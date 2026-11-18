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

      if (req.user) {
        // 1. Account Block Check
        if (req.user.isBlocked) {
          return res.status(403).json({
            success: false,
            message: req.user.blockReason
              ? `Your account has been suspended: ${req.user.blockReason}`
              : 'Your account has been suspended or blocked by an administrator. Please contact support.',
          });
        }

        // 2. Track platform & real-time activity
        const platformHeader = (req.headers['x-platform'] || '').toLowerCase();
        const platform = ['android', 'ios', 'website'].includes(platformHeader)
          ? platformHeader
          : /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '')
          ? 'android'
          : 'website';

        const now = new Date();
        req.user.lastActiveAt = now;
        req.user.platform = platform;

        // Async non-blocking save of lastActiveAt & platform
        try {
          if (req.user.save) {
            req.user.save().catch(() => {});
          } else {
            fallbackStore.updateUser(req.user._id || req.user.id, {
              lastActiveAt: now.toISOString(),
              platform,
            });
          }

          // Log user activity in fallbackStore / DB
          fallbackStore.logUserActivity({
            userId: req.user._id || req.user.id,
            phoneNumber: req.user.phoneNumber,
            userName: req.user.name,
            platform,
            action: `${req.method} ${req.baseUrl || req.path}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
          });
        } catch (e) {
          // ignore tracking error
        }
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
