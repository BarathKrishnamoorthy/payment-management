const Notification = require('../models/Notification');
const User = require('../models/User');
const { checkAndSendRecurringNotifications } = require('../services/notificationService');

const fallbackStore = require('../utils/fallbackStore');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (require('mongoose').connection.readyState !== 1) {
      const list = fallbackStore.getNotifications(userId);
      const unreadCount = list.filter((n) => !n.isRead).length;
      return res.status(200).json({
        success: true,
        unreadCount,
        notifications: list,
        isDbConnected: false,
      });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
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
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
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

    await User.findByIdAndUpdate(req.user._id, { pushToken });

    res.status(200).json({ success: true, message: 'Push notification token registered.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register push token.' });
  }
};

const triggerCheckDuePayments = async (req, res) => {
  try {
    const result = await checkAndSendRecurringNotifications(req.user._id);
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

