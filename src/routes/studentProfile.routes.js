const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const {
  getMyProfile,
  upsertProfile,
  getAllProfiles,
} = require('../controllers/studentProfile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/me', protect, asyncHandler(getMyProfile));
router.post('/', protect, authorize('student'), asyncHandler(upsertProfile));
router.get('/', protect, authorize('placement_officer', 'admin'), asyncHandler(getAllProfiles));

module.exports = router;
