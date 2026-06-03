const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getPlacementAnalytics,
  getDepartmentAnalytics,
  getCompanyAnalytics,
} = require('../controllers/analytics.controller');

router.get('/placements', protect, authorize('placement_officer', 'admin'), asyncHandler(getPlacementAnalytics));
router.get('/departments', protect, authorize('placement_officer', 'admin'), asyncHandler(getDepartmentAnalytics));
router.get('/companies', protect, authorize('placement_officer', 'admin'), asyncHandler(getCompanyAnalytics));

module.exports = router;
