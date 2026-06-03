const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
} = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Get statistics (must be before /:id route)
router.get('/stats', protect, authorize('placement_officer', 'admin'), asyncHandler(getApplicationStats));

// CRUD operations
// Get all applications (pagination, filtering)
router.get('/', protect, asyncHandler(getApplications));

// Create new application (students apply to drive)
router.post('/', protect, authorize('student'), asyncHandler(createApplication));

// Get single application by ID
router.get('/:id', protect, asyncHandler(getApplicationById));

// Update application (placement_officer/admin only)
router.patch('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(updateApplication));

// Delete application
router.delete('/:id', protect, asyncHandler(deleteApplication));

module.exports = router;
