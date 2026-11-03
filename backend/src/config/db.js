const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rb_payment_db';
  
  try {
    // Attempt standard connection first with a 3-second timeout
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log('[Database] MongoDB connected successfully.');
  } catch (err) {
    console.warn(`[Database] Primary MongoDB connection failed (${err.message}).`);
    
    // In dev/fallback mode, auto-start in-memory MongoDB
    try {
      console.log('[Database] Starting in-memory fallback MongoDB (MongoMemoryServer)...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      console.log(`[Database] In-memory MongoDB started at: ${memUri}`);
      
      await mongoose.connect(memUri);
      console.log('[Database] Connected successfully to In-Memory MongoDB.');
    } catch (memErr) {
      console.error('[Database] Fatal: Unable to initialize any MongoDB instance.', memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

