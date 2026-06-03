const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    defaultPackage: {
      type: Number,
      min: [0, 'Package cannot be negative'],
      default: 0,
    },
    package: {
      type: Number,
      min: [0, 'Package cannot be negative'],
      default: 0,
    },
    role: {
      type: String,
      default: '',
    },
    driveDate: {
      type: Date,
    },
    eligibleDepartments: {
      type: [String],
      default: [],
    },
    minimumCgpa: {
      type: Number,
      min: [0, 'minimumCgpa cannot be negative'],
      max: [10, 'minimumCgpa cannot exceed 10'],
      default: 0,
    },
    status: {
      type: String,
      default: 'active',
    },
    externalId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
