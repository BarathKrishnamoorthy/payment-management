const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');

const getReportAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, timeframe = 'all' } = req.query;

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
      }
      if (s._id === 'debit') {
        totalExpense = s.total;
        expenseCount = s.count;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // 2. Category Breakdown for Expenses
    const expenseCategories = await Transaction.aggregate([
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

    // 3. Category Breakdown for Income
    const incomeCategories = await Transaction.aggregate([
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

    // 4. Daily / Monthly trend depending on scope
    const trendAgg = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // 5. Recurring commitment summary
    const recurringCommitments = await RecurringPayment.aggregate([
      { $match: { user: userId, status: 'Active' } },
      {
        $group: {
          _id: '$paymentType',
          totalMonthlyEquivalent: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$recurrenceType', 'Daily'] }, then: { $multiply: ['$amount', 30] } },
                  { case: { $eq: ['$recurrenceType', 'Monthly'] }, then: '$amount' },
                  { case: { $eq: ['$recurrenceType', 'Quarterly'] }, then: { $divide: ['$amount', 3] } },
                  { case: { $eq: ['$recurrenceType', 'Yearly'] }, then: { $divide: ['$amount', 12] } },
                ],
                default: '$amount',
              },
            },
          },
          count: { $sum: 1 },
        },
      },
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
      recurringCommitments,
    });
  } catch (err) {
    console.error('[Reports] Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate report analytics.' });
  }
};

module.exports = { getReportAnalytics };

