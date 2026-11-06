const mongoose = require('mongoose');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

const findDbUser = async (userId, phone, selectFields = '') => {
  if (!isDbReady()) return null;
  const rawId = String(userId || '');
  const cleanPhone = (phone || rawId).replace(/[^0-9]/g, '').slice(-10);
  try {
    if (mongoose.isValidObjectId(rawId)) {
      return selectFields ? await User.findById(rawId).select(selectFields) : await User.findById(rawId);
    } else if (cleanPhone && cleanPhone.length === 10) {
      return selectFields ? await User.findOne({ phoneNumber: cleanPhone }).select(selectFields) : await User.findOne({ phoneNumber: cleanPhone });
    }
  } catch (e) {}
  return null;
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    const user = await findDbUser(userId, req.user?.phoneNumber, '-otp -otpExpiry');
    if (user) {
      fallbackStore.cacheUser(user);
      return res.status(200).json({ success: true, user, isDbConnected: true });
    }

    const fallbackUser = fallbackStore.getUserById(userId);
    res.status(200).json({ success: true, user: fallbackUser, isDbConnected: false });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { name, accountNumber, bankName, email } = req.body;

    const user = await findDbUser(userId, req.user?.phoneNumber);
    if (user) {
      if (name !== undefined) user.name = name.trim();
      if (accountNumber !== undefined) user.accountNumber = accountNumber.trim();
      if (bankName !== undefined) user.bankName = bankName.trim();
      if (email !== undefined) user.email = email.trim();

      await user.save();
      fallbackStore.cacheUser(user);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          bankName: user.bankName,
          accountNumber: user.accountNumber,
          email: user.email,
          isOnboarded: user.isOnboarded,
          tutorialStatus: user.tutorialStatus,
        },
      });
    }

    const updated = fallbackStore.updateUser(userId, {
      name: name !== undefined ? name.trim() : undefined,
      accountNumber: accountNumber !== undefined ? accountNumber.trim() : undefined,
      bankName: bankName !== undefined ? bankName.trim() : undefined,
      email: email !== undefined ? email.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully (Session Mode).',
      user: updated,
      isDbConnected: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const updateTutorialStatus = async (req, res) => {
  try {
    const { module: modName, completed } = req.body;
    const userId = req.user ? req.user._id : 'demo-user-id';

    const user = await findDbUser(userId, req.user?.phoneNumber);
    if (user) {
      if (!user.tutorialStatus) {
        user.tutorialStatus = {};
      }
      user.tutorialStatus[modName] = Boolean(completed);
      user.markModified('tutorialStatus');
      await user.save();
      fallbackStore.cacheUser(user);

      return res.status(200).json({
        success: true,
        message: `Tutorial for ${modName} marked as ${completed ? 'completed' : 'pending'}.`,
        tutorialStatus: user.tutorialStatus,
        isDbConnected: true,
      });
    }

    const updatedStatus = fallbackStore.updateTutorialStatus(userId, modName, completed);

    return res.status(200).json({
      success: true,
      message: `Tutorial for ${modName} marked as ${completed ? 'completed' : 'pending'}.`,
      tutorialStatus: updatedStatus,
      isDbConnected: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update tutorial progress: ' + err.message });
  }
};

const resetTutorialStatus = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const targetModule = req.body ? req.body.module : null;

    const user = await findDbUser(userId, req.user?.phoneNumber);
    if (user) {
      if (!user.tutorialStatus) {
        user.tutorialStatus = {};
      }
      if (targetModule) {
        user.tutorialStatus[targetModule] = false;
      } else {
        user.tutorialStatus = {
          dashboard: false,
          transactions: false,
          recurring: false,
          reports: false,
          accounts: false,
          family: false,
          planning: false,
          loans: false,
        };
      }
      user.markModified('tutorialStatus');
      await user.save();
      fallbackStore.cacheUser(user);

      return res.status(200).json({
        success: true,
        message: targetModule ? `Tutorial for ${targetModule} reset.` : 'All tutorials reset.',
        tutorialStatus: user.tutorialStatus,
        isDbConnected: true,
      });
    }

    const resetStatus = fallbackStore.resetTutorialStatus(userId, targetModule);

    return res.status(200).json({
      success: true,
      message: targetModule ? `Tutorial for ${targetModule} reset.` : 'All tutorials reset.',
      tutorialStatus: resetStatus,
      isDbConnected: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset tutorials: ' + err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateTutorialStatus,
  resetTutorialStatus,
};
