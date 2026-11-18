import React, { useState, useEffect } from 'react';
import {
  Globe,
  Smartphone,
  Users,
  Activity,
  CalendarCheck,
  UserPlus,
  Layers,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export const PlatformAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPlatformAnalytics();
      if (res && res.success) {
        setData(res.analytics);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const web = data?.website || {
    totalUsers: 0,
    dau: 0,
    mau: 0,
    newRegistrations: 0,
    loginActivity: 0,
  };

  const mob = data?.mobile || {
    totalUsers: 0,
    dau: 0,
    mau: 0,
    androidUsers: 0,
    iosUsers: 0,
    loginActivity: 0,
    versionDistribution: [],
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Platform & Device Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-brand-800">
              Web vs. Mobile Ecosystem
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated environment breakdown for Web Browsers, Android devices, iOS systems, and installed app versions.
          </p>
        </div>

        <button
          onClick={fetchPlatformData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold border border-purple-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Dual Column Layout: Website vs Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= 1. WEBSITE ANALYTICS PANEL ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-purple-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#63278D] flex items-center justify-center font-bold shadow-purple-xs">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Website Analytics</h3>
                  <p className="text-xs text-slate-400">Desktop & Mobile Web Application Portal</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-brand-700 border border-purple-200">
                Browser Gateway
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Web Users
                </span>
                <p className="text-2xl font-black text-[#63278D] mt-1">
                  {web.totalUsers.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Lifetime web accounts</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Daily Active (DAU)
                </span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {web.dau.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active today on web</p>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Monthly Active (MAU)
                </span>
                <p className="text-2xl font-black text-violet-800 mt-1">
                  {web.mau.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active in last 30d</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  New Signups Today
                </span>
                <p className="text-2xl font-black text-amber-800 mt-1">
                  {web.newRegistrations.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Registered via website</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Web Login Sessions
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {web.loginActivity.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Recorded user authentication events</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-purple-50/40 border border-purple-100/70 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Responsive Web Portal active on Vercel Edge Serverless Infrastructure.</span>
          </div>
        </div>

        {/* ================= 2. MOBILE APP ANALYTICS PANEL ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sky-100 shadow-purple-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-sky-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Mobile Application Analytics</h3>
                  <p className="text-xs text-slate-400">React Native / Expo Client Ecosystem</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                Native App
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Mobile Users
                </span>
                <p className="text-2xl font-black text-sky-700 mt-1">
                  {mob.totalUsers.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Android + iOS users</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mobile DAU
                </span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {mob.dau.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active today on apps</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mobile MAU
                </span>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {mob.mau.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active in last 30d</p>
              </div>

              <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Android Users
                </span>
                <p className="text-2xl font-black text-green-700 mt-1">
                  {mob.androidUsers.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Google Play / APK</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  iOS Users
                </span>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  {mob.iosUsers.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Apple App Store</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mobile Logins
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {mob.loginActivity.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">OTP sessions via app</p>
              </div>
            </div>

            {/* App Version Distribution Breakdown */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Installed App Version Distribution</span>
                <span className="text-[10px] text-slate-400 font-semibold">Active Releases</span>
              </h4>

              <div className="space-y-2.5">
                {!mob.versionDistribution || mob.versionDistribution.length === 0 ? (
                  <p className="text-xs text-slate-400">No version telemetry logged yet.</p>
                ) : (
                  mob.versionDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">v{item.version}</span>
                        <span className="text-slate-500">{item.count} users ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-sky-50/40 border border-sky-100/70 text-xs text-slate-600 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Telemetry automatically tracks app version via native client headers.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
