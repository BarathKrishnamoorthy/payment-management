import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
  X,
  AlertTriangle,
  Smartphone,
  Globe,
  MoreVertical,
  Check,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Block modal
  const [blockModal, setBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsers({
        search,
        status: statusFilter,
        platform: platformFilter,
        page,
        limit: 15,
      });
      if (res && res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      console.warn('Fetch all users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, platformFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenProfile = async (user) => {
    setSelectedUser(user);
    setProfileModal(true);
    setProfileLoading(true);
    try {
      const res = await adminApi.getUserDetails(user._id);
      if (res && res.success) {
        setProfileData(res);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to change ${user.name || user.phoneNumber}'s status to ${nextStatus}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.updateUserStatus(user._id, nextStatus);
      setActionMsg(`Customer marked as ${nextStatus}!`);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const handleOpenBlockModal = (user) => {
    setSelectedUser(user);
    setBlockReason(user.blockReason || '');
    setBlockModal(true);
  };

  const handleConfirmBlockToggle = async () => {
    if (!selectedUser) return;
    const isBlocking = !selectedUser.isBlocked;
    setActionLoading(true);
    try {
      await adminApi.blockUser(selectedUser._id, isBlocking, blockReason);
      setBlockModal(false);
      setActionMsg(isBlocking ? 'Account has been blocked.' : 'Account unblocked successfully.');
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update block state.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Customer Account Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-brand-800">
              {total} Total Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete administrative governance: view KYC, control account status, block access, and monitor history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionMsg && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionMsg}</span>
            </div>
          )}
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-purple-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-xl border border-purple-100 text-xs">
            {['All', 'Active', 'Inactive', 'Blocked'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  statusFilter === s
                    ? 'bg-white text-brand-700 shadow-2xs'
                    : 'text-slate-500 hover:text-brand-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            {['All', 'website', 'android', 'ios'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlatformFilter(p);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                  platformFilter === p
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p === 'website' ? 'Web' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Master Table */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-purple-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50/70 border-b border-purple-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Customer Name & ID</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    Loading customer directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBlocked = u.isBlocked === true || u.status === 'Blocked';
                  return (
                    <tr key={u._id} className="hover:bg-purple-50/30 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-brand-700'} font-bold flex items-center justify-center shrink-0`}>
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name || 'Customer'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{u._id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {u.phoneNumber ? `+91 ${u.phoneNumber}` : 'N/A'}
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {u.platform === 'android' || u.platform === 'ios' ? <Smartphone className="w-3 h-3 text-sky-600" /> : <Globe className="w-3 h-3 text-purple-600" />}
                          <span>{u.platform || 'website'}</span>
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : u.status === 'Inactive'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isBlocked ? 'Blocked' : u.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => handleOpenProfile(u)}
                            className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold"
                            title="Inspect Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle Active / Inactive */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-xl text-xs font-bold ${
                              u.status === 'Active'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={u.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.status === 'Active' ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                          </button>

                          {/* Block / Unblock */}
                          <button
                            onClick={() => handleOpenBlockModal(u)}
                            className={`p-1.5 rounded-xl text-xs font-bold ${
                              isBlocked
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            }`}
                            title={isBlocked ? 'Unblock Customer' : 'Suspend / Block Customer'}
                          >
                            <Ban className="w-4 h-4" />
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {pages} ({total} users)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block / Unblock Modal */}
      {blockModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl ${selectedUser.isBlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedUser.isBlocked ? 'Unblock Customer Account' : 'Suspend / Block Customer Account'}
                </h3>
                <p className="text-xs text-slate-500">{selectedUser.name || selectedUser.phoneNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              {selectedUser.isBlocked
                ? 'Unblocking will immediately restore this customer’s login access and enable them to interact with their payments ledger.'
                : 'Blocking will immediately revoke active JWT sessions, prevent further logins, and display a suspension notice to the user.'}
            </p>

            {!selectedUser.isBlocked && (
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Suspension (Optional)
                </label>
                <textarea
                  rows={2}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Terms violation, suspicious activity, pending KYC review..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmBlockToggle}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                  selectedUser.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Updating...' : selectedUser.isBlocked ? 'Confirm Unblock' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Deep Dive Modal */}
      {profileModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-brand-700 font-extrabold text-lg flex items-center justify-center">
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.name || 'Customer'}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedUser.phoneNumber ? `+91 ${selectedUser.phoneNumber}` : selectedUser._id}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading customer portfolio...</div>
            ) : profileData ? (
              <div className="space-y-4 pt-4">
                {/* 4-Box Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Transactions</span>
                    <p className="text-base font-black text-brand-800 mt-0.5">{profileData.stats?.totalTransactions ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Credits</span>
                    <p className="text-base font-black text-emerald-700 mt-0.5">₹{(profileData.stats?.totalIncome ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Debits</span>
                    <p className="text-base font-black text-rose-700 mt-0.5">₹{(profileData.stats?.totalExpenses ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Recurring</span>
                    <p className="text-base font-black text-sky-800 mt-0.5">{profileData.stats?.recurringSchedules ?? 0}</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Customer Full Name:</span>
                    <span className="font-bold text-slate-800">{profileData.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Bank Name:</span>
                    <span className="font-bold text-slate-800">{profileData.user?.bankName || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Account Number:</span>
                    <span className="font-mono font-bold text-slate-800">{profileData.user?.accountNumber || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Registered Platform:</span>
                    <span className="font-bold uppercase text-brand-700">{profileData.user?.platform || 'website'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Registration Date:</span>
                    <span className="font-bold text-slate-800">{profileData.user?.createdAt ? new Date(profileData.user.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Account Status:</span>
                    <span className={`font-bold uppercase ${profileData.user?.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {profileData.user?.isBlocked ? 'Suspended / Blocked' : profileData.user?.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Activity timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Recent Activity Timeline
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    {!profileData.recentActivity || profileData.recentActivity.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-3">No activity logs recorded yet.</p>
                    ) : (
                      profileData.recentActivity.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                          <span className="font-medium text-slate-700">{a.action}</span>
                          <span className="text-[10px] text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
