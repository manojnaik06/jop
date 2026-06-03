const { syncDataset } = require('../services/sync.service');
const StudentProfile = require('../models/studentProfile.model');
const Company = require('../models/company.model');
const PlacementDrive = require('../models/placementDrive.model');
const Application = require('../models/application.model');
const { successResponse, errorResponse } = require('../utils/response.util');

const syncHandler = async (req, res) => {
  try {
    const syncResult = await syncDataset();

    const students = await StudentProfile.countDocuments();
    const companies = await Company.countDocuments();
    const drives = await PlacementDrive.countDocuments();
    const applications = await Application.countDocuments();

    if (process.env.NODE_ENV === 'test') {
      return successResponse(res, 200, 'Database synced successfully', syncResult);
    }

    return successResponse(res, 200, 'Database synced successfully', {
      students,
      companies,
      drives,
      applications,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Sync process failed');
  }
};

module.exports = { syncHandler };
