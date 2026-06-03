const Application = require('../models/application.model');
const StudentProfile = require('../models/studentProfile.model');
const { successResponse, errorResponse } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────────────────
// Q15 | GET /analytics/placements
// Returns: totalApplications, shortlistedCount, selectedCount, rejectedCount
// Uses a single aggregation pipeline with $facet for efficiency
// ─────────────────────────────────────────────────────────────────────────────
const getPlacementAnalytics = async (req, res) => {
  try {
    const result = await Application.aggregate([
      {
        $facet: {
          totalApplications: [{ $count: 'count' }],
          shortlistedCount: [
            { $match: { status: 'shortlisted' } },
            { $count: 'count' },
          ],
          selectedCount: [
            { $match: { status: 'selected' } },
            { $count: 'count' },
          ],
          rejectedCount: [
            { $match: { status: 'rejected' } },
            { $count: 'count' },
          ],
        },
      },
      {
        // Flatten each facet array to a single value (0 if empty)
        $project: {
          totalApplications: {
            $ifNull: [{ $arrayElemAt: ['$totalApplications.count', 0] }, 0],
          },
          shortlistedCount: {
            $ifNull: [{ $arrayElemAt: ['$shortlistedCount.count', 0] }, 0],
          },
          selectedCount: {
            $ifNull: [{ $arrayElemAt: ['$selectedCount.count', 0] }, 0],
          },
          rejectedCount: {
            $ifNull: [{ $arrayElemAt: ['$rejectedCount.count', 0] }, 0],
          },
        },
      },
    ]);

    const analytics = result[0] || {
      totalApplications: 0,
      shortlistedCount: 0,
      selectedCount: 0,
      rejectedCount: 0,
    };

    return successResponse(res, 200, 'Placement analytics fetched', analytics);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Q16 | GET /analytics/departments
// Returns: department-wise placedCount and placementPercentage
// StudentProfile uses 'departments' (array field), so $unwind before grouping
// ─────────────────────────────────────────────────────────────────────────────
const getDepartmentAnalytics = async (req, res) => {
  try {
    const result = await Application.aggregate([
      // Step 1: Join applications with student profiles
      {
        $lookup: {
          from: 'studentprofiles',
          localField: 'studentId',
          foreignField: 'userId',
          as: 'studentProfile',
        },
      },
      { $unwind: '$studentProfile' },

      // Step 2: Unwind the departments array so each dept gets its own doc
      { $unwind: '$studentProfile.departments' },

      // Step 3: Group by department — count total applications & selected
      {
        $group: {
          _id: '$studentProfile.departments',
          totalApplications: { $sum: 1 },
          placedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] },
          },
        },
      },

      // Step 4: Calculate placement percentage
      {
        $addFields: {
          placementPercentage: {
            $cond: [
              { $gt: ['$totalApplications', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$placedCount', '$totalApplications'] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },

      // Step 5: Shape output
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$_id', 'Unknown'] },
          totalApplications: 1,
          placedCount: 1,
          placementPercentage: 1,
        },
      },

      { $sort: { placementPercentage: -1 } },
    ]);

    return successResponse(res, 200, 'Department analytics fetched', result);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Q17 | GET /analytics/companies
// Returns: company-wise selectedStudents, highestPackage, driveParticipationCount
// PlacementDrive.company is an ObjectId ref → needs $lookup to companies
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyAnalytics = async (req, res) => {
  try {
    const result = await Application.aggregate([
      // Step 1: Join with placement drives
      {
        $lookup: {
          from: 'placementdrives',
          localField: 'driveId',
          foreignField: '_id',
          as: 'drive',
        },
      },
      { $unwind: '$drive' },

      // Step 2: Join with companies to get company name
      {
        $lookup: {
          from: 'companies',
          localField: 'drive.company',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },

      // Step 3: Group by company
      {
        $group: {
          _id: '$company._id',
          companyName: { $first: '$company.name' },
          highestPackage: { $max: '$drive.packageLpa' },
          driveParticipationCount: { $sum: 1 },
          selectedStudents: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] },
          },
        },
      },

      // Step 4: Shape output
      {
        $project: {
          _id: 0,
          companyId: '$_id',
          companyName: 1,
          highestPackage: 1,
          driveParticipationCount: 1,
          selectedStudents: 1,
        },
      },

      { $sort: { selectedStudents: -1 } },
    ]);

    return successResponse(res, 200, 'Company analytics fetched', result);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getPlacementAnalytics,
  getDepartmentAnalytics,
  getCompanyAnalytics,
};
