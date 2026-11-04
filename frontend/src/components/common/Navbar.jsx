import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  RotateCcw,
  BarChart3,
  User,
  Bell,
  Search,
  ChevronDown,
  Wallet,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({
  unreadCount = 0,
  onOpenNotifications,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Income & Expenses', icon: ArrowLeftRight },
    { path: '/recurring', label: 'Recurring Payments', icon: RotateCcw },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  // Customer display details
  const displayName = user?.name || (user?.phoneNumber ? `Customer (${user.phoneNumber.slice(-4)})` : 'Customer');
  const displayPhone = user?.phoneNumber ? `+91 ${user.phoneNumber.slice(-10)}` : '';
  const initial = (displayName.charAt(0) || 'C').toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100/70 px-4 sm:px-8 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger Toggle + Brand Logo Pill */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Toggle (Mobile only) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-purple-100 bg-white hover:bg-brand-50 text-slate-700 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-brand-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white shadow-purple-md">
              <Wallet className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  RB Payment
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-brand-600 text-white">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Smart Finance & Loan Manager
              </p>
            </div>
          </div>
        </div>

        {/* Center: Top Pill Navigation Tabs (Desktop only) */}
        <nav className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-purple-sm'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Search, Notification Bell & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Search Bar with Ctrl + K (Desktop) */}
          <div
            onClick={() => navigate('/transactions')}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-purple-100 bg-purple-50/30 hover:bg-purple-50/60 text-slate-400 text-xs font-medium cursor-pointer transition-colors w-48 sm:w-60"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 text-slate-500 text-[11px] truncate">Search transactions...</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] font-bold text-slate-500 shadow-2xs">
              Ctrl + K
            </kbd>
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl border border-purple-100 bg-white hover:bg-brand-50 text-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 pl-1 sm:pl-1.5 pr-2 py-1 rounded-2xl hover:bg-purple-50/80 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              {displayPhone && (
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  {displayPhone}
                </p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block ml-0.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
