import React, { useState } from 'react';
import {
  User,
  Phone,
  Landmark,
  CreditCard,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  LogOut,
  Mail,
  AlertCircle,
  Save,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, updateProfile, resetAllTutorials, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        email: email.trim(),
      });
      setMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWalkthroughs = async () => {
    if (window.confirm('Reset all interactive module tours? They will appear automatically when you visit each module.')) {
      await resetAllTutorials();
      alert('Walkthrough tours have been reset! Navigate to any module to experience the interactive tutorials again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Customer Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your customer identity, registered banking accounts, and interactive tutorial preferences.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Details Card */}
      <div className="bg-white rounded-3xl border border-brand-100 shadow-purple-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-purple-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {user?.name || 'Customer'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Primary Account Holder
              </p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => {
                setName(user?.name || '');
                setBankName(user?.bankName || '');
                setAccountNumber(user?.accountNumber || '');
                setEmail(user?.email || '');
                setIsEditing(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel Editing
            </button>
          )}
        </div>

        {/* Form or Display View */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {/* Field 1: Customer Name */}
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Name
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {user?.name || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Field 2: Phone Number */}
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mobile Number (Auth ID)
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  +91 {user?.phoneNumber}
                </p>
              </div>
            </div>

            {/* Field 3: Bank Name */}
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Bank Name
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {user?.bankName || 'Not configured'}
                </p>
              </div>
            </div>

            {/* Field 4: Bank Account Number */}
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bank Account Number
                </span>
                <p className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                  {user?.accountNumber || 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50100492817291"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@domain.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-purple-sm transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Preferences & Reset Walkthroughs Card */}
      <div className="bg-white rounded-3xl border border-brand-100 shadow-purple-sm p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          User Guidance & Tutorial Preferences
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          RB Payment Management features interactive visual walkthroughs with directional arrows and spotlight tooltips for each module.
        </p>

        <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Reset All Module Walkthroughs</h4>
              <p className="text-[11px] text-slate-500">
                Re-enable the automatic step-by-step tutorial tour across Dashboard, Income & Expenses, Recurring Payments, and Reports.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetWalkthroughs}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm whitespace-nowrap transition-all"
          >
            Reset All Tours
          </button>
        </div>
      </div>

      {/* Security & Logout Card */}
      <div className="bg-white rounded-3xl border border-brand-100 shadow-purple-sm p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Session & Security</h4>
            <p className="text-[11px] text-slate-400">Signed in securely via OTP authentication</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

