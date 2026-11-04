const mongoose = require('mongoose');

let isConnected = false;
let mongoMemoryServer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rb_payment_db';

  try {
    console.log(`[Database] Attempting connection to MongoDB...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[Database] MongoDB connected successfully.');
  } catch (err) {
    console.warn(`[Database] Primary MongoDB connection failed: ${err.message}`);

    // In local dev only (not on Vercel), fall back to in-memory MongoDB
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting in-memory fallback MongoDB (MongoMemoryServer)...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        console.log(`[Database] In-memory MongoDB started at: ${memUri}`);

        await mongoose.connect(memUri);
        isConnected = true;
        console.log('[Database] Connected successfully to In-Memory MongoDB.');
        return;
      } catch (memErr) {
        console.error('[Database] In-memory MongoDB failed:', memErr.message);
      }
    }

    // On cloud/Vercel, rethrow clean error so Express can return friendly JSON with CORS headers
    throw new Error(err.message || 'Unable to connect to MongoDB Atlas cluster.');
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
