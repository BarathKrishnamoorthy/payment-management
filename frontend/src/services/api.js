const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('rb_token');
  const headers = { 'Bypass-Tunnel-Reminder': 'true' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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
        'Bypass-Tunnel-Reminder': 'true',
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
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({ phoneNumber, otp }),
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
};

