const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'rb_payment_management_jwt_secret_key_2026'
      );

      req.user = await User.findById(decoded.id).select('-otp -otpExpiry');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists.' });
      }

      return next();
    } catch (err) {
      console.error('[AuthMiddleware] Token error:', err.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protect };

