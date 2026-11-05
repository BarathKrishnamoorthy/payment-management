import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  CreditCard,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Smartphone,
  Eye,
  EyeOff,
  History,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AccountsPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Add Account form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('savings');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Transfer form
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getAccounts();
      if (res && res.success) {
        setAccounts(res.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!accName.trim()) {
      setFormError('Account name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createAccount({
        accountName: accName.trim(),
        accountType: accType,
        bankName: bankName.trim(),
        accountNumber: accNumber.trim(),
        openingBalance: Number(openingBalance) || 0,
        isDefault,
      });

      setShowAddModal(false);
      setAccName('');
      setBankName('');
      setAccNumber('');
      setOpeningBalance('');
      setIsDefault(false);
      fetchAccounts();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setFormError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');

    const amt = Number(transferAmount);
    if (!fromAccId || !toAccId || !amt || amt <= 0) {
      setTransferError('Please select both accounts and enter a valid positive transfer amount.');
      return;
    }

    if (fromAccId === toAccId) {
      setTransferError('Source and destination accounts must be different.');
      return;
    }

    try {
      setTransferring(true);
      await api.transferBetweenAccounts({
        fromAccountId: fromAccId,
        toAccountId: toAccId,
        amount: amt,
        notes: transferNotes.trim(),
      });

      setShowTransferModal(false);
      setTransferAmount('');
      setTransferNotes('');
      fetchAccounts();

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#7C3AED', '#10B981'] });
      } catch (e) {}
    } catch (err) {
      setTransferError(err.message || 'Failed to complete transfer.');
    } finally {
      setTransferring(false);
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'savings':
      case 'current':
        return <Landmark className="w-5 h-5 text-brand-600" />;
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'upi':
      case 'wallet':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-8 bg-brand-600 rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bank Accounts & Wallets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage multi-bank balances, cash wallets, and seamless account-to-account transfers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 text-brand-700 hover:bg-purple-100 font-bold text-xs transition-all border border-purple-200 shadow-2xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-purple-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-brand-200 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              Total Net Liquid Balance
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-brand-300 mt-1">
              Combined balance across {accounts.length} active account{accounts.length === 1 ? '' : 's'} & wallets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <span className="text-[11px] text-brand-200 block">Bank Accounts</span>
              <span className="text-lg font-bold text-white">
                {accounts.filter((a) => ['savings', 'current'].includes(a.accountType)).length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <span className="text-[11px] text-brand-200 block">Cash & UPI</span>
              <span className="text-lg font-bold text-white">
                {accounts.filter((a) => ['cash', 'upi', 'wallet'].includes(a.accountType)).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-2xs">
          <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No accounts added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Add your primary savings bank, current account, or cash wallet to start tracking accurate balances.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-sm"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className="bg-white rounded-3xl border border-purple-100/80 p-5 shadow-2xs hover:shadow-purple-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      {getAccountIcon(acc.accountType)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {acc.accountName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                        {acc.bankName || acc.accountType} {acc.accountNumberLast4 ? `(•••• ${acc.accountNumberLast4})` : ''}
                      </p>
                    </div>
                  </div>

                  {acc.isDefault && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                      Default
                    </span>
                  )}
                </div>

                <div className="my-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Current Balance</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span className="capitalize">{acc.accountType} account</span>
                <button
                  onClick={() => {
                    setFromAccId(acc._id);
                    setShowTransferModal(true);
                  }}
                  className="font-bold text-brand-600 hover:text-brand-800 transition-colors"
                >
                  Transfer Out →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Bank Account / Wallet</h3>
                  <p className="text-xs text-slate-500">Track balance and account transactions</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Display Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Salary Account, Cash Wallet"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="upi">UPI / Digital Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC, SBI, ICICI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 501004928172"
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-600 font-medium">Set as default account for transactions</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Transfer Funds Between Accounts</h3>
                  <p className="text-xs text-slate-500">Excluded from income and expense calculations</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From Account (Source)</label>
                <select
                  value={fromAccId}
                  onChange={(e) => setFromAccId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  required
                >
                  <option value="">Select source account...</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.accountName} (Balance: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To Account (Destination)</label>
                <select
                  value={toAccId}
                  onChange={(e) => setToAccId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  required
                >
                  <option value="">Select destination account...</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.accountName} (Balance: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Note / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ATM cash withdrawal, self transfer"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-sm disabled:opacity-50"
                >
                  {transferring ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
