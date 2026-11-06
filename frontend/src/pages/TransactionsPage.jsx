import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  Download,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { ModuleTour } from '../components/walkthrough/ModuleTour';

export const TransactionsPage = ({ initialType = null }) => {
  const { user, setModuleTutorialDone } = useAuth();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type') || initialType;

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState(queryType || 'all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(!!queryType);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  // Form State for Add / Edit
  const [formType, setFormType] = useState('debit');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('General Expense');
  const [formReason, setFormReason] = useState('');
  const [formRefNumber, setFormRefNumber] = useState('');
  const [formFile, setFormFile] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Bank Statement Import State
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  // Standard category presets
  const categoriesList = [
    'Salary',
    'Consulting',
    'Investment',
    'Rental Income',
    'Home Loan',
    'Car Loan',
    'Bank Loan',
    'Gold Loan',
    'EMI',
    'Food & Dining',
    'Shopping',
    'Utilities',
    'Fuel & Travel',
    'Health & Medical',
    'Entertainment',
    'Subscription',
    'General Expense',
    'Other',
  ];

  const getCustomerKey = () => (user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10) || user?._id || user?.id || 'customer';

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter && categoryFilter !== 'All') params.category = categoryFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getTransactions(params);
      const key = getCustomerKey();

      if (res.success && Array.isArray(res.transactions)) {
        if (res.transactions.length > 0) {
          setTransactions(res.transactions);
          if (res.summary) setSummary(res.summary);
          localStorage.setItem(`rb_txns_${key}`, JSON.stringify(res.transactions));
          if (res.summary) localStorage.setItem(`rb_txns_sum_${key}`, JSON.stringify(res.summary));
        } else {
          // If server returned 0 records and no filters were applied, check if we have local cache
          const isFilterActive = (typeFilter && typeFilter !== 'all') || (categoryFilter && categoryFilter !== 'All') || search || startDate || endDate;
          const cached = localStorage.getItem(`rb_txns_${key}`);
          if (!isFilterActive && cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTransactions(parsed);
                const cachedSum = localStorage.getItem(`rb_txns_sum_${key}`);
                if (cachedSum) setSummary(JSON.parse(cachedSum));
                // Auto-sync cached transactions back to server if server was cold-started
                parsed.forEach((t) => {
                  api.createTransaction({
                    type: t.type,
                    amount: t.amount,
                    date: t.date,
                    category: t.category,
                    reason: t.reason,
                    referenceNumber: t.referenceNumber,
                  }).catch(() => {});
                });
                return;
              }
            } catch (e) {}
          }
          setTransactions([]);
          if (res.summary) setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
      const key = getCustomerKey();
      const cached = localStorage.getItem(`rb_txns_${key}`);
      if (cached) {
        try {
          setTransactions(JSON.parse(cached));
          const cachedSum = localStorage.getItem(`rb_txns_sum_${key}`);
          if (cachedSum) setSummary(JSON.parse(cachedSum));
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, search, startDate, endDate]);

  // First-time walkthrough trigger
  useEffect(() => {
    const rawId = user?._id || user?.id || '';
    const isDoneLocally = rawId && localStorage.getItem(`rb_tut_transactions_${rawId}`) === 'done';
    const isDoneServer = Boolean(user?.tutorialStatus?.transactions);

    if (user && !isDoneLocally && !isDoneServer && !loading) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user?.tutorialStatus?.transactions, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    const rawId = user?._id || user?.id || '';
    if (rawId) localStorage.setItem(`rb_tut_transactions_${rawId}`, 'done');
    setModuleTutorialDone('transactions');
  };

  const resetForm = () => {
    setFormType('debit');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('General Expense');
    setFormReason('');
    setFormRefNumber('');
    setFormFile(null);
    setFormError('');
    setIsEditing(false);
    setSelectedTxn(null);
  };

  const handleOpenAdd = (defaultType = 'debit') => {
    resetForm();
    setFormType(defaultType);
    setFormCategory(defaultType === 'credit' ? 'Salary' : 'General Expense');
    setShowAddModal(true);
  };

  const handleOpenEdit = (txn) => {
    setSelectedTxn(txn);
    setIsEditing(true);
    setFormType(txn.type);
    setFormAmount(String(txn.amount));
    setFormDate(new Date(txn.date).toISOString().split('T')[0]);
    setFormCategory(txn.category || 'General Expense');
    setFormReason(txn.reason || '');
    setFormRefNumber(txn.referenceNumber || '');
    setFormFile(null);
    setShowAddModal(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formAmount || isNaN(formAmount) || Number(formAmount) <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', formType);
      formData.append('amount', formAmount);
      formData.append('date', formDate);
      formData.append('category', formCategory);
      formData.append('reason', formReason);
      formData.append('referenceNumber', formRefNumber);
      if (formFile) {
        formData.append('attachment', formFile);
      }

      if (isEditing && selectedTxn) {
        await api.updateTransaction(selectedTxn._id, formData);
      } else {
        await api.createTransaction(formData);
      }

      setShowAddModal(false);
      resetForm();
      fetchTransactions();
    } catch (err) {
      setFormError(err.message || 'Failed to save transaction.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) {
      return;
    }
    try {
      await api.deleteTransaction(id);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    }
  };

  const handleUploadStatement = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a CSV or Excel file.');
      return;
    }

    setImportLoading(true);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('statement', importFile);
      const res = await api.importBankStatement(formData);
      setImportResult(res);
      fetchTransactions();
    } catch (err) {
      setImportError(err.message || 'Failed to parse statement.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "Date,Description,Reference Number,Credit,Debit\n" +
      "2026-11-01,Monthly Director Salary,NEFT-SAL-0199281,185000,\n" +
      "2026-11-02,HDFC Home Loan Auto Debit,ACH-DEBIT-99120,,32500\n" +
      "2026-11-03,Consulting Strategy Payout,UPI-CR-88291024,45000,\n" +
      "2026-11-04,TNEB Electricity Res,BBPS-ELEC-77182,,4200\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_bank_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const tourSteps = [
    {
      targetId: 'txn-add-btn',
      targetName: 'Add Transaction Button',
      title: 'Record Inflow or Outflow',
      description: 'Click here to log a Credit (Income) or Debit (Expense) with optional bill/receipt attachments and reference numbers.',
      placement: 'bottom',
    },
    {
      targetId: 'txn-import-btn',
      targetName: 'Bank Statement Import',
      title: 'Bulk Statement Import',
      description: 'Upload your bank statement in CSV or Excel format. Our parser extracts dates, amounts, and auto-categorizes entries.',
      placement: 'bottom',
    },
    {
      targetId: 'txn-type-filters',
      targetName: 'Type & Search Filters',
      title: 'Quick Filter Toggles',
      description: 'Switch between All, Income (Credit), and Expenses (Debit), or search by UTR reference and description.',
      placement: 'bottom',
    },
    {
      targetId: 'txn-table',
      targetName: 'Transactions Ledger',
      title: 'Digital Transaction Book',
      description: 'Inspect transaction details, view receipts, edit records, or delete entries at any time.',
      placement: 'top',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Interactive Tour */}
      <ModuleTour
        isOpen={showTour}
        onClose={handleFinishTour}
        onFinish={handleFinishTour}
        steps={tourSteps}
        moduleName="transactions"
      />

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Income & Expense Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage credits, debits, attach digital receipts, and import bank statements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Replay Tutorial Button */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            title="Replay Interactive Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Tour</span>
          </button>

          {/* Import Bank Statement Button */}
          <button
            id="txn-import-btn"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setImportError('');
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-brand-700 text-xs font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600" />
            <span>Import Statement</span>
          </button>

          {/* Add Transaction Button */}
          <button
            id="txn-add-btn"
            onClick={() => handleOpenAdd('debit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-xs font-bold shadow-purple-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Filtered Income (Credit)
            </span>
            <p className="text-xl font-black text-emerald-600 mt-1">
              +{formatCurrency(summary.totalCredit)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Filtered Expense (Debit)
            </span>
            <p className="text-xl font-black text-rose-600 mt-1">
              -{formatCurrency(summary.totalDebit)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Period Net Balance
            </span>
            <p className="text-xl font-black text-brand-700 mt-1">
              {formatCurrency(summary.netBalance)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-brand-100 shadow-purple-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type toggles */}
          <div id="txn-type-filters" className="inline-flex p-1 rounded-xl bg-brand-50/70 border border-brand-100">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-brand-800'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setTypeFilter('credit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'credit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Credit (Income)</span>
            </button>
            <button
              onClick={() => setTypeFilter('debit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'debit'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Debit (Expense)</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reason, category, or ref number..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
            />
          </div>
        </div>

        {/* Date and Category filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 ml-auto">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs"
            >
              <option value="All">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {(startDate || endDate || search || categoryFilter !== 'All' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setCategoryFilter('All');
                setTypeFilter('all');
              }}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div id="txn-table" className="bg-white rounded-3xl border border-brand-100 shadow-purple-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-50/80 border-b border-brand-100 text-[11px] font-bold text-brand-900 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description / Reason</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Paperclip className="w-10 h-10 mx-auto text-slate-200 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">No transaction records found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Add Transaction" or "Import Statement" to log your first record.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isCredit = txn.type === 'credit';
                  return (
                    <tr key={txn._id} className="hover:bg-brand-50/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {new Date(txn.date).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Type Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCredit ? 'Credit (Income)' : 'Debit (Expense)'}
                        </span>
                      </td>

                      {/* Reason / Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">
                          {txn.reason || txn.category}
                        </p>
                        {txn.source && txn.source !== 'manual' && (
                          <span className="text-[10px] text-slate-400 italic">
                            via {txn.source === 'bank_import' ? 'Bank Statement' : 'Recurring Auto-Pay'}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700 font-medium text-[11px] border border-brand-100">
                          {txn.category || 'General'}
                        </span>
                      </td>

                      {/* Ref Number */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {txn.referenceNumber || '-'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-sm whitespace-nowrap">
                        <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                          {isCredit ? '+' : '-'}
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>

                      {/* Receipt File */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {txn.attachmentUrl ? (
                          <a
                            href={txn.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-semibold border border-brand-200 transition-colors"
                            title={txn.attachmentName || 'View attached receipt'}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Receipt</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTxn(txn);
                              setShowViewModal(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(txn._id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add / Edit Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
                  </h3>
                  <p className="text-xs text-brand-100">Credit (Income) or Debit (Expense)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type selector toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('credit');
                      if (formCategory === 'General Expense') setFormCategory('Salary');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formType === 'credit'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Credit (Income)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('debit');
                      if (formCategory === 'Salary') setFormCategory('General Expense');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formType === 'debit'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Debit (Expense)</span>
                  </button>
                </div>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Reason (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason / Description (Optional)
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Monthly rent, Client fee, Grocery purchase"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              {/* Reference Number (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reference / UTR / Check # (Optional)
                </label>
                <input
                  type="text"
                  value={formRefNumber}
                  onChange={(e) => setFormRefNumber(e.target.value)}
                  placeholder="e.g. UTR-881920042, CHQ-0012"
                  className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              {/* File Attachment (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  File Attachment / Receipt (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer p-3 rounded-xl border border-dashed border-brand-300 hover:border-brand-500 bg-brand-50/40 text-center text-xs text-brand-700 transition-colors">
                    <span className="font-semibold">
                      {formFile ? formFile.name : 'Choose invoice / receipt (PDF, JPG, PNG)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => setFormFile(e.target.files[0] || null)}
                    />
                  </label>
                  {formFile && (
                    <button
                      type="button"
                      onClick={() => setFormFile(null)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl shadow-purple-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : isEditing ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Import Bank Statement */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Bank Statement</h3>
                  <p className="text-xs text-brand-100">Upload official CSV or Excel statement</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{importResult.message}</span>
                  </div>
                  <p className="text-emerald-700">
                    {importResult.count} transactions parsed and inserted into your account ledger!
                  </p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900">Supported Formats</span>
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample CSV
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upload CSV, XLSX, or XLS files. The parser automatically detects columns like Date, Description, Debit, Credit, and Reference number.
                </p>
              </div>

              {/* File Dropzone */}
              <label className="border-2 border-dashed border-brand-300 hover:border-brand-600 bg-brand-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <UploadCloud className="w-10 h-10 text-brand-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-800">
                  {importFile ? importFile.name : 'Click to select statement file'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">CSV, XLSX or XLS up to 10MB</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    setImportFile(e.target.files[0] || null);
                    setImportResult(null);
                    setImportError('');
                  }}
                />
              </label>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={handleUploadStatement}
                  disabled={!importFile || importLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl shadow-purple-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {importLoading ? (
                    <span>Parsing statement...</span>
                  ) : (
                    <>
                      <span>Import Records</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: View Transaction Details */}
      {showViewModal && selectedTxn && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Transaction Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center p-4 rounded-2xl bg-brand-50 border border-brand-100">
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedTxn.type === 'credit'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedTxn.type === 'credit' ? 'Credit (Income)' : 'Debit (Expense)'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  {formatCurrency(selectedTxn.amount)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTxn.category}</p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedTxn.date).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedTxn.referenceNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Description:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-xs">
                    {selectedTxn.reason || 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Source:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedTxn.source || 'manual'}
                  </span>
                </div>
              </div>

              {/* Receipt Attachment Viewer */}
              {selectedTxn.attachmentUrl && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                      Attachment Receipt
                    </span>
                    <a
                      href={selectedTxn.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-700 hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {/* Image preview if image */}
                  {selectedTxn.attachmentUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
                    <img
                      src={selectedTxn.attachmentUrl}
                      alt="Receipt Attachment"
                      className="max-h-48 w-full object-cover rounded-xl border border-slate-200 mt-1"
                    />
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

