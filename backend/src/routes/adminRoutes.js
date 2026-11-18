const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminMiddleware');

// 1. Admin Authentication Routes
router.post('/auth/login', adminLogin);
router.post('/auth/logout', adminLogout);
router.post('/auth/forgot-password', adminForgotPassword);
router.post('/auth/reset-password', adminResetPassword);
router.get('/auth/me', adminProtect, getAdminMe);

// 2. Admin Dashboard & Overview Stats (10 KPIs)
router.get('/dashboard/stats', adminProtect, getDashboardStats);

// 3. User Activity Analytics Trends
router.get('/analytics/trends', adminProtect, getActivityTrends);

// 4. Active Users Directory
router.get('/users/active', adminProtect, getActiveUsers);

// 5. User Management Routes
router.get('/users', adminProtect, getAllUsers);
router.get('/users/:id', adminProtect, getUserDetails);
router.patch('/users/:id/status', adminProtect, updateUserStatus);
router.patch('/users/:id/block', adminProtect, blockUser);

// 6. Platform Analytics
router.get('/platform', adminProtect, getPlatformAnalytics);

// 7. Reports & Export Module
router.get('/reports', adminProtect, getReports);

module.exports = router;
