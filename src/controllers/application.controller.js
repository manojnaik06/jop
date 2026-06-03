const Application = require('../models/application.model');
const PlacementDrive = require('../models/placementDrive.model');
const StudentProfile = require('../models/studentProfile.model');
const Company = require('../models/company.model');
const { successResponse, errorResponse } = require('../utils/response.util');

const formatApplication = async (app) => {
  if (!app) return null;
  const appObj = app.toObject ? app.toObject() : app;
  
  let studentUser = appObj.studentId;
  if (studentUser) {
    const User = require('../models/user.model');
    if (typeof studentUser !== 'object') {
      studentUser = await User.findById(studentUser).lean();
    }
    if (studentUser) {
      const profile = await StudentProfile.findOne({ userId: studentUser._id });
      const studentData = {
        _id: profile ? profile._id : studentUser._id,
        studentId: profile ? (profile.studentId || profile.rollNumber) : '',
        name: studentUser.name || '',
        email: studentUser.email || '',
        department: profile ? profile.branch : '',
        cgpa: profile ? profile.cgpa : 0,
        skills: profile ? profile.skills : [],
        graduationYear: profile ? profile.graduationYear : null,
        phone: profile ? profile.phone : '',
        status: profile ? profile.status : 'active',
        createdAt: profile ? profile.createdAt : undefined,
        updatedAt: profile ? profile.updatedAt : undefined,
      };
      appObj.student = studentData;
      appObj.studentId = studentData;
    }
  }
  
  let driveRecord = appObj.driveId;
  if (driveRecord) {
    if (typeof driveRecord !== 'object') {
      driveRecord = await PlacementDrive.findById(driveRecord).lean();
    }
    if (driveRecord) {
      let companyRecord = driveRecord.company;
      if (companyRecord && typeof companyRecord !== 'object') {
        companyRecord = await Company.findById(companyRecord).lean();
      }
      
      const companyData = companyRecord ? {
        _id: companyRecord._id,
        companyId: companyRecord.companyId,
        name: companyRecord.name,
        role: driveRecord.title,
        package: driveRecord.packageLpa || companyRecord.defaultPackage || 0,
        eligibleDepartments: companyRecord.eligibleDepartments || [],
        minimumCgpa: driveRecord.minimumCgpa || companyRecord.minimumCgpa || 0,
        driveDate: driveRecord.registrationDeadline,
        status: driveRecord.status || 'upcoming',
        createdAt: companyRecord.createdAt,
        updatedAt: companyRecord.updatedAt,
      } : null;

      const driveData = {
        _id: driveRecord._id,
        driveId: driveRecord.driveId,
        company: companyData,
        title: driveRecord.title,
        mode: driveRecord.mode,
        location: driveRecord.location,
        registrationDeadline: driveRecord.registrationDeadline,
        rounds: driveRecord.rounds || [],
        status: driveRecord.status,
        createdAt: driveRecord.createdAt,
        updatedAt: driveRecord.updatedAt,
      };
      appObj.drive = driveData;
      appObj.driveId = driveData;
    }
  }
  
  return appObj;
};

// @desc    Get all applications with pagination, search, and filtering
// @route   GET /api/applications
// @access  Private (Placement_officer/Admin can see all; students see own)
// @query   page=1, limit=10, search=studentName/company, status=applied, drive=ObjectId, cgpaMin=7, sortBy=appliedAt
const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      drive,
      cgpaMin,
      cgpaMax,
      sortBy = 'appliedAt',
      sortOrder = '-1',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // AUTHORIZATION: Students only see their own applications
    if (req.user.role === 'student') {
      const StudentProfile = require('../models/studentProfile.model');
      const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
      if (!studentProfile) {
        return errorResponse(res, 404, 'Student profile not found');
      }
      filter.studentId = req.user.id;
    }

    // SEARCH: Search across student name, student email, and company name (via drive)
    if (search) {
      // Search in student population
      const StudentProfile = require('../models/studentProfile.model');
      const students = await StudentProfile.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { rollNumber: new RegExp(search, 'i') },
        ],
      }).select('userId');

      const studentIds = students.map((s) => s.userId);

      // Also search by drive title/company
      const drives = await PlacementDrive.find({
        $or: [
          { title: new RegExp(search, 'i') },
        ],
      }).select('_id');

      const driveIds = drives.map((d) => d._id);

      filter.$or = [{ studentId: { $in: studentIds } }, { driveId: { $in: driveIds } }];
    }

    // FILTER: Status filter
    if (status) {
      const validStatuses = ['applied', 'shortlisted', 'selected', 'rejected'];
      if (validStatuses.includes(status.toLowerCase())) {
        filter.status = status.toLowerCase();
      }
    }

    // FILTER: Drive filter
    if (drive) {
      try {
        filter.driveId = require('mongoose').Types.ObjectId(drive);
      } catch {
        // Invalid drive ID
      }
    }

    // FILTER: CGPA range filter
    if (cgpaMin || cgpaMax) {
      filter.cgpa = {};
      if (cgpaMin) {
        const minCgpa = parseFloat(cgpaMin);
        if (!isNaN(minCgpa) && minCgpa >= 0 && minCgpa <= 10) {
          filter.cgpa.$gte = minCgpa;
        }
      }
      if (cgpaMax) {
        const maxCgpa = parseFloat(cgpaMax);
        if (!isNaN(maxCgpa) && maxCgpa >= 0 && maxCgpa <= 10) {
          filter.cgpa.$lte = maxCgpa;
        }
      }
    }

    // PAGINATION: Build query
    let query = Application.find(filter)
      .populate('studentId', 'name email')
      .populate('driveId', 'title company')
      .populate({ path: 'driveId', populate: { path: 'company', select: 'name' } });

    // SORT: Apply sorting
    const sortField = sortBy || 'appliedAt';
    const sortDirection = sortOrder === '1' ? 1 : -1;
    query = query.sort({ [sortField]: sortDirection });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const applications = await query.exec();
    const total = await Application.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    const formattedApps = [];
    for (const app of applications) {
      formattedApps.push(await formatApplication(app));
    }

    return successResponse(res, 200, 'Applications fetched successfully', {
      applications: formattedApps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: parseInt(page) < totalPages,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Private (Own application, or placement_officer/admin)
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate({
        path: 'driveId',
        select: 'title company minimumCgpa status',
        populate: { path: 'company', select: 'name eligibleDepartments minimumCgpa' },
      });

    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }

    // Authorization: student can only view own application
    if (req.user.role === 'student' && application.studentId._id.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to view this application');
    }

    const formatted = await formatApplication(application);
    return successResponse(res, 200, 'Application fetched successfully', formatted);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new application (WORKFLOW VALIDATION)
// @route   POST /api/applications
// @access  Private (Students only)
const createApplication = async (req, res) => {
  const { driveId, cgpa, resumeUrl } = req.body;

  try {
    // Validate input
    if (!driveId) {
      return errorResponse(res, 400, 'Drive ID is required');
    }

    if (!cgpa || typeof cgpa !== 'number' || cgpa < 0 || cgpa > 10) {
      return errorResponse(res, 400, 'Valid CGPA (0-10) is required');
    }

    // Fetch drive and validate it exists
    const drive = await PlacementDrive.findById(driveId).populate('company');
    if (!drive) {
      return errorResponse(res, 404, 'Placement drive not found');
    }

    // WORKFLOW: Closed drives cannot accept applications
    if (drive.status === 'closed') {
      return errorResponse(res, 400, 'This placement drive is closed. Applications are not accepted.');
    }

    // Fetch student profile
    const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
    if (!studentProfile) {
      return errorResponse(res, 400, 'Student profile not found. Please complete your profile.');
    }

    // WORKFLOW: Student CGPA must satisfy company minimum CGPA
    const company = drive.company;
    if (typeof company.minimumCgpa === 'number' && cgpa < company.minimumCgpa) {
      return errorResponse(
        res,
        400,
        `Your CGPA (${cgpa}) does not meet the minimum requirement (${company.minimumCgpa}) for this company.`
      );
    }

    // WORKFLOW: Student department must be eligible
    const studentDepartments = studentProfile.departments || [];
    const eligibleDepartments = company.eligibleDepartments || [];

    if (eligibleDepartments.length > 0) {
      const isEligible = studentDepartments.some((dept) => eligibleDepartments.includes(dept));
      if (!isEligible) {
        return errorResponse(
          res,
          400,
          `Your department is not eligible for this company. Eligible departments: ${eligibleDepartments.join(', ')}`
        );
      }
    }

    // WORKFLOW: Duplicate application not allowed (enforced by model unique index)
    const existingApp = await Application.findOne({ studentId: req.user.id, driveId });
    if (existingApp) {
      return errorResponse(res, 409, 'You have already applied for this drive');
    }

    // Create application
    const application = await Application.create({
      studentId: req.user.id,
      driveId,
      cgpa,
      resumeUrl: resumeUrl || '',
      currentRound: 1,
      status: 'applied',
      appliedAt: new Date(),
    });

    await application.populate('studentId', 'name email');
    await application.populate({
      path: 'driveId',
      select: 'title company',
      populate: { path: 'company', select: 'name' },
    });

    const formatted = await formatApplication(application);
    return successResponse(res, 201, 'Application submitted successfully', formatted);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'You have already applied for this drive');
    }
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Update application status or current round
// @route   PATCH /api/applications/:id
// @access  Private (Placement_officer/Admin only)
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }

    // Authorization: only placement_officer/admin can update
    if (req.user.role !== 'placement_officer' && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to update applications');
    }

    // Validate status if provided
    if (req.body.status) {
      const validStatuses = ['applied', 'shortlisted', 'selected', 'rejected'];
      if (!validStatuses.includes(req.body.status)) {
        return errorResponse(res, 400, `Status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate currentRound if provided
    if (req.body.currentRound !== undefined) {
      if (typeof req.body.currentRound !== 'number' || req.body.currentRound < 1) {
        return errorResponse(res, 400, 'Current round must be a positive number');
      }
    }

    const updated = await Application.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('studentId', 'name email')
      .populate('driveId', 'title company');

    const formatted = await formatApplication(updated);
    return successResponse(res, 200, 'Application updated successfully', formatted);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private (Student own, or placement_officer/admin)
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }

    // Authorization: student can delete own application, or placement_officer/admin can delete any
    if (
      req.user.role === 'student' &&
      application.studentId.toString() !== req.user.id
    ) {
      return errorResponse(res, 403, 'Not authorized to delete this application');
    }

    await application.deleteOne();

    return successResponse(res, 200, 'Application deleted successfully', {});
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get aggregate analytics for applications
// @route   GET /api/applications/stats
// @access  Private (Placement_officer/Admin only)
const getApplicationStats = async (req, res) => {
  try {
    // 1. Total applications count
    const total = await Application.countDocuments();

    // 2. Group by status
    const statusGroups = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgCgpa: { $avg: '$cgpa' },
        },
      },
    ]);

    const formattedStatusGroups = statusGroups.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        avgCgpa: item.avgCgpa ? Math.round(item.avgCgpa * 100) / 100 : 0,
      };
      return acc;
    }, {});

    // Ensure all statuses have keys
    const statuses = ['applied', 'shortlisted', 'selected', 'rejected'];
    statuses.forEach((s) => {
      if (!formattedStatusGroups[s]) {
        formattedStatusGroups[s] = { count: 0, avgCgpa: 0 };
      }
    });

    // 3. Drive-wise application counts
    const driveStats = await Application.aggregate([
      {
        $group: {
          _id: '$driveId',
          count: { $sum: 1 },
          selected: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 }, // Top 10 drives
    ]);

    // Populate drive details for drive stats
    const driveIds = driveStats.map((item) => item._id);
    const drives = await PlacementDrive.find({ _id: { $in: driveIds } }, 'title company');
    const driveMap = drives.reduce((acc, d) => {
      acc[d._id.toString()] = d.title || 'Unknown Drive';
      return acc;
    }, {});

    const enrichedDriveStats = driveStats.map((item) => ({
      driveName: driveMap[item._id.toString()] || 'Unknown Drive',
      applicationsCount: item.count,
      selectedCount: item.selected,
    }));

    const stats = {
      totalApplications: total,
      byStatus: formattedStatusGroups,
      topDrives: enrichedDriveStats,
    };

    return successResponse(res, 200, 'Application statistics fetched successfully', stats);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
};
