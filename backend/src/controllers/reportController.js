const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');
const fallbackStore = require('../utils/fallbackStore');

const getReportAnalytics = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { startDate, endDate, timeframe = 'all' } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const data = fallbackStore.getReportAnalytics(userId, timeframe, startDate, endDate);
      return res.status(200).json({
        ...data,
        isDbConnected: false,
      });
    }

    const query = { user: userId };
    const now = new Date();

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.date.$lte = eDate;
      }
    } else if (timeframe === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query.date = { $gte: start };
    } else if (timeframe === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      query.date = { $gte: start };
    } else if (timeframe === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      query.date = { $gte: start };
    }

    // 1. Overall Summary
    const summaryAgg = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    summaryAgg.forEach((s) => {
      if (s._id === 'credit') {
        totalIncome = s.total;
        incomeCount = s.count;
      } else if (s._id === 'debit') {
        totalExpense = s.total;
        expenseCount = s.count;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // 2. Category Breakdown for Expenses
    const expenseCategoryAgg = await Transaction.aggregate([
      { $match: { ...query, type: 'debit' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const expenseCategories = expenseCategoryAgg.map((item) => ({
      category: item._id || 'Uncategorized',
      total: item.total,
      count: item.count,
      percentage: totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : 0,
    }));

    // 3. Category Breakdown for Income
    const incomeCategoryAgg = await Transaction.aggregate([
      { $match: { ...query, type: 'credit' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const incomeCategories = incomeCategoryAgg.map((item) => ({
      category: item._id || 'General Income',
      total: item.total,
      count: item.count,
      percentage: totalIncome > 0 ? ((item.total / totalIncome) * 100).toFixed(1) : 0,
    }));

    // 4. Monthly Trend Data (Last 6 Months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const trendAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5. Active Recurring Commitments Total
    const recurringCommitments = await RecurringPayment.aggregate([
      { $match: { user: userId, status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate: Number(savingsRate),
        transactionCount: incomeCount + expenseCount,
        incomeCount,
        expenseCount,
      },
      expenseCategories,
      incomeCategories,
      trendData: trendAgg,
      recurringCommitments: recurringCommitments.length > 0 ? recurringCommitments[0].total : 0,
    });
  } catch (err) {
    console.error('[Reports] Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate report analytics.' });
  }
};

module.exports = { getReportAnalytics };
