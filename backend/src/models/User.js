const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    // Track completed walkthrough tutorials per module
    tutorialStatus: {
      dashboard: { type: Boolean, default: false },
      transactions: { type: Boolean, default: false },
      recurring: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      accounts: { type: Boolean, default: false },
      family: { type: Boolean, default: false },
      planning: { type: Boolean, default: false },
      loans: { type: Boolean, default: false },
    },
    pushToken: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active',
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockReason: {
      type: String,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    platform: {
      type: String,
      enum: ['website', 'android', 'ios'],
      default: 'website',
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

