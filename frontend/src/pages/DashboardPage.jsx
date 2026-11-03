import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  BarChart2,
  PieChart as PieIcon,
  Calendar,
  ChevronDown,
  Sparkles,
  Home,
  Car,
  CreditCard,
  Check,
  Clock,
  ChevronRight,
  AlertTriangle,
  X,
  History,
  Info,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ModuleTour } from '../components/walkthrough/ModuleTour';
import {
  PurpleWalletIllustration,
  GreenWaveBackground,
  PinkWaveBackground,
  MoneyJarIllustration,
  EmptyCategoryIllustration
} from '../components/dashboard/DashboardIllustrations';

export const DashboardPage = ({ setActivePage, onTriggerAddTxn, onTriggerAddRecurring }) => {
  const { user, setModuleTutorialDone } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Timeframe selectors
  const [trendRange, setTrendRange] = useState('Last 6 Months');
  const [categoryRange, setCategoryRange] = useState('This Month');

  // Recurring Payment Details Modal
  const [selectedRecurringDetail, setSelectedRecurringDetail] = useState(null);

  // Recurring Filter: 'due_soon' (≤ 3 days before due date - default) or 'all'
  const [recurringFilter, setRecurringFilter] = useState('due_soon');
  // Local set of dismissed/hidden item IDs for this session
  const [dismissedItemIds, setDismissedItemIds] = useState([]);

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
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    setModuleTutorialDone('dashboard');
  };

  // Instant 1-click payment settlement from dashboard
  const handlePayDueNow = async (recurringId) => {
    try {
      await api.markAsPaid(recurringId);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#7C3AED', '#A855F7'],
        });
      } catch (e) {}
      await fetchSummary();
    } catch (err) {
      alert(err.message || 'Failed to mark payment as paid');
    }
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'Home Loan':
        return Home;
      case 'Car Loan':
        return Car;
      case 'Gold Loan':
        return Coins;
      case 'Bank Loan':
      case 'EMI':
        return CreditCard;
      default:
        return RotateCcw;
    }
  };

  const displayName = user?.name || 'Barathk';

  // Recurring Schedules Computations ("before 3 days to due date and then hide it")
  const rawSchedules = data?.allUpcomingPayments || data?.upcomingPayments || [];
  const allSchedules = rawSchedules.filter((p) => !dismissedItemIds.includes(p._id));
  const duesWithin3Days = allSchedules.filter((p) => p.diffDays <= 3);
  const hiddenFutureCount = allSchedules.filter((p) => p.diffDays > 3).length;
  const displayedPayments = recurringFilter === 'due_soon' ? duesWithin3Days : allSchedules;

  // Currency formatter
  const formatCurrency = (num) => {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  };

  // 6 Months trend chart data (defaults to empty line as in screenshot if 0)
  const defaultChartData = [
    { label: 'May', income: 0, expense: 0 },
    { label: 'Jun', income: 0, expense: 0 },
    { label: 'Jul', income: 0, expense: 0 },
    { label: 'Aug', income: 0, expense: 0 },
    { label: 'Sep', income: 0, expense: 0 },
    { label: 'Oct', income: 0, expense: 0 },
  ];

  const chartData = (data?.chartData && data.chartData.length > 0) ? data.chartData : defaultChartData;

  const PIE_COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#E879F9', '#38BDF8', '#34D399'];

  const tourSteps = [
    {
      targetId: 'dash-metrics',
      targetName: 'Financial Balance & Metrics',
      title: 'Net Balance & Cashflow Summary',
      description: 'View your accumulated financial balance, along with this month’s income, expenses, and savings rate at a glance.',
      placement: 'bottom',
    },
    {
      targetId: 'dash-actions',
      targetName: 'Quick Action Hub',
      title: 'Record Incomes, Expenses & Recurring Loans',
      description: 'Easily log new credits, track debit expenses, or set up automated recurring payment schedules.',
      placement: 'bottom',
    },
    {
      targetId: 'dash-trend-card',
      targetName: 'Income vs Expense Trend',
      title: 'Interactive Cashflow Overview',
      description: 'Analyze your 6-month historical cashflow trajectory with comparative income and expense curves.',
      placement: 'top',
    },
    {
      targetId: 'dash-category-card',
      targetName: 'Expense by Category',
      title: 'Spending Breakdown Diagnostics',
      description: 'Track where your money goes across housing, EMIs, food, shopping, and utilities.',
      placement: 'left',
    },
    {
      targetId: 'dash-recurring-section',
      targetName: 'Recurring Payments Hub',
      title: 'Active Loans & Automated Dues',
      description: 'View your upcoming loan installments, EMIs, and subscriptions, and settle them directly with 1-click.',
      placement: 'top',
    },
  ];

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

      {/* Main Header Row matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Title with vertical purple accent bar */}
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-8 bg-brand-600 rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Financial Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Welcome back, <span className="font-bold text-slate-800">{displayName}</span>. Here is your current financial standing.
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons matching screenshot */}
        <div id="dash-actions" className="flex items-center gap-2.5 flex-wrap">
          {/* + Add Income */}
          <button
            onClick={() => onTriggerAddTxn ? onTriggerAddTxn('credit') : setActivePage('transactions')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-emerald-400 hover:bg-emerald-50 text-slate-700 text-xs font-bold shadow-2xs transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            <span>Add Income</span>
          </button>

          {/* - Add Expense (Solid vibrant purple) */}
          <button
            onClick={() => onTriggerAddTxn ? onTriggerAddTxn('debit') : setActivePage('transactions')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-purple-sm transition-all hover:scale-102"
          >
            <MinusCircle className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          {/* Add Recurring */}
          <button
            onClick={() => onTriggerAddRecurring ? onTriggerAddRecurring() : setActivePage('recurring')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-purple-200 hover:bg-purple-50 text-slate-700 text-xs font-bold shadow-2xs transition-all hover:scale-102"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-600 stroke-[2.5]" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* 4 Top Metric Cards (Horizontal Row) */}
      <div id="dash-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: NET BALANCE (Highlighted purple border + 3D Wallet) */}
        <div className="p-5 rounded-3xl bg-white border-2 border-purple-300 ring-2 ring-purple-100/60 shadow-purple-sm relative flex items-center justify-between overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 flex items-center justify-center text-brand-600 mb-2">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              NET BALANCE
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(data?.summary?.netBalance || 0)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Total Accumulated Balance
            </p>
          </div>

          <PurpleWalletIllustration />
        </div>

        {/* Card 2: TOTAL INCOME (Green trend icon + Green wave background) */}
        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-purple-sm relative flex flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600 mb-2">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              TOTAL INCOME
            </span>
            <h2 className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">
              {formatCurrency(data?.summary?.totalIncome || 0)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              This Month: <span className="font-bold">{formatCurrency(data?.summary?.thisMonthIncome || 0)}</span>
            </p>
          </div>

          <GreenWaveBackground />
        </div>

        {/* Card 3: TOTAL EXPENSES (Red trend icon + Pink wave background) */}
        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-purple-sm relative flex flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-500 mb-2">
              <TrendingDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              TOTAL EXPENSES
            </span>
            <h2 className="text-2xl font-black text-rose-500 mt-1 tracking-tight">
              {formatCurrency(data?.summary?.totalExpenses || 0)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              This Month: <span className="font-bold">{formatCurrency(data?.summary?.thisMonthExpense || 0)}</span>
            </p>
          </div>

          <PinkWaveBackground />
        </div>

        {/* Card 4: MONTHLY SAVINGS (Coin stack icon + 3D Money Jar) */}
        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-purple-sm relative flex items-center justify-between overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 flex items-center justify-center text-brand-600 mb-2">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              MONTHLY SAVINGS
            </span>
            <h2 className="text-2xl font-black text-brand-700 mt-1 tracking-tight">
              {formatCurrency(data?.summary?.thisMonthSavings || 0)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Retained savings this month
            </p>
          </div>

          <MoneyJarIllustration />
        </div>
      </div>

      {/* 2-Column Analytics Cards (Income vs. Expense Trend + Expense by Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Income vs. Expense Trend */}
        <div
          id="dash-trend-card"
          className="lg:col-span-7 xl:col-span-8 p-6 rounded-3xl bg-white border border-purple-100 shadow-purple-sm flex flex-col justify-between"
        >
          {/* Card Header with 3 vertical bars icon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-100/80 text-brand-600 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Income vs. Expense Trend
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  6-Month historical cashflow overview
                </p>
              </div>
            </div>

            {/* Right Legend and Timeframe dropdown pill */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Expenses
                </span>
              </div>

              {/* Timeframe selector pill */}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-slate-700 text-xs font-semibold shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>{trendRange}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
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
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#FFFFFF', stroke: '#10B981', strokeWidth: 2.5 }}
                  activeDot={{ r: 6, fill: '#10B981' }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#FFFFFF', stroke: '#7C3AED', strokeWidth: 2.5 }}
                  activeDot={{ r: 6, fill: '#7C3AED' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Expense by Category */}
        <div
          id="dash-category-card"
          className="lg:col-span-5 xl:col-span-4 p-6 rounded-3xl bg-white border border-purple-100 shadow-purple-sm flex flex-col justify-between"
        >
          {/* Card Header with Pie Chart outline icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-100/80 text-brand-600 flex items-center justify-center">
                <PieIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Expense by Category
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Top spending areas
                </p>
              </div>
            </div>

            {/* Dropdown pill */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-slate-700 text-xs font-semibold shadow-2xs">
              <span>{categoryRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Content: Either Empty State with Illustration OR Donut Chart */}
          {(!data?.categoryExpenses || data.categoryExpenses.length === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <EmptyCategoryIllustration />
              <p className="text-xs text-slate-500 font-medium mt-3">
                No expense records logged yet.
              </p>
              <button
                onClick={() => onTriggerAddTxn ? onTriggerAddTxn('debit') : setActivePage('transactions')}
                className="mt-3 px-4 py-2 rounded-xl border border-purple-300 bg-white hover:bg-purple-50 text-brand-700 text-xs font-bold transition-all hover:scale-102 flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>+ Add Expense</span>
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col justify-between">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryExpenses}
                      dataKey="total"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
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
              </div>

              {/* Top 3 Category list */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {data.categoryExpenses.slice(0, 3).map((cat, idx) => (
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
          )}
        </div>
      </div>

      {/* 3rd Row: Recurring Payment Schedules directly on Dashboard */}
      <div id="dash-recurring-section" className="p-6 rounded-3xl bg-white border border-purple-100 shadow-purple-sm space-y-5">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/90 text-brand-700 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Upcoming Recurring Payments & Loan Commitments
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  {recurringFilter === 'due_soon'
                    ? `${duesWithin3Days.length} Due in ≤ 3 Days`
                    : `${allSchedules.length} Total Schedules`}
                </span>
                {hiddenFutureCount > 0 && recurringFilter === 'due_soon' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>{hiddenFutureCount} future schedule{hiddenFutureCount > 1 ? 's' : ''} hidden</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {recurringFilter === 'due_soon'
                  ? 'Showing commitments due within 3 days. Payments further away remain hidden until 3 days before their due date.'
                  : 'Displaying all active recurring payment schedules.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View filter switcher: Due in ≤ 3 Days vs All */}
            <div className="flex items-center gap-1 p-1 bg-purple-50/80 rounded-xl border border-purple-100 text-xs">
              <button
                onClick={() => setRecurringFilter('due_soon')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  recurringFilter === 'due_soon'
                    ? 'bg-white text-brand-700 shadow-2xs'
                    : 'text-slate-500 hover:text-brand-700'
                }`}
              >
                Due in ≤ 3 Days ({duesWithin3Days.length})
              </button>
              <button
                onClick={() => setRecurringFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  recurringFilter === 'all'
                    ? 'bg-white text-brand-700 shadow-2xs'
                    : 'text-slate-500 hover:text-brand-700'
                }`}
              >
                All ({allSchedules.length})
              </button>
            </div>

            <button
              onClick={() => onTriggerAddRecurring ? onTriggerAddRecurring() : setActivePage('recurring')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold transition-all shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Recurring</span>
            </button>
            <button
              onClick={() => setActivePage('recurring')}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Urgent Due Today Alert Strip if any */}
        {data?.dueToday && data.dueToday.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-brand-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-rose-100">
                  Payment Due Today
                </p>
                <p className="text-sm font-bold text-white">
                  {data.dueToday[0]?.title} • {formatCurrency(data.dueToday[0]?.amount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePayDueNow(data.dueToday[0]?._id)}
              className="px-4 py-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto transition-transform hover:scale-102"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Mark as Paid</span>
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedPayments.length === 0 ? (
            allSchedules.length > 0 && recurringFilter === 'due_soon' ? (
              <div className="col-span-full py-10 px-6 text-center bg-gradient-to-b from-purple-50/40 to-white rounded-2xl border border-purple-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  No Commitments Due in the Next 3 Days
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You have {allSchedules.length} active recurring schedule{allSchedules.length > 1 ? 's' : ''}. Each one is currently hidden and will automatically appear here exactly 3 days before its due date.
                </p>
                <div className="flex items-center justify-center gap-2.5 mt-4">
                  <button
                    onClick={() => setRecurringFilter('all')}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 text-brand-700 text-xs font-bold hover:bg-purple-50 transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View All {allSchedules.length} Schedules</span>
                  </button>
                  <button
                    onClick={() => setActivePage('recurring')}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-2xs"
                  >
                    Manage Recurring Payments →
                  </button>
                </div>
              </div>
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                <RotateCcw className="w-8 h-8 mx-auto text-slate-200 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-slate-600">No recurring payment schedules configured yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add your monthly EMIs, home loans, car loans, or subscriptions to receive alerts on the dashboard.
                </p>
                <button
                  onClick={() => onTriggerAddRecurring ? onTriggerAddRecurring() : setActivePage('recurring')}
                  className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  + Add First Recurring Schedule
                </button>
              </div>
            )
          ) : (
            displayedPayments.map((item) => {
              const Icon = getCategoryIcon(item.paymentType);
              const isDueToday = item.isDueToday;
              const isDueSoon = item.diffDays <= 3 && item.diffDays > 0;

              return (
                <div
                  key={item._id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-purple-sm flex flex-col justify-between ${
                    isDueToday
                      ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                      : isDueSoon
                      ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-purple-100 hover:border-purple-300'
                  }`}
                >
                  <div>
                    {/* Top Category Badge & Due Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-brand-700 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100/80 text-brand-800">
                          {item.paymentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDueToday
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : isDueSoon
                              ? 'bg-amber-100 text-amber-800'
                              : item.diffDays < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {isDueToday
                            ? '🚨 Due Today'
                            : item.diffDays < 0
                            ? `Overdue ${Math.abs(item.diffDays)}d`
                            : `Due in ${item.diffDays}d`}
                        </span>

                        {/* Quick Hide/Dismiss button */}
                        <button
                          onClick={() => setDismissedItemIds(prev => [...prev, item._id])}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Hide from dashboard until next reload"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Amount with clickable details */}
                    <div
                      onClick={() => setSelectedRecurringDetail(item)}
                      className="cursor-pointer group"
                    >
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors mt-2.5 truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-slate-900">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          /{item.recurrenceType.toLowerCase()}
                        </span>
                      </div>
                      {item.reason ? (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.reason}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Due Date & Action */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.nextDueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedRecurringDetail(item)}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-[11px] font-semibold transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handlePayDueNow(item._id)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 hover:scale-102"
                        title="Mark as paid and advance to next due date"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Mark Paid</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recurring Payment Details Modal */}
      {selectedRecurringDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Recurring Payment Details
                  </h3>
                  <p className="text-xs text-brand-100">{selectedRecurringDetail.paymentType} Commitment</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecurringDetail(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    {selectedRecurringDetail.paymentType}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedRecurringDetail.title}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedRecurringDetail.reason || 'No description provided'}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    {formatCurrency(selectedRecurringDetail.amount)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">per {selectedRecurringDetail.recurrenceType.toLowerCase()}</p>
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Next Due Date:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedRecurringDetail.nextDueDate).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Recurrence Frequency:</span>
                  <span className="font-semibold text-slate-800">{selectedRecurringDetail.recurrenceType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Auto-Debit in Ledger:</span>
                  <span className="font-semibold text-emerald-600">Enabled</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-brand-700">Active Schedule</span>
                </div>
              </div>

              {/* Past Payment History */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-brand-600" />
                  Past Payment History
                </span>
                {(!selectedRecurringDetail.paymentHistory || selectedRecurringDetail.paymentHistory.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                    No payment history recorded yet. Tap "Mark as Paid" to settle this installment.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {selectedRecurringDetail.paymentHistory.map((h, hi) => (
                      <div key={hi} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800">{new Date(h.paidDate).toLocaleDateString()}</span>
                          <span className="text-slate-400 ml-1.5">• {h.note || 'Settled'}</span>
                        </div>
                        <span className="font-black text-emerald-600">{formatCurrency(h.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecurringDetail(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setDismissedItemIds((prev) => [...prev, selectedRecurringDetail._id]);
                      setSelectedRecurringDetail(null);
                    }}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-xl font-semibold text-brand-700 text-xs flex items-center gap-1"
                    title="Hide from dashboard until page refresh"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </button>
                </div>
                <button
                  onClick={async () => {
                    await handlePayDueNow(selectedRecurringDetail._id);
                    setSelectedRecurringDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-1.5 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Mark as Paid Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
