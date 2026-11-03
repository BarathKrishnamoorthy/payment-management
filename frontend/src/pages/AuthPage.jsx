import React, { useState, useEffect } from 'react';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Lock,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({ onAuthSuccess }) => {
  const { login } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [receivedOtpDemo, setReceivedOtpDemo] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (phoneToUse = phoneNumber) => {
    setError('');
    setSuccessMsg('');

    const clean = phoneToUse.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(clean);
      setSuccessMsg(res.message || 'OTP sent successfully!');
      if (res.otp) {
        setReceivedOtpDemo(res.otp);
      }
      setPhoneNumber(clean);
      setStep('otp');
      setTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phoneNumber, otp.trim());
      login(res.token, res.user);
      if (onAuthSuccess) {
        onAuthSuccess(res.isFirstTime);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setPhoneNumber('9876543210');
    handleSendOtp('9876543210');
  };

  const handleAutoFillOtp = () => {
    if (receivedOtpDemo) {
      setOtp(receivedOtpDemo);
    } else {
      setOtp('123456');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background purple radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/25 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-purple-glow mb-4">
            <Wallet className="w-8 h-8 text-brand-700" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            RB Payment Management
          </h1>
          <p className="mt-2 text-sm text-brand-200">
            Secure, intelligent income, expenses & recurring loan tracking
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-brand-100 relative">
          {/* Quick Demo Mode Badge */}
          <div className="mb-6 p-3 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-brand-900">1-Click Demo Account</span>
            </div>
            <button
              onClick={handleQuickDemo}
              className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-xl transition-all shadow-sm"
            >
              Try Demo
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div>
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 border-r border-slate-200 pr-2">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 10-digit number (e.g. 9876543210)"
                    className="w-full pl-16 pr-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  We'll send a 6-digit OTP code to verify your account securely.
                </p>
              </div>

              <button
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-bold rounded-xl shadow-purple-md hover:shadow-purple-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    6-Digit Verification Code
                  </label>
                  <button
                    onClick={() => setStep('phone')}
                    className="text-xs text-brand-600 hover:underline font-medium"
                  >
                    Change Number
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  />
                </div>

                {/* Demo OTP Helper banner */}
                <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                  <span className="text-purple-900 font-medium">
                    Demo OTP: <strong className="text-brand-700 font-bold">{receivedOtpDemo || '123456'}</strong>
                  </span>
                  <button
                    onClick={handleAutoFillOtp}
                    className="text-brand-700 hover:text-brand-900 font-bold text-xs underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-bold rounded-xl shadow-purple-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                {timer > 0 ? (
                  <p className="text-xs text-slate-400">
                    Resend code in <span className="font-semibold text-brand-600">{timer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => handleSendOtp()}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security note footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit encrypted authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

