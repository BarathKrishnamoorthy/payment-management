import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  CalendarCheck,
  TrendingUp,
  Globe,
  Smartphone,
  UserPlus,
  UserX,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
  BarChart2,
  FileSpreadsheet,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../../services/adminApi';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendTimeframe, setTrendTimeframe] = useState('last_30_days');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getActivityTrends({ timeframe: trendTimeframe }),
      ]);
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
      }
      if (trendsRes && trendsRes.success) {
        setTrends(trendsRes.trends || []);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [trendTimeframe]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // 10 Cards Configuration as specified in requirements
  const summaryCards = [
    {
      id: 'total_registered',
      title: 'Total Registered Users',
      value: stats?.totalRegisteredUsers ?? 0,
      description: 'Overall registered customer accounts',
      icon: Users,
      color: 'from-purple-600 to-brand-700',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      id: 'total_active',
      title: 'Total Active Users',
      value: stats?.totalActiveUsers ?? 0,
      description: 'Active users within last 30 days',
      icon: Activity,
      color: 'from-emerald-600 to-teal-700',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'dau',
      title: 'Daily Active Users (DAU)',
      value: stats?.dau ?? 0,
      description: 'Unique customers active today',
      icon: CalendarCheck,
      color: 'from-blue-600 to-indigo-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      id: 'wau',
      title: 'Weekly Active Users (WAU)',
      value: stats?.wau ?? 0,
      description: 'Unique customers active in last 7 days',
      icon: TrendingUp,
      color: 'from-violet-600 to-purple-800',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-200',
    },
    {
      id: 'mau',
      title: 'Monthly Active Users (MAU)',
      value: stats?.mau ?? 0,
      description: 'Unique customers active in last 30 days',
      icon: Activity,
      color: 'from-fuchsia-600 to-pink-700',
      bgColor: 'bg-fuchsia-50',
      textColor: 'text-fuchsia-700',
      borderColor: 'border-fuchsia-200',
    },
    {
      id: 'website_active',
      title: 'Website Active Users',
      value: stats?.websiteActiveUsers ?? 0,
      description: 'Platform access via Web Browser',
      icon: Globe,
      color: 'from-cyan-600 to-blue-700',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      borderColor: 'border-cyan-200',
    },
    {
      id: 'mobile_active',
      title: 'Mobile Active Users',
      value: stats?.mobileActiveUsers ?? 0,
      description: 'Platform access via Android & iOS Apps',
      icon: Smartphone,
      color: 'from-indigo-600 to-purple-700',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'new_registrations',
      title: 'New Registrations',
      value: stats?.newRegistrations ?? 0,
      description: 'Newly registered customer accounts today',
      icon: UserPlus,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
    },
    {
      id: 'inactive_users',
      title: 'Inactive Users',
      value: stats?.inactiveUsers ?? 0,
      description: 'No recorded activity for > 30 days',
      icon: UserX,
      color: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200',
    },
    {
      id: 'blocked_users',
      title: 'Blocked Users',
      value: stats?.blockedUsers ?? 0,
      description: 'Suspended or restricted customer accounts',
      icon: ShieldAlert,
      color: 'from-rose-500 to-rose-700',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
    },
  ];

  // Pie chart data for platform distribution
  const webCount = stats?.websiteActiveUsers || 0;
  const mobCount = stats?.mobileActiveUsers || 0;
  const platformPie = [
    { name: 'Website', value: webCount || (mobCount === 0 ? 1 : 0), color: '#63278D' },
    { name: 'Mobile App', value: mobCount, color: '#38BDF8' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Platform Overview & Live Analytics
            </h1>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Engine</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-platform telemetry across Web & Mobile applications. Zero mock numbers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Real-time active indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-brand-700">
            <Radio className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            <span>
              <strong>{stats?.realTimeActiveUsers ?? 0}</strong> Active in Last 30m
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-white hover:bg-purple-50 text-slate-700 border border-purple-200 text-xs font-bold transition-all shadow-purple-xs disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 10 Dashboard Summary Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Core Performance Metrics (10 Indicators)
          </h2>
          <span className="text-xs font-bold text-brand-700">All Metrics Dynamically Computed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`bg-white rounded-2xl p-5 border ${card.borderColor} shadow-purple-xs hover:shadow-purple-sm transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                      {card.title}
                    </span>
                    <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.textColor} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {loading ? (
                      <span className="text-slate-300 animate-pulse">...</span>
                    ) : (
                      Number(card.value).toLocaleString()
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium line-clamp-1">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main 30-Day Activity Trends Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                User Activity & DAU Velocity
              </h3>
              <p className="text-xs text-slate-400">
                Daily active users, website traffic & mobile interactions over time
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-xl border border-purple-100 text-xs">
              {[
                { id: 'last_7_days', label: '7D' },
                { id: 'last_30_days', label: '30D' },
                { id: 'this_month', label: 'Month' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTrendTimeframe(tf.id)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                    trendTimeframe === tf.id
                      ? 'bg-white text-brand-700 shadow-2xs'
                      : 'text-slate-500 hover:text-brand-700'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#63278D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#63278D" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
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
                <Area type="monotone" dataKey="dau" name="Daily Active Users (DAU)" stroke="#63278D" strokeWidth={2.5} fillOpacity={1} fill="url(#dauGrad)" />
                <Area type="monotone" dataKey="mobileUsers" name="Mobile App DAU" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#mobGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#63278D]" />
              <span className="font-semibold text-slate-600">Total DAU (Unique)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#38BDF8]" />
              <span className="font-semibold text-slate-600">Mobile Interactions</span>
            </div>
          </div>
        </div>

        {/* Platform Distribution Ring */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Distribution</h3>
            <p className="text-xs text-slate-400">Website vs. Mobile application active ratio</p>

            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {platformPie.map((entry, index) => (
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

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-purple-50/60">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#63278D]" />
                <span className="font-bold text-slate-800">Website Access</span>
              </div>
              <span className="font-extrabold text-[#63278D]">{stats?.websiteActiveUsers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-sky-50/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#0284C7]" />
                <span className="font-bold text-slate-800">Mobile Apps (Android/iOS)</span>
              </div>
              <span className="font-extrabold text-[#0284C7]">{stats?.mobileActiveUsers ?? 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Access Control Modules Hub */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-purple-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Administrative Modules</h3>
            <p className="text-xs text-slate-400">Jump directly to specialized control and reporting desks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/admin/active-users')}
            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 flex items-center justify-between">
              <span>Active Users</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Live user roster with device, login time & status filters.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/users')}
            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Directory
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 flex items-center justify-between">
              <span>User Management</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Manage accounts, block/unblock, and inspect transaction portfolios.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/platform')}
            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Web vs Mobile
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 flex items-center justify-between">
              <span>Platform Analytics</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Android vs iOS breakdown, app version distribution and logins.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/reports')}
            className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                CSV / Excel
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 flex items-center justify-between">
              <span>Reports & Export</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Export 8 standard audits in Excel (.xlsx) and CSV formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
