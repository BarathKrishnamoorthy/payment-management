const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendRealOtp } = require('../services/smsService');

// Demo fixed OTP for easy automated testing or rapid login, plus random 6-digit support
const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.',
      });
    }

    const cleanPhone = phoneNumber.trim().replace(/[^0-9+]/g, '');

    // Generate 6-digit OTP (e.g. 123456 for test or 6-digit random)
    const otp = cleanPhone === '9876543210' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ phoneNumber: cleanPhone });
    if (!user) {
      user = new User({
        phoneNumber: cleanPhone,
        otp,
        otpExpiry,
        isOnboarded: false,
      });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
    }

    await user.save();

    // Trigger real SMS delivery to physical phone handset
    const smsResult = await sendRealOtp(cleanPhone, otp);

    res.status(200).json({
      success: true,
      message: smsResult.success
        ? `Real SMS OTP sent to +91 ${cleanPhone.slice(-10)} via ${smsResult.provider}.`
        : 'OTP generated successfully. Check your SMS or the code shown below.',
      // Real OTP returned for instant convenience + verification
      otp: otp,
      phoneNumber: cleanPhone,
      smsDelivered: smsResult.success,
      provider: smsResult.provider || 'Dev Console',
    });
  } catch (err) {
    console.error('[Auth] sendOtp error:', err);
    res.status(500).json({ success: false, message: 'Server error sending OTP.' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required.',
      });
    }

    const cleanPhone = phoneNumber.trim().replace(/[^0-9+]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found for this mobile number. Please request a new OTP.',
      });
    }

    // Check OTP validity or master test OTP (123456)
    const isValid = (user.otp && user.otp === otp.trim()) || otp.trim() === '123456';

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code and try again.',
      });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry && otp.trim() !== '123456') {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a fresh OTP.',
      });
    }

    // Clear used OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      token,
      isFirstTime: !user.isOnboarded,
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
    console.error('[Auth] verifyOtp error:', err);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpiry');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving user data.' });
  }
};

module.exports = { sendOtp, verifyOtp, getMe };

