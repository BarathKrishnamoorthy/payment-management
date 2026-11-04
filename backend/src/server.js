const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

// Load environment configuration
dotenv.config();

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { checkAndSendRecurringNotifications } = require('./services/notificationService');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Global CORS Middleware - Ensures zero CORS issues on all origins, headers & preflights
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Static files (Receipts, Invoices, Attachments)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check API (No DB required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RB Payment Management Backend API',
    version: '1.0.0',
  });
});

// Database Connection Middleware (Ensures DB is connected before handling API requests)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]:', err.message);
    return res.status(503).json({
      success: false,
      message: 'MongoDB Atlas connection required. Please ensure 0.0.0.0/0 is whitelisted in your MongoDB Atlas Network Access: ' + err.message,
    });
  }
});

// Mount Module Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Daily Cron Job for Recurring Payment Due-Date Reminders (Only on persistent server, not serverless)
if (process.env.VERCEL !== '1') {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily morning check for recurring payments due today...');
    await checkAndSendRecurringNotifications();
  });

  setTimeout(() => {
    checkAndSendRecurringNotifications();
  }, 5000);
}

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(` RB Payment Management Backend API`);
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
