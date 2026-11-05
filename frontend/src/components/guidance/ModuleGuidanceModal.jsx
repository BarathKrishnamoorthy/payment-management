import React, { useState } from 'react';
import {
  X,
  BookOpen,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Calendar,
  CreditCard,
  PieChart,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const ModuleGuidanceModal = ({ isOpen, onClose, moduleKey = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const guidanceData = {
    dashboard: {
      title: 'How to Use Dashboard & Financial Overview',
      subtitle: 'Understand your real-time financial health, upcoming commitments, and cashflow charts.',
      overview: [
        {
          icon: TrendingUp,
          title: 'Total Balance & Monthly Metrics',
          desc: 'Displays your current net financial balance (Total Credits minus Total Debits) along with this month’s income, expense, and savings rate.',
        },
        {
          icon: AlertTriangle,
          title: 'Urgent Due-Today Alerts Banner',
          desc: 'Highlights any recurring payments, loan installments, or EMIs due today so you never miss a deadline.',
        },
        {
          icon: PieChart,
          title: 'Income vs Expense Analytics Charts',
          desc: 'Visual area and bar charts tracking your 6-month historical cashflow, alongside a breakdown of top expense categories.',
        },
      ],
      crud: [
        {
          action: 'Viewing Records',
          steps: ['Scan recent transactions list on the dashboard.', 'Click any row to view its receipt and detailed reference info.'],
          badge: 'View',
          color: 'purple',
        },
        {
          action: 'Quick Actions',
          steps: ['Click "Add Income" or "Add Expense" to record a transaction on the fly.', 'Click "Pay Now" on any due card to record instant payment.'],
          badge: 'Create',
          color: 'emerald',
        },
      ],
      fields: [
        { name: 'Net Balance', meaning: 'Your accumulated savings (Total Income - Total Expenses).' },
        { name: 'Due Today Banner', meaning: 'Active recurring payments whose deadline is today. Requires immediate settlement.' },
        { name: 'Monthly Savings', meaning: 'Income earned minus expenses spent during the current calendar month.' },
      ],
    },
    transactions: {
      title: 'How to Use Income & Expense Management',
      subtitle: 'Record credits, debits, attach receipts, filter records, and import bank statements.',
      overview: [
        {
          icon: PlusCircle,
          title: 'Dual Entry (Income vs Expense)',
          desc: 'Easily track incoming funds (Credit) like Salary, Consulting, and Investments, and outgoing expenditures (Debit) like Rent, Bills, and Food.',
        },
        {
          icon: FileSpreadsheet,
          title: 'Bank Statement Import Engine',
          desc: 'Import your official bank statements in CSV or Excel format. Our parser auto-maps dates, amounts, and descriptions into clean records.',
        },
        {
          icon: ShieldCheck,
          title: 'Receipts & File Attachments',
          desc: 'Upload invoices, bill receipts, or payment screenshots (PDF/PNG/JPG) up to 10MB to maintain digital proof for audit.',
        },
      ],
      crud: [
        {
          action: 'Adding a Transaction',
          steps: [
            'Click "+ Add Transaction" button in the top right.',
            'Select Type: Credit (Income) or Debit (Expense).',
            'Enter Amount (₹), choose Date, and pick a Category.',
            'Optionally enter Reason, Reference Number (UTR / Check #), and attach a bill receipt.',
            'Click "Save Transaction".',
          ],
          badge: 'Add',
          color: 'emerald',
        },
        {
          action: 'Viewing & Editing',
          steps: [
            'Click the "Eye" icon to view transaction details, including uploaded attachments.',
            'Click the "Edit" (pencil) icon to modify amount, date, reason, or update receipt.',
          ],
          badge: 'Edit',
          color: 'brand',
        },
        {
          action: 'Deleting Records',
          steps: [
            'Click the "Trash" icon on any transaction row.',
            'Confirm the deletion prompt to permanently remove the transaction and its stored receipt.',
          ],
          badge: 'Delete',
          color: 'rose',
        },
      ],
      fields: [
        { name: 'Type', meaning: 'Credit (Money into your account) or Debit (Money paid out).' },
        { name: 'Reference Number', meaning: 'Transaction ID, UTR number, UPI reference, or cheque number for verification.' },
        { name: 'Attachment', meaning: 'Digital file (receipt, invoice, voucher) proving the financial transaction.' },
        { name: 'Category', meaning: 'Classification tag (e.g. Salary, Utilities, Food & Dining, Shopping, Health).' },
      ],
    },
    recurring: {
      title: 'How to Use Recurring Payment Management',
      subtitle: 'Manage loans, EMIs, credit cards, subscriptions, and auto-advance payment schedules.',
      overview: [
        {
          icon: CreditCard,
          title: '6 Standardized Payment Categories',
          desc: 'Covers EMI, Bank Loan, Subscription, Gold Loan, Home Loan, and Car Loan with custom tags.',
        },
        {
          icon: Calendar,
          title: 'Flexible Recurrence Schedules',
          desc: 'Configure payments on Daily, Monthly, Quarterly, or Yearly frequencies with automatic next due-date recalculation.',
        },
        {
          icon: CheckCircle,
          title: '1-Click "Mark as Paid"',
          desc: 'Clicking Mark as Paid logs an expense transaction, rolls forward the next due date, and archives the payment record in history.',
        },
      ],
      crud: [
        {
          action: 'Adding Recurring Payment',
          steps: [
            'Click "+ Add Recurring Payment" in the top header.',
            'Enter Title (e.g. "HDFC Home Loan EMI" or "Netflix").',
            'Select Category (EMI, Bank Loan, Subscription, Gold Loan, Home Loan, Car Loan).',
            'Pick Recurrence Type (Daily, Monthly, Quarterly, Yearly) and Initial Due Date.',
            'Enter Amount (₹) and optional Reason/Notes, then click Save.',
          ],
          badge: 'Create',
          color: 'brand',
        },
        {
          action: 'Recording a Payment',
          steps: [
            'When due, click the green "Mark as Paid" button on the payment card.',
            'Confirm payment date and amount.',
            'The system automatically records a Debit expense and sets the next scheduled due date!',
          ],
          badge: 'Settle',
          color: 'emerald',
        },
        {
          action: 'Editing or Pausing',
          steps: [
            'Click "Edit" to adjust monthly amount, due date, or change status to "Paused" if temporarily halted.',
          ],
          badge: 'Manage',
          color: 'amber',
        },
      ],
      fields: [
        { name: 'Payment Type', meaning: 'Class of obligation: EMI, Bank Loan, Subscription, Gold Loan, Home Loan, Car Loan.' },
        { name: 'Recurrence Type', meaning: 'How frequently this payment repeats: Daily, Monthly, Quarterly, or Yearly.' },
        { name: 'Due Date', meaning: 'The calendar deadline when the installment must be settled.' },
        { name: 'Next Due Date', meaning: 'The upcoming scheduled date automatically computed from the recurrence formula.' },
      ],
    },
    reports: {
      title: 'How to Use Reports & Financial Analytics',
      subtitle: 'Analyze income vs expense trends, breakdown categories, and export records for accounting.',
      overview: [
        {
          icon: TrendingUp,
          title: 'Income vs Expense Trends',
          desc: 'Comparative cashflow charts showing net inflows vs outflows over time with calculated savings rate.',
        },
        {
          icon: PieChart,
          title: 'Category Expenditure Breakdown',
          desc: 'Interactive breakdown identifying your largest spending drivers (e.g., Housing, Loans, Dining, Shopping).',
        },
        {
          icon: FileSpreadsheet,
          title: 'Export to CSV & Print Ledger',
          desc: 'Download formatted reports for your chartered accountant, tax filing, or personal archives with 1-click.',
        },
      ],
      crud: [
        {
          action: 'Filtering Data',
          steps: [
            'Choose a timeframe: All Time, This Month, This Quarter, or This Year.',
            'Or select custom Start and End dates to generate targeted date-range reports.',
          ],
          badge: 'Filter',
          color: 'brand',
        },
        {
          action: 'Exporting Reports',
          steps: [
            'Click "Export CSV" to download raw transaction rows into Microsoft Excel or Google Sheets.',
            'Click "Print Report" to generate a clean, print-friendly statement view.',
          ],
          badge: 'Export',
          color: 'emerald',
        },
      ],
      fields: [
        { name: 'Savings Rate', meaning: 'Percentage of total income retained after subtracting all expenses: ((Income - Expense) / Income) * 100.' },
        { name: 'Recurring Financial Commitment', meaning: 'Normalized monthly financial liability represented by all active recurring loans and subscriptions.' },
      ],
    },
    accounts: {
      title: 'How to Use Bank Accounts & Wallets',
      subtitle: 'Manage savings accounts, current accounts, UPI, and cash wallets with instant 1-click transfers.',
      overview: [
        {
          icon: CreditCard,
          title: 'Multi-Account Liquidity',
          desc: 'Keep track of balances across your bank accounts, digital UPI wallets, and physical cash reserves.',
        },
        {
          icon: ArrowRight,
          title: 'Inter-Account Fund Transfers',
          desc: 'Move funds between your accounts (e.g., Bank to UPI) without affecting your income or expense metrics.',
        },
      ],
      crud: [
        {
          action: 'Adding an Account',
          steps: [
            'Click "+ Add Bank / Wallet".',
            'Select account type: Savings, Current, Cash, UPI Wallet, or Credit Card.',
            'Enter account name, bank name, last 4 digits, and opening balance.',
          ],
          badge: 'Create',
          color: 'purple',
        },
        {
          action: 'Transferring Funds',
          steps: [
            'Click "Transfer Between Accounts".',
            'Select source and destination accounts, enter transfer amount, and confirm.',
          ],
          badge: 'Transfer',
          color: 'emerald',
        },
      ],
      fields: [
        { name: 'Account Balance', meaning: 'Current real-time liquid balance calculated from opening balance + net transfers and transactions.' },
        { name: 'Transfer Exclusion', meaning: 'Transfers between owned accounts do not count as income or expense.' },
      ],
    },
    family: {
      title: 'How to Use Family Finance Workspace',
      subtitle: 'Collaborate with family members, manage shared household expenses, and split contributions.',
      overview: [
        {
          icon: ShieldCheck,
          title: 'Family Workspace Isolation',
          desc: 'Separate your personal finances from shared family bills with role-based member permissions.',
        },
        {
          icon: CheckCircle,
          title: 'Mobile Number Invitations',
          desc: 'Invite your spouse, parents, or dependents using their phone number with Owner, Admin, Member, or Viewer roles.',
        },
      ],
      crud: [
        {
          action: 'Creating Family Workspace',
          steps: [
            'Click "Create Family Workspace".',
            'Enter family name and choose default currency.',
            'Add family members via their mobile phone number.',
          ],
          badge: 'Setup',
          color: 'brand',
        },
      ],
      fields: [
        { name: 'Role: Admin', meaning: 'Can add and edit shared transactions and invite new family members.' },
        { name: 'Role: Viewer', meaning: 'Can view shared household totals and reports in read-only mode.' },
      ],
    },
    planning: {
      title: 'How to Use Budgets & Savings Goals',
      subtitle: 'Set category spending limits with threshold alerts and track milestone savings goals.',
      overview: [
        {
          icon: TrendingUp,
          title: 'Category Spending Limits',
          desc: 'Define monthly budgets for Food, Shopping, Utilities, and get automatic alerts at 80% and 100% spend.',
        },
        {
          icon: CheckCircle,
          title: 'Target Savings Goals',
          desc: 'Set goals for emergency funds, vacations, or down-payments and record milestone deposits.',
        },
      ],
      crud: [
        {
          action: 'Setting Budgets',
          steps: ['Click "+ Create Budget", select category, monthly limit amount, and save.'],
          badge: 'Budget',
          color: 'purple',
        },
        {
          action: 'Adding Goal Deposit',
          steps: ['Click "Deposit", enter contribution amount and optional note to increase goal progress.'],
          badge: 'Goal',
          color: 'emerald',
        },
      ],
      fields: [
        { name: '80% Warning Badge', meaning: 'Notifies you that 80% of your category monthly limit has been consumed.' },
        { name: '100% Exceeded Badge', meaning: 'Alerts you that actual spending has surpassed the allocated budget.' },
      ],
    },
    loans: {
      title: 'How to Use Borrow & Lend Tracker',
      subtitle: 'Record personal loans, friends & family debts, and partial repayments.',
      overview: [
        {
          icon: TrendingUp,
          title: 'Money Lent vs Money Borrowed',
          desc: 'Easily track amounts you gave to others (To Collect) vs amounts you borrowed (To Repay).',
        },
        {
          icon: CheckCircle,
          title: 'Partial Repayments',
          desc: 'Log installment repayments with automatic outstanding balance recalculation.',
        },
      ],
      crud: [
        {
          action: 'Recording a Loan',
          steps: [
            'Click "+ Record New Loan / Debt".',
            'Select "I Lent Money" or "I Borrowed Money".',
            'Enter contact name, phone, principal, due date, and save.',
          ],
          badge: 'Record',
          color: 'purple',
        },
        {
          action: 'Recording Repayment',
          steps: [
            'Click "Record Repayment" on any active loan card.',
            'Enter repayment amount and payment note (e.g. UPI transfer reference).',
          ],
          badge: 'Repay',
          color: 'emerald',
        },
      ],
      fields: [
        { name: 'Outstanding Balance', meaning: 'Remaining unpaid principal amount.' },
        { name: 'Net Position', meaning: 'Total money owed to you minus total money you owe.' },
      ],
    },
  };

  const currentGuide = guidanceData[moduleKey] || guidanceData.dashboard;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-6 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-100" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-brand-200">
                  User Manual & Step-by-Step Instructions
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{currentGuide.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-brand-100/90 mt-2 max-w-lg">{currentGuide.subtitle}</p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-brand-500/40 pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-brand-800 shadow'
                  : 'text-brand-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Feature Highlights
            </button>
            <button
              onClick={() => setActiveTab('crud')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'crud'
                  ? 'bg-white text-brand-800 shadow'
                  : 'text-brand-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Step-by-Step Actions
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'fields'
                  ? 'bg-white text-brand-800 shadow'
                  : 'text-brand-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Field Definitions
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Core Capabilities & Architecture
              </p>
              {currentGuide.overview.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 hover:border-brand-300 transition-colors flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'crud' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                How to Add, Edit, View, and Delete Records
              </p>
              {currentGuide.crud.map((item, index) => (
                <div key={index} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-brand-600" />
                      {item.action}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800">
                      {item.badge}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-600">
                    {item.steps.map((s, si) => (
                      <li key={si} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Field Glossary & Meaning
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {currentGuide.fields.map((f, fi) => (
                  <div key={fi} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-slate-50">
                    <span className="font-semibold text-brand-800 min-w-[140px]">{f.name}</span>
                    <span className="text-slate-600">{f.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
            You can reopen this guide anytime from the top bar.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
};

