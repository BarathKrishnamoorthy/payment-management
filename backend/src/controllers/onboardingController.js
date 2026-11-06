const mongoose = require('mongoose');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');

const completeOnboarding = async (req, res) => {
  try {
    const { name, accountNumber, bankName } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required to complete profile onboarding.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      user.name = name.trim();
      if (accountNumber !== undefined) user.accountNumber = accountNumber.trim();
      if (bankName !== undefined) user.bankName = bankName.trim();
      user.isOnboarded = true;

      await user.save();
      fallbackStore.cacheUser(user);

      return res.status(200).json({
        success: true,
        message: 'Customer onboarding completed successfully!',
        user: {
          _id: user._id,
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          bankName: user.bankName,
          accountNumber: user.accountNumber,
          isOnboarded: true,
          tutorialStatus: user.tutorialStatus,
        },
      });
    }

    // In-memory fallback
    const userId = req.user ? req.user._id : 'demo-user-id';
    const updated = fallbackStore.updateUser(userId, {
      name: name.trim(),
      accountNumber: accountNumber ? accountNumber.trim() : '',
      bankName: bankName ? bankName.trim() : '',
      isOnboarded: true,
    });

    res.status(200).json({
      success: true,
      message: 'Customer onboarding completed successfully (Session Mode)!',
      user: {
        ...updated,
        _id: updated._id,
        id: updated._id,
        isOnboarded: true,
      },
      isDbConnected: false,
    });
  } catch (err) {
    console.error('[Onboarding] Error:', err);
    res.status(500).json({ success: false, message: 'Server error completing onboarding.' });
  }
};

module.exports = { completeOnboarding };
