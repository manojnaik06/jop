const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getDrives, getDriveById, createDrive, updateDrive, deleteDrive } = require('../controllers/drive.controller');

// Get all drives (any authenticated user)
router.get('/', protect, getDrives);

// Get drive by ID (any authenticated user)
router.get('/:id', protect, getDriveById);

// Create drive (placement_officer/admin only)
router.post('/', protect, authorize('placement_officer', 'admin'), createDrive);

// Update drive (placement_officer/admin only)
router.patch('/:id', protect, authorize('placement_officer', 'admin'), updateDrive);

// Delete drive (placement_officer/admin only)
router.delete('/:id', protect, authorize('placement_officer', 'admin'), deleteDrive);

module.exports = router;
