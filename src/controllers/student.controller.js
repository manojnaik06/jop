const StudentProfile = require('../models/studentProfile.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all students with pagination, search, and filtering
// @route   GET /api/students
// @access  Private (Placement_officer/Admin)
// @query   page=1, limit=10, search=name/email, department=CSE, status=active, cgpaMin=7.5, cgpaMax=9.5
const getStudents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      department, 
      status,
      cgpaMin,
      cgpaMax,
      sortBy = 'createdAt',
      sortOrder = '-1'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // SEARCH: Search across name, email, rollNumber
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { rollNumber: new RegExp(search, 'i') },
      ];
    }

    // FILTER: Department filter
    if (department) {
      filter.departments = { $in: [department] };
    }

    // FILTER: Status filter
    if (status) {
      const validStatuses = ['active', 'inactive', 'placed'];
      if (validStatuses.includes(status)) {
        filter.status = status;
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
    let query = StudentProfile.find(filter).populate('userId', 'name email');

    // SORT: Apply sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === '1' ? 1 : -1;
    query = query.sort({ [sortField]: sortDirection });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const students = await query.exec();
    const total = await StudentProfile.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    return successResponse(res, 200, 'Students fetched successfully', {
      students,
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

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private (Placement_officer/Admin or self)
const getStudentById = async (req, res) => {
  try {
    const student = await StudentProfile.findById(req.params.id).populate('userId', 'name email');
    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }
    return successResponse(res, 200, 'Student fetched successfully', student);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getStudents,
  getStudentById,
};
