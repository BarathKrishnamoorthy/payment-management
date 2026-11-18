import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Users,
  LineChart,
  Smartphone,
  FileSpreadsheet,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const AdminLayout = ({ children }) => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/active-users', label: 'Active Users', icon: Activity, badge: 'Live' },
    { path: '/admin/users', label: 'User Directory', icon: Users },
    { path: '/admin/analytics', label: 'Activity Analytics', icon: LineChart },
    { path: '/admin/platform', label: 'Platform Analytics', icon: Smartphone },
    { path: '/admin/reports', label: 'Reports & Export', icon: FileSpreadsheet },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-purple-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Emblem & Portal Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-purple-50"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-brand-700" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white p-1 border border-purple-200 shadow-purple-xs flex items-center justify-center transition-transform group-hover:scale-105">
                  <img
                    src="/logo-icon.png"
                    alt="ERM Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#63278D]">
                      ERM
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-brand-800 border border-purple-200">
                      ADMIN PORTAL
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                    Every Rupee Matters • Central Control
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Navigation Tabs for Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-purple-xs'
                        : 'text-slate-600 hover:text-brand-700 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Quick Customer App Switch + Admin Profile + Logout */}
            <div className="flex items-center gap-2.5">
              <a
                href="/dashboard"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 transition-colors"
                title="Open user app in new tab"
              >
                <span>Customer App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-purple-500 text-white font-extrabold text-xs flex items-center justify-center shadow-purple-xs">
                  {admin?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {admin?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Super Admin</span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-100 bg-white px-4 pt-3 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-700 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <a
                href="/dashboard"
                className="text-brand-700 font-semibold flex items-center gap-1"
              >
                <span>View Customer App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleLogout}
                className="text-rose-600 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="ERM" className="w-4 h-4 object-contain" />
            <span className="font-bold text-slate-700">ERM Centralized Admin Platform</span>
            <span>•</span>
            <span className="text-brand-600 font-semibold">Every Rupee Matters</span>
          </div>
          <div>
            poweredBy <span className="font-extrabold text-brand-700">RB NextWave</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
