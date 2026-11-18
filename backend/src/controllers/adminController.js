const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const fallbackStore = require('../utils/fallbackStore');

// Helper to generate Admin JWT
const generateAdminToken = (admin) => {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    'rb_admin_jwt_secret_super_secure_key_2026';
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role || 'admin',
    },
    secret,
    { expiresIn: '7d' }
  );
};

const isDbReady = () => mongoose.connection.readyState === 1;

// Seed default Super Admin into MongoDB on first boot
const seedDefaultAdminInDb = async () => {
  if (!isDbReady()) return;
  try {
    const existing = await AdminUser.findOne({ email: 'admin@erm.com' });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123456', salt);
      await AdminUser.create({
        name: 'ERM Super Admin',
        email: 'admin@erm.com',
        password: hashedPassword,
        role: 'superadmin',
      });
      console.log('[AdminController] Pre-seeded default admin (admin@erm.com) into MongoDB.');
    }
  } catch (err) {
    console.warn('[AdminController] DB admin seed warning:', err.message);
  }
};

// ================= 1. ADMIN AUTHENTICATION =================

// POST /api/admin/auth/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    await seedDefaultAdminInDb();

    let admin = null;

    // 1. Try MongoDB
    if (isDbReady()) {
      try {
        admin = await AdminUser.findOne({ email: cleanEmail });
      } catch (e) {
        // ignore
      }
    }

    // 2. Try Fallback Store
    if (!admin) {
      admin = fallbackStore.getAdminByEmail(cleanEmail);
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
    }

    // Update lastLoginAt
    if (admin.save) {
      admin.lastLoginAt = new Date();
      await admin.save();
    } else {
      admin.lastLoginAt = new Date().toISOString();
    }

    const token = generateAdminToken(admin);

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (err) {
    console.error('[Admin Auth Login Error]:', err);
    res.status(500).json({ success: false, message: 'Server error during admin authentication: ' + err.message });
  }
};

// POST /api/admin/auth/logout
const adminLogout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Admin logged out successfully.' });
};

// GET /api/admin/auth/me
const getAdminMe = async (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      lastLoginAt: req.admin.lastLoginAt,
    },
  });
};

// POST /api/admin/auth/forgot-password
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered admin email.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = isDbReady()
      ? await AdminUser.findOne({ email: cleanEmail })
      : fallbackStore.getAdminByEmail(cleanEmail);

    if (!admin) {
      // Security standard: don't reveal if admin email exists
      return res.status(200).json({
        success: true,
        message: 'If an administrator account exists with this email, a password reset link has been dispatched.',
      });
    }

    const resetToken = 'rst-' + Math.random().toString(36).substring(2) + Date.now();
    if (admin.save) {
      admin.resetPasswordToken = resetToken;
      admin.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await admin.save();
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      demoResetToken: resetToken, // Provided for testing environments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Forgot password request failed: ' + err.message });
  }
};

// POST /api/admin/auth/reset-password
const adminResetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let admin = isDbReady()
      ? await AdminUser.findOne({ email: cleanEmail })
      : fallbackStore.getAdminByEmail(cleanEmail);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (admin.save) {
      admin.password = hashedPassword;
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save();
    } else {
      admin.password = hashedPassword;
    }

    res.status(200).json({ success: true, message: 'Administrator password reset successfully. Please log in with your new credentials.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset password: ' + err.message });
  }
};

// ================= 2. DASHBOARD OVERVIEW (10 SUMMARY CARDS) =================

// GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    if (isDbReady()) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const realTime30Min = new Date(now.getTime() - 30 * 60 * 1000);

      // 1. Total Registered
      const totalRegisteredUsers = await User.countDocuments();

      // 2. Active in last 30 days
      const totalActiveUsers = await User.countDocuments({
        lastActiveAt: { $gte: monthStart },
        isBlocked: { $ne: true },
      });

      // 3. DAU (Unique active today)
      const dau = await User.countDocuments({
        lastActiveAt: { $gte: todayStart },
      });

      // 4. WAU (Unique active in last 7 days)
      const wau = await User.countDocuments({
        lastActiveAt: { $gte: weekStart },
      });

      // 5. MAU (Unique active in last 30 days)
      const mau = totalActiveUsers;

      // 6. Website Active Users
      const websiteActiveUsers = await User.countDocuments({
        lastActiveAt: { $gte: monthStart },
        platform: 'website',
      });

      // 7. Mobile Active Users (Android + iOS)
      const mobileActiveUsers = await User.countDocuments({
        lastActiveAt: { $gte: monthStart },
        platform: { $in: ['android', 'ios'] },
      });

      // 8. New Registrations Today
      const newRegistrations = await User.countDocuments({
        createdAt: { $gte: todayStart },
      });

      // 9. Inactive Users (No activity > 30 days)
      const inactiveUsers = await User.countDocuments({
        $or: [
          { lastActiveAt: { $lt: monthStart } },
          { lastActiveAt: { $exists: false } },
        ],
      });

      // 10. Blocked Users
      const blockedUsers = await User.countDocuments({ isBlocked: true });

      // Real-time active in last 30 minutes
      const realTimeActiveUsers = await User.countDocuments({
        lastActiveAt: { $gte: realTime30Min },
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalRegisteredUsers,
          totalActiveUsers,
          dau,
          wau,
          mau,
          websiteActiveUsers,
          mobileActiveUsers,
          newRegistrations,
          inactiveUsers,
          blockedUsers,
          realTimeActiveUsers,
        },
      });
    }

    // Fallback store
    const fbStats = fallbackStore.getAdminStats();
    res.status(200).json({
      success: true,
      stats: fbStats,
      isDbConnected: false,
    });
  } catch (err) {
    console.error('[Admin Dashboard Stats Error]:', err);
    const fbStats = fallbackStore.getAdminStats();
    res.status(200).json({
      success: true,
      stats: fbStats,
      isDbConnected: false,
    });
  }
};

// ================= 3. USER ACTIVITY ANALYTICS =================

// GET /api/admin/analytics/trends
const getActivityTrends = async (req, res) => {
  try {
    const { timeframe = 'last_30_days', startDate, endDate } = req.query;

    if (!isDbReady()) {
      const data = fallbackStore.getActivityTrends(timeframe, startDate, endDate);
      return res.status(200).json({ success: true, trends: data });
    }

    let days = 30;
    if (timeframe === 'today' || timeframe === 'yesterday') days = 1;
    else if (timeframe === 'last_7_days') days = 7;
    else if (timeframe === 'this_month') days = 30;

    const points = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const dau = await User.countDocuments({
        lastActiveAt: { $gte: dStart, $lte: dEnd },
      });

      const webCount = await User.countDocuments({
        lastActiveAt: { $gte: dStart, $lte: dEnd },
        platform: 'website',
      });

      const mobCount = await User.countDocuments({
        lastActiveAt: { $gte: dStart, $lte: dEnd },
        platform: { $in: ['android', 'ios'] },
      });

      const newReg = await User.countDocuments({
        createdAt: { $gte: dStart, $lte: dEnd },
      });

      const activityCount = await UserActivity.countDocuments({
        timestamp: { $gte: dStart, $lte: dEnd },
      });

      points.push({
        date: d.toISOString().split('T')[0],
        label,
        dau,
        websiteUsers: webCount,
        mobileUsers: mobCount,
        newRegistrations: newReg,
        activityCount,
      });
    }

    res.status(200).json({ success: true, trends: points });
  } catch (err) {
    console.error('[Activity Trends Error]:', err);
    const data = fallbackStore.getActivityTrends(req.query.timeframe);
    res.status(200).json({ success: true, trends: data });
  }
};

// ================= 4. ACTIVE USERS MODULE =================

// GET /api/admin/users/active
const getActiveUsers = async (req, res) => {
  try {
    const { search = '', platform = 'All', page = 1, limit = 20 } = req.query;

    if (!isDbReady()) {
      const result = fallbackStore.getActiveUsersList({ search, platform, page, limit });
      return res.status(200).json({ success: true, ...result });
    }

    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const realTime30Min = new Date(Date.now() - 30 * 60 * 1000);

    const query = {
      lastActiveAt: { $gte: monthStart },
      isBlocked: { $ne: true },
    };

    if (platform && platform !== 'All') {
      query.platform = platform.toLowerCase();
    }

    if (search && search.trim()) {
      const rgx = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: rgx },
        { phoneNumber: rgx },
        { email: rgx },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ lastActiveAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-otp -otpExpiry');

    const mapped = users.map((u) => ({
      _id: u._id,
      name: u.name || 'Customer',
      phoneNumber: u.phoneNumber,
      email: u.email || 'N/A',
      platform: u.platform || 'website',
      status: u.status || 'Active',
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt,
      isRealTimeActive: u.lastActiveAt ? new Date(u.lastActiveAt) >= realTime30Min : false,
    }));

    res.status(200).json({
      success: true,
      users: mapped,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error('[Get Active Users Error]:', err);
    const result = fallbackStore.getActiveUsersList(req.query);
    res.status(200).json({ success: true, ...result });
  }
};

// ================= 5. USER MANAGEMENT MODULE =================

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { search = '', status = 'All', platform = 'All', page = 1, limit = 20 } = req.query;

    if (!isDbReady()) {
      const result = fallbackStore.getAllUsersList({ search, status, platform, page, limit });
      return res.status(200).json({ success: true, ...result });
    }

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (platform && platform !== 'All') {
      query.platform = platform.toLowerCase();
    }

    if (search && search.trim()) {
      const rgx = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: rgx },
        { phoneNumber: rgx },
        { email: rgx },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-otp -otpExpiry');

    res.status(200).json({
      success: true,
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error('[Get All Users Error]:', err);
    const result = fallbackStore.getAllUsersList(req.query);
    res.status(200).json({ success: true, ...result });
  }
};

// GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbReady()) {
      const details = fallbackStore.getUserDetails(id);
      if (!details) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.status(200).json({ success: true, ...details });
    }

    let user = null;
    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).select('-otp -otpExpiry');
    } else {
      user = await User.findOne({ phoneNumber: id.replace(/[^0-9]/g, '').slice(-10) }).select('-otp -otpExpiry');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = user._id;
    const [txCount, incomeAgg, expenseAgg, recCount, loansCount, accCount, recentActivity] = await Promise.all([
      Transaction.countDocuments({ user: userId }),
      Transaction.aggregate([
        { $match: { user: userId, type: 'credit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'debit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      RecurringPayment.countDocuments({ user: userId }),
      Loan.countDocuments({ user: userId }),
      Account.countDocuments({ user: userId }),
      UserActivity.find({ user: userId }).sort({ timestamp: -1 }).limit(25),
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalTransactions: txCount,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        recurringSchedules: recCount,
        loansCount,
        accountsCount: accCount,
      },
      recentActivity,
    });
  } catch (err) {
    console.error('[Get User Details Error]:', err);
    const details = fallbackStore.getUserDetails(req.params.id);
    if (details) return res.status(200).json({ success: true, ...details });
    res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
};

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Active, Inactive, or Blocked.' });
    }

    if (isDbReady() && mongoose.isValidObjectId(id)) {
      const user = await User.findById(id);
      if (user) {
        user.status = status;
        if (status === 'Blocked') user.isBlocked = true;
        if (status === 'Active') user.isBlocked = false;
        await user.save();
        fallbackStore.setUserStatus(id, status);
        return res.status(200).json({ success: true, message: `User status updated to ${status}.`, user });
      }
    }

    const updated = fallbackStore.setUserStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: `User status updated to ${status}.`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user status: ' + err.message });
  }
};

// PATCH /api/admin/users/:id/block
const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked, reason = '' } = req.body;

    const blockedBool = Boolean(isBlocked);

    if (isDbReady() && mongoose.isValidObjectId(id)) {
      const user = await User.findById(id);
      if (user) {
        user.isBlocked = blockedBool;
        user.blockReason = reason;
        user.status = blockedBool ? 'Blocked' : 'Active';
        await user.save();
        fallbackStore.setUserBlockStatus(id, blockedBool, reason);
        return res.status(200).json({
          success: true,
          message: blockedBool ? 'User has been blocked successfully.' : 'User has been unblocked successfully.',
          user,
        });
      }
    }

    const updated = fallbackStore.setUserBlockStatus(id, blockedBool, reason);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: blockedBool ? 'User has been blocked successfully.' : 'User has been unblocked successfully.',
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update block state: ' + err.message });
  }
};

// ================= 6. PLATFORM ANALYTICS MODULE =================

// GET /api/admin/platform
const getPlatformAnalytics = async (req, res) => {
  try {
    if (!isDbReady()) {
      const data = fallbackStore.getPlatformAnalytics();
      return res.status(200).json({ success: true, analytics: data });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      webTotal,
      webDau,
      webMau,
      webNew,
      webLogins,
      mobTotal,
      mobDau,
      mobMau,
      androidCount,
      iosCount,
      mobLogins,
      appVersionsAgg,
    ] = await Promise.all([
      User.countDocuments({ platform: 'website' }),
      User.countDocuments({ platform: 'website', lastActiveAt: { $gte: todayStart } }),
      User.countDocuments({ platform: 'website', lastActiveAt: { $gte: monthStart } }),
      User.countDocuments({ platform: 'website', createdAt: { $gte: todayStart } }),
      UserActivity.countDocuments({ platform: 'website', action: { $regex: /login/i } }),
      User.countDocuments({ platform: { $in: ['android', 'ios'] } }),
      User.countDocuments({ platform: { $in: ['android', 'ios'] }, lastActiveAt: { $gte: todayStart } }),
      User.countDocuments({ platform: { $in: ['android', 'ios'] }, lastActiveAt: { $gte: monthStart } }),
      User.countDocuments({ platform: 'android' }),
      User.countDocuments({ platform: 'ios' }),
      UserActivity.countDocuments({ platform: { $in: ['android', 'ios'] }, action: { $regex: /login/i } }),
      User.aggregate([
        { $match: { platform: { $in: ['android', 'ios'] } } },
        { $group: { _id: '$appVersion', count: { $sum: 1 } } },
      ]),
    ]);

    const totalMob = mobTotal || 1;
    const versionDistribution = appVersionsAgg.map((v) => ({
      version: v._id || '1.0.0',
      count: v.count,
      percentage: Math.round((v.count / totalMob) * 100),
    }));

    res.status(200).json({
      success: true,
      analytics: {
        website: {
          totalUsers: webTotal,
          dau: webDau,
          mau: webMau,
          newRegistrations: webNew,
          loginActivity: webLogins,
        },
        mobile: {
          totalUsers: mobTotal,
          dau: mobDau,
          mau: mobMau,
          androidUsers: androidCount,
          iosUsers: iosCount,
          loginActivity: mobLogins,
          versionDistribution: versionDistribution.length > 0 ? versionDistribution : [{ version: '1.0.0', count: mobTotal, percentage: 100 }],
        },
      },
    });
  } catch (err) {
    console.error('[Platform Analytics Error]:', err);
    const data = fallbackStore.getPlatformAnalytics();
    res.status(200).json({ success: true, analytics: data });
  }
};

// ================= 7. REPORTS & EXPORT MODULE =================

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { reportType = 'total_registered' } = req.query;
    const reportData = fallbackStore.getReports(reportType, req.query);
    res.status(200).json({ success: true, ...reportData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report: ' + err.message });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminMe,
  adminForgotPassword,
  adminResetPassword,
  getDashboardStats,
  getActivityTrends,
  getActiveUsers,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  blockUser,
  getPlatformAnalytics,
  getReports,
};
