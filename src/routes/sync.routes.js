const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');
const { syncHandler } = require('../controllers/sync.controller');

router.post('/', protect, authorize('admin', 'placement_officer'), asyncHandler(syncHandler));

module.exports = router;
