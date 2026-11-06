import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit3,
  Eye,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon,
  TrendingDown,
  Phone,
  Crown,
  HeartHandshake,
  Mail,
  Calendar,
  FileText,
  X,
  CreditCard,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ModuleTour } from '../components/walkthrough/ModuleTour';

export const FamilyPage = () => {
  const { user, setModuleTutorialDone } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [familyWorkspace, setFamilyWorkspace] = useState(null);
  const [familySummary, setFamilySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  // Create Family Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberRelationship, setMemberRelationship] = useState('Spouse');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberBudget, setMemberBudget] = useState('');
  const [memberNotes, setMemberNotes] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Edit Member Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('member');
  const [editRelationship, setEditRelationship] = useState('Spouse');
  const [editEmail, setEditEmail] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // View Member Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPayments, setMemberPayments] = useState([]);
  const [memberTotalPaid, setMemberTotalPaid] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add Member Payment Modal
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentTargetMember, setPaymentTargetMember] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('debit');
  const [paymentCategory, setPaymentCategory] = useState('Household');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReason, setPaymentReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const tourSteps = [
    {
      targetId: 'fam-header',
      targetName: 'Family Finance Workspace',
      title: 'Collaborative Household Ledger',
      description: 'Manage household expenses, track contributions, and ensure full transparency across family members.',
      placement: 'bottom',
    },
    {
      targetId: 'fam-members-section',
      targetName: 'Family Members & Roles',
      title: 'Family Members Directory',
      description: 'Add, edit, and view profiles of your family members, allocate monthly budgets, and see who paid what.',
      placement: 'bottom',
    },
    {
      targetId: 'fam-breakdown-section',
      targetName: 'Expense Allocations',
      title: 'Contribution Tracking',
      description: 'Visual breakdown showing each member’s financial share and recorded payments for household commitments.',
      placement: 'top',
    },
  ];

  const fetchWorkspacesAndSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkspaces();
      if (res && res.success) {
        setWorkspaces(res.workspaces || []);
        const fam = (res.workspaces || []).find((w) => w.type === 'family');
        setFamilyWorkspace(fam || null);

        if (fam) {
          const sumRes = await api.getFamilySummary(fam._id);
          if (sumRes && sumRes.success) {
            setFamilySummary(sumRes);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching family data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspacesAndSummary();
  }, []);

  // First-time tutorial walkthrough check
  useEffect(() => {
    const rawId = user?._id || user?.id || '';
    const isDoneLocally = rawId && localStorage.getItem(`rb_tut_family_${rawId}`) === 'done';
    const isDoneServer = Boolean(user?.tutorialStatus?.family);

    if (user && !isDoneLocally && !isDoneServer && !loading) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [user?.tutorialStatus?.family, loading]);

  const handleFinishTour = () => {
    setShowTour(false);
    const rawId = user?._id || user?.id || '';
    if (rawId) localStorage.setItem(`rb_tut_family_${rawId}`, 'done');
    setModuleTutorialDone('family');
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!familyName.trim()) {
      setCreateError('Please enter a family group name.');
      return;
    }

    try {
      setCreating(true);
      const res = await api.createFamilyWorkspace({
        name: familyName.trim(),
        ownerName: user?.name && user.name !== 'Customer' ? user.name : undefined,
        ownerPhone: user?.phoneNumber || undefined,
      });
      if (res && res.success) {
        setShowCreateModal(false);
        setFamilyName('');
        await fetchWorkspacesAndSummary();
        try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create family group.');
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!memberName.trim()) {
      setInviteError('Please provide the family member full name.');
      return;
    }

    const cleanPhone = memberPhone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setInviteError('Please provide a valid 10-digit mobile number.');
      return;
    }

    try {
      setInviting(true);
      const res = await api.inviteFamilyMember(familyWorkspace._id, {
        name: memberName.trim(),
        phoneNumber: cleanPhone,
        role: memberRole,
        relationship: memberRelationship,
        email: memberEmail.trim(),
        monthlyBudget: Number(memberBudget) || 0,
        notes: memberNotes.trim(),
      });

      if (res && res.success) {
        setInviteSuccess(`Successfully added ${memberName.trim()} to family!`);
        setMemberName('');
        setMemberPhone('');
        setMemberEmail('');
        setMemberBudget('');
        setMemberNotes('');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess('');
        }, 1200);
        await fetchWorkspacesAndSummary();
        try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to add member.');
    } finally {
      setInviting(false);
    }
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setEditName(m.name || '');
    setEditPhone(m.phoneNumber ? m.phoneNumber.slice(-10) : '');
    setEditRole(m.role || 'member');
    setEditRelationship(m.relationship || 'Spouse');
    setEditEmail(m.email || '');
    setEditBudget(m.monthlyBudget ? String(m.monthlyBudget) : '');
    setEditNotes(m.notes || '');
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editName.trim()) {
      setEditError('Member name is required.');
      return;
    }

    const cleanPhone = editPhone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setEditError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setUpdating(true);
      const res = await api.updateFamilyMember(familyWorkspace._id, editingMember._id, {
        name: editName.trim(),
        phoneNumber: cleanPhone,
        role: editRole,
        relationship: editRelationship,
        email: editEmail.trim(),
        monthlyBudget: Number(editBudget) || 0,
        notes: editNotes.trim(),
      });

      if (res && res.success) {
        setEditSuccess('Member details updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess('');
        }, 1000);
        await fetchWorkspacesAndSummary();
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update member.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDetails = async (m) => {
    setSelectedMember(m);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await api.getFamilyMemberPayments(familyWorkspace._id, m._id);
      if (res && res.success) {
        setMemberPayments(res.payments || []);
        setMemberTotalPaid(res.totalPaid || 0);
      }
    } catch (err) {
      console.error('Error fetching member details & payments:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenAddPayment = (m) => {
    setPaymentTargetMember(m);
    setPaymentAmount('');
    setPaymentType('debit');
    setPaymentCategory('Household');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReason(`Expense for ${m.name}`);
    setPaymentRef('');
    setPaymentError('');
    setPaymentSuccess('');
    setShowAddPaymentModal(true);
  };

  const handleSaveMemberPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');

    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    try {
      setSavingPayment(true);
      const res = await api.addFamilyMemberPayment(familyWorkspace._id, paymentTargetMember._id, {
        amount: numAmount,
        type: paymentType,
        category: paymentCategory,
        date: paymentDate,
        reason: paymentReason.trim(),
        referenceNumber: paymentRef.trim(),
      });

      if (res && res.success) {
        setPaymentSuccess(res.message || 'Payment successfully recorded for family member!');
        setTimeout(() => {
          setShowAddPaymentModal(false);
          setPaymentSuccess('');
        }, 1200);

        // Refresh summary and active member details if open
        await fetchWorkspacesAndSummary();
        if (showDetailsModal && selectedMember && String(selectedMember._id) === String(paymentTargetMember._id)) {
          const detailRes = await api.getFamilyMemberPayments(familyWorkspace._id, paymentTargetMember._id);
          if (detailRes && detailRes.success) {
            setMemberPayments(detailRes.payments || []);
            setMemberTotalPaid(detailRes.totalPaid || 0);
          }
        }
        try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch (e) {}
      }
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this member'} from the family group?`)) return;
    try {
      await api.removeFamilyMember(familyWorkspace._id, memberId);
      await fetchWorkspacesAndSummary();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Interactive Tour */}
      <ModuleTour
        isOpen={showTour}
        onClose={handleFinishTour}
        onFinish={handleFinishTour}
        steps={tourSteps}
        moduleName="family"
      />

      {/* Header */}
      <div id="fam-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-8 bg-brand-600 rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Family Financial Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Collaborative household budgeting, shared expenses, member allocations & reimbursements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Replay Tutorial Button */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            title="Replay Interactive Walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Tour</span>
          </button>

          {familyWorkspace && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading family group...</p>
        </div>
      ) : !familyWorkspace ? (
        /* Empty State: Create Family Group */
        <div className="bg-white rounded-3xl border border-purple-100 p-8 sm:p-12 text-center shadow-2xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-brand-700 flex items-center justify-center mx-auto mb-4 shadow-purple-sm">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Create a Family Financial Workspace</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            Collaborate with your spouse, parents, or household members. Track combined groceries, shared bills, rent, and see who paid what with transparency.
          </p>
          <button
            id="fam-create-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm transition-all shadow-purple-md inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Create Family Group</span>
          </button>
        </div>
      ) : (
        /* Family Active Dashboard */
        <div className="space-y-6">
          {/* Family Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-purple-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-brand-200 text-xs font-bold mb-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Family Workspace Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{familyWorkspace.name}</h2>
              <p className="text-xs text-brand-300 mt-1">
                {familyWorkspace.members?.length || 1} Registered Member{familyWorkspace.members?.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center min-w-[130px]">
                <span className="text-[11px] text-brand-200 block">Total Shared Spent</span>
                <span className="text-xl font-extrabold text-white">
                  ₹{Number(familySummary?.totalSharedExpense || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center min-w-[130px]">
                <span className="text-[11px] text-brand-200 block">Contributions</span>
                <span className="text-xl font-extrabold text-white">
                  ₹{Number(familySummary?.totalContributions || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Members List Section */}
          <div id="fam-members-section" className="bg-white rounded-3xl border border-purple-100 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Family Members</h3>
                <p className="text-xs text-slate-500">View member details, assign payments, and manage roles</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
              >
                + Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(familyWorkspace.members || []).map((m) => {
                const isOwner = m.role === 'owner';
                const isSelf = isOwner || m.user === (user?._id || user?.id) || (m.phoneNumber && user?.phoneNumber && m.phoneNumber.slice(-10) === user.phoneNumber.slice(-10));
                const isGeneric = !m.name || m.name === 'Customer' || m.name.startsWith('Customer ') || m.name === 'Family Head' || m.name === 'Owner';
                const memberDisplayName = (isSelf && user?.name && user.name !== 'Customer')
                  ? user.name
                  : (isGeneric && isOwner && user?.name && user.name !== 'Customer'
                      ? user.name
                      : (m.name || (isOwner ? (user?.name || 'Owner') : 'Family Member')));
                const memberInitial = (memberDisplayName.charAt(0) || 'M').toUpperCase();

                return (
                  <div
                    key={m._id || m.phoneNumber}
                    onClick={() => handleOpenDetails({ ...m, name: memberDisplayName })}
                    className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 hover:bg-purple-50/70 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-brand-600 group-hover:bg-brand-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                          {memberInitial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-brand-700 truncate transition-colors">
                              {memberDisplayName}
                            </p>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">+91 {m.phoneNumber ? m.phoneNumber.slice(-10) : ''}</p>
                          <span className="text-[10px] text-brand-700 font-semibold">{m.relationship || 'Family Member'}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-brand-700 shrink-0">
                        {m.role}
                      </span>
                    </div>

                    {/* Monthly Budget Badge if set */}
                    {m.monthlyBudget > 0 && (
                      <div className="px-2.5 py-1 rounded-xl bg-white border border-purple-100 text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="text-slate-400">Monthly Budget:</span>
                        <span className="font-bold text-brand-700">₹{Number(m.monthlyBudget).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails({ ...m, name: memberDisplayName });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-brand-700 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="View details & payment history"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddPayment({ ...m, name: memberDisplayName });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-brand-600 text-white hover:bg-brand-700 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="Record payment for this member"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit({ ...m, name: memberDisplayName });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-white transition-colors"
                          title="Edit member details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {m.role !== 'owner' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(m._id, m.name);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Member Spending Breakdown Section */}
          <div id="fam-breakdown-section" className="bg-white rounded-3xl border border-purple-100 p-6 shadow-2xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Household Expense Contributions</h3>
            <p className="text-xs text-slate-500 mb-4">Total payments recorded by each member for household bills</p>

            {(!familySummary || !familySummary.memberBreakdown || familySummary.memberBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-4">No expense contributions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {familySummary.memberBreakdown.map((mb) => {
                  const total = familySummary.totalSharedExpense || 1;
                  const pct = Math.round(((mb.paid || 0) / total) * 100);
                  const isMbSelf = mb.role === 'owner' || (mb.phoneNumber && user?.phoneNumber && mb.phoneNumber.slice(-10) === user.phoneNumber.slice(-10));
                  const isMbGeneric = !mb.name || mb.name === 'Customer' || mb.name.startsWith('Customer ') || mb.name === 'Family Head' || mb.name === 'Owner';
                  const mbDisplayName = (isMbSelf && user?.name && user.name !== 'Customer') ? user.name : (isMbGeneric && isMbSelf && user?.name ? user.name : (mb.name || 'Member'));
                  return (
                    <div key={mb.phoneNumber} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span className="flex items-center gap-2">
                          <span>{mbDisplayName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({mb.relationship || mb.role})</span>
                        </span>
                        <span>₹{Number(mb.paid || 0).toLocaleString('en-IN')} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE FAMILY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Family Group</h3>
                  <p className="text-xs text-slate-500">Shared household budget & ledger</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFamily} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Family Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Balasubramanian Family, Home Expenses"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Family'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Family Member</h3>
                  <p className="text-xs text-slate-500">Record profile info, relationship & spending limits</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {inviteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={memberRelationship}
                    onChange={(e) => setMemberRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs text-slate-500 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      maxLength={10}
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role & Permissions</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="member">Member (Can add expenses)</option>
                    <option value="admin">Admin (Full management)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Budget (₹ Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={memberBudget}
                    onChange={(e) => setMemberBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  placeholder="Notes about this member's allocations or responsibilities..."
                  rows={2}
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {inviting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Family Member</h3>
                  <p className="text-xs text-slate-500">Update profile details, permissions & budget</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={editRelationship}
                    onChange={(e) => setEditRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs text-slate-500 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role & Permissions</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={editingMember.role === 'owner'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white disabled:bg-slate-100"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Budget (₹)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {updating ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MEMBER DETAILS & PAYMENT HISTORY MODAL */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                  {(selectedMember.name ? selectedMember.name.charAt(0) : 'M').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedMember.name}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-brand-700">
                      {selectedMember.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedMember.relationship || 'Family Member'} • +91 {selectedMember.phoneNumber ? selectedMember.phoneNumber.slice(-10) : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Spent</span>
                <span className="text-base font-black text-brand-700">₹{Number(memberTotalPaid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Payments</span>
                <span className="text-base font-black text-slate-800">{memberPayments.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Monthly Budget</span>
                <span className="text-base font-black text-slate-800">
                  {selectedMember.monthlyBudget > 0 ? `₹${Number(selectedMember.monthlyBudget).toLocaleString('en-IN')}` : 'None'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Email</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block mt-1">
                  {selectedMember.email || 'Not provided'}
                </span>
              </div>
            </div>

            {selectedMember.notes && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4">
                <span className="font-bold text-slate-800">Notes: </span>
                {selectedMember.notes}
              </div>
            )}

            {/* Payment History Table / List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">Member Payment History</h4>
                <button
                  onClick={() => handleOpenAddPayment(selectedMember)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {loadingDetails ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading payment history...</p>
                </div>
              ) : memberPayments.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No payments recorded for this member yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use "Record Payment" to log an expense or contribution.</p>
                </div>
              ) : (
                <div className="divide-y divide-purple-50 border border-purple-100 rounded-2xl overflow-hidden bg-white">
                  {memberPayments.map((p) => {
                    const isDebit = p.type === 'debit';
                    const dateStr = p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <div key={p._id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-purple-50/30 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isDebit ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isDebit ? 'Expense' : 'Contribution'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">{p.category || 'General'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.reason || 'Payment'}</p>
                          <span className="text-[10px] text-slate-400">{dateStr} {p.referenceNumber ? `• Ref: ${p.referenceNumber}` : ''}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isDebit ? '-' : '+'}₹{Number(p.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECORD / ASSOCIATE PAYMENT WITH MEMBER MODAL */}
      {showAddPaymentModal && paymentTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
                  <p className="text-xs text-slate-500">Associate with {paymentTargetMember.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            {paymentError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveMemberPayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('debit')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      paymentType === 'debit'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Expense (Paid Out)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      paymentType === 'credit'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Contribution (Paid In)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={paymentCategory}
                    onChange={(e) => setPaymentCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800 bg-white"
                  >
                    <option value="Household">Household</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Utilities">Utilities & Bills</option>
                    <option value="Rent">Rent & Housing</option>
                    <option value="Education">Education & School</option>
                    <option value="Medical">Medical & Health</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly milk delivery, school books"
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference # / UPI Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-1234567890"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-purple-sm disabled:opacity-50"
                >
                  {savingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPage;
