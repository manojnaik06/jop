const Interview = require('../models/interview.model');
const Application = require('../models/application.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Get all interviews with pagination, search, and filtering
// @route   GET /api/interviews
// @access  Private (Placement_officer/Admin only)
// @query   page=1, limit=10, application=ObjectId, result=pending, sortBy=scheduledAt, search=studentName
const getInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      application,
      result,
      search,
      sortBy = 'scheduledAt',
      sortOrder = '-1',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // FILTER: Application filter
    if (application) {
      try {
        filter.applicationId = require('mongoose').Types.ObjectId(application);
      } catch {
        // Invalid application ID
      }
    }

    // FILTER: Result filter
    if (result) {
      const validResults = ['pending', 'passed', 'failed'];
      if (validResults.includes(result.toLowerCase())) {
        filter.result = result.toLowerCase();
      }
    }

    // SEARCH: Search by student name across related applications
    if (search) {
      const StudentProfile = require('../models/studentProfile.model');
      const students = await StudentProfile.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ],
      }).select('userId');

      const studentIds = students.map((s) => s.userId);

      // Find applications for these students
      const apps = await Application.find({ studentId: { $in: studentIds } }).select('_id');
      const appIds = apps.map((a) => a._id);

      if (appIds.length > 0) {
        filter.applicationId = { $in: appIds };
      }
    }

    // PAGINATION: Build query
    let query = Interview.find(filter)
      .populate('applicationId', 'studentId driveId status')
      .populate('interviewer', 'name email');

    // SORT: Apply sorting
    const sortField = sortBy || 'scheduledAt';
    const sortDirection = sortOrder === '1' ? 1 : -1;
    query = query.sort({ [sortField]: sortDirection });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const interviews = await query.exec();
    const total = await Interview.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    return successResponse(res, 200, 'Interviews fetched successfully', {
      interviews,
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

// @desc    Get single interview by ID
// @route   GET /api/interviews/:id
// @access  Private (Placement_officer/Admin only)
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('applicationId', 'studentId driveId status cgpa')
      .populate('interviewer', 'name email');

    if (!interview) {
      return errorResponse(res, 404, 'Interview not found');
    }

    return successResponse(res, 200, 'Interview fetched successfully', interview);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Schedule new interview
// @route   POST /api/interviews
// @access  Private (Placement_officer/Admin only)
// WORKFLOW VALIDATION:
// - Application must exist
// - Interview date must be valid (future date)
// - Rejected applications cannot receive interviews
const scheduleInterview = async (req, res) => {
  const { applicationId, interviewerId, round, scheduledAt, notes } = req.body;

  try {
    // Validate input
    if (!applicationId) {
      return errorResponse(res, 400, 'Application ID is required');
    }

    if (!scheduledAt) {
      return errorResponse(res, 400, 'Interview scheduled date is required');
    }

    // Validate interview date is in the future
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return errorResponse(res, 400, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)');
    }

    if (scheduledDate < new Date()) {
      return errorResponse(res, 400, 'Interview date must be in the future');
    }

    // WORKFLOW: Check if application exists
    const application = await Application.findById(applicationId).populate('driveId');
    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }

    // WORKFLOW: Rejected applications cannot receive interviews
    if (application.status === 'rejected') {
      return errorResponse(
        res,
        400,
        'Cannot schedule interview for a rejected application. Application must be in applied or shortlisted status.'
      );
    }

    // Validate interviewer if provided
    if (interviewerId) {
      const interviewer = await User.findById(interviewerId);
      if (!interviewer) {
        return errorResponse(res, 404, 'Interviewer not found');
      }
    }

    // Create interview
    const interview = await Interview.create({
      applicationId,
      interviewer: interviewerId || null,
      round: round || 1,
      scheduledAt: scheduledDate,
      result: 'pending',
      notes: notes || '',
    });

    await interview.populate('applicationId', 'studentId driveId status');
    await interview.populate('interviewer', 'name email');

    return successResponse(res, 201, 'Interview scheduled successfully', interview);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Update interview result
// @route   PATCH /api/interviews/:id
// @access  Private (Placement_officer/Admin only)
// WORKFLOW VALIDATION:
// - Result must be one of: pending, passed, failed
// - Selected candidates cannot be rescheduled (cannot update scheduledAt if already selected)
const updateInterviewResult = async (req, res) => {
  const { result, interviewerId, notes, scheduledAt } = req.body;

  try {
    const interview = await Interview.findById(req.params.id).populate('applicationId');
    if (!interview) {
      return errorResponse(res, 404, 'Interview not found');
    }

    // Validate result if provided
    if (result !== undefined) {
      const validResults = ['pending', 'passed', 'failed'];
      if (!validResults.includes(result.toLowerCase())) {
        return errorResponse(res, 400, `Result must be one of: ${validResults.join(', ')}`);
      }
    }

    // WORKFLOW: Selected candidates cannot be rescheduled
    const application = interview.applicationId;
    if (application.status === 'selected' && scheduledAt && scheduledAt !== interview.scheduledAt.toISOString()) {
      return errorResponse(res, 400, 'Cannot reschedule interview for a selected candidate');
    }

    // Validate new interviewer if provided
    if (interviewerId) {
      const interviewer = await User.findById(interviewerId);
      if (!interviewer) {
        return errorResponse(res, 404, 'Interviewer not found');
      }
    }

    // Validate new scheduled date if provided
    if (scheduledAt) {
      const newDate = new Date(scheduledAt);
      if (isNaN(newDate.getTime())) {
        return errorResponse(res, 400, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)');
      }
      if (newDate < new Date()) {
        return errorResponse(res, 400, 'Interview date must be in the future');
      }
    }

    // Update interview
    const updateData = {};
    if (result !== undefined) updateData.result = result.toLowerCase();
    if (interviewerId !== undefined) updateData.interviewer = interviewerId;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);

    const updated = await Interview.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('applicationId', 'studentId driveId status cgpa')
      .populate('interviewer', 'name email');

    return successResponse(res, 200, 'Interview updated successfully', updated);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private (Placement_officer/Admin only)
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return errorResponse(res, 404, 'Interview not found');
    }

    // Only allow deletion of pending interviews
    if (interview.result !== 'pending') {
      return errorResponse(res, 400, 'Cannot delete an interview that has already been conducted');
    }

    await interview.deleteOne();

    return successResponse(res, 200, 'Interview deleted successfully', {});
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get interviews for an application
// @route   GET /api/interviews/application/:applicationId
// @access  Private (Placement_officer/Admin only)
const getApplicationInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ applicationId: req.params.applicationId })
      .populate('interviewer', 'name email')
      .sort({ scheduledAt: -1 });

    return successResponse(res, 200, 'Application interviews fetched successfully', interviews);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  scheduleInterview,
  updateInterviewResult,
  deleteInterview,
  getApplicationInterviews,
};
