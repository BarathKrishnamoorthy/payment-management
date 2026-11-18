import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Table,
  CheckCircle2,
  Users,
  Activity,
  UserX,
  Globe,
  Smartphone,
  UserPlus,
  LogIn,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminApi } from '../../services/adminApi';

export const AdminReportsPage = () => {
  const [activeReport, setActiveReport] = useState('total_registered');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState('');
  const [search, setSearch] = useState('');

  const reportTabs = [
    { id: 'total_registered', label: 'Total Registered Users', icon: Users, desc: 'Complete master registry of all customer accounts' },
    { id: 'daily_active', label: 'Daily Active Users (DAU)', icon: Activity, desc: 'Unique customers active today with timestamps' },
    { id: 'weekly_monthly_active', label: 'Weekly & Monthly Active', icon: Calendar, desc: 'WAU and MAU categorized activity audit' },
    { id: 'inactive_users', label: 'Inactive Users Report', icon: UserX, desc: 'Dormant users with days since last platform activity' },
    { id: 'website_usage', label: 'Website Usage Report', icon: Globe, desc: 'Browser platform access, login counts & last seen' },
    { id: 'mobile_usage', label: 'Mobile App Usage Report', icon: Smartphone, desc: 'Android & iOS sessions, app versions & device telemetry' },
    { id: 'new_registrations', label: 'New Registrations Report', icon: UserPlus, desc: 'Newly onboarded customer profiles registered today' },
    { id: 'login_activity', label: 'Login Activity Audit', icon: LogIn, desc: 'Detailed log of authentication events and IP addresses' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports({ reportType: activeReport });
      if (res && res.success) {
        setReportData(res.data || []);
        setGeneratedAt(res.generatedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn('Fetch report error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  // Dynamic columns from data keys
  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  // Filtered rows by local search
  const filteredRows = reportData.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(q));
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = columns;
    const csvRows = filteredRows.map((row) =>
      headers.map((col) => {
        const val = row[col] === undefined || row[col] === null ? '' : String(row[col]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ERM_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (filteredRows.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    const sheetName = activeReport.slice(0, 31); // Excel tab max 31 chars
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `ERM_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const currentTabInfo = reportTabs.find((t) => t.id === activeReport);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Title & Export Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-purple-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports & Data Export Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              8 Standard Audits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export official administrative audits in Excel (.xlsx) and CSV formats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-700 text-xs font-bold border border-purple-200 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-purple-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 8 Report Tabs Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white border-transparent shadow-purple-sm'
                  : 'bg-white hover:bg-purple-50/50 text-slate-700 border-purple-100 shadow-purple-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-700'}`} />
                <span className="text-xs font-bold line-clamp-1">{tab.label}</span>
              </div>
              <p className={`text-[10px] line-clamp-1 ${isActive ? 'text-purple-100' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Report Preview Table Card */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-purple-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {currentTabInfo?.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-brand-800">
                {filteredRows.length} Rows
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Generated: {generatedAt ? new Date(generatedAt).toLocaleString() : 'Just now'}
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in this report..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white border-b border-purple-100 z-10">
              <tr className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 bg-purple-50/60">
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 5} className="py-12 text-center text-slate-400 font-semibold">
                    Compiling report audit dataset...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 5} className="py-12 text-center text-slate-400">
                    No data records found for this report.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/20 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="py-3 px-4 whitespace-nowrap">
                        {String(row[col] ?? 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span>Official audit export ready in CSV and Microsoft Excel (.xlsx) formats</span>
          <span>ERM Telemetry Engine</span>
        </div>
      </div>
    </div>
  );
};
