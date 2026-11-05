const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
  },
  { _id: true }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspaceId: {
      type: String,
      default: 'personal',
      index: true,
    },
    goalName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Emergency Fund', 'Vehicle', 'Home', 'Education', 'Vacation', 'Wedding', 'Investment', 'Other'],
      default: 'Other',
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'archived'],
      default: 'in_progress',
    },
    contributions: [contributionSchema],
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);

