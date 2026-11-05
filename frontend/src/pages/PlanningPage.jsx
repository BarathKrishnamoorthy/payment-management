import React, { useState, useEffect } from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Coins,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PlanningPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('budgets'); // 'budgets' | 'savings'
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food & Dining');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [savingBudget, setSavingBudget] = useState(false);

  // New Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [goalCategory, setGoalCategory] = useState('Emergency Fund');
  const [targetDate, setTargetDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Deposit Contribution Modal
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositing, setDepositing] = useState(false);

  const categoriesList = [
    'Food & Dining',
    'Shopping',
    'Utilities',
    'Fuel & Travel',
    'Health & Medical',
    'Entertainment',
    'Subscription',
    'General Expense',
    'Other',
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bgtRes, savRes] = await Promise.all([
        api.getBudgets(),
        api.getSavingsGoals(),
      ]);

      if (bgtRes && bgtRes.success) setBudgets(bgtRes.budgets || []);
      if (savRes && savRes.success) setSavingsGoals(savRes.savingsGoals || []);
    } catch (err) {
      console.error('Error fetching planning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    const amt = Number(budgetAmount);
    if (!amt || amt <= 0) return;

    try {
      setSavingBudget(true);
      await api.createBudget({
        category: budgetCategory,
        amount: amt,
        period: budgetPeriod,
      });
      setShowBudgetModal(false);
      setBudgetAmount('');
      fetchData();
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
    } catch (err) {
      alert(err.message || 'Failed to create budget.');
    } finally {
      setSavingBudget(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    const tgt = Number(targetAmount);
    if (!goalName.trim() || !tgt || tgt <= 0) return;

    try {
      setSavingGoal(true);
      await api.createSavingsGoal({
        goalName: goalName.trim(),
        targetAmount: tgt,
        initialDeposit: Number(initialDeposit) || 0,
        category: goalCategory,
        targetDate: targetDate || undefined,
        notes: goalNotes.trim(),
      });
      setShowGoalModal(false);
      setGoalName('');
      setTargetAmount('');
      setInitialDeposit('');
      setGoalNotes('');
      fetchData();
      try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
    } catch (err) {
      alert(err.message || 'Failed to create savings goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0 || !selectedGoal) return;

    try {
      setDepositing(true);
      await api.addGoalContribution(selectedGoal._id, {
        amount: amt,
        notes: depositNotes.trim(),
      });
      setSelectedGoal(null);
      setDepositAmount('');
      setDepositNotes('');
      fetchData();
      try { confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } }); } catch (e) {}
    } catch (err) {
      alert(err.message || 'Failed to record deposit.');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-8 bg-brand-600 rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Financial Planning
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Category expense limits, budget warning alerts & milestone savings goals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'budgets' ? (
            <button
              onClick={() => setShowBudgetModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-md"
            >
              <Plus className="w-4 h-4" />
              <span>Set Budget</span>
            </button>
          ) : (
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Savings Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'budgets'
              ? 'bg-brand-600 text-white shadow-purple-sm'
              : 'text-slate-600 hover:text-brand-700 hover:bg-purple-50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Category Budgets ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('savings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'savings'
              ? 'bg-brand-600 text-white shadow-purple-sm'
              : 'text-slate-600 hover:text-brand-700 hover:bg-purple-50'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Savings Goals ({savingsGoals.length})</span>
        </button>
      </div>

      {/* TAB 1: CATEGORY BUDGETS */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-2xs">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No monthly budgets configured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Set monthly limits on high-spend categories like Food, Shopping, or Travel to prevent overspending.
              </p>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm"
              >
                Set Your First Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((b) => (
                <div
                  key={b._id}
                  className={`bg-white rounded-3xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                    b.isOverBudget
                      ? 'border-rose-300 bg-rose-50/20'
                      : b.isNearLimit
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-purple-100/80 hover:shadow-purple-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{b.category}</h3>
                        <span className="text-[11px] text-slate-400 capitalize">{b.period} Budget</span>
                      </div>

                      {b.isOverBudget ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Exceeded
                        </span>
                      ) : b.isNearLimit ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          80% Alert
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          On Track
                        </span>
                      )}
                    </div>

                    <div className="my-3">
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Spent: ₹{b.spent.toLocaleString('en-IN')}</span>
                        <span className="font-extrabold text-slate-900">Limit: ₹{b.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.isOverBudget
                              ? 'bg-rose-600'
                              : b.isNearLimit
                              ? 'bg-amber-500'
                              : 'bg-brand-600'
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Remaining: ₹{b.remaining.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-slate-800">{b.percentage}% used</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVINGS GOALS */}
      {activeTab === 'savings' && (
        <div className="space-y-4">
          {savingsGoals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-2xs">
              <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No savings goals created</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Build an emergency fund, save for a new car, wedding, or home deposit with milestone tracking.
              </p>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsGoals.map((g) => (
                <div
                  key={g._id}
                  className="bg-white rounded-3xl border border-purple-100/80 p-5 shadow-2xs hover:shadow-purple-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{g.goalName}</h3>
                        <span className="text-[11px] text-brand-600 font-semibold">{g.category}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          g.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-brand-700'
                        }`}
                      >
                        {g.status === 'completed' ? 'Achieved!' : `${g.percentage}%`}
                      </span>
                    </div>

                    <div className="my-4 p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">Saved</span>
                        <span className="text-xs text-slate-400 font-medium">Target</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-brand-700">
                          ₹{Number(g.currentAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          ₹{Number(g.targetAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200/50 h-2 rounded-full overflow-hidden mt-2.5">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, g.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Remaining: ₹{g.remainingAmount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => setSelectedGoal(g)}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 text-brand-700 hover:bg-brand-600 hover:text-white font-bold text-xs transition-colors"
                    >
                      + Add Funds
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SET BUDGET */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Category Budget</h3>
                  <p className="text-xs text-slate-500">Configure monthly spending limits</p>
                </div>
              </div>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Budget Limit (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 15000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {savingBudget ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SAVINGS GOAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Savings Goal</h3>
                  <p className="text-xs text-slate-500">Track milestones for future goals</p>
                </div>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund (6 Months), Electric Car"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Deposit (₹)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Home">Home</option>
                    <option value="Education">Education</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {savingGoal ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTRIBUTION / DEPOSIT */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h3 className="text-sm font-bold text-slate-900">Deposit into {selectedGoal.goalName}</h3>
              <button onClick={() => setSelectedGoal(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bonus savings, monthly transfer"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {depositing ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
