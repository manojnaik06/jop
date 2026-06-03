const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    round: {
      type: Number,
      default: 1,
      min: 1,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    result: {
      type: String,
      enum: ['pending', 'pass', 'fail', 'passed', 'failed'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Pre-save validation: ensure application exists and is not rejected
InterviewSchema.pre('save', async function (next) {
  try {
    const Application = mongoose.model('Application');
    const application = await Application.findById(this.applicationId);

    if (!application) {
      return next(new Error('Referenced application does not exist'));
    }

    // WORKFLOW: Rejected applications cannot receive interviews
    if (application.status === 'rejected') {
      return next(new Error('Rejected application cannot receive interview'));
    }

    // Validate scheduledAt is in the future
    if (this.scheduledAt < new Date()) {
      return next(new Error('Interview must be scheduled for a future date'));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

// Pre-update validation: prevent rescheduling selected candidates
InterviewSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();

    // Only validate if scheduledAt is being updated
    if (update.scheduledAt) {
      const id = this.getFilter()._id;
      const interview = await mongoose.model('Interview').findById(id);

      if (!interview) {
        return next(new Error('Interview not found'));
      }

      const Application = mongoose.model('Application');
      const application = await Application.findById(interview.applicationId);

      // WORKFLOW: Selected candidates cannot be rescheduled
      if (application && application.status === 'selected') {
        return next(new Error('Selected candidate cannot be rescheduled'));
      }

      // Validate new date is in the future
      if (new Date(update.scheduledAt) < new Date()) {
        return next(new Error('Interview must be scheduled for a future date'));
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);

