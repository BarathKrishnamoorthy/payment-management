import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rb_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rb_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('rb_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => logout();
    window.addEventListener('rb_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('rb_unauthorized', handleUnauthorized);
  }, []);

  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('rb_token', authToken);
    localStorage.setItem('rb_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');
  };

  const completeOnboarding = async (data) => {
    const res = await api.completeOnboarding(data);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('rb_user', JSON.stringify(res.user));
    }
    return res;
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('rb_user', JSON.stringify(res.user));
    }
    return res;
  };

  const setModuleTutorialDone = async (module) => {
    try {
      // Optimistic update
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          tutorialStatus: {
            ...(prev.tutorialStatus || {}),
            [module]: true,
          },
        };
        localStorage.setItem('rb_user', JSON.stringify(updated));
        return updated;
      });

      await api.updateTutorialStatus(module, true);
    } catch (e) {
      console.warn('Tutorial update sync error:', e);
    }
  };

  const resetAllTutorials = async () => {
    try {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          tutorialStatus: {
            dashboard: false,
            transactions: false,
            recurring: false,
            reports: false,
          },
        };
        localStorage.setItem('rb_user', JSON.stringify(updated));
        return updated;
      });

      await api.resetTutorialStatus();
    } catch (e) {
      console.warn('Tutorial reset error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isOnboarded: !!user?.isOnboarded,
        login,
        logout,
        completeOnboarding,
        updateProfile,
        setModuleTutorialDone,
        resetAllTutorials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

