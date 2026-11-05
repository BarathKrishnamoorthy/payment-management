import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  BarChart3,
  User,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Landmark,
  Users,
  Target,
  Handshake,
  Layers
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
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isStacked: false,
    },
    {
      path: '/transactions',
      labelTop: 'Income &',
      labelBottom: 'Expenses',
      icon: ArrowLeftRight,
      isStacked: true,
    },
    {
      path: '/recurring',
      labelTop: 'Recurring',
      labelBottom: 'Payments',
      icon: Calendar,
      isStacked: true,
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: BarChart3,
      isStacked: false,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      isStacked: false,
    },
  ];

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  const moreItems = [
    {
      path: '/accounts',
      label: 'Bank & Wallets',
      desc: 'Savings, UPI, cash accounts & transfers',
      icon: Landmark,
    },
    {
      path: '/family',
      label: 'Family Finance',
      desc: 'Shared workspace & member splits',
      icon: Users,
    },
    {
      path: '/planning',
      label: 'Budgets & Goals',
      desc: 'Category limits & savings milestones',
      icon: Target,
    },
    {
      path: '/loans',
      label: 'Borrow & Lend',
      desc: 'Loans tracker & repayment history',
      icon: Handshake,
    },
  ];

  const isMoreActive = moreItems.some((i) => location.pathname === i.path);
  const activeMoreItem = moreItems.find((i) => location.pathname === i.path);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const displayName = user?.name || (user?.phoneNumber ? `Customer (${user.phoneNumber.slice(-4)})` : 'Customer');
  const displayPhone = user?.phoneNumber ? `+91 ${user.phoneNumber.slice(-10)}` : '';
  const initial = (displayName.charAt(0) || 'C').toUpperCase();

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 w-full">
      <div className="max-w-[1600px] mx-auto bg-white rounded-2xl lg:rounded-full border border-purple-100 shadow-[0_6px_25px_rgba(124,58,237,0.06)] px-4 sm:px-6 py-2 flex items-center justify-between gap-3 sm:gap-4 transition-all">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hamburger Menu Toggle (Mobile & Tablet) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 text-slate-700 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-brand-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Logo + Every Rupee Matters Text */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <img
              src="/logo-icon.png"
              alt="Every Rupee Matters Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
            />
            <span className="font-extrabold text-xs sm:text-sm tracking-wider text-[#63278D] font-sans uppercase select-none">
              EVERY RUPEE MATTERS
            </span>
          </div>

          {/* Subtle vertical divider matching design */}
          <div className="h-5 w-[1px] bg-slate-200 ml-1 mr-1 hidden xl:block" />
        </div>

        {/* Center: Top Navigation Tabs matching user design */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-[#6D28D9] text-white shadow-purple-sm'
                    : 'text-slate-700 hover:text-brand-700 hover:bg-purple-50/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                />
                {item.isStacked ? (
                  <div className="flex flex-col text-left leading-[1.05]">
                    <span
                      className={`text-[10px] font-bold ${
                        isActive ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {item.labelTop}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isActive ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {item.labelBottom}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-bold ${
                      isActive ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
          {/* Dropdown for More Modules (Accounts, Family, Budgets, Loans) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 text-left ${
                isMoreActive
                  ? 'bg-[#6D28D9] text-white shadow-purple-sm'
                  : 'text-slate-700 hover:text-brand-700 hover:bg-purple-50/70'
              }`}
            >
              <Layers
                className={`w-4 h-4 shrink-0 ${
                  isMoreActive ? 'text-white' : 'text-slate-600'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  isMoreActive ? 'text-white' : 'text-slate-800'
                }`}
              >
                {activeMoreItem ? activeMoreItem.label : 'More'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showMoreMenu ? 'rotate-180' : ''
                } ${isMoreActive ? 'text-white' : 'text-slate-400'}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-purple-100 p-2 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-purple-50 mb-1">
                  Financial Modules
                </div>
                {moreItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isItemActive
                          ? 'bg-purple-50 text-[#6D28D9] font-bold'
                          : 'hover:bg-purple-50/60 text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Search, Notification Bell & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search Pill Input with Ctrl + K */}
          <div
            onClick={() => navigate('/transactions')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200/90 text-slate-400 text-xs cursor-pointer hover:border-purple-300 transition-colors w-44 lg:w-56"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="flex-1 text-[11px] text-slate-400 font-normal truncate">
              Search transactions...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-500 shadow-2xs">
              Ctrl + K
            </kbd>
          </div>

          {/* Notification Bell with indicator dot */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-purple-50 text-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-purple-50/80 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              {displayPhone && (
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  {displayPhone}
                </p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
};
