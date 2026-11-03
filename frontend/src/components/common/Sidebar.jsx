import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  BarChart2,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage, onOpenGuidance }) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: ArrowLeftRight, label: 'Income & Expenses' },
    { id: 'recurring', icon: Calendar, label: 'Recurring Payments' },
    { id: 'reports', icon: BarChart2, label: 'Reports' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-16 py-6 border-r border-purple-100/80 bg-white/80 shrink-0">
      {/* Top module icons */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                isActive
                  ? 'bg-purple-100/90 text-brand-700 shadow-2xs'
                  : 'text-slate-400 hover:text-brand-700 hover:bg-purple-50/60'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              {/* Tooltip on hover */}
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
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
          <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
            How to Use
          </span>
        </button>

        <button
          onClick={() => setActivePage('profile')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-700 hover:bg-purple-50/60 transition-colors group relative"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
};

