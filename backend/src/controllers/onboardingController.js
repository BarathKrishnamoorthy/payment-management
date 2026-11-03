const User = require('../models/User');

const completeOnboarding = async (req, res) => {
  try {
    const { name, accountNumber, bankName } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required to complete profile onboarding.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.name = name.trim();
    if (accountNumber !== undefined) user.accountNumber = accountNumber.trim();
    if (bankName !== undefined) user.bankName = bankName.trim();
    user.isOnboarded = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Customer onboarding completed successfully!',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        isOnboarded: user.isOnboarded,
        tutorialStatus: user.tutorialStatus,
      },
    });
  } catch (err) {
    console.error('[Onboarding] Error:', err);
    res.status(500).json({ success: false, message: 'Server error completing onboarding.' });
  }
};

module.exports = { completeOnboarding };

