// Admin API Client for Centralized ERM Admin Dashboard

const BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://backend-nine-zeta-zy9fgdrzlm.vercel.app/api'
    : '/api'
);

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('rb_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        // Clear invalid admin token
        localStorage.removeItem('rb_admin_token');
        localStorage.removeItem('rb_admin_user');
      }
      throw new Error(data.message || `Admin API Error: ${res.status}`);
    }
    return data;
  } catch (err) {
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    throw err;
  }
};

export const adminApi = {
  // 1. Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  logout: async () => {
    try {
      await fetch(`${BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
      });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('rb_admin_token');
    localStorage.removeItem('rb_admin_user');
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${BASE_URL}/admin/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (data) => {
    const res = await fetch(`${BASE_URL}/admin/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // 2. Dashboard 10 KPIs
  getDashboardStats: async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  // 3. User Activity Trends
  getActivityTrends: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/admin/analytics/trends?${query}`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  // 4. Active Users
  getActiveUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/admin/users/active?${query}`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  // 5. User Management
  getAllUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/admin/users?${query}`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  getUserDetails: async (id) => {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  updateUserStatus: async (id, status) => {
    const res = await fetch(`${BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  blockUser: async (id, isBlocked, reason = '') => {
    const res = await fetch(`${BASE_URL}/admin/users/${id}/block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ isBlocked, reason }),
    });
    return handleResponse(res);
  },

  // 6. Platform Analytics
  getPlatformAnalytics: async () => {
    const res = await fetch(`${BASE_URL}/admin/platform`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },

  // 7. Reports & Export
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/admin/reports?${query}`, {
      headers: { ...getAdminAuthHeaders() },
    });
    return handleResponse(res);
  },
};
