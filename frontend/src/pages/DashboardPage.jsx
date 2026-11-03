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
  Sparkles
} from 'lucide-react';
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

  const displayName = user?.name || 'Barathk';

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

      {/* Main Header Row */}
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

      {/* Lower Row: 2-Column Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card (col-span-7 or 8): Income vs. Expense Trend */}
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

        {/* Right Card (col-span-5 or 4): Expense by Category */}
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
    </div>
  );
};
