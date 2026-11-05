import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon,
  TrendingDown,
  Phone,
  Crown,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const FamilyPage = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [familyWorkspace, setFamilyWorkspace] = useState(null);
  const [familySummary, setFamilySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create Family Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Invite Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

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

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!familyName.trim()) {
      setCreateError('Please enter a family group name.');
      return;
    }

    try {
      setCreating(true);
      const res = await api.createFamilyWorkspace({ name: familyName.trim() });
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

    const cleanPhone = memberPhone.replace(/[^0-9]/g, '');
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
      });

      if (res && res.success) {
        setInviteSuccess(`Successfully added ${memberName || cleanPhone} to family!`);
        setMemberName('');
        setMemberPhone('');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess('');
        }, 1500);
        await fetchWorkspacesAndSummary();
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to add member.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the family group?')) return;
    try {
      await api.removeFamilyMember(familyWorkspace._id, memberId);
      await fetchWorkspacesAndSummary();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {familyWorkspace && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-purple-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
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

          {/* Members List */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Family Members</h3>
                <p className="text-xs text-slate-500">Roles define viewing and expense submission permissions</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
              >
                + Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(familyWorkspace.members || []).map((m) => (
                <div
                  key={m._id || m.phoneNumber}
                  className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {(m.name ? m.name.charAt(0) : 'M').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.name || 'Family Member'}</p>
                      <p className="text-[11px] text-slate-500 truncate">+91 {m.phoneNumber.slice(-10)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-brand-700">
                      {m.role}
                    </span>
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Spending Breakdown */}
          {familySummary && familySummary.memberBreakdown && familySummary.memberBreakdown.length > 0 && (
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-2xs">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Household Expense Contributions</h3>
              <p className="text-xs text-slate-500 mb-4">Total payments recorded by each member for household bills</p>

              <div className="space-y-3">
                {familySummary.memberBreakdown.map((mb) => {
                  const total = familySummary.totalSharedExpense || 1;
                  const pct = Math.round((mb.paid / total) * 100);
                  return (
                    <div key={mb.phoneNumber} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span className="flex items-center gap-2">
                          <span>{mb.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({mb.role})</span>
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
            </div>
          )}
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

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-purple-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Invite Family Member</h3>
                  <p className="text-xs text-slate-500">Send access to join your family ledger</p>
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Member Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya (Spouse), Rajesh (Father)"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-xs text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs text-slate-500 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
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
                  <option value="member">Member (Can add shared expenses & view family reports)</option>
                  <option value="admin">Admin (Can manage members and budgets)</option>
                  <option value="viewer">Viewer (Read-only family reports)</option>
                </select>
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
                  {inviting ? 'Inviting...' : 'Add to Family'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
