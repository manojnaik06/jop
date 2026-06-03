const Company = require('../models/company.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all companies with pagination and filtering
// @route   GET /api/companies
// @access  Private
// @query   page=1, limit=10, search=name, status=active, sortBy=createdAt, sortOrder=-1
const getCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = '-1',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // SEARCH: Search by company name
    if (search) {
      filter.name = new RegExp(search, 'i');
    }

    // FILTER: Status filter
    if (status) {
      const validStatuses = ['active', 'inactive'];
      if (validStatuses.includes(status.toLowerCase())) {
        filter.status = status.toLowerCase();
      }
    }

    // PAGINATION: Build query
    let query = Company.find(filter);

    // SORT: Apply sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === '1' ? 1 : -1;
    query = query.sort({ [sortField]: sortDirection });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const companies = await query.exec();
    const total = await Company.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    return successResponse(res, 200, 'Companies fetched successfully', {
      companies,
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

// @desc    Get single company by ID
// @route   GET /api/companies/:id
// @access  Private
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }
    return successResponse(res, 200, 'Company fetched successfully', company);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Placement_officer/Admin only)
const createCompany = async (req, res) => {
  const { name, defaultPackage, eligibleDepartments, minimumCgpa, status, role, package: pkgVal, driveDate, companyId } = req.body;

  try {
    // Validate required fields
    if (!name || typeof name !== 'string') {
      return errorResponse(res, 400, 'Company name is required and must be a string');
    }

    // Validate CGPA bounds
    if (minimumCgpa !== undefined) {
      if (typeof minimumCgpa !== 'number' || minimumCgpa < 0 || minimumCgpa > 10) {
        return errorResponse(res, 400, 'Minimum CGPA must be between 0 and 10');
      }
    }

    // Validate package bounds
    const pkgToUse = defaultPackage !== undefined ? defaultPackage : (pkgVal !== undefined ? pkgVal : undefined);
    if (pkgToUse !== undefined) {
      if (typeof pkgToUse !== 'number' || pkgToUse < 0) {
        return errorResponse(res, 400, 'Package cannot be negative');
      }
    }

    const company = await Company.create({
      companyId: companyId,
      name: name.trim(),
      defaultPackage: pkgToUse || 0,
      package: pkgToUse || 0,
      role: role || '',
      driveDate: driveDate,
      eligibleDepartments: Array.isArray(eligibleDepartments) ? eligibleDepartments : [],
      minimumCgpa: minimumCgpa || 0,
      status: status || 'active',
    });

    return successResponse(res, 201, 'Company created successfully', company);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Company already exists');
    }
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Update company
// @route   PATCH /api/companies/:id
// @access  Private (Placement_officer/Admin only)
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }

    // Validate updatable fields
    if (req.body.minimumCgpa !== undefined) {
      if (typeof req.body.minimumCgpa !== 'number' || req.body.minimumCgpa < 0 || req.body.minimumCgpa > 10) {
        return errorResponse(res, 400, 'Minimum CGPA must be between 0 and 10');
      }
    }

    if (req.body.package !== undefined) {
      if (typeof req.body.package !== 'number' || req.body.package < 0) {
        return errorResponse(res, 400, 'Package cannot be negative');
      }
      req.body.defaultPackage = req.body.package;
    } else if (req.body.defaultPackage !== undefined) {
      if (typeof req.body.defaultPackage !== 'number' || req.body.defaultPackage < 0) {
        return errorResponse(res, 400, 'Default package cannot be negative');
      }
      req.body.package = req.body.defaultPackage;
    }

    if (req.body.name && typeof req.body.name !== 'string') {
      return errorResponse(res, 400, 'Company name must be a string');
    }

    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, 'Company updated successfully', updated);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Company already exists');
    }
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Placement_officer/Admin only)
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }
    return successResponse(res, 200, 'Company deleted successfully', {});
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
