const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { checkAndSendRecurringNotifications } = require('../services/notificationService');
const fallbackStore = require('../utils/fallbackStore');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(userId)) {
      const list = fallbackStore.getNotifications(userId);
      const unreadCount = list.filter((n) => !n.isRead).length;
      return res.status(200).json({
        success: true,
        unreadCount,
        notifications: list,
        isDbConnected: mongoose.connection.readyState === 1,
      });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
      isDbConnected: true,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications: ' + err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(userId)) {
      const updated = fallbackStore.markNotificationRead(req.params.id, userId);
      return res.status(200).json({ success: true, notification: updated, isDbConnected: false });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(userId)) {
      fallbackStore.markAllNotificationsRead(userId);
      return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    }

    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
};

const registerPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'pushToken is required.' });
    }

    const userId = req.user ? req.user._id : 'demo-user-id';
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)) {
      await User.findByIdAndUpdate(userId, { pushToken });
    }

    res.status(200).json({ success: true, message: 'Push notification token registered.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register push token.' });
  }
};

const triggerCheckDuePayments = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const result = await checkAndSendRecurringNotifications(userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check due payments.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  triggerCheckDuePayments,
};
