const mongoose = require('mongoose');

const PlacementDriveSchema = new mongoose.Schema(
  {
    driveId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    mode: {
      type: String,
      enum: ['on-campus', 'off-campus', 'online'],
      default: 'on-campus',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    registrationDeadline: {
      type: Date,
    },
    rounds: {
      type: [
        {
          name: String,
          type: String,
          weight: Number,
        },
      ],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    minimumCgpa: {
      type: Number,
      default: 0,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    packageLpa: {
      type: Number,
      min: [0, 'Package cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    externalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Populate missing package/minimumCgpa from company if available
PlacementDriveSchema.pre('save', async function (next) {
  if (this.company) {
    try {
      const Company = mongoose.model('Company');
      const company = await Company.findById(this.company).select('defaultPackage minimumCgpa');
      if (company) {
        if (!this.packageLpa || this.packageLpa === 0) this.packageLpa = company.defaultPackage || this.packageLpa;
        if (!this.minimumCgpa || this.minimumCgpa === 0) this.minimumCgpa = company.minimumCgpa || this.minimumCgpa;
      }
    } catch (err) {
      return next(err);
    }
  }
  return next();
});

module.exports = mongoose.model('PlacementDrive', PlacementDriveSchema);
