import React from 'react';
import { X, Bell, Check, Clock, AlertTriangle, ShieldCheck, CheckCheck } from 'lucide-react';

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onNavigateToRecurring,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Notifications</h3>
                <p className="text-xs text-brand-100">
                  {unreadCount > 0 ? `${unreadCount} unread reminders` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader controls */}
          <div className="px-5 py-3 bg-brand-50/60 border-b border-brand-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-900">Payment Alerts & Dues</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bell className="w-12 h-12 text-slate-200 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  You will receive alerts here when your recurring loans or EMIs are due.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isDueToday = item.type === 'due_today';
                const isUpcoming = item.type === 'upcoming_due';

                return (
                  <div
                    key={item._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      !item.isRead
                        ? isDueToday
                          ? 'bg-rose-50/70 border-rose-200 shadow-sm'
                          : 'bg-brand-50/60 border-brand-200 shadow-sm'
                        : 'bg-white border-slate-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDueToday
                            ? 'bg-rose-100 text-rose-600'
                            : isUpcoming
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        {isDueToday ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isUpcoming ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                        <div className="mt-3 flex items-center justify-between">
                          {item.relatedId && onNavigateToRecurring && (
                            <button
                              onClick={() => {
                                onNavigateToRecurring();
                                onClose();
                              }}
                              className="text-xs font-semibold text-brand-700 hover:text-brand-900 underline"
                            >
                              View in Recurring Payments &rarr;
                            </button>
                          )}

                          {!item.isRead && (
                            <button
                              onClick={() => onMarkRead(item._id)}
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 ml-auto flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

