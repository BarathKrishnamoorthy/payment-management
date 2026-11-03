const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');
const Notification = require('../models/Notification');
const generateToken = require('./generateToken');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seed = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing demo data...');

    await User.deleteMany({ phoneNumber: '9876543210' });

    // 1. Create Demo User
    const demoUser = await User.create({
      phoneNumber: '9876543210',
      name: 'Rajesh Balasubramanian',
      bankName: 'HDFC Bank',
      accountNumber: '50100492817291',
      email: 'rajesh.b@rbpayments.com',
      isOnboarded: true,
      tutorialStatus: {
        dashboard: false,
        transactions: false,
        recurring: false,
        reports: false,
      },
    });

    console.log(`[Seed] Created User: ${demoUser.name} (${demoUser.phoneNumber})`);

    // Clean any prior records for this user ID
    await Transaction.deleteMany({ user: demoUser._id });
    await RecurringPayment.deleteMany({ user: demoUser._id });
    await Notification.deleteMany({ user: demoUser._id });

    // 2. Create Recurring Payments across specified categories
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const recurringItems = [
      {
        user: demoUser._id,
        title: 'HDFC Home Loan EMI',
        paymentType: 'Home Loan',
        recurrenceType: 'Monthly',
        amount: 32500,
        dueDate: todayDateOnly, // Due TODAY!
        nextDueDate: todayDateOnly,
        reason: 'Monthly installment for 3BHK flat at Anna Nagar',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'ICICI Car Loan',
        paymentType: 'Car Loan',
        recurrenceType: 'Monthly',
        amount: 14850,
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
        nextDueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        reason: 'Creta SX (O) Auto loan installment #18 of 60',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'Muthoot Gold Loan Interest',
        paymentType: 'Gold Loan',
        recurrenceType: 'Monthly',
        amount: 4200,
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        reason: 'Monthly interest payment for loan #GL-993821',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'SBI Personal Bank Loan',
        paymentType: 'Bank Loan',
        recurrenceType: 'Monthly',
        amount: 18500,
        dueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000),
        reason: 'Home renovation personal loan repayment',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'Amazon Prime & Netflix Family',
        paymentType: 'Subscription',
        recurrenceType: 'Monthly',
        amount: 1299,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        reason: 'Entertainment streaming media bundle',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'Apple Cloud 2TB & Workspace',
        paymentType: 'Subscription',
        recurrenceType: 'Monthly',
        amount: 999,
        dueDate: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000),
        reason: 'Cloud backup and professional software subscription',
        status: 'Active',
      },
      {
        user: demoUser._id,
        title: 'Consumer Electronics EMI',
        paymentType: 'EMI',
        recurrenceType: 'Monthly',
        amount: 6499,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'MacBook Pro no-cost EMI #4 of 9',
        status: 'Active',
      },
    ];

    const insertedRecurring = await RecurringPayment.insertMany(recurringItems);
    console.log(`[Seed] Seeded ${insertedRecurring.length} recurring payments.`);

    // 3. Create Sample Income & Expense Transactions over past 4 months
    const sampleTransactions = [
      // Current Month
      {
        user: demoUser._id,
        type: 'credit',
        amount: 185000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        category: 'Salary',
        reason: 'Monthly Director Salary credited from RB Fintech Solutions',
        referenceNumber: 'NEFT-SAL-0199281',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'credit',
        amount: 45000,
        date: new Date(today.getFullYear(), today.getMonth(), 2),
        category: 'Consulting',
        reason: 'Payment received for Architectural Review & Strategy',
        referenceNumber: 'UPI-CR-88291024',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 32500,
        date: new Date(today.getFullYear(), today.getMonth(), 3),
        category: 'Home Loan',
        reason: 'HDFC Home Loan EMI auto-debited',
        referenceNumber: 'ACH-DEBIT-99120',
        source: 'recurring_payment',
        recurringPaymentId: insertedRecurring[0]._id,
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 8750,
        date: new Date(today.getFullYear(), today.getMonth(), 4),
        category: 'Food & Dining',
        reason: 'Family dinner & weekend catering',
        referenceNumber: 'POS-TXN-449102',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 4200,
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        category: 'Utilities',
        reason: 'TNEB Electricity Bill payment for residence',
        referenceNumber: 'BBPS-ELEC-77182',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 6500,
        date: new Date(today.getFullYear(), today.getMonth(), 6),
        category: 'Fuel & Travel',
        reason: 'HPCL Fuel refill & FASTag toll recharge',
        referenceNumber: 'UPI-PETROL-8819',
        source: 'manual',
      },
      // Previous Month
      {
        user: demoUser._id,
        type: 'credit',
        amount: 185000,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        category: 'Salary',
        reason: 'Monthly Director Salary credited',
        referenceNumber: 'NEFT-SAL-0199100',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'credit',
        amount: 28000,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 15),
        category: 'Investment',
        reason: 'Quarterly mutual fund dividend payout',
        referenceNumber: 'DIV-MF-882910',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 32500,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 3),
        category: 'Home Loan',
        reason: 'HDFC Home Loan EMI paid',
        referenceNumber: 'ACH-DEBIT-88192',
        source: 'recurring_payment',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 14850,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 5),
        category: 'Car Loan',
        reason: 'ICICI Car Loan EMI paid',
        referenceNumber: 'ACH-DEBIT-88193',
        source: 'recurring_payment',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 12500,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 10),
        category: 'Shopping',
        reason: 'Electronics & household appliances purchase',
        referenceNumber: 'AMZN-IN-88912',
        source: 'manual',
      },
      // Two months ago
      {
        user: demoUser._id,
        type: 'credit',
        amount: 185000,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        category: 'Salary',
        reason: 'Monthly Director Salary credited',
        referenceNumber: 'NEFT-SAL-0198900',
        source: 'manual',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 32500,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 3),
        category: 'Home Loan',
        reason: 'HDFC Home Loan EMI paid',
        referenceNumber: 'ACH-DEBIT-77192',
        source: 'recurring_payment',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 14850,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 5),
        category: 'Car Loan',
        reason: 'ICICI Car Loan EMI paid',
        referenceNumber: 'ACH-DEBIT-77193',
        source: 'recurring_payment',
      },
      {
        user: demoUser._id,
        type: 'debit',
        amount: 18500,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 14),
        category: 'Bank Loan',
        reason: 'SBI Personal Loan EMI payment',
        referenceNumber: 'ACH-DEBIT-77194',
        source: 'recurring_payment',
      },
    ];

    const insertedTxns = await Transaction.insertMany(sampleTransactions);
    console.log(`[Seed] Seeded ${insertedTxns.length} transactions.`);

    // 4. Create Notifications (including Payment Due Today alert!)
    const notifications = [
      {
        user: demoUser._id,
        title: '🚨 Payment Due Today: HDFC Home Loan EMI',
        message: 'Your Home Loan installment of ₹32,500 for "HDFC Home Loan EMI" is due today. Tap to mark as paid.',
        type: 'due_today',
        relatedId: insertedRecurring[0]._id,
        amount: 32500,
        dueDate: todayDateOnly,
        isRead: false,
      },
      {
        user: demoUser._id,
        title: '⚠️ Upcoming Due in 2 Days: Consumer Electronics EMI',
        message: 'Reminder: Your EMI installment of ₹6,499 for "Consumer Electronics EMI" is due in 2 days.',
        type: 'upcoming_due',
        relatedId: insertedRecurring[6]._id,
        amount: 6499,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        isRead: false,
      },
      {
        user: demoUser._id,
        title: '✅ Salary Credited Successfully',
        message: 'Income of ₹1,85,000 was credited to your account from RB Fintech Solutions.',
        type: 'system',
        amount: 185000,
        isRead: true,
      },
    ];

    await Notification.insertMany(notifications);
    console.log('[Seed] Seeded notifications.');

    const token = generateToken(demoUser._id);
    console.log('\n=============================================');
    console.log('RB Payment Management - Demo Seed Completed!');
    console.log(`Demo Phone Number: ${demoUser.phoneNumber}`);
    console.log('Demo Fixed OTP: 123456');
    console.log(`Demo JWT Token: ${token}`);
    console.log('=============================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed };

