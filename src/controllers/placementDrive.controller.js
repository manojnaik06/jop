const PlacementDrive = require('../models/placementDrive.model');
const Company = require('../models/company.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all placement drives with pagination and filtering
// @route   GET /api/drives
// @access  Private
const getDrives = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, company } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.title = new RegExp(search, 'i');
    }
    if (status) {
      filter.status = status;
    }
    if (company) {
      filter.company = company;
    }

    const drives = await PlacementDrive.find(filter)
      .populate('company', 'name defaultPackage eligibleDepartments minimumCgpa')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PlacementDrive.countDocuments(filter);

    return successResponse(res, 200, 'Placement drives fetched successfully', {
      drives,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
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

// @desc    Get aggregate analytics for placement drives
// @route   GET /api/drives/stats
// @access  Private (Placement_officer/Admin only)
const getPlacementDriveStats = async (req, res) => {
  try {
    // 1. General counts (active vs closed)
    const total = await PlacementDrive.countDocuments();
    const active = await PlacementDrive.countDocuments({ status: 'active' });
    const closed = await PlacementDrive.countDocuments({ status: 'closed' });

    // 2. Average package using aggregation
    const packageStats = await PlacementDrive.aggregate([
      {
        $group: {
          _id: null,
          avgPackage: { $avg: '$packageLpa' },
          maxPackage: { $max: '$packageLpa' },
          minPackage: { $min: '$packageLpa' },
        },
      },
    ]);

    // 3. Location breakdown using aggregation
    const locationBreakdown = await PlacementDrive.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 4. Company list and count using aggregation
    const companyStats = await PlacementDrive.aggregate([
      {
        $group: {
          _id: '$companyName',
          drivesCount: { $sum: 1 },
          avgPackage: { $avg: '$packageLpa' },
        },
      },
      { $sort: { avgPackage: -1 } },
    ]);

    const stats = {
      totalDrives: total,
      activeDrives: active,
      closedDrives: closed,
      packages: packageStats[0] || { avgPackage: 0, maxPackage: 0, minPackage: 0 },
      locations: locationBreakdown.reduce((acc, loc) => {
        acc[loc._id] = loc.count;
        return acc;
      }, {}),
      companies: companyStats,
    };

    return successResponse(res, 'Placement drive statistics fetched successfully', stats);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getPlacementDrives,
  getPlacementDriveById,
  createPlacementDrive,
  updatePlacementDrive,
  deletePlacementDrive,
  getPlacementDriveStats,
};
