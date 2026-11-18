import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  Globe,
  Smartphone,
  ShieldCheck,
  Eye,
  RefreshCw,
  X,
  Radio,
  FileSpreadsheet,
  ArrowUpDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminApi } from '../../services/adminApi';

export const ActiveUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModal, setUserDetailsModal] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userFullDetails, setUserFullDetails] = useState(null);

  const fetchActiveUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getActiveUsers({
        search,
        platform,
        page,
        limit: 15,
      });
      if (res && res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      console.warn('Fetch active users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [page, platform]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchActiveUsers();
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setUserDetailsModal(true);
    setUserDetailsLoading(true);
    try {
      const res = await adminApi.getUserDetails(user._id);
      if (res && res.success) {
        setUserFullDetails(res);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Name', 'Phone', 'Email', 'Platform', 'Registration Date', 'Last Login', 'Last Active', 'Status'];
    const rows = users.map((u) => [
      u._id,
      `"${u.name || 'Customer'}"`,
      `"${u.phoneNumber || ''}"`,
      `"${u.email || 'N/A'}"`,
      u.platform || 'website',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A',
      u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'N/A',
      u.status || 'Active',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `active_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (users.length === 0) return;
    const data = users.map((u) => ({
      'User ID': u._id,
      'Customer Name': u.name || 'Customer',
      'Mobile Number': u.phoneNumber,
      'Email Address': u.email || 'N/A',
      'Platform': (u.platform || 'website').toUpperCase(),
      'Registration Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
      'Last Login Time': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A',
      'Last Active Timestamp': u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'N/A',
      'Account Status': u.status || 'Active',
      'Real-Time Active': u.isRealTimeActive ? 'YES' : 'NO',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Users');
    XLSX.writeFile(workbook, `ERM_Active_Users_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Active Users Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {total} Total Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time directory of customers currently active or engaged across Web and Mobile apps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold border border-purple-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-purple-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={fetchActiveUsers}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-purple-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        {/* Platform filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-purple-50 rounded-xl border border-purple-100 text-xs self-start md:self-auto">
          {['All', 'website', 'android', 'ios'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPlatform(p);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                platform === p
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-500 hover:text-brand-700'
              }`}
            >
              {p === 'website' ? 'Web' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-purple-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50/70 border-b border-purple-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Loading active users telemetrics...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active users matching the query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isMobile = u.platform === 'android' || u.platform === 'ios';
                  return (
                    <tr key={u._id} className="hover:bg-purple-50/30 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {u.isRealTimeActive && (
                              <span
                                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300"
                                title="Active Now (< 30 min)"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name || 'Customer'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{u._id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">
                          {u.phoneNumber ? `+91 ${u.phoneNumber}` : 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {u.email || 'No email attached'}
                        </p>
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isMobile
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-purple-100 text-brand-800'
                          }`}
                        >
                          {isMobile ? <Smartphone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          <span>{u.platform || 'website'}</span>
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">
                          {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'Blocked'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.status || 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewDetails(u)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold transition-all"
                        >
                          View Profile
                        </button>
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
              Showing Page {page} of {pages} ({total} active customers)
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

      {/* User Details Modal */}
      {userDetailsModal && selectedUser && (
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
                onClick={() => setUserDetailsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userDetailsLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading customer portfolio...</div>
            ) : userFullDetails ? (
              <div className="space-y-4 pt-4">
                {/* Stats 4-box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Transactions</span>
                    <p className="text-base font-black text-brand-800 mt-0.5">{userFullDetails.stats?.totalTransactions ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Credits</span>
                    <p className="text-base font-black text-emerald-700 mt-0.5">₹{(userFullDetails.stats?.totalIncome ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Debits</span>
                    <p className="text-base font-black text-rose-700 mt-0.5">₹{(userFullDetails.stats?.totalExpenses ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Recurring</span>
                    <p className="text-base font-black text-sky-800 mt-0.5">{userFullDetails.stats?.recurringSchedules ?? 0}</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Customer Full Name:</span>
                    <span className="font-bold text-slate-800">{userFullDetails.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Registered Bank Name:</span>
                    <span className="font-bold text-slate-800">{userFullDetails.user?.bankName || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Bank Account Number:</span>
                    <span className="font-mono font-bold text-slate-800">{userFullDetails.user?.accountNumber || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Platform / OS:</span>
                    <span className="font-bold uppercase text-brand-700">{userFullDetails.user?.platform || 'website'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Registration Date:</span>
                    <span className="font-bold text-slate-800">{userFullDetails.user?.createdAt ? new Date(userFullDetails.user.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Last Login:</span>
                    <span className="font-bold text-slate-800">{userFullDetails.user?.lastLoginAt ? new Date(userFullDetails.user.lastLoginAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Recent Customer Activity Log
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    {!userFullDetails.recentActivity || userFullDetails.recentActivity.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-3">No recorded activity logs yet.</p>
                    ) : (
                      userFullDetails.recentActivity.map((a, i) => (
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
