import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminApi } from '../../services/adminApi';

export const AdminLoginPage = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [demoResetToken, setDemoResetToken] = useState('');

  // Reset Password Inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!email.trim() || !password) {
      setError('Please provide your admin email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@erm.com');
    setPassword('Admin@123456');
    setError('');
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your administrator email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await adminApi.forgotPassword(forgotEmail.trim());
      setForgotMsg(res.message || 'Reset link dispatched.');
      if (res.demoResetToken) {
        setDemoResetToken(res.demoResetToken);
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleApplyReset = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setResettingPassword(true);
    try {
      const res = await adminApi.resetPassword({
        email: forgotEmail.trim(),
        token: demoResetToken,
        newPassword,
      });
      setMsg(res.message || 'Password reset successfully! Please sign in.');
      setShowForgotModal(false);
      setPassword(newPassword);
      setEmail(forgotEmail);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#2E1065] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background radial glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-500/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo Emblem & Heading */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white p-2 flex items-center justify-center mb-4 shadow-purple-lg border border-white/40">
            <img
              src="/logo-icon.png"
              alt="ERM Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-brand-100 text-[11px] font-bold tracking-wider uppercase backdrop-blur mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
            <span>Authorized Personnel Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ERM Admin Portal
          </h1>
          <p className="mt-1 text-xs text-brand-200 font-semibold tracking-wide">
            Every Rupee Matters • Centralized Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-brand-100 relative">
          
          {/* Quick Demo Pre-Fill Banner */}
          <div className="mb-5 p-3 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-700" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Super Admin Demo</p>
                <p className="text-[10px] text-slate-500">admin@erm.com</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 px-3 py-1.5 rounded-xl transition-all shadow-purple-xs"
            >
              Fill Credentials
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {msg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@erm.com"
                  className="w-full pl-10 pr-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-brand-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-700 to-purple-600 hover:from-brand-800 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-purple-md hover:shadow-purple-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Administrator...</span>
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Customer Portal */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Not an administrator?{' '}
              <a
                href="/login"
                className="font-bold text-brand-700 hover:underline"
              >
                Go to Customer Login &rarr;
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-brand-200 font-medium">
          poweredBy <span className="font-extrabold text-white">RB NextWave</span>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-brand-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin Password Recovery</h3>
                <p className="text-xs text-slate-500">Reset your administrator access credentials</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {!demoResetToken ? (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@erm.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Processing...' : 'Generate Reset Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleApplyReset} className="space-y-3">
                <p className="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-medium">
                  Verified Reset Session for <strong>{forgotEmail}</strong>. Enter new password below.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {resettingPassword ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
