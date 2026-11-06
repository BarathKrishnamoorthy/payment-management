const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');
const Notification = require('../models/Notification');
const fallbackStore = require('../utils/fallbackStore');

const getDashboardSummary = async (req, res) => {
  try {
    const rawUserId = req.user ? req.user._id : 'demo-user-id';
    const userId = mongoose.Types.ObjectId.isValid(rawUserId) ? new mongoose.Types.ObjectId(rawUserId) : rawUserId;

    if (mongoose.connection.readyState !== 1) {
      const fbData = fallbackStore.getDashboardData(rawUserId);
      return res.status(200).json({
        ...fbData,
        isDbConnected: false,
      });
    }

    // 1. Calculate Total Income, Total Expenses, Balance
    const summaryAgg = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    summaryAgg.forEach((item) => {
      if (item._id === 'credit') totalIncome = item.total;
      if (item._id === 'debit') totalExpenses = item.total;
    });

    const netBalance = totalIncome - totalExpenses;

    // 2. This Month Income vs. Expense
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const thisMonthAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    thisMonthAgg.forEach((item) => {
      if (item._id === 'credit') thisMonthIncome = item.total;
      if (item._id === 'debit') thisMonthExpense = item.total;
    });

    // 3. Monthly Breakdown (Last 6 Months) for Graph
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format 6 months chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyMap[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        income: 0,
        expense: 0,
      };
    }

    monthlyAgg.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (monthlyMap[key]) {
        if (m._id.type === 'credit') monthlyMap[key].income = m.total;
        if (m._id.type === 'debit') monthlyMap[key].expense = m.total;
      }
    });

    const chartData = Object.values(monthlyMap);

    // 4. Category breakdown for expenses
    const categoryAgg = await Transaction.aggregate([
      { $match: { user: userId, type: 'debit' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 6 },
    ]);

    // 5. Upcoming Recurring Payments
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch active recurring payments for this user
    const recurringDues = await RecurringPayment.find({
      user: userId,
      status: 'Active',
    }).sort({ nextDueDate: 1 });

    const allMappedPayments = recurringDues.map((item) => {
      const rawDate = item.nextDueDate || item.dueDate;
      let itemDue;
      if (typeof rawDate === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split('-');
        itemDue = new Date(Number(y), Number(m) - 1, Number(d));
      } else if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split('/');
        itemDue = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        itemDue = new Date(rawDate);
      }
      const itemDay = new Date(itemDue.getFullYear(), itemDue.getMonth(), itemDue.getDate());
      const diffDays = Math.round((itemDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        _id: item._id,
        title: item.title,
        paymentType: item.paymentType,
        recurrenceType: item.recurrenceType,
        amount: item.amount,
        nextDueDate: item.nextDueDate || item.dueDate,
        dueDate: item.dueDate,
        reason: item.reason,
        autoCreateDebit: item.autoCreateDebit,
        lastPaidDate: item.lastPaidDate,
        paymentHistory: item.paymentHistory,
        diffDays,
        isOverdue: diffDays < 0,
        isDueToday: diffDays === 0,
        isDueSoon: diffDays <= 3 && diffDays >= 0,
      };
    });

    // Rule: "show the upcoming recurring before 3 days to due date and then hide it"
    // Only display payments within 3 days of due date (diffDays <= 3).
    // Payments with diffDays > 3 are hidden until they enter the 3-day window.
    const upcomingPayments = allMappedPayments.filter((p) => p.diffDays <= 3);

    // Payments due today specifically
    const dueToday = allMappedPayments.filter((p) => p.isDueToday);

    // 6. Recent Transactions (last 6)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    // 7. Unread notifications count
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        thisMonthIncome,
        thisMonthExpense,
        thisMonthSavings: thisMonthIncome - thisMonthExpense,
      },
      chartData,
      categoryExpenses: categoryAgg,
      upcomingPayments, // Filtered to diffDays <= 3
      allUpcomingPayments: allMappedPayments,
      activeSchedulesCount: recurringDues.length,
      dueWithin3DaysCount: upcomingPayments.length,
      hiddenSchedulesCount: allMappedPayments.filter((p) => p.diffDays > 3).length,
      dueToday,
      recentTransactions,
      unreadNotifications,
    });
  } catch (err) {
    console.error('[Dashboard] Summary error:', err);
    const userId = req.user ? req.user._id : 'demo-user-id';
    const fbData = fallbackStore.getDashboardData(userId);
    res.status(200).json({
      ...fbData,
      isDbConnected: false,
    });
  }
};

module.exports = { getDashboardSummary };

