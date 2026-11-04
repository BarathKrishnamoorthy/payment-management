const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rb_payment_db';

  try {
    console.log(`[Database] Attempting connection to MongoDB...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    isConnected = true;
    console.log('[Database] MongoDB connected successfully to Atlas/Cluster.');
    return true;
  } catch (err) {
    console.warn(`[Database] MongoDB connection issue: ${err.message}`);
    isConnected = false;
    return false;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB };
