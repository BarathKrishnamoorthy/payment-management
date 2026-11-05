const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// Get all accounts for current user/workspace
const getAccounts = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const workspaceId = req.query.workspaceId || 'personal';

    if (!isDbReady()) {
      const accounts = fallbackStore.getAccounts(userId, workspaceId);
      return res.status(200).json({ success: true, accounts, isDbConnected: false });
    }

    let accounts = await Account.find({ user: userId, status: 'active' }).sort({ isDefault: -1, createdAt: -1 });

    // Auto-create default Cash and Bank account if customer has none
    if (accounts.length === 0) {
      const defaultCash = await Account.create({
        user: userId,
        workspaceId,
        accountName: 'Cash Wallet',
        accountType: 'cash',
        openingBalance: 0,
        currentBalance: 0,
        isDefault: true,
      });
      accounts = [defaultCash];
    }

    res.status(200).json({ success: true, accounts, isDbConnected: true });
  } catch (err) {
    console.error('[Account] getAccounts error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving accounts.' });
  }
};

// Create a new account / wallet
const createAccount = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { accountName, accountType, bankName, accountNumber, openingBalance, isDefault, workspaceId } = req.body;

    if (!accountName || !accountName.trim()) {
      return res.status(400).json({ success: false, message: 'Account name is required.' });
    }

    const opBal = Number(openingBalance) || 0;

    if (!isDbReady()) {
      const acc = fallbackStore.createAccount({
        user: userId,
        workspaceId: workspaceId || 'personal',
        accountName: accountName.trim(),
        accountType: accountType || 'savings',
        bankName: bankName ? bankName.trim() : '',
        accountNumber: accountNumber ? accountNumber.trim() : '',
        accountNumberLast4: accountNumber ? accountNumber.trim().slice(-4) : '',
        openingBalance: opBal,
        currentBalance: opBal,
        isDefault: Boolean(isDefault),
      });
      return res.status(201).json({ success: true, account: acc, isDbConnected: false });
    }

    if (isDefault) {
      await Account.updateMany({ user: userId }, { isDefault: false });
    }

    const account = await Account.create({
      user: userId,
      workspaceId: workspaceId || 'personal',
      accountName: accountName.trim(),
      accountType: accountType || 'savings',
      bankName: bankName ? bankName.trim() : '',
      accountNumber: accountNumber ? accountNumber.trim() : '',
      accountNumberLast4: accountNumber ? accountNumber.trim().slice(-4) : '',
      openingBalance: opBal,
      currentBalance: opBal,
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({ success: true, account, isDbConnected: true });
  } catch (err) {
    console.error('[Account] createAccount error:', err);
    res.status(500).json({ success: false, message: 'Server error creating account.' });
  }
};

// Update account
const updateAccount = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;
    const { accountName, accountType, bankName, accountNumber, isDefault } = req.body;

    if (!isDbReady()) {
      const updated = fallbackStore.updateAccount(id, userId, req.body);
      return res.status(200).json({ success: true, account: updated, isDbConnected: false });
    }

    if (isDefault) {
      await Account.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
    }

    const account = await Account.findOneAndUpdate(
      { _id: id, user: userId },
      {
        accountName,
        accountType,
        bankName,
        accountNumber,
        accountNumberLast4: accountNumber ? accountNumber.slice(-4) : undefined,
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
      },
      { new: true }
    );

    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    res.status(200).json({ success: true, account, isDbConnected: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating account.' });
  }
};

// Transfer between accounts (Excluded from Income & Expenses)
const transferBetweenAccounts = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { fromAccountId, toAccountId, amount, date, notes } = req.body;

    const transferAmount = Number(amount);
    if (!fromAccountId || !toAccountId || !transferAmount || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Source account, destination account, and a positive amount are required.',
      });
    }

    if (String(fromAccountId) === String(toAccountId)) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination accounts must be different.',
      });
    }

    const transferGroupId = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const txDate = date ? new Date(date) : new Date();

    if (!isDbReady()) {
      const result = fallbackStore.transferBetweenAccounts(userId, {
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        date: txDate.toISOString(),
        notes: notes || '',
        transferGroupId,
      });
      return res.status(200).json({
        success: true,
        message: `Successfully transferred ₹${transferAmount.toLocaleString('en-IN')}!`,
        ...result,
        isDbConnected: false,
      });
    }

    const fromAcc = await Account.findOne({ _id: fromAccountId, user: userId });
    const toAcc = await Account.findOne({ _id: toAccountId, user: userId });

    if (!fromAcc || !toAcc) {
      return res.status(404).json({ success: false, message: 'Source or destination account not found.' });
    }

    // 1. Debit Source Account
    await Transaction.create({
      user: userId,
      accountId: fromAcc._id,
      toAccountId: toAcc._id,
      type: 'transfer',
      transferGroupId,
      amount: transferAmount,
      date: txDate,
      category: 'Transfer',
      reason: notes || `Transfer to ${toAcc.accountName}`,
      source: 'transfer',
    });

    // 2. Credit Destination Account
    await Transaction.create({
      user: userId,
      accountId: toAcc._id,
      toAccountId: fromAcc._id,
      type: 'transfer',
      transferGroupId,
      amount: transferAmount,
      date: txDate,
      category: 'Transfer',
      reason: notes || `Transfer from ${fromAcc.accountName}`,
      source: 'transfer',
    });

    // 3. Update account balances
    fromAcc.currentBalance -= transferAmount;
    toAcc.currentBalance += transferAmount;
    await fromAcc.save();
    await toAcc.save();

    res.status(200).json({
      success: true,
      message: `Successfully transferred ₹${transferAmount.toLocaleString('en-IN')} from ${fromAcc.accountName} to ${toAcc.accountName}!`,
      transferGroupId,
      fromAccount: fromAcc,
      toAccount: toAcc,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Account] transfer error:', err);
    res.status(500).json({ success: false, message: 'Server error processing transfer.' });
  }
};

// Archive account
const archiveAccount = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;

    if (!isDbReady()) {
      const ok = fallbackStore.archiveAccount(id, userId);
      return res.status(200).json({ success: ok, message: 'Account archived.' });
    }

    await Account.findOneAndUpdate({ _id: id, user: userId }, { status: 'archived' });
    res.status(200).json({ success: true, message: 'Account archived successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error archiving account.' });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  transferBetweenAccounts,
  archiveAccount,
};

