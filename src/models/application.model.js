const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL/file is required'],
      trim: true,
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'selected', 'rejected'],
      default: 'applied',
    },
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound index so a student can only apply once to a specific placement drive
ApplicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

// Runtime validation: ensure student/profile exists and satisfies drive eligibility
ApplicationSchema.pre('save', async function (next) {
  try {
    const PlacementDrive = mongoose.model('PlacementDrive');
    const StudentProfile = mongoose.model('StudentProfile');

    const drive = await PlacementDrive.findById(this.driveId).select('minimumCgpa status');
    if (!drive) return next(new Error('Referenced PlacementDrive does not exist'));
    if (drive.status !== 'active') return next(new Error('Cannot apply to a non-active drive'));

    const profile = await StudentProfile.findOne({ userId: this.studentId }).select('cgpa status');
    if (!profile) return next(new Error('Student profile not found'));
    if (profile.status !== 'active') return next(new Error('Student profile is not active'));
    if (typeof profile.cgpa === 'number' && typeof drive.minimumCgpa === 'number') {
      if (profile.cgpa < drive.minimumCgpa) return next(new Error('Student CGPA below drive minimum'));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
