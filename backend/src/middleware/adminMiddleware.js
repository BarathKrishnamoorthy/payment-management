const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const fallbackStore = require('../utils/fallbackStore');

const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secrets = [
        process.env.ADMIN_JWT_SECRET,
        process.env.JWT_SECRET,
        'rb_admin_jwt_secret_super_secure_key_2026',
        'rb_payment_management_jwt_secret_super_secure_key_2026',
      ].filter(Boolean);

      let decoded = null;
      let lastErr = null;
      for (const secret of secrets) {
        try {
          decoded = jwt.verify(token, secret);
          if (decoded && decoded.id && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!decoded || !decoded.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized as administrator. Invalid or expired session.',
        });
      }

      const adminId = String(decoded.id);

      // Try MongoDB
      if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(adminId)) {
        try {
          req.admin = await AdminUser.findById(adminId).select('-password');
        } catch (e) {
          // ignore
        }
      }

      // Try fallback store
      if (!req.admin) {
        req.admin = fallbackStore.getAdminById(adminId) || fallbackStore.getAdminByEmail(decoded.email);
      }

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Administrator account not found or access revoked.',
        });
      }

      return next();
    } catch (err) {
      console.error('[AdminMiddleware] Error:', err);
      return res.status(401).json({
        success: false,
        message: 'Administrator authorization failed: ' + err.message,
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'No authorization token provided. Administrator login required.',
  });
};

module.exports = { adminProtect };
