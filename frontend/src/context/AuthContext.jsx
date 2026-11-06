import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const checkCustomerOnboarded = (u) => {
  if (!u) return false;
  // If backend says user is onboarded, they are onboarded
  if (u.isOnboarded === true) return true;
  // If user has a valid custom name (not empty, not default 'Customer')
  if (
    u.name &&
    u.name.trim() !== '' &&
    !u.name.startsWith('Customer ') &&
    u.name !== 'Customer'
  ) {
    return true;
  }
  return false;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rb_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed) {
        parsed.isOnboarded = checkCustomerOnboarded(parsed);
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rb_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify session on load from backend
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rb_token');
      const storedUser = localStorage.getItem('rb_user');

      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res && res.success && res.user) {
            const rawUser = res.user;
            const isOnboarded = checkCustomerOnboarded(rawUser);

            const mergedUser = {
              ...rawUser,
              isOnboarded,
              tutorialStatus: rawUser.tutorialStatus || {},
            };

            setUser(mergedUser);
            localStorage.setItem('rb_user', JSON.stringify(mergedUser));
          } else if (!storedUser) {
            // Only clear token if we have no stored user profile at all
            logout();
          }
        } catch (err) {
          console.warn('[AuthContext] Session verification warning (maintaining local session):', err.message);
          // Do NOT logout on transient network failure or API HTML response when we have a valid local session
          if (!storedUser) {
            logout();
          }
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
    // Clear any previous user's cached ledger/dashboard data to ensure strict user isolation
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('rb_dash_') ||
          key.startsWith('rb_txns_') ||
          key.startsWith('rb_rec_') ||
          key.startsWith('rb_tut_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    setToken(authToken);
    const isOnboarded = checkCustomerOnboarded(userData);
    const mergedUser = {
      ...userData,
      isOnboarded,
      tutorialStatus: userData?.tutorialStatus || {},
    };

    setUser(mergedUser);
    localStorage.setItem('rb_token', authToken);
    localStorage.setItem('rb_user', JSON.stringify(mergedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');

    // Clean up all cached session keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('rb_dash_') ||
          key.startsWith('rb_txns_') ||
          key.startsWith('rb_rec_') ||
          key.startsWith('rb_customer_') ||
          key.startsWith('rb_tut_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  };

  const completeOnboarding = async (data) => {
    const res = await api.completeOnboarding(data);
    if (res.success && res.user) {
      const updatedUser = {
        ...res.user,
        isOnboarded: true,
      };
      setUser(updatedUser);
      localStorage.setItem('rb_user', JSON.stringify(updatedUser));
    }
    return res;
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      const updatedUser = {
        ...res.user,
        isOnboarded: checkCustomerOnboarded(res.user),
      };
      setUser(updatedUser);
      localStorage.setItem('rb_user', JSON.stringify(updatedUser));
    }
    return res;
  };

  const setModuleTutorialDone = async (module) => {
    try {
      const uid = user?._id || user?.id || '';
      if (uid) {
        localStorage.setItem(`rb_tut_${module}_${uid}`, 'done');
      }

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

  const resetAllTutorials = async (targetModule) => {
    try {
      const uid = user?._id || user?.id || '';
      if (uid) {
        if (targetModule) {
          localStorage.removeItem(`rb_tut_${targetModule}_${uid}`);
        } else {
          ['dashboard', 'transactions', 'recurring', 'reports', 'accounts', 'family', 'planning', 'loans'].forEach((m) => {
            localStorage.removeItem(`rb_tut_${m}_${uid}`);
          });
        }
      }

      setUser((prev) => {
        if (!prev) return prev;
        const current = { ...(prev.tutorialStatus || {}) };
        if (targetModule) {
          current[targetModule] = false;
        } else {
          Object.keys(current).forEach((k) => {
            current[k] = false;
          });
        }
        const updated = { ...prev, tutorialStatus: current };
        localStorage.setItem('rb_user', JSON.stringify(updated));
        return updated;
      });

      await api.resetTutorialStatus(targetModule);
    } catch (e) {
      console.warn('Tutorial reset error:', e);
    }
  };

  const isOnboarded = checkCustomerOnboarded(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isOnboarded,
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
