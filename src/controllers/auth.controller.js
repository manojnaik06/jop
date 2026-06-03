const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response.util');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'placement_secret_key_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const allowedRoles = ['student', 'placement_officer', 'admin'];

  if (!name || !email || !password) {
    return errorResponse(res, 400, 'Name, email, and password are required');
  }

  if (role && !allowedRoles.includes(role)) {
    return errorResponse(res, 400, 'Invalid role provided');
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      const StudentProfile = require('../models/studentProfile.model');
      await User.deleteOne({ _id: userExists._id });
      await StudentProfile.deleteOne({ userId: userExists._id });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    // Create token
    const token = generateToken(user._id);

    return successResponse(res, 201, 'User registered successfully', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide an email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Create token
    const token = generateToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return successResponse(res, 200, 'Authenticated user fetched successfully', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { register, login, getMe };
