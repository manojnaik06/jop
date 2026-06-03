const StudentProfile = require('../models/studentProfile.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get current logged in student profile
// @route   GET /api/profiles/me
// @access  Private (Student only)
const getMyProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id }).populate('userId', 'name email');
    if (!profile) {
      return errorResponse(res, 404, 'Profile not found. Please create one.');
    }
    return successResponse(res, 'Student profile fetched successfully', profile);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create or update student profile
// @route   POST /api/profiles
// @access  Private (Student only)
const upsertProfile = async (req, res) => {
  const { rollNumber, cgpa, branch, skills, resumeUrl } = req.body;

  try {
    let profile = await StudentProfile.findOne({ userId: req.user.id });

    const profileData = {
      rollNumber,
      cgpa,
      branch,
      skills: Array.isArray(skills) ? skills : [],
      resumeUrl,
      userId: req.user.id,
    };

    if (profile) {
      // Update
      profile = await StudentProfile.findOneAndUpdate(
        { userId: req.user.id },
        profileData,
        { new: true, runValidators: true }
      );
      return successResponse(res, 'Student profile updated successfully', profile);
    } else {
      // Create
      profile = await StudentProfile.create(profileData);
      return successResponse(res, 'Student profile created successfully', profile);
    }
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Get all student profiles
// @route   GET /api/profiles
// @access  Private (Placement_officer/Admin only)
const getAllProfiles = async (req, res) => {
  try {
    const profiles = await StudentProfile.find().populate('userId', 'name email');
    return successResponse(res, 'All student profiles fetched successfully', profiles);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getMyProfile,
  upsertProfile,
  getAllProfiles,
};
