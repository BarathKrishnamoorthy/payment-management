const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpiry');
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, accountNumber, bankName, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) user.name = name.trim();
    if (accountNumber !== undefined) user.accountNumber = accountNumber.trim();
    if (bankName !== undefined) user.bankName = bankName.trim();
    if (email !== undefined) user.email = email.trim();

    await user.save();

    res.status(200).json({
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const updateTutorialStatus = async (req, res) => {
  try {
    const { module, completed } = req.body; // module: 'dashboard' | 'transactions' | 'recurring' | 'reports'
    const validModules = ['dashboard', 'transactions', 'recurring', 'reports'];

    if (!validModules.includes(module)) {
      return res.status(400).json({ success: false, message: 'Invalid module name.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.tutorialStatus) {
      user.tutorialStatus = { dashboard: false, transactions: false, recurring: false, reports: false };
    }

    user.tutorialStatus[module] = completed !== undefined ? Boolean(completed) : true;
    user.markModified('tutorialStatus');
    await user.save();

    res.status(200).json({
      success: true,
      message: `Tutorial status for ${module} updated.`,
      tutorialStatus: user.tutorialStatus,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update tutorial status.' });
  }
};

const resetTutorialStatus = async (req, res) => {
  try {
    const { module } = req.body;
    const user = await User.findById(req.user._id);

    if (module && ['dashboard', 'transactions', 'recurring', 'reports'].includes(module)) {
      user.tutorialStatus[module] = false;
    } else {
      user.tutorialStatus = {
        dashboard: false,
        transactions: false,
        recurring: false,
        reports: false,
      };
    }

    user.markModified('tutorialStatus');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Tutorial reset successfully. The interactive walkthrough will display again.',
      tutorialStatus: user.tutorialStatus,
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

