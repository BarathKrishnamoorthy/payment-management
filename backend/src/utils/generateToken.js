const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'rb_payment_management_jwt_secret_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = generateToken;

