const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe, firebaseLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/firebase-login', firebaseLogin);
router.get('/me', protect, getMe);

module.exports = router;

