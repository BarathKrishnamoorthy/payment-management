import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  PlusCircle,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  X,
  History,
  ShieldCheck,
  Home,
  Car,
  Coins,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { ModuleTour } from '../components/walkthrough/ModuleTour';

export const RecurringPage = () => {
  const { user, setModuleTutorialDone } = useAuth();
  const [searchParams] = useSearchParams();

  const [recurringList, setRecurringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('EMI');
  const [formRecurrenceType, setFormRecurrenceType] = useState('Monthly');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formAutoDebit, setFormAutoDebit] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 6 Required categories
  const paymentCategories = [
    'EMI',
    'Bank Loan',
    'Subscription',
    'Gold Loan',
    'Home Loan',
    'Car Loan',
  ];

  const recurrenceTypes = ['Daily', 'Monthly', 'Quarterly', 'Yearly'];

  // Fetch recurring list
  const getCustomerKey = () => (user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10) || user?._id || user?.id || 'customer';

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.paymentType = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await api.getRecurringPayments(params);
      const key = getCustomerKey();

      if (res && res.success && Array.isArray(res.recurringPayments)) {
        if (res.recurringPayments.length > 0) {
          setRecurringList(res.recurringPayments);
          localStorage.setItem(`rb_rec_${key}`, JSON.stringify(res.recurringPayments));
        } else {
          const isFilterActive = categoryFilter !== 'All' || statusFilter !== 'All';
          const cached = localStorage.getItem(`rb_rec_${key}`);
          if (!isFilterActive && cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setRecurringList(parsed);
                // Resync cached recurring records to server if server was cold-started
                parsed.forEach((r) => {
                  api.createRecurringPayment({
                    title: r.title,
                    amount: r.amount,
                    paymentType: r.paymentType,
                    recurrenceType: r.recurrenceType,
                    dueDate: r.dueDate,
                    reminderDays: r.reminderDays,
                    reason: r.reason,
                    autoCreateDebit: r.autoCreateDebit,
                  }).catch(() => {});
                });
                return;
              }
            } catch (e) {}
          }
          setRecurringList([]);
        }
      }
    } catch (err) {
      console.error('Fetch recurring error:', err);
      const key = getCustomerKey();
      const cached = localStorage.getItem(`rb_rec_${key}`);
      if (cached) {
        try {
          setRecurringList(JSON.parse(cached));
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, [categoryFilter, statusFilter]);

  // First-time walkthrough
  useEffect(() => {
    const rawId = user?._id || user?.id || '';
    const isDoneLocally = rawId && localStorage.getItem(`rb_tut_recurring_${rawId}`) === 'done';
    const isDoneServer = Boolean(user?.tutorialStatus?.recurring);

    if (user && !isDoneLocally && !isDoneServer && !loading) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user?.tutorialStatus?.recurring, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    const rawId = user?._id || user?.id || '';
    if (rawId) localStorage.setItem(`rb_tut_recurring_${rawId}`, 'done');
    setModuleTutorialDone('recurring');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormPaymentType('EMI');
    setFormRecurrenceType('Monthly');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormReason('');
    setFormAutoDebit(true);
    setFormError('');
    setIsEditing(false);
    setSelectedItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsEditing(true);
    setFormTitle(item.title || '');
    setFormPaymentType(item.paymentType || 'EMI');
    setFormRecurrenceType(item.recurrenceType || 'Monthly');

    // Safe date parsing to prevent RangeError
    const rawDate = item.nextDueDate || item.dueDate;
    let formattedDate = new Date().toISOString().split('T')[0];
    if (rawDate) {
      try {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          formattedDate = parsed.toISOString().split('T')[0];
        }
      } catch (e) {}
    }
    setFormDueDate(formattedDate);
    setFormAmount(item.amount !== undefined ? String(item.amount) : '');
    setFormReason(item.reason || '');
    setFormAutoDebit(item.autoCreateDebit !== false);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Title is required (e.g. HDFC Home Loan EMI).');
      return;
    }

    if (!formAmount || isNaN(formAmount) || Number(formAmount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        paymentType: formPaymentType,
        recurrenceType: formRecurrenceType,
        dueDate: formDueDate,
        amount: Number(formAmount),
        reason: formReason.trim(),
        autoCreateDebit: formAutoDebit,
      };

      const itemId = selectedItem?._id || selectedItem?.id;

      if (isEditing && itemId) {
        await api.updateRecurringPayment(itemId, payload);
      } else {
        await api.createRecurringPayment(payload);
      }

      // Optimistically update React state and localStorage cache immediately
      const key = getCustomerKey();
      setRecurringList((prevList) => {
        let updatedList;
        if (isEditing && itemId) {
          updatedList = prevList.map((r) =>
            r._id === itemId || r.id === itemId
              ? {
                  ...r,
                  ...payload,
                  nextDueDate: formDueDate,
                  dueDate: formDueDate,
                }
              : r
          );
        } else {
          const newEntry = {
            _id: 'rec-' + Date.now(),
            ...payload,
            nextDueDate: formDueDate,
            dueDate: formDueDate,
            status: 'Active',
            paymentHistory: [],
          };
          updatedList = [newEntry, ...prevList];
        }
        try {
          localStorage.setItem(`rb_rec_${key}`, JSON.stringify(updatedList));
          localStorage.removeItem(`rb_dash_${key}`);
        } catch (e) {}
        return updatedList;
      });

      setShowAddModal(false);
      resetForm();
      fetchRecurring();
    } catch (err) {
      setFormError(err.message || 'Failed to save recurring payment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRecurring = async (item) => {
    const id = typeof item === 'object' ? item?._id || item?.id : item;
    if (!window.confirm('Are you sure you want to delete this recurring payment?')) {
      return;
    }
    try {
      await api.deleteRecurringPayment(id);
      const key = getCustomerKey();
      setRecurringList((prev) => {
        const next = prev.filter((r) => r._id !== id && r.id !== id);
        try {
          localStorage.setItem(`rb_rec_${key}`, JSON.stringify(next));
          localStorage.removeItem(`rb_dash_${key}`);
        } catch (e) {}
        return next;
      });
      fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to delete recurring payment.');
    }
  };

  // Mark as Paid
  const handleMarkAsPaid = async (item) => {
    try {
      const res = await api.markAsPaid(item._id, {
        paidDate: new Date(),
        amount: item.amount,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#7C3AED', '#A855F7'],
        });
      } catch (e) {}

      alert(res.message || 'Payment recorded successfully!');
      fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to record payment.');
    }
  };

  const formatCurrency = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'Home Loan':
        return Home;
      case 'Car Loan':
        return Car;
      case 'Gold Loan':
        return Coins;
      case 'Bank Loan':
      case 'EMI':
        return CreditCard;
      default:
        return RotateCcw;
    }
  };

  const tourSteps = [
    {
      targetId: 'rec-add-btn',
      targetName: 'Add Recurring Payment',
      title: 'Schedule Loans & Subscriptions',
      description: 'Setup recurring payments across 6 standardized categories: EMI, Bank Loan, Subscription, Gold Loan, Home Loan, and Car Loan.',
      placement: 'bottom',
    },
    {
      targetId: 'rec-categories',
      targetName: 'Category Filter Chips',
      title: 'Filter by Loan / Payment Type',
      description: 'Click any chip to isolate Home Loans, Gold Loans, EMIs, or Subscriptions instantly.',
      placement: 'bottom',
    },
    {
      targetId: 'rec-cards-grid',
      targetName: 'Recurring Schedules & Mark Paid',
      title: 'Due Indicators & 1-Click Settlement',
      description: 'Track due dates, overdue statuses, and click "Mark as Paid" to automatically log a Debit transaction and roll forward your next due date!',
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
        moduleName="recurring"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Recurring Payment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track EMIs, Bank Loans, Subscriptions, Gold Loans, Home Loans, and Car Loans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Replay Tutorial Button */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            title="Replay Interactive Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Tour</span>
          </button>

          <button
            id="rec-add-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-xs font-bold shadow-purple-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Recurring Payment</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div id="rec-categories" className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            categoryFilter === 'All'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white border border-brand-100 text-slate-600 hover:bg-brand-50'
          }`}
        >
          All Categories
        </button>
        {paymentCategories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isSelected = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-brand-100 text-slate-600 hover:bg-brand-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div id="rec-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Loading recurring payments...
          </div>
        ) : recurringList.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-brand-100 shadow-purple-sm">
            <RotateCcw className="w-12 h-12 mx-auto text-slate-200 mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-800">No recurring payments configured</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your monthly EMIs, home loans, car loans, or streaming subscriptions to receive reminders and track auto-advancing schedules.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              + Add First Recurring Payment
            </button>
          </div>
        ) : (
          recurringList.map((item) => {
            const Icon = getCategoryIcon(item.paymentType);
            const isDueToday = item.isDueToday;
            const isOverdue = item.isOverdue;

            return (
              <div
                key={item._id}
                className={`p-5 rounded-3xl bg-white border transition-all hover:shadow-purple-md relative flex flex-col justify-between ${
                  isDueToday
                    ? 'border-rose-400 ring-2 ring-rose-400/20'
                    : isOverdue
                    ? 'border-amber-400'
                    : 'border-brand-100 shadow-purple-sm'
                }`}
              >
                <div>
                  {/* Top Category Badge & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                          {item.paymentType}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.recurrenceType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowHistoryModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50"
                        title="Payment History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecurring(item._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Amount */}
                  <h3 className="text-base font-bold text-slate-900 mt-3 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/{item.recurrenceType.toLowerCase()}</span>
                  </div>

                  {item.reason && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.reason}
                    </p>
                  )}
                </div>

                {/* Footer Due Information & Mark Paid Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Due:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(item.nextDueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isDueToday
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : isOverdue
                          ? 'bg-rose-50 text-rose-600'
                          : item.diffDays <= 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isDueToday
                        ? '🚨 Due Today'
                        : isOverdue
                        ? `Overdue by ${Math.abs(item.diffDays)} days`
                        : `Due in ${item.diffDays} days`}
                    </span>

                    {/* Mark as Paid Button */}
                    <button
                      onClick={() => handleMarkAsPaid(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 hover:scale-102"
                      title="Records debit expense and advances next due date"
                    >
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>Mark as Paid</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Recurring Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditing ? 'Edit Recurring Payment' : 'New Recurring Payment'}
                  </h3>
                  <p className="text-xs text-brand-100">Schedule automatic reminders & dues</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRecurring} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Payment Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. HDFC Home Loan EMI, Creta Car Loan, Netflix"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              {/* Category and Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => setFormPaymentType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  >
                    {paymentCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recurrence Frequency *
                  </label>
                  <select
                    value={formRecurrenceType}
                    onChange={(e) => setFormRecurrenceType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  >
                    {recurrenceTypes.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount and Due Date */}
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
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Loan #99281, installment #12 of 60"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              {/* Auto Create Debit Transaction Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-brand-50/50 border border-brand-100 text-xs">
                <input
                  type="checkbox"
                  checked={formAutoDebit}
                  onChange={(e) => setFormAutoDebit(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
                />
                <span className="font-semibold text-slate-800">
                  Automatically log a Debit transaction in Income & Expense when marked as paid
                </span>
              </label>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl shadow-purple-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : isEditing ? 'Update Schedule' : 'Save Recurring Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Payment History</h3>
                <p className="text-xs text-brand-100">{selectedItem.title}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto text-xs">
              {!selectedItem.paymentHistory || selectedItem.paymentHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto text-slate-200 mb-2 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">No payment logs recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "Mark as Paid" on the payment card when you settle an installment.
                  </p>
                </div>
              ) : (
                selectedItem.paymentHistory.map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        {new Date(h.paidDate).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[11px] text-slate-500">{h.note || 'Settled'}</p>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatCurrency(h.amount)}
                    </span>
                  </div>
                ))
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
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

