import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Lock,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Settings,
  X,
  ExternalLink,
  KeyRound,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  setupRecaptcha,
  signInWithPhoneNumber,
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
} from '../config/firebase';

export const AuthPage = ({ onAuthSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [receivedOtpDemo, setReceivedOtpDemo] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [fbConfigStatus, setFbConfigStatus] = useState(isFirebaseConfigured());
  const [configSuccess, setConfigSuccess] = useState('');

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
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth();
        const appVerifier = setupRecaptcha('recaptcha-container');
        const formattedPhone = '+91' + clean.slice(-10);
        console.log('[Firebase] Sending Real SMS OTP via Google Cloud to:', formattedPhone);
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setSuccessMsg(`Google Firebase Real SMS OTP sent to ${formattedPhone}! Please check your SMS.`);
      } else {
        const res = await api.sendOtp(clean);
        setSuccessMsg(res.message || 'OTP generated successfully!');
        if (res.otp) {
          setReceivedOtpDemo(res.otp);
        }
      }
      setPhoneNumber(clean);
      setStep('otp');
      setTimer(60);
    } catch (err) {
      console.error('[Send OTP Error]:', err);
      // Fallback to server/demo OTP if Firebase had any credential or origin error
      try {
        const res = await api.sendOtp(clean);
        setSuccessMsg('Sent via fallback: ' + (res.message || 'Use OTP below'));
        if (res.otp) setReceivedOtpDemo(res.otp);
        setPhoneNumber(clean);
        setStep('otp');
        setTimer(60);
        return;
      } catch (e) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulVerification = (res, rawPhone) => {
    const cleanPhone = (res.user?.phoneNumber || rawPhone || phoneNumber).replace(/[^0-9]/g, '').slice(-10);
    const hasCustomName = Boolean(
      res.user?.name &&
      res.user.name.trim() !== '' &&
      !res.user.name.startsWith('Customer ') &&
      res.user.name !== 'Customer'
    );

    const isAlreadyOnboarded = Boolean(res.user?.isOnboarded === true || hasCustomName);

    const finalUser = {
      ...res.user,
      name: res.user?.name || `Customer ${cleanPhone.slice(-4)}`,
      isOnboarded: isAlreadyOnboarded,
    };

    login(res.token, finalUser);
    if (onAuthSuccess) {
      onAuthSuccess(!isAlreadyOnboarded);
    } else {
      navigate(isAlreadyOnboarded ? '/dashboard' : '/onboarding');
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
      if (confirmationResult) {
        // Verify via Google Firebase
        const result = await confirmationResult.confirm(otp.trim());
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();
        const res = await api.firebaseLogin({
          phoneNumber: fbUser.phoneNumber || phoneNumber,
          idToken,
          uid: fbUser.uid,
        });
        handleSuccessfulVerification(res, fbUser.phoneNumber || phoneNumber);
      } else {
        // Verify via Server API
        const res = await api.verifyOtp(phoneNumber, otp.trim());
        handleSuccessfulVerification(res, phoneNumber);
      }
    } catch (err) {
      console.error('[Verify OTP Error]:', err);
      // If Firebase code fails or user used master test code 123456
      if (otp.trim() === '123456') {
        try {
          const res = await api.verifyOtp(phoneNumber, '123456');
          handleSuccessfulVerification(res, phoneNumber);
          return;
        } catch (e) {}
      }
      setError(err.message || 'Verification failed. Please check the OTP code.');
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

  // Helper to parse pasted Firebase configuration
  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    setConfigSuccess('');
    setError('');

    try {
      let configObj = null;

      // Check if raw JSON
      try {
        configObj = JSON.parse(rawConfigInput.trim());
      } catch (jsonErr) {
        // Regex extraction if user pasted a JS snippet: const firebaseConfig = { ... }
        const apiKey = rawConfigInput.match(/apiKey:\s*["']([^"']+)["']/)?.[1];
        const authDomain = rawConfigInput.match(/authDomain:\s*["']([^"']+)["']/)?.[1];
        const projectId = rawConfigInput.match(/projectId:\s*["']([^"']+)["']/)?.[1];
        const storageBucket = rawConfigInput.match(/storageBucket:\s*["']([^"']+)["']/)?.[1];
        const messagingSenderId = rawConfigInput.match(/messagingSenderId:\s*["']([^"']+)["']/)?.[1];
        const appId = rawConfigInput.match(/appId:\s*["']([^"']+)["']/)?.[1];

        if (apiKey && projectId) {
          configObj = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
        }
      }

      if (!configObj || !configObj.apiKey || !configObj.projectId) {
        throw new Error('Could not parse Firebase keys. Please ensure "apiKey" and "projectId" are present.');
      }

      saveFirebaseConfig(configObj);
      setFbConfigStatus(true);
      setConfigSuccess('Firebase configuration saved successfully! Real SMS (10,000/month) is now ACTIVE.');
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetFirebaseConfig = () => {
    clearFirebaseConfig();
    setFbConfigStatus(false);
    setRawConfigInput('');
    setConfigSuccess('Firebase configuration cleared. Reverted to standard OTP mode.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background purple radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/25 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-purple-glow mb-3 p-1 overflow-hidden">
            <img
              src="/logo-icon.png"
              alt="Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Payment Management
          </h1>
          <p className="mt-1 text-sm text-brand-200 font-bold tracking-wide">
            Every Rupee Matters
          </p>
          <p className="mt-0.5 text-xs text-brand-300">
            Secure, intelligent income, expenses & recurring loan tracking
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-brand-100 relative">
          
          {/* Top Bar: Demo Mode + Firebase Option 2 Badge */}
          <div className="mb-5 space-y-2">
            <div className="p-2.5 rounded-2xl bg-brand-50/80 border border-brand-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-brand-900">1-Click Demo Account</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-xl transition-all shadow-sm"
              >
                Try Demo
              </button>
            </div>

            {/* Option 2: Firebase Phone Auth Pill */}
            <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <div className="text-left">
                  <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    Option 2: Real SMS
                    {fbConfigStatus ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        10k Free SMS Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                        Firebase Free Tier
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-700/90">
                    {fbConfigStatus ? 'Sends real SMS via Google' : 'Click setup to add 10,000 free SMS/mo'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>{fbConfigStatus ? 'Manage' : 'Setup'}</span>
              </button>
            </div>
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
              <div className="mb-5">
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
                    placeholder="Enter 10-digit number (e.g. 6379976620)"
                    className="w-full pl-16 pr-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>We'll send a 6-digit OTP code to verify your account.</span>
                  {fbConfigStatus && (
                    <span className="text-emerald-600 font-medium">Real SMS Enabled</span>
                  )}
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

              {/* Invisible Google reCAPTCHA container for Firebase Phone Auth */}
              <div id="recaptcha-container"></div>
            </div>
          ) : (
            <div>
              <div className="mb-5">
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
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit encrypted bank-grade authentication</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-brand-200">
          poweredBy <span className="font-extrabold text-white">RB NextWave</span>
        </div>
      </div>

      {/* FIREBASE OPTION 2 SETUP MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Option 2: Google Firebase Real SMS
                  </h3>
                  <p className="text-xs text-slate-500">
                    10,000 real SMS OTPs free every month forever
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status */}
            <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Status:</span>
              {fbConfigStatus ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active (10,000 SMS/mo)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Demo Mode (Not Configured)
                </span>
              )}
            </div>

            {configSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configSuccess}</span>
              </div>
            )}

            {/* How to get free keys instructions */}
            <div className="mb-4 p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 text-xs space-y-1.5 text-slate-700">
              <div className="font-bold text-brand-900 flex items-center justify-between">
                <span>3 Quick Steps to Get Free SMS:</span>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline flex items-center gap-1"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Create a free project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">console.firebase.google.com</a>.</li>
                <li>Go to <strong>Authentication &rarr; Sign-in method</strong> &rarr; Enable <strong>Phone</strong>.</li>
                <li>Go to <strong>Project Settings (gear icon) &rarr; General</strong> &rarr; Scroll down to <strong>Your apps</strong> &rarr; click Web <strong>(&lt;/&gt;)</strong> &rarr; copy the config object below.</li>
              </ol>
            </div>

            {/* Paste Config Input Form */}
            <form onSubmit={handleSaveFirebaseConfig}>
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Paste Firebase Config Snippet or JSON:
                </label>
                <textarea
                  rows={6}
                  value={rawConfigInput}
                  onChange={(e) => setRawConfigInput(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "your-app.firebaseapp.com",\n  projectId: "your-project",\n  storageBucket: "your-app.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                {fbConfigStatus && (
                  <button
                    type="button"
                    onClick={handleResetFirebaseConfig}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    Clear Config
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-purple-sm transition-all"
                >
                  Save & Activate Real SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
