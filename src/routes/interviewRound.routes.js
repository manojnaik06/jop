const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const {
  getInterviews,
  getInterviewById,
  scheduleInterview,
  updateInterviewResult,
  deleteInterview,
  getApplicationInterviews,
} = require('../controllers/interview.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Get all interviews (placement_officer/admin only)
router.get('/', protect, authorize('placement_officer', 'admin'), asyncHandler(getInterviews));

// Get interviews for an application
router.get('/application/:applicationId', protect, authorize('placement_officer', 'admin'), asyncHandler(getApplicationInterviews));

// Get single interview by ID
router.get('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(getInterviewById));

// Schedule new interview (WORKFLOW PROTECTED)
router.post('/', protect, authorize('placement_officer', 'admin'), asyncHandler(scheduleInterview));

// Update interview result (WORKFLOW PROTECTED)
router.patch('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(updateInterviewResult));

// Delete interview
router.delete('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(deleteInterview));

module.exports = router;

