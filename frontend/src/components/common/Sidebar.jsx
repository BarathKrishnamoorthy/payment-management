import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  RotateCcw,
  BarChart2,
  User,
  Settings,
  HelpCircle,
  X,
  Wallet,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({
  onOpenGuidance,
  isMobileOpen = false,
  onCloseMobile = () => {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const items = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Income & Expenses' },
    { path: '/recurring', icon: RotateCcw, label: 'Recurring Payments' },
    { path: '/reports', icon: BarChart2, label: 'Reports' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onCloseMobile();
  };

  const handleLogout = () => {
    onCloseMobile();
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Customer';
  const displayPhone = user?.phoneNumber ? `+91 ${user.phoneNumber.slice(-10)}` : '';

  return (
    <>
      {/* 1. DESKTOP ICON DOCK (md:flex, hidden on mobile) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-16 py-6 border-r border-purple-100/80 bg-white/80 shrink-0">
        {/* Top module icons */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-purple-100/90 text-brand-700 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-brand-700 hover:bg-purple-50/60'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
                {/* Tooltip on hover */}
                <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom utility icons */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenGuidance}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-700 hover:bg-purple-50/60 transition-colors group relative"
            title="How to Use Guide"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
              How to Use
            </span>
          </button>

          <button
            onClick={() => handleNavigate('/profile')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-700 hover:bg-purple-50/60 transition-colors group relative"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
              Settings
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE SIDEBAR DRAWER (< md screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={onCloseMobile}
          />

          {/* Slide-out Sidebar Drawer */}
          <div className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
            {/* Top section: Header & Navigation Links */}
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-purple-100/70 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-purple-sm">
                    <Wallet className="w-5 h-5 text-white stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                      RB Payment
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Smart Finance
                    </p>
                  </div>
                </div>

                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Profile Banner */}
              <div className="p-3.5 mx-3 my-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {(displayName.charAt(0) || 'C').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {displayPhone || 'Logged in Customer'}
                  </p>
                </div>
              </div>

              {/* Navigation Menu List */}
              <nav className="px-3 space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-purple-sm'
                          : 'text-slate-700 hover:text-brand-700 hover:bg-purple-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions: Guide & Logout */}
            <div className="p-3 border-t border-purple-100/70 space-y-2 bg-slate-50/50">
              <button
                onClick={() => {
                  onCloseMobile();
                  onOpenGuidance();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-purple-50/80 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">How to Use Guide</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
