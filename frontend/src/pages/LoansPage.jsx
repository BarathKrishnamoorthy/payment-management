import React, { useState, useEffect } from 'react';
import {
  Handshake,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Phone,
  Clock,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoansPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({
    totalBorrowed: 0,
    totalLent: 0,
    outstandingBorrowed: 0,
    outstandingLent: 0,
    netPosition: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lent' | 'borrowed'

  // Add Loan Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [loanType, setLoanType] = useState('lent'); // 'lent' (I gave money) or 'borrowed' (I took money)
  const [personName, setPersonName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [principal, setPrincipal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [notes, setNotes] = useState('');
  const [savingLoan, setSavingLoan] = useState(false);
  const [formError, setFormError] = useState('');

  // Repayment Modal state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.getLoans();
      if (res && res.success) {
        setLoans(res.loans || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setFormError('');

    const amount = Number(principal);
    if (!personName.trim()) {
      setFormError('Please enter person or organization name.');
      return;
    }
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid principal amount.');
      return;
    }

    try {
      setSavingLoan(true);
      await api.createLoan({
        personName: personName.trim(),
        mobileNumber: mobileNumber.trim(),
        type: loanType,
        principal: amount,
        interestRate: Number(interestRate) || 0,
        dueDate: dueDate || null,
        notes: notes.trim(),
      });

      setShowAddModal(false);
      setPersonName('');
      setMobileNumber('');
      setPrincipal('');
      setDueDate('');
      setInterestRate('');
      setNotes('');
      fetchLoans();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setFormError(err.message || 'Failed to save loan record.');
    } finally {
      setSavingLoan(false);
    }
  };

  const handleRepayment = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const amount = Number(repayAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }
    if (amount > selectedLoan.outstanding) {
      alert(`Repayment amount cannot exceed outstanding balance of ₹${selectedLoan.outstanding.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setSubmittingRepay(true);
      await api.addLoanRepayment(selectedLoan._id, {
        amount,
        notes: repayNotes.trim(),
      });

      setSelectedLoan(null);
      setRepayAmount('');
      setRepayNotes('');
      fetchLoans();

      if (amount === selectedLoan.outstanding) {
        try {
          confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
        } catch (e) {}
      }
    } catch (err) {
      alert(err.message || 'Failed to record repayment.');
    } finally {
      setSubmittingRepay(false);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;
    try {
      await api.deleteLoan(loanId);
      fetchLoans();
    } catch (err) {
      alert(err.message || 'Failed to delete loan record.');
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (filterType === 'all') return true;
    return l.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#63278D] via-[#7138B8] to-[#8B48DE] p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-purple-100 mb-3 border border-white/20">
              <Handshake className="w-3.5 h-3.5" />
              <span>Borrowing & Lending Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Borrow & Lend Tracker
            </h1>
            <p className="text-sm text-purple-100 mt-1 max-w-xl">
              Track money lent to friends, relatives, or colleagues and keep tab of loans borrowed with automatic settlement updates.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#63278D] font-black text-sm hover:bg-purple-50 transition-all shadow-lg shadow-purple-950/20 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record New Loan / Debt</span>
          </button>
        </div>

        {/* 2. Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 pt-6 border-t border-white/15">
          {/* Net Debt Position */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span>Net Position</span>
              {summary.netPosition >= 0 ? (
                <span className="flex items-center text-emerald-300 font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" /> To Receive
                </span>
              ) : (
                <span className="flex items-center text-amber-300 font-bold">
                  <TrendingDown className="w-3 h-3 mr-1" /> You Owe
                </span>
              )}
            </div>
            <p className="text-2xl font-black mt-1">
              ₹{Math.abs(summary.netPosition).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-purple-200/80 mt-1">
              {summary.netPosition >= 0 ? 'Others owe you in total' : 'You owe others overall'}
            </p>
          </div>

          {/* Money Lent (To Collect) */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                Money Lent (To Collect)
              </span>
              <span className="text-emerald-300 font-bold">Active</span>
            </div>
            <p className="text-2xl font-black mt-1 text-emerald-300">
              ₹{summary.outstandingLent.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-purple-200/80 mt-1">
              Total lent: ₹{summary.totalLent.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Money Borrowed (To Repay) */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span className="flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-300" />
                Money Borrowed (To Repay)
              </span>
              <span className="text-amber-300 font-bold">Pending</span>
            </div>
            <p className="text-2xl font-black mt-1 text-amber-300">
              ₹{summary.outstandingBorrowed.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-purple-200/80 mt-1">
              Total borrowed: ₹{summary.totalBorrowed.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-white border border-purple-100 rounded-2xl w-fit shadow-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterType === 'all'
                ? 'bg-[#7138B8] text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            All Records ({loans.length})
          </button>
          <button
            onClick={() => setFilterType('lent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterType === 'lent'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Money Lent ({loans.filter((l) => l.type === 'lent').length})</span>
          </button>
          <button
            onClick={() => setFilterType('borrowed')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterType === 'borrowed'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Money Borrowed ({loans.filter((l) => l.type === 'borrowed').length})</span>
          </button>
        </div>
      </div>

      {/* 4. Loans Grid & Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 mt-3">Loading loans & debt ledger...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <Handshake className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No loan records found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {filterType === 'all'
              ? 'You have not added any borrowing or lending records yet. Add a record to keep track of amounts, due dates, and partial repayments.'
              : `No ${filterType === 'lent' ? 'money lent' : 'money borrowed'} records in this view.`}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7138B8] text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-purple-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => {
            const isLent = loan.type === 'lent';
            const repaidAmount = (loan.principal || 0) - (loan.outstanding || 0);
            const repaidPercent = Math.min(
              100,
              Math.round(((loan.principal - loan.outstanding) / (loan.principal || 1)) * 100)
            );
            const isFullyRepaid = loan.status === 'repaid' || loan.outstanding <= 0;
            const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && !isFullyRepaid;

            return (
              <div
                key={loan._id}
                className="bg-white rounded-2xl border border-purple-100/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                        isLent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isLent ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Money Lent</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Money Borrowed</span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isFullyRepaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          <Check className="w-3 h-3 stroke-[3]" /> Repaid
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteLoan(loan._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Person Details */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-black text-sm shrink-0">
                      {(loan.personName?.charAt(0) || 'P').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {loan.personName}
                      </h4>
                      {loan.mobileNumber && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {loan.mobileNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Outstanding:</span>
                      <span className={`font-black text-sm ${isLent ? 'text-emerald-700' : 'text-amber-700'}`}>
                        ₹{Number(loan.outstanding || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Original Principal:</span>
                      <span className="font-semibold text-slate-700">
                        ₹{Number(loan.principal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Repayment Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-500">Repayment Progress</span>
                      <span className="text-slate-800">{repaidPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFullyRepaid ? 'bg-emerald-500' : 'bg-[#7138B8]'
                        }`}
                        style={{ width: `${repaidPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates & Notes */}
                  {loan.dueDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>Due: {new Date(loan.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}

                  {loan.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-purple-50/40 p-2 rounded-lg border border-purple-100/50 line-clamp-2 mb-3">
                      "{loan.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-purple-50 mt-2">
                  {!isFullyRepaid ? (
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setRepayAmount(loan.outstanding);
                        setRepayNotes('');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7138B8] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Repayment</span>
                    </button>
                  ) : (
                    <div className="text-center py-1 text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD LOAN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7138B8] flex items-center justify-center font-bold">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Record Borrow / Lend</h3>
                  <p className="text-xs text-slate-500">Track loans between friends, family, or lenders</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
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

            <form onSubmit={handleCreateLoan} className="space-y-4 mt-5">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanType('lent')}
                    className={`py-3 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-2 transition-all ${
                      loanType === 'lent'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>I Lent Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType('borrowed')}
                    className={`py-3 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-2 transition-all ${
                      loanType === 'borrowed'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                    <span>I Borrowed Money</span>
                  </button>
                </div>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {loanType === 'lent' ? 'Borrower Name (Who took money)' : 'Lender Name (Who gave money)'} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar / ABC Finance"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  required
                />
              </div>

              {/* Mobile Number & Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Principal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 15000"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Due Date & Interest */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Target Return Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0 if zero interest"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. For festival shopping, emergency laptop repair..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLoan}
                  className="px-5 py-2.5 rounded-xl bg-[#7138B8] hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-purple-sm disabled:opacity-50"
                >
                  {savingLoan ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RECORD REPAYMENT MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Record Repayment</h3>
                <p className="text-xs text-slate-500">
                  {selectedLoan.type === 'lent' ? 'Received from' : 'Paid to'} {selectedLoan.personName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs flex justify-between items-center">
              <span className="text-slate-600">Current Outstanding:</span>
              <span className="font-black text-purple-900 text-sm">
                ₹{Number(selectedLoan.outstanding).toLocaleString('en-IN')}
              </span>
            </div>

            <form onSubmit={handleRepayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Repayment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedLoan.outstanding}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Payment Reference / Mode
                </label>
                <input
                  type="text"
                  placeholder="e.g. GPay UPI transfer, Cash repayment"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRepay}
                  className="px-5 py-2.5 rounded-xl bg-[#7138B8] hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-purple-sm disabled:opacity-50"
                >
                  {submittingRepay ? 'Recording...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoansPage;

