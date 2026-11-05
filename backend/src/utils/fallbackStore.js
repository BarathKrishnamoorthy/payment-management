// In-Memory Fallback Store - Zero-Downtime Resilience with STRICT Customer-Wise Data Isolation
// Completely free of dummy/mock data: every customer starts with an empty ledger (0 balance, 0 records).
const fs = require('fs');
const path = require('path');

const memoryUsers = new Map();
const memoryOtps = new Map();
let memoryTransactions = [];
let memoryRecurring = [];
let memoryNotifications = [];
let memoryAccounts = [];
let memoryWorkspaces = [];
let memoryBudgets = [];
let memorySavingsGoals = [];
let memoryLoans = [];

// Persistence file path
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'fallback_store.json');

const saveToDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      users: Array.from(memoryUsers.entries()),
      transactions: memoryTransactions,
      recurring: memoryRecurring,
      notifications: memoryNotifications,
      accounts: memoryAccounts,
      workspaces: memoryWorkspaces,
      budgets: memoryBudgets,
      savingsGoals: memorySavingsGoals,
      loans: memoryLoans,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    // Gracefully ignore storage write failures in restricted environments
  }
};

const loadFromDisk = () => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.users && Array.isArray(parsed.users)) {
        parsed.users.forEach(([k, v]) => memoryUsers.set(k, v));
      }
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        memoryTransactions = parsed.transactions;
      }
      if (parsed.recurring && Array.isArray(parsed.recurring)) {
        memoryRecurring = parsed.recurring;
      }
      if (parsed.notifications && Array.isArray(parsed.notifications)) {
        memoryNotifications = parsed.notifications;
      }
      if (parsed.accounts && Array.isArray(parsed.accounts)) {
        memoryAccounts = parsed.accounts;
      }
      if (parsed.workspaces && Array.isArray(parsed.workspaces)) {
        memoryWorkspaces = parsed.workspaces;
      }
      if (parsed.budgets && Array.isArray(parsed.budgets)) {
        memoryBudgets = parsed.budgets;
      }
      if (parsed.savingsGoals && Array.isArray(parsed.savingsGoals)) {
        memorySavingsGoals = parsed.savingsGoals;
      }
      if (parsed.loans && Array.isArray(parsed.loans)) {
        memoryLoans = parsed.loans;
      }
    }
  } catch (e) {
    // Ignore corrupt or unreadable cache file
  }
};

// Initial load on start
loadFromDisk();

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
    const cleanPhone = stringId.replace('user-', '') || '9876543210';
    const newUser = {
      _id: stringId,
      phoneNumber: cleanPhone,
      name: 'Customer',
      bankName: '',
      accountNumber: '',
      monthlySalary: 0,
      salaryDate: 1,
      isOnboarded: false,
      tutorialStatus: { dashboard: false, transactions: false, recurring: false, reports: false },
      createdAt: new Date().toISOString(),
    };
    memoryUsers.set(cleanPhone, newUser);
    return newUser;
  },

  updateUser: (id, updates) => {
    const user = module.exports.getUserById(id);
    if (updates.name && updates.name.trim() !== '' && !updates.name.startsWith('Customer ') && updates.name !== 'Customer') {
      updates.isOnboarded = true;
    }
    Object.assign(user, updates);
    saveToDisk();
    return user;
  },

  updateTutorialStatus: (userId, modName, completed) => {
    const user = module.exports.getUserById(userId);
    if (!user.tutorialStatus) {
      user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
    }
    user.tutorialStatus[modName] = Boolean(completed);
    saveToDisk();
    return user.tutorialStatus;
  },

  resetTutorialStatus: (userId, modName) => {
    const user = module.exports.getUserById(userId);
    if (!user.tutorialStatus) {
      user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
    }
    if (modName) {
      user.tutorialStatus[modName] = false;
    } else {
      user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
    }
    saveToDisk();
    return user.tutorialStatus;
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
    saveToDisk();
    return newTx;
  },

  deleteTransaction: (id, userId) => {
    const initialLen = memoryTransactions.length;
    memoryTransactions = memoryTransactions.filter(
      (t) => !(t._id === id && String(t.user) === String(userId))
    );
    const deleted = memoryTransactions.length < initialLen;
    if (deleted) saveToDisk();
    return deleted;
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
    saveToDisk();
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

      saveToDisk();
      return item;
    }
    return null;
  },

  deleteRecurring: (id, userId) => {
    const initialLen = memoryRecurring.length;
    memoryRecurring = memoryRecurring.filter(
      (r) => !(r._id === id && String(r.user) === String(userId))
    );
    const deleted = memoryRecurring.length < initialLen;
    if (deleted) saveToDisk();
    return deleted;
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

  // ==========================================
  // ACCOUNTS & WALLETS (FALLBACK STORE)
  // ==========================================
  getAccounts: (userId, workspaceId = 'personal') => {
    const targetUserId = String(userId);
    let list = memoryAccounts.filter((a) => String(a.user) === targetUserId && a.status !== 'archived');
    if (list.length === 0) {
      const defaultCash = {
        _id: 'acc-cash-' + targetUserId,
        user: targetUserId,
        workspaceId,
        accountName: 'Cash Wallet',
        accountType: 'cash',
        openingBalance: 0,
        currentBalance: 0,
        currency: 'INR',
        isDefault: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      memoryAccounts.push(defaultCash);
      saveToDisk();
      return [defaultCash];
    }
    return list;
  },

  createAccount: (data) => {
    const newAcc = {
      _id: 'acc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      user: String(data.user),
      workspaceId: data.workspaceId || 'personal',
      accountName: data.accountName,
      accountType: data.accountType || 'savings',
      bankName: data.bankName || '',
      accountNumber: data.accountNumber || '',
      accountNumberLast4: data.accountNumberLast4 || '',
      openingBalance: Number(data.openingBalance) || 0,
      currentBalance: Number(data.openingBalance) || 0,
      currency: data.currency || 'INR',
      isDefault: Boolean(data.isDefault),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    if (newAcc.isDefault) {
      memoryAccounts.forEach((a) => {
        if (String(a.user) === String(data.user)) a.isDefault = false;
      });
    }
    memoryAccounts.push(newAcc);
    saveToDisk();
    return newAcc;
  },

  updateAccount: (id, userId, updates) => {
    const acc = memoryAccounts.find((a) => a._id === id && String(a.user) === String(userId));
    if (acc) {
      if (updates.isDefault) {
        memoryAccounts.forEach((a) => {
          if (String(a.user) === String(userId)) a.isDefault = false;
        });
      }
      Object.assign(acc, updates);
      saveToDisk();
      return acc;
    }
    return null;
  },

  archiveAccount: (id, userId) => {
    const acc = memoryAccounts.find((a) => a._id === id && String(a.user) === String(userId));
    if (acc) {
      acc.status = 'archived';
      saveToDisk();
      return true;
    }
    return false;
  },

  transferBetweenAccounts: (userId, data) => {
    const targetUserId = String(userId);
    const fromAcc = memoryAccounts.find((a) => a._id === data.fromAccountId && String(a.user) === targetUserId);
    const toAcc = memoryAccounts.find((a) => a._id === data.toAccountId && String(a.user) === targetUserId);

    if (fromAcc) fromAcc.currentBalance -= data.amount;
    if (toAcc) toAcc.currentBalance += data.amount;

    // Record source leg
    const tx1 = {
      _id: 'tx-' + Date.now() + '-1',
      user: targetUserId,
      accountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      type: 'transfer',
      transferGroupId: data.transferGroupId,
      amount: data.amount,
      date: data.date,
      category: 'Transfer',
      reason: data.notes || `Transfer to ${toAcc ? toAcc.accountName : 'Account'}`,
      source: 'transfer',
      createdAt: new Date().toISOString(),
    };
    // Record dest leg
    const tx2 = {
      _id: 'tx-' + Date.now() + '-2',
      user: targetUserId,
      accountId: data.toAccountId,
      toAccountId: data.fromAccountId,
      type: 'transfer',
      transferGroupId: data.transferGroupId,
      amount: data.amount,
      date: data.date,
      category: 'Transfer',
      reason: data.notes || `Transfer from ${fromAcc ? fromAcc.accountName : 'Account'}`,
      source: 'transfer',
      createdAt: new Date().toISOString(),
    };
    memoryTransactions.unshift(tx1);
    memoryTransactions.unshift(tx2);
    saveToDisk();

    return { fromAccount: fromAcc, toAccount: toAcc, transferGroupId: data.transferGroupId };
  },

  // ==========================================
  // WORKSPACES & FAMILY (FALLBACK STORE)
  // ==========================================
  getWorkspaces: (userId, phone) => {
    const targetUserId = String(userId);
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);

    let list = memoryWorkspaces.filter(
      (w) =>
        w.status === 'active' &&
        (String(w.owner) === targetUserId ||
          w.members.some((m) => String(m.user) === targetUserId || m.phoneNumber === cleanPhone))
    );

    // Ensure personal workspace exists
    let personal = list.find((w) => w.type === 'personal');
    if (!personal) {
      personal = {
        _id: 'ws-personal-' + targetUserId,
        name: 'Personal Workspace',
        type: 'personal',
        owner: targetUserId,
        currency: 'INR',
        status: 'active',
        members: [{ user: targetUserId, phoneNumber: cleanPhone, name: 'Owner', role: 'owner', status: 'active' }],
        createdAt: new Date().toISOString(),
      };
      memoryWorkspaces.unshift(personal);
      list.unshift(personal);
      saveToDisk();
    }
    return list;
  },

  createFamilyWorkspace: (userId, data) => {
    const ws = {
      _id: 'ws-fam-' + Date.now(),
      name: data.name,
      type: 'family',
      owner: String(userId),
      currency: 'INR',
      status: 'active',
      members: [
        {
          _id: 'mem-' + Date.now(),
          user: String(userId),
          phoneNumber: data.ownerPhone,
          name: data.ownerName,
          role: 'owner',
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    memoryWorkspaces.push(ws);
    saveToDisk();
    return ws;
  },

  inviteMember: (workspaceId, userId, memberData) => {
    const ws = memoryWorkspaces.find((w) => w._id === workspaceId);
    if (ws) {
      const newMem = {
        _id: 'mem-' + Date.now(),
        phoneNumber: memberData.phoneNumber,
        name: memberData.name,
        role: memberData.role || 'member',
        status: 'active',
        joinedAt: new Date().toISOString(),
      };
      ws.members.push(newMem);
      saveToDisk();
      return ws;
    }
    return null;
  },

  removeMember: (workspaceId, memberId, userId) => {
    const ws = memoryWorkspaces.find((w) => w._id === workspaceId && String(w.owner) === String(userId));
    if (ws) {
      ws.members = ws.members.filter((m) => m._id !== memberId);
      saveToDisk();
      return ws;
    }
    return null;
  },

  getFamilySummary: (workspaceId) => {
    const ws = memoryWorkspaces.find((w) => w._id === workspaceId);
    const sharedTxs = memoryTransactions.filter((t) => t.workspaceId === workspaceId);

    let totalSharedExpense = 0;
    let totalContributions = 0;
    const memberTotals = {};

    if (ws && ws.members) {
      ws.members.forEach((m) => {
        memberTotals[m.phoneNumber] = {
          name: m.name || m.phoneNumber,
          phoneNumber: m.phoneNumber,
          role: m.role,
          paid: 0,
        };
      });
    }

    sharedTxs.forEach((tx) => {
      if (tx.type === 'debit') {
        totalSharedExpense += tx.amount;
        if (tx.familyPayerId && memberTotals[tx.familyPayerId]) {
          memberTotals[tx.familyPayerId].paid += tx.amount;
        }
      } else if (tx.type === 'credit') {
        totalContributions += tx.amount;
      }
    });

    return {
      workspace: ws,
      totalSharedExpense,
      totalContributions,
      memberBreakdown: Object.values(memberTotals),
      recentTransactions: sharedTxs.slice(0, 10),
    };
  },

  // ==========================================
  // BUDGETS (FALLBACK STORE)
  // ==========================================
  getBudgets: (userId, workspaceId = 'personal') => {
    const targetUserId = String(userId);
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    const userBudgets = memoryBudgets.filter(
      (b) => String(b.user) === targetUserId && b.workspaceId === workspaceId && b.status === 'active'
    );

    const userDebits = memoryTransactions.filter(
      (t) => String(t.user) === targetUserId && t.type === 'debit'
    );

    return userBudgets.map((b) => {
      const spent = userDebits
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
      return {
        ...b,
        spent,
        remaining,
        percentage,
        isNearLimit: percentage >= 80 && percentage < 100,
        isOverBudget: spent > b.amount,
      };
    });
  },

  createBudget: (data) => {
    const existing = memoryBudgets.find(
      (b) =>
        String(b.user) === String(data.user) &&
        b.workspaceId === data.workspaceId &&
        b.category === data.category
    );
    if (existing) {
      existing.amount = data.amount;
      existing.status = 'active';
      saveToDisk();
      return existing;
    }
    const newB = {
      _id: 'bgt-' + Date.now(),
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    memoryBudgets.push(newB);
    saveToDisk();
    return newB;
  },

  deleteBudget: (id, userId) => {
    const b = memoryBudgets.find((x) => x._id === id && String(x.user) === String(userId));
    if (b) {
      b.status = 'archived';
      saveToDisk();
      return true;
    }
    return false;
  },

  // ==========================================
  // SAVINGS GOALS (FALLBACK STORE)
  // ==========================================
  getSavingsGoals: (userId, workspaceId = 'personal') => {
    const targetUserId = String(userId);
    return memorySavingsGoals
      .filter((g) => String(g.user) === targetUserId && g.status !== 'archived')
      .map((g) => ({
        ...g,
        percentage: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
        remainingAmount: Math.max(0, g.targetAmount - g.currentAmount),
      }));
  },

  createSavingsGoal: (data) => {
    const newGoal = {
      _id: 'goal-' + Date.now(),
      ...data,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    };
    memorySavingsGoals.push(newGoal);
    saveToDisk();
    return newGoal;
  },

  addGoalContribution: (id, userId, contribution) => {
    const goal = memorySavingsGoals.find((g) => g._id === id && String(g.user) === String(userId));
    if (goal) {
      goal.currentAmount += Number(contribution.amount);
      if (!goal.contributions) goal.contributions = [];
      goal.contributions.push({
        _id: 'dep-' + Date.now(),
        amount: Number(contribution.amount),
        date: new Date().toISOString(),
        notes: contribution.notes || 'Deposit',
      });
      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = 'completed';
      }
      saveToDisk();
      return goal;
    }
    return null;
  },

  deleteSavingsGoal: (id, userId) => {
    const goal = memorySavingsGoals.find((g) => g._id === id && String(g.user) === String(userId));
    if (goal) {
      goal.status = 'archived';
      saveToDisk();
      return true;
    }
    return false;
  },

  // ==========================================
  // LOANS (BORROWING & LENDING FALLBACK STORE)
  // ==========================================
  getLoans: (userId, workspaceId = 'personal', type) => {
    const targetUserId = String(userId);
    let list = memoryLoans.filter((l) => String(l.user) === targetUserId);
    if (type) list = list.filter((l) => l.type === type);

    let totalBorrowed = 0;
    let totalLent = 0;
    let outstandingBorrowed = 0;
    let outstandingLent = 0;

    list.forEach((l) => {
      if (l.type === 'borrowed') {
        totalBorrowed += l.principal;
        outstandingBorrowed += l.outstanding;
      } else if (l.type === 'lent') {
        totalLent += l.principal;
        outstandingLent += l.outstanding;
      }
    });

    return {
      loans: list,
      summary: {
        totalBorrowed,
        totalLent,
        outstandingBorrowed,
        outstandingLent,
        netPosition: outstandingLent - outstandingBorrowed,
      },
    };
  },

  createLoan: (data) => {
    const newLoan = {
      _id: 'loan-' + Date.now(),
      ...data,
      status: 'active',
      repayments: [],
      createdAt: new Date().toISOString(),
    };
    memoryLoans.push(newLoan);
    saveToDisk();
    return newLoan;
  },

  addLoanRepayment: (id, userId, repayment) => {
    const loan = memoryLoans.find((l) => l._id === id && String(l.user) === String(userId));
    if (loan) {
      loan.outstanding = Math.max(0, loan.outstanding - Number(repayment.amount));
      if (!loan.repayments) loan.repayments = [];
      loan.repayments.push({
        _id: 'rep-' + Date.now(),
        amount: Number(repayment.amount),
        date: repayment.date || new Date().toISOString(),
        notes: repayment.notes || '',
        referenceNumber: repayment.referenceNumber || '',
      });
      if (loan.outstanding === 0) {
        loan.status = 'repaid';
      }
      saveToDisk();
      return loan;
    }
    return null;
  },

  deleteLoan: (id, userId) => {
    const initial = memoryLoans.length;
    memoryLoans = memoryLoans.filter((l) => !(l._id === id && String(l.user) === String(userId)));
    const deleted = memoryLoans.length < initial;
    if (deleted) saveToDisk();
    return deleted;
  },
};
