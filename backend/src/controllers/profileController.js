const mongoose = require('mongoose');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

const getProfile = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';

    if (isDbReady()) {
      const user = await User.findById(userId).select('-otp -otpExpiry');
      if (user) {
        return res.status(200).json({ success: true, user });
      }
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

    if (isDbReady()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (name !== undefined) user.name = name.trim();
      if (accountNumber !== undefined) user.accountNumber = accountNumber.trim();
      if (bankName !== undefined) user.bankName = bankName.trim();
      if (email !== undefined) user.email = email.trim();

      await user.save();

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

    if (isDbReady()) {
      const user = await User.findById(userId);
      if (user) {
        if (!user.tutorialStatus) {
          user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
        }
        user.tutorialStatus[modName] = Boolean(completed);
        user.markModified('tutorialStatus');
        await user.save();
      }
    }

    const updatedStatus = fallbackStore.updateTutorialStatus(userId, modName, completed);

    return res.status(200).json({
      success: true,
      message: `Tutorial for ${modName} marked as ${completed ? 'completed' : 'pending'}.`,
      tutorialStatus: updatedStatus,
      isDbConnected: isDbReady(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update tutorial progress: ' + err.message });
  }
};

const resetTutorialStatus = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const targetModule = req.body ? req.body.module : null;

    if (isDbReady()) {
      const user = await User.findById(userId);
      if (user) {
        if (!user.tutorialStatus) {
          user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
        }
        if (targetModule) {
          user.tutorialStatus[targetModule] = false;
        } else {
          user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
        }
        user.markModified('tutorialStatus');
        await user.save();
      }
    }

    const updatedStatus = fallbackStore.resetTutorialStatus(userId, targetModule);

    res.status(200).json({
      success: true,
      message: targetModule ? `Tutorial for ${targetModule} reset.` : 'All tutorials reset.',
      tutorialStatus: updatedStatus,
      isDbConnected: isDbReady(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset tutorial.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateTutorialStatus,
  resetTutorialStatus,
};
