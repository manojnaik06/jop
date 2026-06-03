const PlacementDrive = require('../models/placementDrive.model');
const Company = require('../models/company.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all placement drives with pagination, search, and filtering
// @route   GET /api/drives
// @access  Private
// @query   page=1, limit=10, search=title, status=active, company=ObjectId, mode=on-campus, sortBy=createdAt
const getDrives = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      company,
      mode,
      sortBy = 'createdAt',
      sortOrder = '-1',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // SEARCH: Search by drive title
    if (search) {
      filter.title = new RegExp(search, 'i');
    }

    // FILTER: Status filter
    if (status) {
      filter.status = status.toLowerCase();
    }

    // FILTER: Company filter (by company ID or company name)
    if (company) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(company)) {
        filter.company = company;
      } else {
        const Company = require('../models/company.model');
        const companies = await Company.find({ name: new RegExp(company, 'i') }).select('_id');
        const companyIds = companies.map((c) => c._id);
        filter.company = { $in: companyIds };
      }
    }

    // FILTER: Mode filter (on-campus, off-campus, online, offline, hybrid)
    if (mode) {
      filter.mode = mode.toLowerCase();
    }

    // PAGINATION: Build query
    let query = PlacementDrive.find(filter)
      .populate('company', 'companyId name package defaultPackage eligibleDepartments minimumCgpa driveDate status')
      .populate('createdBy', 'name email');

    // SORT: Apply sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === '1' ? 1 : -1;
    query = query.sort({ [sortField]: sortDirection });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const drives = await query.exec();
    const total = await PlacementDrive.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    return successResponse(res, 200, 'Placement drives fetched successfully', {
      drives,
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

// @desc    Get single placement drive by ID
// @route   GET /api/drives/:id
// @access  Private
const getDriveById = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id)
      .populate('company', 'name defaultPackage eligibleDepartments minimumCgpa')
      .populate('createdBy', 'name email');

    if (!drive) {
      return errorResponse(res, 404, 'Placement drive not found');
    }
    return successResponse(res, 200, 'Placement drive fetched successfully', drive);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new placement drive
// @route   POST /api/drives
// @access  Private (Placement_officer/Admin only)
const createDrive = async (req, res) => {
  const { company, title, mode, location, registrationDeadline, rounds, requiredSkills, minimumCgpa, packageLpa } =
    req.body;

  try {
    // Validate company exists
    if (!company) {
      return errorResponse(res, 400, 'Company ID is required');
    }

    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return errorResponse(res, 404, 'Company not found');
    }

    // Validate title
    if (!title || typeof title !== 'string') {
      return errorResponse(res, 400, 'Drive title is required');
    }

    // Validate CGPA bounds
    if (minimumCgpa !== undefined) {
      if (typeof minimumCgpa !== 'number' || minimumCgpa < 0 || minimumCgpa > 10) {
        return errorResponse(res, 400, 'Minimum CGPA must be between 0 and 10');
      }
    }

    // Validate package
    if (packageLpa !== undefined) {
      if (typeof packageLpa !== 'number' || packageLpa < 0) {
        return errorResponse(res, 400, 'Package cannot be negative');
      }
    }

    const drive = await PlacementDrive.create({
      company,
      title: title.trim(),
      mode: mode || 'on-campus',
      location: location || '',
      registrationDeadline: registrationDeadline || null,
      rounds: Array.isArray(rounds) ? rounds : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      minimumCgpa: minimumCgpa !== undefined ? minimumCgpa : companyDoc.minimumCgpa,
      packageLpa: packageLpa !== undefined ? packageLpa : companyDoc.defaultPackage,
      createdBy: req.user.id,
    });

    await drive.populate('company', 'name defaultPackage eligibleDepartments minimumCgpa');

    return successResponse(res, 201, 'Placement drive created successfully', drive);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Update placement drive
// @route   PATCH /api/drives/:id
// @access  Private (Placement_officer/Admin only)
const updateDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return errorResponse(res, 404, 'Placement drive not found');
    }

    // Authorization check
    if (drive.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to update this drive');
    }

    // Validate CGPA bounds
    if (req.body.minimumCgpa !== undefined) {
      if (typeof req.body.minimumCgpa !== 'number' || req.body.minimumCgpa < 0 || req.body.minimumCgpa > 10) {
        return errorResponse(res, 400, 'Minimum CGPA must be between 0 and 10');
      }
    }

    // Validate package
    if (req.body.packageLpa !== undefined) {
      if (typeof req.body.packageLpa !== 'number' || req.body.packageLpa < 0) {
        return errorResponse(res, 400, 'Package cannot be negative');
      }
    }

    // Validate company if updating
    if (req.body.company && req.body.company !== drive.company.toString()) {
      const companyDoc = await Company.findById(req.body.company);
      if (!companyDoc) {
        return errorResponse(res, 404, 'Company not found');
      }
    }

    const updated = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('company', 'name defaultPackage eligibleDepartments minimumCgpa');

    return successResponse(res, 200, 'Placement drive updated successfully', updated);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Delete placement drive
// @route   DELETE /api/drives/:id
// @access  Private (Placement_officer/Admin only)
const deleteDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return errorResponse(res, 404, 'Placement drive not found');
    }

    // Authorization check
    if (drive.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this drive');
    }

    await drive.deleteOne();

    return successResponse(res, 200, 'Placement drive deleted successfully', {});
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
};
