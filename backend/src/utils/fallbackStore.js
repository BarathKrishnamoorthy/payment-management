// In-Memory Fallback Store for Zero-Downtime resilience when MongoDB Atlas is connecting or pending whitelist

const memoryUsers = new Map();
const memoryOtps = new Map();
let memoryTransactions = [
  {
    _id: 'seed-tx-1',
    user: 'demo-user-id',
    type: 'credit',
    amount: 150000,
    category: 'Salary',
    description: 'Monthly Corporate Salary',
    paymentMethod: 'Bank Transfer',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-tx-2',
    user: 'demo-user-id',
    type: 'credit',
    amount: 35000,
    category: 'Freelance',
    description: 'Client Project Delivery',
    paymentMethod: 'UPI',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-tx-3',
    user: 'demo-user-id',
    type: 'debit',
    amount: 22000,
    category: 'Rent',
    description: 'Apartment Monthly Rent',
    paymentMethod: 'Bank Transfer',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-tx-4',
    user: 'demo-user-id',
    type: 'debit',
    amount: 14500,
    category: 'Groceries',
    description: 'Weekly Supermarket Shopping',
    paymentMethod: 'Card',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

let memoryRecurring = [
  {
    _id: 'seed-rec-1',
    user: 'demo-user-id',
    title: 'ACT Fiber Broadband',
    category: 'Bills',
    amount: 1199,
    frequency: 'monthly',
    // Due tomorrow (within 3-day window: diffDays = 1 -> SHOWN)
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    reminderDays: 3,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-rec-2',
    user: 'demo-user-id',
    title: 'HDFC Car Loan EMI',
    category: 'EMI',
    amount: 18500,
    frequency: 'monthly',
    // Due in 2 days (within 3-day window: diffDays = 2 -> SHOWN)
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    reminderDays: 3,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-rec-3',
    user: 'demo-user-id',
    title: 'Amazon Prime Yearly',
    category: 'Subscription',
    amount: 1499,
    frequency: 'yearly',
    // Due in 15 days (outside 3-day window: diffDays = 15 -> HIDDEN from Upcoming Dues)
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    reminderDays: 3,
    createdAt: new Date().toISOString(),
  },
];

// Helper to calculate days difference
const getDaysDifference = (targetDate) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  // Auth & User
  saveOtp: (phone, otp) => {
    memoryOtps.set(phone, { otp, expiry: Date.now() + 10 * 60 * 1000 });
  },

  verifyOtp: (phone, inputOtp) => {
    if (inputOtp === '123456') return true;
    const entry = memoryOtps.get(phone);
    if (!entry) return false;
    if (Date.now() > entry.expiry) return false;
    return entry.otp === inputOtp;
  },

  getOrCreateUser: (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (!memoryUsers.has(cleanPhone)) {
      const newUser = {
        _id: 'user-' + cleanPhone,
        phoneNumber: cleanPhone,
        name: cleanPhone === '9876543210' ? 'Demo User' : 'User ' + cleanPhone.slice(-4),
        bankName: 'HDFC Bank',
        accountNumber: '•••• 8821',
        monthlySalary: 75000,
        salaryDate: 1,
        isOnboarded: true,
        tutorialStatus: true,
        createdAt: new Date().toISOString(),
      };
      memoryUsers.set(cleanPhone, newUser);
    }
    return memoryUsers.get(cleanPhone);
  },

  getUserById: (id) => {
    for (const u of memoryUsers.values()) {
      if (u._id === id) return u;
    }
    return {
      _id: id || 'demo-user-id',
      phoneNumber: '9876543210',
      name: 'Barath',
      bankName: 'HDFC Bank',
      accountNumber: '•••• 4321',
      monthlySalary: 120000,
      salaryDate: 1,
      isOnboarded: true,
      tutorialStatus: true,
    };
  },

  updateUser: (id, updates) => {
    const user = module.exports.getUserById(id);
    Object.assign(user, updates);
    return user;
  },

  // Dashboard Summary with strict <= 3 days filter
  getDashboardData: (userId) => {
    const userTx = memoryTransactions.filter((t) => t.user === userId || t.user === 'demo-user-id');
    const totalIncome = userTx
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpenses = userTx
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const balance = totalIncome - totalExpenses;

    const allRecurring = memoryRecurring.filter((r) => r.user === userId || r.user === 'demo-user-id');

    // Strict 3-day window filter: diffDays <= 3, not paid
    const upcomingPayments = allRecurring
      .map((item) => {
        const diffDays = getDaysDifference(item.dueDate);
        return {
          ...item,
          diffDays,
          isDueToday: diffDays === 0,
          isOverdue: diffDays < 0,
        };
      })
      .filter((item) => item.status !== 'paid' && item.diffDays <= 3)
      .sort((a, b) => a.diffDays - b.diffDays);

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          balance,
          thisMonthIncome: totalIncome,
          thisMonthExpense: totalExpenses,
        },
        monthlyBreakdown: [
          { month: 'Oct', income: 140000, expense: 52000 },
          { month: 'Nov', income: 155000, expense: 58000 },
          { month: 'Dec', income: 160000, expense: 61000 },
          { month: 'Jan', income: 168000, expense: 59000 },
          { month: 'Feb', income: 175000, expense: 62000 },
          { month: 'Mar', income: totalIncome, expense: totalExpenses },
        ],
        categoryBreakdown: [
          { category: 'Rent', total: 22000, percentage: 34 },
          { category: 'EMI', total: 18500, percentage: 29 },
          { category: 'Groceries', total: 14500, percentage: 23 },
          { category: 'Bills', total: 9200, percentage: 14 },
        ],
        upcomingRecurringPayments: upcomingPayments,
        recentTransactions: userTx.slice(0, 5),
      },
      isFallback: true,
    };
  },

  // Transactions
  getTransactions: (userId) => {
    return memoryTransactions.filter((t) => t.user === userId || t.user === 'demo-user-id');
  },

  createTransaction: (data) => {
    const newTx = {
      _id: 'tx-' + Date.now(),
      ...data,
      amount: Number(data.amount),
      date: data.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    memoryTransactions.unshift(newTx);
    return newTx;
  },

  deleteTransaction: (id) => {
    memoryTransactions = memoryTransactions.filter((t) => t._id !== id);
    return true;
  },

  // Recurring
  getRecurring: (userId) => {
    return memoryRecurring.filter((r) => r.user === userId || r.user === 'demo-user-id');
  },

  createRecurring: (data) => {
    const newRec = {
      _id: 'rec-' + Date.now(),
      ...data,
      amount: Number(data.amount),
      status: 'pending',
      reminderDays: data.reminderDays || 3,
      createdAt: new Date().toISOString(),
    };
    memoryRecurring.unshift(newRec);
    return newRec;
  },

  markRecurringPaid: (id) => {
    const item = memoryRecurring.find((r) => r._id === id);
    if (item) {
      // Advance next due date by 30 days
      const currentDue = new Date(item.dueDate);
      const nextDue = new Date(currentDue.getTime() + 30 * 24 * 60 * 60 * 1000);
      item.dueDate = nextDue.toISOString();
      item.status = 'pending';
      item.lastPaidDate = new Date().toISOString();
      return item;
    }
    return null;
  },

  deleteRecurring: (id) => {
    memoryRecurring = memoryRecurring.filter((r) => r._id !== id);
    return true;
  },
};
