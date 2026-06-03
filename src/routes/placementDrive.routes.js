const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
} = require('../controllers/drive.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Get all drives
router.get('/', protect, asyncHandler(getDrives));

// Get single drive by ID
router.get('/:id', protect, asyncHandler(getDriveById));

// Create new drive
router.post('/', protect, authorize('placement_officer', 'admin'), asyncHandler(createDrive));

// Update drive
router.patch('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(updateDrive));

// Delete drive
router.delete('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(deleteDrive));

module.exports = router;
