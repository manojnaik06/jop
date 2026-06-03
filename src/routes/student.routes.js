const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getStudents, getStudentById } = require('../controllers/student.controller');

// Get all students (placement_officer/admin only)
router.get('/', protect, authorize('placement_officer', 'admin'), getStudents);

// Get student by ID (placement_officer/admin only)
router.get('/:id', protect, authorize('placement_officer', 'admin'), getStudentById);

module.exports = router;
