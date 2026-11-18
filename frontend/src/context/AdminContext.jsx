import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem('rb_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('rb_admin_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate admin session on mount
  useEffect(() => {
    const initAdmin = async () => {
      const savedToken = localStorage.getItem('rb_admin_token');
      if (savedToken) {
        try {
          const res = await adminApi.getMe();
          if (res && res.success && res.admin) {
            setAdmin(res.admin);
            localStorage.setItem('rb_admin_user', JSON.stringify(res.admin));
          } else {
            logout();
          }
        } catch (e) {
          // If network is offline but local session exists, keep local state
          console.warn('[AdminContext] Sync warning:', e.message);
        }
      }
      setLoading(false);
    };

    initAdmin();
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    if (res && res.success && res.token) {
      setToken(res.token);
      setAdmin(res.admin);
      localStorage.setItem('rb_admin_token', res.token);
      localStorage.setItem('rb_admin_user', JSON.stringify(res.admin));
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = () => {
    adminApi.logout();
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('rb_admin_token');
    localStorage.removeItem('rb_admin_user');
  };

  const refreshAdmin = async () => {
    try {
      const res = await adminApi.getMe();
      if (res && res.success && res.admin) {
        setAdmin(res.admin);
        localStorage.setItem('rb_admin_user', JSON.stringify(res.admin));
      }
    } catch (e) {
      // ignore
    }
  };

  const value = {
    admin,
    token,
    isAuthenticated: Boolean(token && admin),
    loading,
    login,
    logout,
    refreshAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
