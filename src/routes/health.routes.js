const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/studentProfile.model');
const { successResponse, errorResponse } = require('../utils/response.util');

router.get('/', async (req, res) => {
  try {
    const count = await StudentProfile.countDocuments();
    return successResponse(res, 200, 'Database connected successfully', {
      database: 'connected',
      documentCount: count,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Database unavailable');
  }
});

module.exports = router;
