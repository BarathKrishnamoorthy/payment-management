const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// ==========================================
// 1. BUDGET CONTROLLERS
// ==========================================
const getBudgets = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const workspaceId = req.query.workspaceId || 'personal';

    if (!isDbReady()) {
      const budgets = fallbackStore.getBudgets(userId, workspaceId);
      return res.status(200).json({ success: true, budgets, isDbConnected: false });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = await Budget.find({
      user: userId,
      workspaceId,
      status: 'active',
      month: currentMonth,
      year: currentYear,
    });

    // Calculate actual spending for each category in current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const actualSpendingAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'debit',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spendMap = {};
    actualSpendingAgg.forEach((item) => {
      spendMap[item._id] = item.spent;
    });

    const enrichedBudgets = budgets.map((b) => {
      const spent = spendMap[b.category] || 0;
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
      const isNearLimit = percentage >= 80 && percentage < 100;
      const isOverBudget = spent > b.amount;

      return {
        ...b.toObject(),
        spent,
        remaining,
        percentage,
        isNearLimit,
        isOverBudget,
      };
    });

    res.status(200).json({ success: true, budgets: enrichedBudgets, isDbConnected: true });
  } catch (err) {
    console.error('[Planning] getBudgets error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving budgets.' });
  }
};

const createBudget = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { category, amount, period, workspaceId } = req.body;

    const budgetAmount = Number(amount);
    if (!category || !budgetAmount || budgetAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Category and positive budget amount are required.' });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (!isDbReady()) {
      const budget = fallbackStore.createBudget({
        user: userId,
        workspaceId: workspaceId || 'personal',
        category: category.trim(),
        name: `${category.trim()} Budget`,
        amount: budgetAmount,
        period: period || 'monthly',
        month,
        year,
      });
      return res.status(201).json({ success: true, budget, isDbConnected: false });
    }

    // Upsert budget for current month & category
    const budget = await Budget.findOneAndUpdate(
      {
        user: userId,
        workspaceId: workspaceId || 'personal',
        category: category.trim(),
        month,
        year,
      },
      {
        name: `${category.trim()} Budget`,
        amount: budgetAmount,
        period: period || 'monthly',
        status: 'active',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, budget, isDbConnected: true });
  } catch (err) {
    console.error('[Planning] createBudget error:', err);
    res.status(500).json({ success: false, message: 'Server error creating budget.' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;

    if (!isDbReady()) {
      fallbackStore.deleteBudget(id, userId);
      return res.status(200).json({ success: true, message: 'Budget removed.' });
    }

    await Budget.findOneAndDelete({ _id: id, user: userId });
    res.status(200).json({ success: true, message: 'Budget removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing budget.' });
  }
};

// ==========================================
// 2. SAVINGS GOALS CONTROLLERS
// ==========================================
const getSavingsGoals = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const workspaceId = req.query.workspaceId || 'personal';

    if (!isDbReady()) {
      const goals = fallbackStore.getSavingsGoals(userId, workspaceId);
      return res.status(200).json({ success: true, savingsGoals: goals, isDbConnected: false });
    }

    const goals = await SavingsGoal.find({ user: userId, workspaceId, status: { $ne: 'archived' } }).sort({ createdAt: -1 });

    const enrichedGoals = goals.map((g) => {
      const percentage = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);

      return {
        ...g.toObject(),
        percentage,
        remainingAmount,
      };
    });

    res.status(200).json({ success: true, savingsGoals: enrichedGoals, isDbConnected: true });
  } catch (err) {
    console.error('[Planning] getSavingsGoals error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving savings goals.' });
  }
};

const createSavingsGoal = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { goalName, targetAmount, initialDeposit, category, targetDate, notes, workspaceId } = req.body;

    const target = Number(targetAmount);
    if (!goalName || !target || target <= 0) {
      return res.status(400).json({ success: false, message: 'Goal name and target amount are required.' });
    }

    const initDep = Number(initialDeposit) || 0;

    if (!isDbReady()) {
      const goal = fallbackStore.createSavingsGoal({
        user: userId,
        workspaceId: workspaceId || 'personal',
        goalName: goalName.trim(),
        targetAmount: target,
        currentAmount: initDep,
        category: category || 'Other',
        targetDate: targetDate || null,
        notes: notes || '',
        contributions: initDep > 0 ? [{ amount: initDep, date: new Date().toISOString(), notes: 'Initial Deposit' }] : [],
      });
      return res.status(201).json({ success: true, savingsGoal: goal, isDbConnected: false });
    }

    const goal = await SavingsGoal.create({
      user: userId,
      workspaceId: workspaceId || 'personal',
      goalName: goalName.trim(),
      targetAmount: target,
      currentAmount: initDep,
      category: category || 'Other',
      targetDate: targetDate ? new Date(targetDate) : undefined,
      notes: notes || '',
      contributions: initDep > 0 ? [{ amount: initDep, date: new Date(), notes: 'Initial Deposit' }] : [],
    });

    res.status(201).json({ success: true, savingsGoal: goal, isDbConnected: true });
  } catch (err) {
    console.error('[Planning] createSavingsGoal error:', err);
    res.status(500).json({ success: false, message: 'Error creating savings goal.' });
  }
};

const addGoalContribution = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;
    const { amount, notes, accountId } = req.body;

    const contributionAmount = Number(amount);
    if (!contributionAmount || contributionAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid contribution amount is required.' });
    }

    if (!isDbReady()) {
      const updated = fallbackStore.addGoalContribution(id, userId, {
        amount: contributionAmount,
        notes: notes || 'Deposit',
        accountId,
      });
      return res.status(200).json({ success: true, savingsGoal: updated, isDbConnected: false });
    }

    const goal = await SavingsGoal.findOne({ _id: id, user: userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Savings goal not found.' });

    goal.currentAmount += contributionAmount;
    goal.contributions.push({
      amount: contributionAmount,
      date: new Date(),
      notes: notes || 'Contribution deposit',
      accountId: accountId || null,
    });

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.status(200).json({ success: true, savingsGoal: goal, message: `Deposited ₹${contributionAmount.toLocaleString('en-IN')}!`, isDbConnected: true });
  } catch (err) {
    console.error('[Planning] addGoalContribution error:', err);
    res.status(500).json({ success: false, message: 'Error recording contribution.' });
  }
};

const deleteSavingsGoal = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { id } = req.params;

    if (!isDbReady()) {
      fallbackStore.deleteSavingsGoal(id, userId);
      return res.status(200).json({ success: true, message: 'Savings goal archived.' });
    }

    await SavingsGoal.findOneAndUpdate({ _id: id, user: userId }, { status: 'archived' });
    res.status(200).json({ success: true, message: 'Savings goal archived.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error archiving goal.' });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  addGoalContribution,
  deleteSavingsGoal,
};

