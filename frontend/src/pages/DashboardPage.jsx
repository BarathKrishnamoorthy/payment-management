import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Calendar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Receipt,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ModuleTour } from '../components/walkthrough/ModuleTour';

export const DashboardPage = ({ setActivePage, onTriggerAddTxn, onTriggerAddRecurring }) => {
  const { user, setModuleTutorialDone } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Fetch dashboard summary
  const fetchSummary = async () => {
    try {
      const res = await api.getDashboardSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Check if first-time walkthrough should be displayed
  useEffect(() => {
    if (user && !user.tutorialStatus?.dashboard && !loading) {
      // Delay slightly for smooth render
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    setModuleTutorialDone('dashboard');
  };

  const handlePayDueNow = async (recurringId) => {
    try {
      await api.markAsPaid(recurringId);
      await fetchSummary();
    } catch (err) {
      alert(err.message || 'Failed to mark payment as paid');
    }
  };

  // Tour steps definition
  const tourSteps = [
    {
      targetId: 'dash-metrics',
      targetName: 'Financial Balance & Metrics',
      title: 'Net Balance & Cashflow Summary',
      description: 'View your accumulated financial balance, along with this month’s income, expenses, and savings rate at a glance.',
      placement: 'bottom',
    },
    {
      targetId: 'dash-due-today',
      targetName: 'Urgent Payments Due Today',
      title: 'Real-Time Payment Alerts',
      description: 'Any recurring EMIs, gold loans, or subscriptions due today are highlighted here. Settle them with 1-click!',
      placement: 'bottom',
    },
    {
      targetId: 'dash-charts',
      targetName: 'Income vs Expense Analytics',
      title: 'Interactive Cashflow Chart',
      description: 'Track your 6-month historical income versus spending patterns and top expenditure categories.',
      placement: 'top',
    },
    {
      targetId: 'dash-quick-actions',
      targetName: 'Quick Action Hub',
      title: 'Fast Financial Logging',
      description: 'Easily record incoming credit, outgoing debit, set up a recurring loan schedule, or import bank statements.',
      placement: 'left',
    },
  ];

  const formatCurrency = (num) => {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  };

  // Pie chart color palette (White and Purple theme complementary colors)
  const PIE_COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#E879F9', '#38BDF8', '#34D399'];

  return (
    <div className="space-y-6 pb-12">
      {/* Interactive Tour */}
      <ModuleTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onFinish={handleFinishTour}
        steps={tourSteps}
        moduleName="dashboard"
      />

      {/* Page Title & Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <strong className="text-brand-700">{user?.name || 'Customer'}</strong>. Here is your current financial standing.
          </p>
        </div>

        {/* Quick Hub Buttons */}
        <div id="dash-quick-actions" className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onTriggerAddTxn ? onTriggerAddTxn('credit') : setActivePage('transactions')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => onTriggerAddTxn ? onTriggerAddTxn('debit') : setActivePage('transactions')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => onTriggerAddRecurring ? onTriggerAddRecurring() : setActivePage('recurring')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-purple-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* Urgent Payment Due Today Banner (Requirement 5) */}
      {data?.dueToday && data.dueToday.length > 0 && (
        <div
          id="dash-due-today"
          className="p-5 rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-brand-700 text-white shadow-purple-md relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-100">
                  Urgent Attention Required
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {data.dueToday.length} Payment{data.dueToday.length > 1 ? 's' : ''} Due Today!
                </h3>
                <p className="text-xs text-rose-100/90 mt-1">
                  {data.dueToday[0]?.title} of {formatCurrency(data.dueToday[0]?.amount)} is scheduled for settlement today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePayDueNow(data.dueToday[0]?._id)}
                className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Paid Now</span>
              </button>
              <button
                onClick={() => setActivePage('recurring')}
                className="px-3.5 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-semibold transition-colors"
              >
                View Details &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid (Requirement 4) */}
      <div id="dash-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Balance */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm hover:shadow-purple-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Balance
            </span>
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
            {formatCurrency(data?.summary?.netBalance)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Total Accumulated Balance</p>
        </div>

        {/* Card 2: Total Income */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm hover:shadow-purple-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-emerald-600 mt-3 tracking-tight">
            {formatCurrency(data?.summary?.totalIncome)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            This Month: <span className="font-semibold text-slate-700">{formatCurrency(data?.summary?.thisMonthIncome)}</span>
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm hover:shadow-purple-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-rose-600 mt-3 tracking-tight">
            {formatCurrency(data?.summary?.totalExpenses)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            This Month: <span className="font-semibold text-slate-700">{formatCurrency(data?.summary?.thisMonthExpense)}</span>
          </p>
        </div>

        {/* Card 4: Month Savings */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm hover:shadow-purple-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Savings
            </span>
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-brand-700 mt-3 tracking-tight">
            {formatCurrency(data?.summary?.thisMonthSavings)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Retained savings this month
          </p>
        </div>
      </div>

      {/* Graphical Charts Section (Requirement 4) */}
      <div id="dash-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 6-Month Income vs Expense Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Income vs. Expense Trend</h3>
              <p className="text-xs text-slate-500">6-Month historical cashflow overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-brand-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E9D5FF',
                    boxShadow: '0 8px 20px -3px rgba(124, 58, 237, 0.15)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Doughnut Chart */}
        <div className="p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Expense by Category</h3>
            <p className="text-xs text-slate-500">Top spending areas</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            {data?.categoryExpenses && data.categoryExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryExpenses}
                    dataKey="total"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {data.categoryExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      borderColor: '#E9D5FF',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No expense records logged yet.</p>
            )}
          </div>

          {/* Category List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {(data?.categoryExpenses || []).slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {cat._id}
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Recurring Payments & Recent Transactions Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Recurring Payments */}
        <div id="dash-upcoming" className="p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Recurring Payments</h3>
              <p className="text-xs text-slate-500">Next 30 days scheduled dues</p>
            </div>
            <button
              onClick={() => setActivePage('recurring')}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {!data?.upcomingPayments || data.upcomingPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No upcoming recurring payments in the next 30 days.
              </div>
            ) : (
              data.upcomingPayments.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    item.isDueToday
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-brand-50/30 border-brand-100 hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.isDueToday
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        {item.paymentType} • {item.recurrenceType}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(item.amount)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        item.isDueToday
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : item.diffDays <= 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-brand-100 text-brand-800'
                      }`}
                    >
                      {item.isDueToday ? 'Due Today' : `Due in ${item.diffDays}d`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Latest credits and debits</p>
            </div>
            <button
              onClick={() => setActivePage('transactions')}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No transactions recorded yet.
              </div>
            ) : (
              data.recentTransactions.slice(0, 4).map((txn) => {
                const isCredit = txn.type === 'credit';
                return (
                  <div
                    key={txn._id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-brand-200 transition-colors flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-xs">
                          {txn.reason || txn.category}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {new Date(txn.date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {txn.category}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-extrabold ${
                          isCredit ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {txn.referenceNumber || 'TXN'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

