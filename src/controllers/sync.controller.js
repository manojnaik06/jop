const { syncDataset } = require('../services/sync.service');
const StudentProfile = require('../models/studentProfile.model');
const PlacementDrive = require('../models/placementDrive.model');
const Application = require('../models/application.model');
const { successResponse, errorResponse } = require('../utils/response.util');

const syncHandler = async (req, res) => {
  try {
    const syncResult = await syncDataset();

    const students = await StudentProfile.countDocuments();
    const companies = await PlacementDrive.distinct('companyName').then((names) => names.length);
    const drives = await PlacementDrive.countDocuments();
    const applications = await Application.countDocuments();

    return successResponse(res, 200, 'Database synced successfully', {
      ...syncResult,
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
