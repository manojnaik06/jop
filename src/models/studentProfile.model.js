const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
      sparse: true,
    },
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    departments: {
      type: [String],
      default: [],
    },
    graduationYear: {
      type: Number,
      min: [1900, 'Invalid graduation year'],
      max: [2100, 'Invalid graduation year'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'placed'],
      default: 'active',
    },
    skills: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Sync name/email from linked User on save if missing
StudentProfileSchema.pre('save', async function (next) {
  try {
    const User = mongoose.model('User');
    if (this.userId) {
      const user = await User.findById(this.userId).select('name email');
      if (user) {
        if (!this.name) this.name = user.name || '';
        if (!this.email) this.email = user.email || '';
      }
    }
  } catch (err) {
    return next(err);
  }
  return next();
});

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
