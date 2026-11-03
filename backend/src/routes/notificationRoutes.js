const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  triggerCheckDuePayments,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/mark-all-read', protect, markAllAsRead);
router.post('/register-token', protect, registerPushToken);
router.post('/check-dues', protect, triggerCheckDuePayments);

module.exports = router;

