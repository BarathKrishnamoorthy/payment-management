import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Calendar,
  PiggyBank,
  PieChart,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart as RechartsPie,
  Pie
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ModuleTour } from '../components/walkthrough/ModuleTour';

export const ReportsPage = () => {
  const { user, setModuleTutorialDone } = useAuth();

  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'month' | 'quarter' | 'year' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (timeframe === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await api.getReportAnalytics(params);
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, startDate, endDate]);

  // First-time walkthrough
  useEffect(() => {
    if (user && !user.tutorialStatus?.reports && !loading) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    setModuleTutorialDone('reports');
  };

  const formatCurrency = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.getTransactions({ limit: 10000, ...params });

      if (!res.transactions || res.transactions.length === 0) {
        alert('No transactions found to export.');
        return;
      }

      const headers = ['Date', 'Type', 'Category', 'Reason', 'Reference Number', 'Amount'];
      const rows = res.transactions.map((t) => [
        new Date(t.date).toISOString().split('T')[0],
        t.type,
        `"${t.category || ''}"`,
        `"${(t.reason || '').replace(/"/g, '""')}"`,
        t.referenceNumber || '',
        t.amount,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `RB_Payment_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const PIE_COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#E879F9', '#38BDF8', '#34D399'];

  const tourSteps = [
    {
      targetId: 'rep-filters',
      targetName: 'Date Range & Timeframe Selector',
      title: 'Targeted Analytics Periods',
      description: 'Filter your reports by This Month, This Quarter, This Year, or choose custom calendar dates.',
      placement: 'bottom',
    },
    {
      targetId: 'rep-summary',
      targetName: 'Financial Analytics Summary',
      title: 'Net Savings & Savings Rate',
      description: 'Analyze net surplus cashflow and your savings rate % (the proportion of income retained).',
      placement: 'bottom',
    },
    {
      targetId: 'rep-charts',
      targetName: 'Expense Breakdown Charts',
      title: 'Visual Financial Diagnostics',
      description: 'Identify spending drivers and recurring loan liabilities across your financial ledger.',
      placement: 'top',
    },
    {
      targetId: 'rep-export-btn',
      targetName: 'Export & Print Center',
      title: '1-Click Reports Export',
      description: 'Download raw CSV data for spreadsheet accounting or generate a print-friendly statement.',
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
        moduleName="reports"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze income vs expense trends, breakdown categories, and export audit-ready records.
          </p>
        </div>

        {/* Export & Print Buttons */}
        <div id="rep-export-btn" className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-brand-700 text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-purple-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector Pill Bar */}
      <div id="rep-filters" className="p-4 rounded-3xl bg-white border border-brand-100 shadow-purple-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            Timeframe:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'This Quarter' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Date Range' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeframe === tf.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-brand-50 text-slate-600 hover:bg-brand-100'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {timeframe === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Analytics Cards */}
      <div id="rep-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Income (Credit)
          </span>
          <h2 className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(analytics?.summary?.totalIncome)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.summary?.incomeCount || 0} deposit credits
          </p>
        </div>

        {/* Total Expense */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Expenses (Debit)
          </span>
          <h2 className="text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(analytics?.summary?.totalExpense)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.summary?.expenseCount || 0} debit payouts
          </p>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Net Surplus / Savings
          </span>
          <h2 className="text-2xl font-black text-brand-700 mt-2">
            {formatCurrency(analytics?.summary?.netSavings)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Retained funds for period
          </p>
        </div>

        {/* Savings Rate */}
        <div className="p-5 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Savings Rate %
          </span>
          <h2 className="text-2xl font-black text-brand-600 mt-2">
            {analytics?.summary?.savingsRate || 0}%
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Of total earned income
          </p>
        </div>
      </div>

      {/* Graphical Breakdown Charts */}
      <div id="rep-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Bar Chart */}
        <div className="p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Expenses by Category</h3>
            <p className="text-xs text-slate-500">Distribution of expenditures</p>
          </div>

          <div className="h-64 w-full">
            {analytics?.expenseCategories && analytics.expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.expenseCategories} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey={(d) => d.category || d._id}
                    stroke="#94A3B8"
                    fontSize={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      borderColor: '#E9D5FF',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="total" fill="#7C3AED" radius={[6, 6, 0, 0]}>
                    {analytics.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No expense data available for this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Recurring Financial Commitments Impact */}
        <div className="p-6 rounded-3xl bg-white border border-brand-100 shadow-purple-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recurring Commitments Burden</h3>
            <p className="text-xs text-slate-500">Monthly normalized liabilities across loan types</p>
          </div>

          <div className="space-y-3 my-auto py-4">
            {(!analytics?.recurringCommitments || (Array.isArray(analytics.recurringCommitments) && analytics.recurringCommitments.length === 0) || analytics.recurringCommitments === 0) ? (
              <div className="text-center text-slate-400 text-xs py-8">
                No active recurring loans or subscriptions configured.
              </div>
            ) : Array.isArray(analytics.recurringCommitments) ? (
              analytics.recurringCommitments.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title || item.paymentType || item._id}</h4>
                      <p className="text-[10px] text-slate-400">{item.count || 1} active schedule(s)</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(item.totalMonthlyEquivalent || item.amount || item.total)}/mo
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Total Monthly Commitments</h4>
                  <p className="text-[10px] text-slate-400">Sum of all active recurring obligations</p>
                </div>
                <span className="text-lg font-black text-brand-700">
                  {formatCurrency(analytics.recurringCommitments)}/mo
                </span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
            <span className="font-semibold">Healthy Financial Practice:</span>
            <span className="text-[11px] text-brand-700">Maintain EMIs &lt; 40% of monthly income</span>
          </div>
        </div>
      </div>
    </div>
  );
};

