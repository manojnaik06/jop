const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { syncHandler } = require('../controllers/sync.controller');

router.post('/', asyncHandler(syncHandler));

module.exports = router;
