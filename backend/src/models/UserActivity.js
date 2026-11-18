const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      index: true,
    },
    userName: {
      type: String,
      default: '',
    },
    platform: {
      type: String,
      enum: ['website', 'android', 'ios'],
      default: 'website',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);
