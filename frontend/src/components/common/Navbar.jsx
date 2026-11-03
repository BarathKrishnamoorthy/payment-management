import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  RotateCcw,
  BarChart3,
  User,
  Bell,
  HelpCircle,
  Sparkles,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({
  activePage,
  setActivePage,
  onOpenGuidance,
  onReplayTour,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Income & Expenses', icon: ArrowLeftRight },
    { id: 'recurring', label: 'Recurring Payments', icon: RotateCcw },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-100 shadow-purple-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActivePage('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white shadow-purple-md group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                  RB Payment
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Finance & Loan Manager</p>
            </div>
          </div>

          {/* Desktop Navigation Navigation items */}
          <nav className="hidden md:flex items-center gap-1 bg-brand-50/70 p-1 rounded-2xl border border-brand-100">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  id={`nav-${item.id}`}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-brand-700 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* "How to Use" Button */}
            <button
              onClick={onOpenGuidance}
              id="btn-how-to-use"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-brand-700 text-xs font-semibold shadow-sm transition-all hover:scale-102"
              title="Step-by-step module instructions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>How to Use</span>
            </button>

            {/* "Replay Tour" Button */}
            <button
              onClick={onReplayTour}
              id="btn-replay-tour"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 text-xs font-semibold transition-all hover:scale-102"
              title="Replay interactive visual tutorial"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Replay Tour</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              id="btn-notifications"
              className="relative p-2 rounded-xl border border-brand-100 bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile avatar pill */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-brand-100">
              <div
                onClick={() => setActivePage('profile')}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-brand-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name || 'Customer'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {user?.phoneNumber || ''}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile bottom / secondary navigation strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-brand-50 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-700 font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

