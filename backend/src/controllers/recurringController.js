const mongoose = require('mongoose');
const RecurringPayment = require('../models/RecurringPayment');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// Helper to advance date by recurrence type
const computeNextDueDate = (fromDate, recurrenceType) => {
  const next = new Date(fromDate);
  switch (recurrenceType) {
    case 'Daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

// CREATE Recurring Payment
const createRecurringPayment = async (req, res) => {
  try {
    const { title, paymentType, dueDate, recurrenceType, amount, reason, autoCreateDebit } = req.body;

    const validTypes = ['EMI', 'Bank Loan', 'Subscription', 'Gold Loan', 'Home Loan', 'Car Loan', 'Other'];
    const validRecurrences = ['Daily', 'Monthly', 'Quarterly', 'Yearly'];

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required (e.g. "HDFC Car Loan").' });
    }

    if (!paymentType || !validTypes.includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: `Payment type must be one of: ${validTypes.join(', ')}`,
      });
    }

    if (!recurrenceType || !validRecurrences.includes(recurrenceType)) {
      return res.status(400).json({
        success: false,
        message: `Recurrence must be one of: ${validRecurrences.join(', ')}`,
      });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required.' });
    }

    const initialDue = new Date(dueDate);

    if (isDbReady()) {
      const recurring = await RecurringPayment.create({
        user: req.user._id,
        title: title.trim(),
        paymentType,
        dueDate: initialDue,
        nextDueDate: initialDue,
        recurrenceType,
        amount: Number(amount),
        reason: reason ? reason.trim() : '',
        autoCreateDebit: autoCreateDebit !== undefined ? Boolean(autoCreateDebit) : true,
        status: 'Active',
      });

      return res.status(201).json({
        success: true,
        message: 'Recurring payment created successfully.',
        recurring,
      });
    }

    // In-memory fallback
    const newRec = fallbackStore.createRecurring({
      user: req.user ? req.user._id : 'demo-user-id',
      title: title.trim(),
      paymentType,
      dueDate: initialDue.toISOString(),
      nextDueDate: initialDue.toISOString(),
      recurrenceType,
      amount: Number(amount),
      reason: reason || '',
      autoCreateDebit: Boolean(autoCreateDebit),
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Recurring payment created successfully (Session Mode).',
      recurring: newRec,
    });
  } catch (err) {
    console.error('[Recurring] Create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create recurring payment.' });
  }
};

// GET All Recurring Payments
const getRecurringPayments = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (isDbReady()) {
      const { status, paymentType } = req.query;
      const query = { user: userId };

      if (status && ['Active', 'Paused', 'Completed'].includes(status)) {
        query.status = status;
      }
      if (paymentType && paymentType !== 'All') {
        query.paymentType = paymentType;
      }

      const recurringList = await RecurringPayment.find(query).sort({ nextDueDate: 1 });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const enriched = recurringList.map((item) => {
        const itemDue = new Date(item.nextDueDate);
        const itemDay = new Date(itemDue.getFullYear(), itemDue.getMonth(), itemDue.getDate());
        const diffTime = itemDay.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...item.toObject(),
          diffDays,
          isOverdue: diffDays < 0,
          isDueToday: diffDays === 0,
          isDueSoon: diffDays > 0 && diffDays <= 7,
        };
      });

      return res.status(200).json({
        success: true,
        count: enriched.length,
        recurringPayments: enriched,
      });
    }

    // In-memory fallback
    const list = fallbackStore.getRecurring(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const enriched = list.map((item) => {
      const itemDue = new Date(item.dueDate || item.nextDueDate);
      const itemDay = new Date(itemDue.getFullYear(), itemDue.getMonth(), itemDue.getDate());
      const diffDays = Math.round((itemDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        diffDays,
        isOverdue: diffDays < 0,
        isDueToday: diffDays === 0,
        isDueSoon: diffDays > 0 && diffDays <= 7,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      recurringPayments: enriched,
      isDbConnected: false,
    });
  } catch (err) {
    console.error('[Recurring] Get error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve recurring payments.' });
  }
};

// GET Recurring Payment by ID
const getRecurringById = async (req, res) => {
  try {
    if (isDbReady()) {
      const recurring = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
      if (!recurring) {
        return res.status(404).json({ success: false, message: 'Recurring payment not found.' });
      }
      return res.status(200).json({ success: true, recurring });
    }

    const item = fallbackStore.getRecurring(req.user ? req.user._id : 'demo-user-id').find(r => r._id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring payment not found.' });
    }
    res.status(200).json({ success: true, recurring: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recurring payment.' });
  }
};

// UPDATE Recurring Payment
const updateRecurringPayment = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const id = req.params.id;

    if (isDbReady()) {
      let recurring = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        recurring = await RecurringPayment.findOne({ _id: id, user: userId });
      }

      if (recurring) {
        const { title, paymentType, dueDate, recurrenceType, amount, reason, status, autoCreateDebit } = req.body;

        if (title) recurring.title = title.trim();
        if (paymentType) recurring.paymentType = paymentType;
        if (recurrenceType) recurring.recurrenceType = recurrenceType;
        if (amount !== undefined && !isNaN(amount)) recurring.amount = Number(amount);
        if (reason !== undefined) recurring.reason = reason.trim();
        if (status) recurring.status = status;
        if (autoCreateDebit !== undefined) recurring.autoCreateDebit = Boolean(autoCreateDebit);

        if (dueDate) {
          recurring.dueDate = new Date(dueDate);
          recurring.nextDueDate = new Date(dueDate);
        }

        await recurring.save();

        // Keep fallbackStore in sync
        fallbackStore.updateRecurring(id, userId, req.body);

        return res.status(200).json({
          success: true,
          message: 'Recurring payment updated successfully.',
          recurring,
        });
      }
    }

    // In fallback mode or when id was created in session/fallback store
    const updated = fallbackStore.updateRecurring(id, userId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Recurring payment not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring payment updated successfully.',
      recurring: updated,
    });
  } catch (err) {
    console.error('[Recurring] Update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update recurring payment.' });
  }
};

// DELETE Recurring Payment
const deleteRecurringPayment = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (isDbReady()) {
      const recurring = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
      if (!recurring) {
        return res.status(404).json({ success: false, message: 'Recurring payment not found.' });
      }

      await RecurringPayment.deleteOne({ _id: recurring._id });

      return res.status(200).json({
        success: true,
        message: 'Recurring payment deleted successfully.',
      });
    }

    const deleted = fallbackStore.deleteRecurring(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Recurring payment not found or unauthorized.' });
    }
    res.status(200).json({
      success: true,
      message: 'Recurring payment deleted successfully (Session Mode).',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete recurring payment.' });
  }
};

// MARK AS PAID (Advances nextDueDate by 30 days & hides from upcoming dues)
const markAsPaid = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (isDbReady()) {
      const recurring = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
      if (!recurring) {
        return res.status(404).json({ success: false, message: 'Recurring payment not found.' });
      }

      const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
      const paidAmount = req.body.amount ? Number(req.body.amount) : recurring.amount;
      const note = req.body.note || `Paid on ${paidDate.toLocaleDateString()}`;

      let createdTxn = null;

      if (recurring.autoCreateDebit) {
        createdTxn = await Transaction.create({
          user: req.user._id,
          type: 'debit',
          amount: paidAmount,
          date: paidDate,
          category: recurring.paymentType,
          reason: `${recurring.title} (${recurring.paymentType} payment)`,
          referenceNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
          source: 'recurring_payment',
          recurringPaymentId: recurring._id,
        });
      }

      const updatedNextDue = computeNextDueDate(recurring.nextDueDate, recurring.recurrenceType);

      recurring.lastPaidDate = paidDate;
      recurring.nextDueDate = updatedNextDue;
      recurring.paymentHistory.push({
        paidDate,
        amount: paidAmount,
        transactionId: createdTxn ? createdTxn._id : null,
        note,
      });

      await recurring.save();

      return res.status(200).json({
        success: true,
        message: `Payment of ₹${paidAmount} recorded successfully! Next due date: ${updatedNextDue.toLocaleDateString()}`,
        recurring,
        transaction: createdTxn,
      });
    }

    // In-memory fallback
    const updated = fallbackStore.markRecurringPaid(req.params.id, userId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Recurring payment not found or unauthorized.' });
    }
    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully! Next due date advanced by 30 days.',
      recurring: updated,
      isDbConnected: false,
    });
  } catch (err) {
    console.error('[Recurring] Mark as paid error:', err);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
};

module.exports = {
  createRecurringPayment,
  getRecurringPayments,
  getRecurringById,
  updateRecurringPayment,
  deleteRecurringPayment,
  markAsPaid,
};
