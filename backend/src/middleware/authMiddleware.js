const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secrets = [
        process.env.JWT_SECRET,
        'rb_payment_management_jwt_secret_super_secure_key_2026',
        'rb_payment_management_jwt_secret_key_2026',
      ].filter(Boolean);

      let decoded = null;
      let lastErr = null;
      for (const secret of secrets) {
        try {
          decoded = jwt.verify(token, secret);
          if (decoded && decoded.id) break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!decoded || !decoded.id) {
        console.error('[AuthMiddleware] Token verification failed:', lastErr?.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired.' });
      }

      const rawId = String(decoded.id);
      const cleanPhone = rawId.replace(/[^0-9]/g, '').slice(-10);

      // Reconnect if needed
      if (mongoose.connection.readyState !== 1) {
        try {
          const { connectDB } = require('../config/db');
          await connectDB();
        } catch (e) {
          // ignore
        }
      }

      // Safe DB lookup preventing CastError
      if (mongoose.connection.readyState === 1) {
        try {
          if (mongoose.isValidObjectId(rawId)) {
            req.user = await User.findById(rawId).select('-otp -otpExpiry');
          } else if (cleanPhone && cleanPhone.length === 10) {
            req.user = await User.findOne({ phoneNumber: cleanPhone }).select('-otp -otpExpiry');
          }
        } catch (e) {
          console.warn('[AuthMiddleware] DB user query error:', e.message);
        }
      }

      // Fallback store lookup
      if (!req.user) {
        req.user = fallbackStore.getUserById(rawId);
      }

      return next();
    } catch (err) {
      console.error('[AuthMiddleware] Unexpected token verification error:', err.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protect };
