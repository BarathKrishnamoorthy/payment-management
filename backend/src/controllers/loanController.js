const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// Get all loans (borrowed & lent)
const getLoans = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const workspaceId = req.query.workspaceId || 'personal';
    const type = req.query.type; // 'borrowed' | 'lent' | undefined

    if (!isDbReady()) {
      const data = fallbackStore.getLoans(userId, workspaceId, type);
      return res.status(200).json({ success: true, ...data, isDbConnected: false });
    }

    const filter = { user: userId, workspaceId };
    if (type && ['borrowed', 'lent'].includes(type)) {
      filter.type = type;
    }

    const loans = await Loan.find(filter).sort({ dueDate: 1, createdAt: -1 });

    let totalBorrowed = 0;
    let totalLent = 0;
    let outstandingBorrowed = 0;
    let outstandingLent = 0;

    loans.forEach((l) => {
      if (l.type === 'borrowed') {
        totalBorrowed += l.principal;
        outstandingBorrowed += l.outstanding;
      } else if (l.type === 'lent') {
        totalLent += l.principal;
        outstandingLent += l.outstanding;
      }
    });

    res.status(200).json({
      success: true,
      loans,
      summary: {
        totalBorrowed,
        totalLent,
        outstandingBorrowed,
        outstandingLent,
        netPosition: outstandingLent - outstandingBorrowed, // positive means people owe you more
      },
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Loan] getLoans error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving loans.' });
  }
};

// Create a new borrowed or lent record
const createLoan = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { personName, mobileNumber, type, principal, interestRate, dueDate, notes, workspaceId } = req.body;

    const amount = Number(principal);
    if (!personName || !type || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Person name, type (borrowed or lent), and a positive principal amount are required.',
      });
    }

    if (!isDbReady()) {
      const loan = fallbackStore.createLoan({
        user: userId,
        workspaceId: workspaceId || 'personal',
        personName: personName.trim(),
        mobileNumber: mobileNumber ? mobileNumber.trim() : '',
        type,
        principal: amount,
        outstanding: amount,
        interestRate: Number(interestRate) || 0,
        dueDate: dueDate || null,
        notes: notes || '',
        status: 'active',
        repayments: [],
      });
      return res.status(201).json({ success: true, loan, isDbConnected: false });
    }

    const loan = await Loan.create({
      user: userId,
      workspaceId: workspaceId || 'personal',
      personName: personName.trim(),
      mobileNumber: mobileNumber ? mobileNumber.trim() : '',
      type,
      principal: amount,
      outstanding: amount,
      interestRate: Number(interestRate) || 0,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes || '',
      status: 'active',
      repayments: [],
    });

    res.status(201).json({ success: true, loan, isDbConnected: true });
  } catch (err) {
    console.error('[Loan] createLoan error:', err);
    res.status(500).json({ success: false, message: 'Server error creating loan record.' });
  }
};

// Add a partial or full repayment
const addRepayment = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;
    const { amount, date, notes, accountId, referenceNumber } = req.body;

    const repAmount = Number(amount);
    if (!repAmount || repAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid repayment amount is required.' });
    }

    if (!isDbReady()) {
      const updated = fallbackStore.addLoanRepayment(id, userId, {
        amount: repAmount,
        date: date || new Date().toISOString(),
        notes: notes || 'Repayment',
        accountId,
        referenceNumber: referenceNumber || '',
      });
      return res.status(200).json({ success: true, loan: updated, isDbConnected: false });
    }

    const loan = await Loan.findOne({ _id: id, user: userId });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan record not found.' });

    loan.outstanding = Math.max(0, loan.outstanding - repAmount);
    loan.repayments.push({
      amount: repAmount,
      date: date ? new Date(date) : new Date(),
      notes: notes || 'Repayment',
      accountId: accountId || null,
      referenceNumber: referenceNumber || '',
    });

    if (loan.outstanding === 0) {
      loan.status = 'repaid';
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: `Recorded repayment of ₹${repAmount.toLocaleString('en-IN')}! Remaining: ₹${loan.outstanding.toLocaleString('en-IN')}`,
      loan,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Loan] addRepayment error:', err);
    res.status(500).json({ success: false, message: 'Server error adding repayment.' });
  }
};

// Delete loan record
const deleteLoan = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;

    if (!isDbReady()) {
      fallbackStore.deleteLoan(id, userId);
      return res.status(200).json({ success: true, message: 'Loan record removed.' });
    }

    await Loan.findOneAndDelete({ _id: id, user: userId });
    res.status(200).json({ success: true, message: 'Loan record removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error removing loan record.' });
  }
};

module.exports = {
  getLoans,
  createLoan,
  addRepayment,
  deleteLoan,
};

