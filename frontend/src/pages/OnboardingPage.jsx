import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Landmark,
  CreditCard,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export const OnboardingPage = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name (Required).');
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      });

      // Persist permanently in browser so this customer never sees onboarding again!
      const cleanPhone = (user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone) {
        localStorage.setItem(`rb_customer_onboarded_${cleanPhone}`, 'true');
        localStorage.setItem(`rb_customer_name_${cleanPhone}`, name.trim());
        if (bankName.trim()) localStorage.setItem(`rb_customer_bank_${cleanPhone}`, bankName.trim());
        if (accountNumber.trim()) localStorage.setItem(`rb_customer_acc_${cleanPhone}`, accountNumber.trim());
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A855F7', '#EC4899', '#10B981'],
        });
      } catch (e) {
        /* ignore */
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Onboarding welcome badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-200 text-xs font-semibold mb-3 backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>Welcome to Payment Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Complete Customer Onboarding
          </h1>
          <p className="mt-1 text-xs text-brand-300 font-semibold tracking-wide">
            Every Rupee Matters
          </p>
          <p className="mt-1 text-sm text-brand-200">
            Tell us a bit about yourself to personalize your payment and loan ledger.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-brand-100">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Name (Required) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Customer Full Name</span>
                <span className="text-[10px] text-brand-700 font-extrabold uppercase">Required</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Balasubramanian"
                  className="w-full pl-10 pr-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                />
              </div>
            </div>

            {/* 2. Phone Number (Auto-filled from login, locked) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Filled
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.phoneNumber ? `+91 ${user.phoneNumber}` : ''}
                  className="w-full pl-10 pr-4 py-3 text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. Bank Name (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Primary Bank Name</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Landmark className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                />
              </div>
            </div>

            {/* 4. Account Number (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Bank Account Number</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50100492817291"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-bold rounded-xl shadow-purple-md hover:shadow-purple-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Setting up your workspace...</span>
              ) : (
                <>
                  <span>Save Profile & Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Bank details are encrypted and securely stored.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-brand-200">
          poweredBy <span className="font-extrabold text-white">RB NextWave</span>
        </div>
      </div>
    </div>
  );
};

