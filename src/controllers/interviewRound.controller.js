const InterviewRound = require('../models/interviewRound.model');
const Application = require('../models/application.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// @desc    Schedule a new interview round for an application
// @route   POST /api/interviews
// @access  Private (Placement_officer/Admin only)
const scheduleInterview = async (req, res) => {
  const {
    applicationId,
    roundNumber,
    roundName,
    scheduledTime,
    interviewer,
    mode,
    meetingDetails,
  } = req.body;

  try {
    if (!applicationId || !roundNumber || !roundName || !scheduledTime || !interviewer) {
      return errorResponse(res, 400, 'Missing required fields for scheduling an interview round');
    }

    // 1. Verify application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }

    // 2. Automatically update application status to 'shortlisted' if it was 'applied'
    if (application.status === 'applied') {
      application.status = 'shortlisted';
      await application.save();
    }

    // 3. Create interview round
    const interview = await InterviewRound.create({
      applicationId,
      roundNumber,
      roundName,
      scheduledTime,
      interviewer,
      mode: mode || 'online',
      meetingDetails: meetingDetails || '',
    });

    return successResponse(res, 'Interview round scheduled successfully', interview);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Update interview round (status, feedback, etc.)
// @route   PUT /api/interviews/:id
// @access  Private (Placement_officer/Admin only)
const updateInterview = async (req, res) => {
  const { status, feedback, interviewer, scheduledTime, mode, meetingDetails } = req.body;

  try {
    const interview = await InterviewRound.findById(req.params.id);
    if (!interview) {
      return errorResponse(res, 404, 'Interview round not found');
    }

    const updates = {};
    if (status) {
      if (!['scheduled', 'passed', 'failed', 'cancelled'].includes(status)) {
        return errorResponse(res, 400, 'Invalid status value');
      }
      updates.status = status;
    }
    if (feedback !== undefined) updates.feedback = feedback;
    if (interviewer) updates.interviewer = interviewer;
    if (scheduledTime) updates.scheduledTime = scheduledTime;
    if (mode) updates.mode = mode;
    if (meetingDetails !== undefined) updates.meetingDetails = meetingDetails;

    const updatedInterview = await InterviewRound.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // If interview round failed, we can optionally update the Application status to 'rejected'
    if (status === 'failed') {
      const application = await Application.findById(interview.applicationId);
      if (application) {
        application.status = 'rejected';
        await application.save();
      }
    }

    return successResponse(res, 'Interview round updated successfully', updatedInterview);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// @desc    Get all interview rounds for currently logged-in student
// @route   GET /api/interviews/student
// @access  Private (Student only)
const getInterviewsForStudent = async (req, res) => {
  try {
    // 1. Find all applications for the student
    const studentApps = await Application.find({ studentId: req.user.id });
    const appIds = studentApps.map((app) => app._id);

    // 2. Fetch interview rounds matching these applications
    const interviews = await InterviewRound.find({ applicationId: { $in: appIds } })
      .populate({
        path: 'applicationId',
        populate: {
          path: 'driveId',
          select: 'companyName jobRole packageLpa location',
        },
      })
      .sort({ scheduledTime: 1 });

    return successResponse(res, 'Student interviews fetched successfully', interviews);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get interview rounds for a specific job application
// @route   GET /api/interviews/application/:applicationId
// @access  Private (Placement_officer/Admin only)
const getInterviewsForApplication = async (req, res) => {
  try {
    const interviews = await InterviewRound.find({ applicationId: req.params.applicationId })
      .sort({ roundNumber: 1 });

    return successResponse(res, 'Application interviews fetched successfully', interviews);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  scheduleInterview,
  updateInterview,
  getInterviewsForStudent,
  getInterviewsForApplication,
};
