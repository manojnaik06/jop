const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { getStats } = require('../controllers/task.controller');

router.get('/', asyncHandler(getStats));

module.exports = router;
