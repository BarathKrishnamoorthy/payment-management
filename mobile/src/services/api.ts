import { Platform } from 'react-native';
import { DEFAULT_LIVE_API_URL, LOCAL_WIFI_API_URL } from '../config/env';

// Start with live URL, or local Wi-Fi if testing locally
let currentApiUrl = DEFAULT_LIVE_API_URL;
let userToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userToken = token;
};

export const setApiUrl = (url: string) => {
  currentApiUrl = url.trim().replace(/\/$/, '');
};

export const getApiUrl = () => currentApiUrl;

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  };
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }
  return headers;
};

const handleRes = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
};

export const MobileAPI = {
  // Auth
  sendOtp: async (phoneNumber: string) => {
    const res = await fetch(`${currentApiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    return handleRes(res);
  },

  verifyOtp: async (phoneNumber: string, otp: string) => {
    const res = await fetch(`${currentApiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return handleRes(res);
  },

  getMe: async () => {
    const res = await fetch(`${currentApiUrl}/auth/me`, {
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Onboarding
  completeOnboarding: async (data: { name: string; bankName?: string; accountNumber?: string }) => {
    const res = await fetch(`${currentApiUrl}/onboarding/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  // Profile
  getProfile: async () => {
    const res = await fetch(`${currentApiUrl}/profile`, { headers: getHeaders() });
    return handleRes(res);
  },

  updateProfile: async (data: any) => {
    const res = await fetch(`${currentApiUrl}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  updateTutorialStatus: async (module: string) => {
    const res = await fetch(`${currentApiUrl}/profile/tutorial-status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ module, completed: true }),
    });
    return handleRes(res);
  },

  resetTutorialStatus: async () => {
    const res = await fetch(`${currentApiUrl}/profile/reset-tutorial`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return handleRes(res);
  },

  // Dashboard
  getDashboardSummary: async () => {
    const res = await fetch(`${currentApiUrl}/dashboard/summary`, { headers: getHeaders() });
    return handleRes(res);
  },

  // Transactions
  getTransactions: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${currentApiUrl}/transactions?${query}`, { headers: getHeaders() });
    return handleRes(res);
  },

  createTransaction: async (data: {
    type: 'credit' | 'debit';
    amount: number;
    date: string;
    category: string;
    reason?: string;
    referenceNumber?: string;
  }) => {
    const res = await fetch(`${currentApiUrl}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  deleteTransaction: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Recurring Payments
  getRecurring: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${currentApiUrl}/recurring?${query}`, { headers: getHeaders() });
    return handleRes(res);
  },

  createRecurring: async (data: {
    title: string;
    paymentType: string;
    recurrenceType: string;
    dueDate: string;
    amount: number;
    reason?: string;
  }) => {
    const res = await fetch(`${currentApiUrl}/recurring`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  markAsPaid: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/recurring/${id}/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return handleRes(res);
  },

  deleteRecurring: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/recurring/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Reports
  getReports: async (timeframe: string = 'all') => {
    const res = await fetch(`${currentApiUrl}/reports/analytics?timeframe=${timeframe}`, {
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${currentApiUrl}/notifications`, { headers: getHeaders() });
    return handleRes(res);
  },

  markAllNotificationsRead: async () => {
    const res = await fetch(`${currentApiUrl}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Bank Accounts & Wallets
  getAccounts: async () => {
    const res = await fetch(`${currentApiUrl}/accounts`, { headers: getHeaders() });
    return handleRes(res);
  },

  createAccount: async (data: {
    accountName: string;
    accountType: string;
    bankName?: string;
    accountNumber?: string;
    openingBalance?: number;
    isDefault?: boolean;
  }) => {
    const res = await fetch(`${currentApiUrl}/accounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  transferBetweenAccounts: async (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
  }) => {
    const res = await fetch(`${currentApiUrl}/accounts/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  archiveAccount: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/accounts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Workspaces & Family
  getWorkspaces: async () => {
    const res = await fetch(`${currentApiUrl}/workspaces`, { headers: getHeaders() });
    return handleRes(res);
  },

  createFamilyWorkspace: async (name: string, members: Array<{ mobileNumber: string; role?: string; name?: string }>) => {
    const res = await fetch(`${currentApiUrl}/workspaces/family`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, members }),
    });
    return handleRes(res);
  },

  inviteFamilyMember: async (workspaceId: string, mobileNumber: string, role?: string, name?: string) => {
    const res = await fetch(`${currentApiUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mobileNumber, role, name }),
    });
    return handleRes(res);
  },

  getFamilySummary: async (workspaceId: string) => {
    const res = await fetch(`${currentApiUrl}/workspaces/${workspaceId}/summary`, { headers: getHeaders() });
    return handleRes(res);
  },

  // Planning: Budgets & Savings Goals
  getBudgets: async (workspaceId?: string) => {
    const url = workspaceId ? `${currentApiUrl}/planning/budgets?workspaceId=${workspaceId}` : `${currentApiUrl}/planning/budgets`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleRes(res);
  },

  createBudget: async (data: { category: string; monthlyLimit: number; period?: string; workspaceId?: string }) => {
    const res = await fetch(`${currentApiUrl}/planning/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  deleteBudget: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/planning/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  getSavingsGoals: async (workspaceId?: string) => {
    const url = workspaceId ? `${currentApiUrl}/planning/goals?workspaceId=${workspaceId}` : `${currentApiUrl}/planning/goals`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleRes(res);
  },

  createSavingsGoal: async (data: {
    name: string;
    targetAmount: number;
    initialDeposit?: number;
    category?: string;
    targetDate?: string;
    notes?: string;
    workspaceId?: string;
  }) => {
    const res = await fetch(`${currentApiUrl}/planning/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  addGoalContribution: async (goalId: string, amount: number, notes?: string) => {
    const res = await fetch(`${currentApiUrl}/planning/goals/${goalId}/deposit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, notes }),
    });
    return handleRes(res);
  },

  deleteSavingsGoal: async (id: string) => {
    const res = await fetch(`${currentApiUrl}/planning/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },

  // Borrowing & Lending (Loans)
  getLoans: async (type?: 'borrowed' | 'lent', workspaceId?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (workspaceId) params.append('workspaceId', workspaceId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${currentApiUrl}/loans${query}`, { headers: getHeaders() });
    return handleRes(res);
  },

  createLoan: async (data: {
    personName: string;
    mobileNumber?: string;
    type: 'borrowed' | 'lent';
    principal: number;
    interestRate?: number;
    dueDate?: string;
    notes?: string;
    workspaceId?: string;
  }) => {
    const res = await fetch(`${currentApiUrl}/loans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  addLoanRepayment: async (loanId: string, data: { amount: number; notes?: string }) => {
    const res = await fetch(`${currentApiUrl}/loans/${loanId}/repay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },

  deleteLoan: async (loanId: string) => {
    const res = await fetch(`${currentApiUrl}/loans/${loanId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleRes(res);
  },
};
