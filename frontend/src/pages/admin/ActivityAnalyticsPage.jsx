import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Calendar,
  Filter,
  TrendingUp,
  Globe,
  Smartphone,
  UserPlus,
  Activity,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../../services/adminApi';

export const ActivityAnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendRes, statsRes] = await Promise.all([
        adminApi.getActivityTrends({
          timeframe,
          startDate: timeframe === 'custom' ? startDate : undefined,
          endDate: timeframe === 'custom' ? endDate : undefined,
        }),
        adminApi.getDashboardStats(),
      ]);

      if (trendRes && trendRes.success) {
        setTrends(trendRes.trends || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeframe !== 'custom' || (startDate && endDate)) {
      fetchAnalytics();
    }
  }, [timeframe]);

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchAnalytics();
    }
  };

  // Aggregates over the loaded trend points
  const totalDAUSum = trends.reduce((acc, t) => acc + (t.dau || 0), 0);
  const totalWebSum = trends.reduce((acc, t) => acc + (t.websiteUsers || 0), 0);
  const totalMobSum = trends.reduce((acc, t) => acc + (t.mobileUsers || 0), 0);
  const totalNewReg = trends.reduce((acc, t) => acc + (t.newRegistrations || 0), 0);
  const totalActions = trends.reduce((acc, t) => acc + (t.activityCount || 0), 0);

  const pieData = [
    { name: 'Website Traffic', value: totalWebSum || 1, color: '#63278D' },
    { name: 'Mobile Traffic', value: totalMobSum, color: '#38BDF8' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Title & Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              User Activity Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-brand-800">
              Interactive Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyze daily, weekly, and monthly active user frequencies and multi-platform interactions.
          </p>
        </div>

        {/* Date Filter Pills as required */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-purple-50 rounded-2xl border border-purple-100 text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'last_30_days', label: 'Last 30 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                timeframe === tf.id
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-600 hover:text-brand-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Form (if custom chosen) */}
      {timeframe === 'custom' && (
        <form onSubmit={handleApplyCustomDate} className="bg-white p-4 rounded-2xl border border-purple-100 shadow-purple-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-all shadow-purple-xs"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-purple-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total DAU Engagements</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDAUSum.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Aggregated active user encounters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cyan-100 shadow-purple-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Website Engagements</span>
          <p className="text-2xl font-black text-cyan-700 mt-1">{totalWebSum.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Direct web portal interactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-purple-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Mobile Interactions</span>
          <p className="text-2xl font-black text-sky-700 mt-1">{totalMobSum.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Android & iOS mobile sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-purple-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Actions Recorded</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalActions.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Logins, ledger updates, queries</p>
        </div>
      </div>

      {/* Main Multi-Metric Trend Area Chart */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active User Trajectory</h3>
            <p className="text-xs text-slate-400">Daily unique users vs. multi-platform activity volume</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl text-slate-500 hover:bg-purple-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>

        <div className="h-72 sm:h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGradFull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#63278D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#63278D" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="webGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1B4B',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="dau" name="Daily Active Users" stroke="#63278D" strokeWidth={2.5} fillOpacity={1} fill="url(#dauGradFull)" />
              <Area type="monotone" dataKey="websiteUsers" name="Website Active" stroke="#8B5CF6" strokeWidth={1.5} fillOpacity={1} fill="url(#webGrad)" />
              <Area type="monotone" dataKey="mobileUsers" name="Mobile Active" stroke="#38BDF8" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Registration Trends Bar Chart + Platform Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* New Registrations Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">New User Registration Velocity</h3>
          <p className="text-xs text-slate-400 mb-4">Customer signups across the selected timeframe</p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1B4B',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="newRegistrations" name="New Customer Registrations" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Share Ring */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Platform Engagement Distribution</h3>
            <p className="text-xs text-slate-400 mb-2">Proportion of activity generated through Web vs. Mobile devices</p>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1B4B',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
              <span className="font-bold text-brand-800">Website Engagements</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{totalWebSum}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
              <span className="font-bold text-sky-800">Mobile Engagements</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{totalMobSum}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
