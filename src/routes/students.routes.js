const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getStudents, getStudentById } = require('../controllers/students.controller');

router.get('/', protect, authorize('placement_officer', 'admin'), asyncHandler(getStudents));
router.get('/:id', protect, authorize('placement_officer', 'admin'), asyncHandler(getStudentById));

module.exports = router;
