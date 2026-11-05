const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
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
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
      index: true,
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'transfer'],
      required: true,
    },
    transferGroupId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentName: {
      type: String,
      default: '',
    },
    attachmentSize: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['manual', 'bank_import', 'recurring_payment', 'transfer'],
      default: 'manual',
    },
    recurringPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringPayment',
      default: null,
    },
    // Family workspace shared expense support
    familyMemberId: {
      type: String,
      default: null,
    },
    familyPayerId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ workspaceId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
