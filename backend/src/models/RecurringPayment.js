const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  paidDate: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  note: {
    type: String,
    default: '',
  },
});

const recurringPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    paymentType: {
      type: String,
      enum: ['EMI', 'Bank Loan', 'Subscription', 'Gold Loan', 'Home Loan', 'Car Loan', 'Other'],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    recurrenceType: {
      type: String,
      enum: ['Daily', 'Monthly', 'Quarterly', 'Yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Completed'],
      default: 'Active',
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    lastPaidDate: {
      type: Date,
      default: null,
    },
    paymentHistory: [paymentHistorySchema],
    autoCreateDebit: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

recurringPaymentSchema.index({ user: 1, nextDueDate: 1 });
recurringPaymentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('RecurringPayment', recurringPaymentSchema);

