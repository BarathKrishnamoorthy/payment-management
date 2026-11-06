const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const fallbackStore = require('../utils/fallbackStore');
const { parseStatementFile } = require('../utils/statementParser');
const fs = require('fs');
const path = require('path');

const isDbReady = () => mongoose.connection.readyState === 1;

// CREATE Transaction
const createTransaction = async (req, res) => {
  try {
    const { type, amount, date, category, reason, referenceNumber } = req.body;

    if (!type || !['credit', 'debit'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "credit" or "debit".' });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    let attachmentUrl = '';
    let attachmentName = '';
    let attachmentSize = 0;

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
      attachmentSize = req.file.size;
    }

    if (isDbReady()) {
      const transaction = await Transaction.create({
        user: req.user._id,
        type,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        category: category ? category.trim() : (type === 'credit' ? 'Income' : 'General Expense'),
        reason: reason ? reason.trim() : '',
        referenceNumber: referenceNumber ? referenceNumber.trim() : `TXN-${Date.now().toString(36).toUpperCase()}`,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        source: 'manual',
      });

      return res.status(201).json({
        success: true,
        message: `${type === 'credit' ? 'Income (Credit)' : 'Expense (Debit)'} recorded successfully!`,
        transaction,
      });
    }

    // In-memory fallback
    const newTx = fallbackStore.createTransaction({
      user: req.user ? req.user._id : 'demo-user-id',
      type,
      amount: Number(amount),
      date: date || new Date().toISOString(),
      category: category ? category.trim() : (type === 'credit' ? 'Income' : 'General Expense'),
      reason: reason ? reason.trim() : '',
      referenceNumber: referenceNumber || `TXN-${Date.now().toString(36).toUpperCase()}`,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      source: 'manual',
    });

    res.status(201).json({
      success: true,
      message: `${type === 'credit' ? 'Income (Credit)' : 'Expense (Debit)'} recorded (Session Mode)!`,
      transaction: newTx,
      isDbConnected: false,
    });
  } catch (err) {
    console.error('[Transactions] Create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create transaction.' });
  }
};

// GET All Transactions with search, filter, pagination
const getTransactions = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (!isDbReady()) {
      const txs = fallbackStore.getTransactions(userId, req.query);
      const totalCredit = txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const totalDebit = txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      return res.status(200).json({
        success: true,
        transactions: txs,
        pagination: { total: txs.length, page: 1, limit: 20, totalPages: 1 },
        summary: { totalCredit, totalDebit, net: totalCredit - totalDebit },
        isDbConnected: false,
      });
    }

    const { type, category, startDate, endDate, search, page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const query = { user: req.user._id };

    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.date.$lte = eDate;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ reason: regex }, { referenceNumber: regex }, { category: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    // Calculate totals for currently matched query
    const aggQuery = {
      ...query,
      user: mongoose.Types.ObjectId.isValid(req.user._id) ? new mongoose.Types.ObjectId(req.user._id) : req.user._id,
    };
    const summaryAggregation = await Transaction.aggregate([
      { $match: aggQuery },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalCredit = 0;
    let totalDebit = 0;
    summaryAggregation.forEach((item) => {
      if (item._id === 'credit') totalCredit = item.totalAmount;
      if (item._id === 'debit') totalDebit = item.totalAmount;
    });

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
      summary: {
        totalCredit,
        totalDebit,
        netBalance: totalCredit - totalDebit,
      },
    });
  } catch (err) {
    console.error('[Transactions] Get error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
  }
};

// GET Transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.status(200).json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve transaction.' });
  }
};

// UPDATE Transaction
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const { type, amount, date, category, reason, referenceNumber } = req.body;

    if (type && ['credit', 'debit'].includes(type)) transaction.type = type;
    if (amount !== undefined && !isNaN(amount)) transaction.amount = Number(amount);
    if (date) transaction.date = new Date(date);
    if (category) transaction.category = category.trim();
    if (reason !== undefined) transaction.reason = reason.trim();
    if (referenceNumber !== undefined) transaction.referenceNumber = referenceNumber.trim();

    if (req.file) {
      // Clean old attachment if exists
      if (transaction.attachmentUrl) {
        const oldPath = path.join(__dirname, '../../uploads', path.basename(transaction.attachmentUrl));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
        }
      }
      transaction.attachmentUrl = `/uploads/${req.file.filename}`;
      transaction.attachmentName = req.file.originalname;
      transaction.attachmentSize = req.file.size;
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      transaction,
    });
  } catch (err) {
    console.error('[Transactions] Update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
};

// DELETE Transaction
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (!isDbReady()) {
      const deleted = fallbackStore.deleteTransaction(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      }
      return res.status(200).json({ success: true, message: 'Transaction deleted successfully (Session Mode).' });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (transaction.attachmentUrl) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(transaction.attachmentUrl));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }

    await Transaction.deleteOne({ _id: transaction._id });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (err) {
    console.error('[Transactions] Delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
};

// IMPORT Bank Statement (CSV or Excel)
const importBankStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a bank statement file (CSV or Excel).' });
    }

    const filePath = req.file.path;
    const parsedRows = await parseStatementFile(filePath, req.file.mimetype);

    if (!parsedRows || parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid transaction records detected in the uploaded file.' });
    }

    // Attach user id and insert records
    const docsToInsert = parsedRows.map((row) => ({
      ...row,
      user: req.user._id,
      attachmentUrl: `/uploads/${req.file.filename}`,
      attachmentName: req.file.originalname,
      attachmentSize: req.file.size,
    }));

    const inserted = await Transaction.insertMany(docsToInsert);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} transactions from statement!`,
      count: inserted.length,
      sample: inserted.slice(0, 5),
    });
  } catch (err) {
    console.error('[Transactions] Import statement error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to parse and import bank statement.',
    });
  }
};

// EXPORT Transactions as JSON / structured data for reports
const exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = { user: req.user._id };

    if (type && ['credit', 'debit'].includes(type)) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.date.$lte = eDate;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export transactions.' });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  importBankStatement,
  exportTransactions,
};

