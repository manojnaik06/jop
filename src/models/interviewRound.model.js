const mongoose = require('mongoose');

const InterviewRoundSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    roundNumber: {
      type: Number,
      required: [true, 'Round number is required'],
    },
    roundName: {
      type: String,
      required: [true, 'Round name (e.g. Technical Round 1) is required'],
      trim: true,
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'passed', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    interviewer: {
      type: String,
      required: [true, 'Interviewer name is required'],
      trim: true,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    meetingDetails: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewRound', InterviewRoundSchema);
