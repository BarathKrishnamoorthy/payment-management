const LIVE_BACKEND_URL = 'https://backend-nine-zeta-zy9fgdrzlm.vercel.app/api';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? LIVE_BACKEND_URL
    : '/api');

const getAuthHeaders = () => {
  const token = localStorage.getItem('rb_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('rb_token');
      localStorage.removeItem('rb_user');
      window.dispatchEvent(new Event('rb_unauthorized'));
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  sendOtp: async (phoneNumber) => {
    const res = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    return handleResponse(res);
  },

  verifyOtp: async (phoneNumber, otp) => {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return handleResponse(res);
  },

  firebaseLogin: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/firebase-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Onboarding
  completeOnboarding: async (data) => {
    const res = await fetch(`${BASE_URL}/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Profile
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateTutorialStatus: async (module, completed = true) => {
    const res = await fetch(`${BASE_URL}/profile/tutorial-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ module, completed }),
    });
    return handleResponse(res);
  },

  resetTutorialStatus: async (module = null) => {
    const res = await fetch(`${BASE_URL}/profile/reset-tutorial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ module }),
    });
    return handleResponse(res);
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/transactions?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createTransaction: async (formData) => {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData, // FormData handles its own boundary
    });
    return handleResponse(res);
  },

  updateTransaction: async (id, formData) => {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return handleResponse(res);
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  importBankStatement: async (formData) => {
    const res = await fetch(`${BASE_URL}/transactions/import-statement`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return handleResponse(res);
  },

  // Recurring Payments
  getRecurringPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/recurring?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createRecurringPayment: async (data) => {
    const res = await fetch(`${BASE_URL}/recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateRecurringPayment: async (id, data) => {
    const res = await fetch(`${BASE_URL}/recurring/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteRecurringPayment: async (id) => {
    const res = await fetch(`${BASE_URL}/recurring/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  markAsPaid: async (id, payload = {}) => {
    const res = await fetch(`${BASE_URL}/recurring/${id}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    const res = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Reports
  getReportAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/reports/analytics?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  markNotificationAsRead: async (id) => {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  markAllNotificationsAsRead: async () => {
    const res = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  triggerCheckDues: async () => {
    const res = await fetch(`${BASE_URL}/notifications/check-dues`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Accounts & Wallets
  getAccounts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/accounts?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createAccount: async (data) => {
    const res = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateAccount: async (id, data) => {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  transferBetweenAccounts: async (data) => {
    const res = await fetch(`${BASE_URL}/accounts/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  archiveAccount: async (id) => {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Workspaces & Family Management
  getWorkspaces: async () => {
    const res = await fetch(`${BASE_URL}/workspaces`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createFamilyWorkspace: async (data) => {
    const res = await fetch(`${BASE_URL}/workspaces/family`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getFamilySummary: async (workspaceId) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/summary`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  inviteFamilyMember: async (workspaceId, data) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateFamilyMember: async (workspaceId, memberId, data) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getFamilyMemberPayments: async (workspaceId, memberId) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/members/${memberId}/payments`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  addFamilyMemberPayment: async (workspaceId, memberId, data) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/members/${memberId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  removeFamilyMember: async (workspaceId, memberId) => {
    const res = await fetch(`${BASE_URL}/workspaces/family/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Planning: Budgets & Savings Goals
  getBudgets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/planning/budgets?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createBudget: async (data) => {
    const res = await fetch(`${BASE_URL}/planning/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteBudget: async (id) => {
    const res = await fetch(`${BASE_URL}/planning/budgets/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  getSavingsGoals: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/planning/savings-goals?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createSavingsGoal: async (data) => {
    const res = await fetch(`${BASE_URL}/planning/savings-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  addGoalContribution: async (id, data) => {
    const res = await fetch(`${BASE_URL}/planning/savings-goals/${id}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSavingsGoal: async (id) => {
    const res = await fetch(`${BASE_URL}/planning/savings-goals/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Loans: Borrowing & Lending
  getLoans: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/loans?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  createLoan: async (data) => {
    const res = await fetch(`${BASE_URL}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  addLoanRepayment: async (id, data) => {
    const res = await fetch(`${BASE_URL}/loans/${id}/repayments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteLoan: async (id) => {
    const res = await fetch(`${BASE_URL}/loans/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },
};

