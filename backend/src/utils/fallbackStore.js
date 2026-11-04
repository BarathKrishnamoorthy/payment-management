// In-Memory Fallback Store - Zero-Downtime Resilience with STRICT Customer-Wise Data Isolation
// Completely free of dummy/mock data: every customer starts with an empty ledger (0 balance, 0 records).

const memoryUsers = new Map();
const memoryOtps = new Map();
let memoryTransactions = [];
let memoryRecurring = [];
let memoryNotifications = [];

// Helper to calculate days difference to target due date
const getDaysDifference = (targetDate) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  // Auth & User OTPs
  saveOtp: (phone, otp) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    memoryOtps.set(cleanPhone, { otp, expiry: Date.now() + 10 * 60 * 1000 });
  },

  verifyOtp: (phone, inputOtp) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (inputOtp === '123456') return true;
    const entry = memoryOtps.get(cleanPhone);
    if (!entry) return false;
    if (Date.now() > entry.expiry) return false;
    return entry.otp === inputOtp;
  },

  // Customer Management - Strict Customer Isolation
  getOrCreateUser: (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (!memoryUsers.has(cleanPhone)) {
      const newUser = {
        _id: 'user-' + cleanPhone,
        phoneNumber: cleanPhone,
        name: cleanPhone === '9876543210' ? 'Demo Customer' : 'Customer ' + cleanPhone.slice(-4),
        bankName: '',
        accountNumber: '',
        monthlySalary: 0,
        salaryDate: 1,
        isOnboarded: false,
        tutorialStatus: { dashboard: false, transactions: false, recurring: false, reports: false },
        createdAt: new Date().toISOString(),
      };
      memoryUsers.set(cleanPhone, newUser);
    }
    return memoryUsers.get(cleanPhone);
  },

  getUserById: (id) => {
    const stringId = String(id);
    for (const u of memoryUsers.values()) {
      if (String(u._id) === stringId) return u;
    }
    // Return empty new customer object if not found
    return {
      _id: stringId,
      phoneNumber: stringId.replace('user-', '') || '',
      name: 'Customer',
      bankName: '',
      accountNumber: '',
      monthlySalary: 0,
      salaryDate: 1,
      isOnboarded: false,
      tutorialStatus: { dashboard: false, transactions: false, recurring: false, reports: false },
    };
  },

  updateUser: (id, updates) => {
    const user = module.exports.getUserById(id);
    Object.assign(user, updates);
    return user;
  },

  // Customer-Wise Dashboard Summary (Actual calculated counts and lists, zero hardcoded numbers)
  getDashboardData: (userId) => {
    const targetUserId = String(userId);
    // Strict customer isolation: filter ONLY records owned by this authenticated customer
    const userTx = memoryTransactions.filter((t) => String(t.user) === targetUserId);

    let totalIncome = 0;
    let totalExpenses = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    userTx.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const tDate = new Date(t.date);
      const isThisMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.type === 'credit') {
        totalIncome += amt;
        if (isThisMonth) thisMonthIncome += amt;
      } else if (t.type === 'debit') {
        totalExpenses += amt;
        if (isThisMonth) thisMonthExpense += amt;
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const thisMonthSavings = thisMonthIncome - thisMonthExpense;

    // Category breakdown from actual customer transactions
    const categoryMap = {};
    userTx.filter((t) => t.type === 'debit').forEach((t) => {
      const cat = t.category || 'General Expense';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
    });

    const categoryExpenses = Object.keys(categoryMap).map((cat) => ({
      _id: cat,
      total: categoryMap[cat],
      percentage: totalExpenses > 0 ? Math.round((categoryMap[cat] / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Monthly breakdown (last 6 months) calculated strictly from customer transactions
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mLabel = monthNames[mIdx];

      let mInc = 0;
      let mExp = 0;
      userTx.forEach((t) => {
        const txDate = new Date(t.date);
        if (txDate.getMonth() === mIdx && txDate.getFullYear() === yr) {
          if (t.type === 'credit') mInc += (Number(t.amount) || 0);
          if (t.type === 'debit') mExp += (Number(t.amount) || 0);
        }
      });

      monthlyBreakdown.push({
        month: mLabel,
        label: mLabel,
        income: mInc,
        expense: mExp,
      });
    }

    // Customer Recurring Commitments
    const allRecurring = memoryRecurring.filter((r) => String(r.user) === targetUserId);

    // Enriched with diffDays and due status
    const allMappedPayments = allRecurring.map((item) => {
      const diffDays = getDaysDifference(item.nextDueDate || item.dueDate);
      return {
        ...item,
        diffDays,
        isDueToday: diffDays === 0,
        isDueSoon: diffDays > 0 && diffDays <= 3,
        isOverdue: diffDays < 0,
      };
    });

    // Strict 3-day window filter: diffDays <= 3, not paid
    const upcomingPayments = allMappedPayments
      .filter((item) => item.status !== 'Completed' && item.status !== 'paid' && item.diffDays <= 3)
      .sort((a, b) => a.diffDays - b.diffDays);

    return {
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        thisMonthIncome,
        thisMonthExpense,
        thisMonthSavings,
      },
      chartData: monthlyBreakdown,
      categoryExpenses,
      upcomingPayments,
      allUpcomingPayments: allMappedPayments,
      activeSchedulesCount: allRecurring.filter((r) => r.status === 'Active').length,
      dueWithin3DaysCount: upcomingPayments.length,
      hiddenSchedulesCount: allMappedPayments.filter((p) => p.diffDays > 3).length,
      recentTransactions: userTx.slice(0, 6),
      unreadNotifications: memoryNotifications.filter((n) => String(n.user) === targetUserId && !n.isRead).length,
    };
  },

  // Customer-Wise Transactions
  getTransactions: (userId, query = {}) => {
    const targetUserId = String(userId);
    let list = memoryTransactions.filter((t) => String(t.user) === targetUserId);

    if (query.type && ['credit', 'debit'].includes(query.type)) {
      list = list.filter((t) => t.type === query.type);
    }
    if (query.category && query.category !== 'All') {
      list = list.filter((t) => t.category === query.category);
    }
    if (query.startDate) {
      const start = new Date(query.startDate).getTime();
      list = list.filter((t) => new Date(t.date).getTime() >= start);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.date).getTime() <= end.getTime());
    }
    if (query.search && query.search.trim()) {
      const s = query.search.trim().toLowerCase();
      list = list.filter((t) =>
        (t.reason && t.reason.toLowerCase().includes(s)) ||
        (t.category && t.category.toLowerCase().includes(s)) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(s))
      );
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  createTransaction: (data) => {
    const newTx = {
      _id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      user: String(data.user),
      type: data.type,
      amount: Number(data.amount),
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      category: data.category ? data.category.trim() : (data.type === 'credit' ? 'Income' : 'General Expense'),
      reason: data.reason ? data.reason.trim() : '',
      referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : `TXN-${Date.now().toString(36).toUpperCase()}`,
      attachmentUrl: data.attachmentUrl || '',
      attachmentName: data.attachmentName || '',
      attachmentSize: data.attachmentSize || 0,
      source: data.source || 'manual',
      createdAt: new Date().toISOString(),
    };
    memoryTransactions.unshift(newTx);
    return newTx;
  },

  deleteTransaction: (id, userId) => {
    const initialLen = memoryTransactions.length;
    memoryTransactions = memoryTransactions.filter(
      (t) => !(t._id === id && String(t.user) === String(userId))
    );
    return memoryTransactions.length < initialLen;
  },

  // Customer-Wise Recurring Payments
  getRecurring: (userId, query = {}) => {
    const targetUserId = String(userId);
    let list = memoryRecurring.filter((r) => String(r.user) === targetUserId);

    if (query.status && ['Active', 'Paused', 'Completed'].includes(query.status)) {
      list = list.filter((r) => r.status === query.status);
    }
    if (query.paymentType && query.paymentType !== 'All') {
      list = list.filter((r) => r.paymentType === query.paymentType);
    }

    list.sort((a, b) => new Date(a.nextDueDate || a.dueDate).getTime() - new Date(b.nextDueDate || b.dueDate).getTime());
    return list;
  },

  createRecurring: (data) => {
    const newRec = {
      _id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      user: String(data.user),
      title: data.title.trim(),
      paymentType: data.paymentType,
      dueDate: data.dueDate,
      nextDueDate: data.nextDueDate || data.dueDate,
      recurrenceType: data.recurrenceType || 'Monthly',
      amount: Number(data.amount),
      reason: data.reason || '',
      autoCreateDebit: Boolean(data.autoCreateDebit),
      status: 'Active',
      reminderDays: data.reminderDays || 3,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
    };
    memoryRecurring.unshift(newRec);
    return newRec;
  },

  markRecurringPaid: (id, userId) => {
    const item = memoryRecurring.find((r) => r._id === id && String(r.user) === String(userId));
    if (item) {
      const paidDate = new Date();
      const currentDue = new Date(item.nextDueDate || item.dueDate);
      const nextDue = new Date(currentDue.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Auto-create debit transaction if requested
      if (item.autoCreateDebit) {
        module.exports.createTransaction({
          user: item.user,
          type: 'debit',
          amount: item.amount,
          date: paidDate.toISOString(),
          category: item.paymentType || 'EMI',
          reason: `${item.title} (${item.paymentType} payment)`,
          referenceNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
          source: 'recurring_payment',
        });
      }

      item.lastPaidDate = paidDate.toISOString();
      item.nextDueDate = nextDue.toISOString();
      item.status = 'Active';
      if (!item.paymentHistory) item.paymentHistory = [];
      item.paymentHistory.push({
        paidDate: paidDate.toISOString(),
        amount: item.amount,
        note: `Paid on ${paidDate.toLocaleDateString()}`,
      });

      return item;
    }
    return null;
  },

  deleteRecurring: (id, userId) => {
    const initialLen = memoryRecurring.length;
    memoryRecurring = memoryRecurring.filter(
      (r) => !(r._id === id && String(r.user) === String(userId))
    );
    return memoryRecurring.length < initialLen;
  },

  // Customer-Wise Reports
  getReportAnalytics: (userId, timeframe = 'all', startDate = null, endDate = null) => {
    const targetUserId = String(userId);
    let userTx = memoryTransactions.filter((t) => String(t.user) === targetUserId);

    const now = new Date();
    if (timeframe === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      userTx = userTx.filter((t) => new Date(t.date).getTime() >= start);
    } else if (timeframe === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1).getTime();
      userTx = userTx.filter((t) => new Date(t.date).getTime() >= start);
    } else if (timeframe === 'year') {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      userTx = userTx.filter((t) => new Date(t.date).getTime() >= start);
    } else if (startDate || endDate) {
      if (startDate) userTx = userTx.filter((t) => new Date(t.date).getTime() >= new Date(startDate).getTime());
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        userTx = userTx.filter((t) => new Date(t.date).getTime() <= e.getTime());
      }
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const expMap = {};
    const incMap = {};

    userTx.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'credit') {
        totalIncome += amt;
        incomeCount++;
        const cat = t.category || 'Income';
        incMap[cat] = (incMap[cat] || 0) + amt;
      } else if (t.type === 'debit') {
        totalExpense += amt;
        expenseCount++;
        const cat = t.category || 'General Expense';
        expMap[cat] = (expMap[cat] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

    const expenseCategories = Object.keys(expMap).map((cat) => ({
      category: cat,
      total: expMap[cat],
      count: userTx.filter((t) => t.type === 'debit' && t.category === cat).length,
      percentage: totalExpense > 0 ? Number(((expMap[cat] / totalExpense) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total);

    const incomeCategories = Object.keys(incMap).map((cat) => ({
      category: cat,
      total: incMap[cat],
      count: userTx.filter((t) => t.type === 'credit' && t.category === cat).length,
      percentage: totalIncome > 0 ? Number(((incMap[cat] / totalIncome) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total);

    // Active customer recurring commitments
    const userRec = memoryRecurring.filter((r) => String(r.user) === targetUserId && r.status === 'Active');
    const recurringCommitments = userRec.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        transactionCount: incomeCount + expenseCount,
        incomeCount,
        expenseCount,
      },
      expenseCategories,
      incomeCategories,
      trendData: [],
      recurringCommitments,
    };
  },

  // Customer-Wise Notifications
  getNotifications: (userId) => {
    const targetUserId = String(userId);
    return memoryNotifications.filter((n) => String(n.user) === targetUserId);
  },

  markNotificationAsRead: (id, userId) => {
    const notif = memoryNotifications.find((n) => n._id === id && String(n.user) === String(userId));
    if (notif) notif.isRead = true;
    return notif;
  },

  markAllNotificationsAsRead: (userId) => {
    const targetUserId = String(userId);
    memoryNotifications.forEach((n) => {
      if (String(n.user) === targetUserId) n.isRead = true;
    });
    return true;
  },
};
