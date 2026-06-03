const StudentProfile = require('../models/studentProfile.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all students with optional filters and pagination
// @route   GET /api/students
// @access  Private (Placement_officer/Admin only)
const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.department) {
      filter.branch = new RegExp(req.query.department, 'i');
    }
    if (req.query.cgpaMin) {
      filter.cgpa = { $gte: parseFloat(req.query.cgpaMin) };
    }
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    const total = await StudentProfile.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const students = await StudentProfile.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = students.map((student) => ({
      _id: student._id,
      studentId: student.studentId || student.rollNumber,
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      department: student.branch,
      cgpa: student.cgpa,
      status: student.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      page,
      limit,
      total,
      totalPages,
      data: formatted,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private (Placement_officer/Admin only)
const getStudentById = async (req, res) => {
  try {
    const student = await StudentProfile.findById(req.params.id).populate('userId', 'name email role');
    if (!student) {
      return errorResponse(res, 404, 'Student not found');
    }

    return successResponse(res, 200, 'Student fetched successfully', {
      _id: student._id,
      studentId: student.studentId || student.rollNumber,
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      department: student.branch,
      cgpa: student.cgpa,
      skills: student.skills,
      graduationYear: student.graduationYear,
      phone: student.phone,
      status: student.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getStudents, getStudentById };
