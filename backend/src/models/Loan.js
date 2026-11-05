const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema(
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
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const loanSchema = new mongoose.Schema(
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
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['borrowed', 'lent'],
      required: true,
    },
    principal: {
      type: Number,
      required: true,
      min: 1,
    },
    outstanding: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'repaid', 'defaulted'],
      default: 'active',
    },
    repayments: [repaymentSchema],
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ user: 1, type: 1, status: 1 });

module.exports = mongoose.model('Loan', loanSchema);

