import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const isModuleTutorialDoneLocally = (module, u) => {
  if (!u) return false;
  const phone = (u.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
  const rawId = u._id || u.id || '';
  if (phone && localStorage.getItem(`rb_tut_${module}_${phone}`) === 'done') return true;
  if (rawId && localStorage.getItem(`rb_tut_${module}_${rawId}`) === 'done') return true;
  if (localStorage.getItem(`rb_tut_${module}_customer`) === 'done') return true;
  if (localStorage.getItem(`rb_tut_${module}_done`) === 'done') return true;
  return false;
};

const checkCustomerOnboarded = (u) => {
  if (!u) return false;
  const phone = (u.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
  const localOnboarded = phone ? localStorage.getItem(`rb_customer_onboarded_${phone}`) === 'true' : false;
  const localName = phone ? localStorage.getItem(`rb_customer_name_${phone}`) : null;
  const hasCustomName = Boolean(
    u.name &&
    u.name.trim() !== '' &&
    !u.name.startsWith('Customer ') &&
    u.name !== 'Customer'
  );
  return Boolean(u.isOnboarded || hasCustomName || localOnboarded || (localName && localName.trim() !== ''));
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

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rb_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            const rawUser = res.user;
            const phone = (rawUser.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
            const localName = phone ? localStorage.getItem(`rb_customer_name_${phone}`) : null;
            const hasCustomName = Boolean(
              rawUser.name &&
              rawUser.name.trim() !== '' &&
              !rawUser.name.startsWith('Customer ') &&
              rawUser.name !== 'Customer'
            );
            const isOnboarded = checkCustomerOnboarded(rawUser);
            const resolvedName = (hasCustomName ? rawUser.name : localName) || rawUser.name || (phone ? `Customer ${phone.slice(-4)}` : 'Customer');

            // MERGE with local tutorial completions so a refresh NEVER resurrects completed tours
            const mergedTutorialStatus = {
              dashboard: Boolean(rawUser.tutorialStatus?.dashboard || isModuleTutorialDoneLocally('dashboard', rawUser)),
              transactions: Boolean(rawUser.tutorialStatus?.transactions || isModuleTutorialDoneLocally('transactions', rawUser)),
              recurring: Boolean(rawUser.tutorialStatus?.recurring || isModuleTutorialDoneLocally('recurring', rawUser)),
              reports: Boolean(rawUser.tutorialStatus?.reports || isModuleTutorialDoneLocally('reports', rawUser)),
            };

            const mergedUser = {
              ...rawUser,
              name: resolvedName,
              isOnboarded,
              tutorialStatus: mergedTutorialStatus,
            };

            if (phone && isOnboarded) {
              localStorage.setItem(`rb_customer_onboarded_${phone}`, 'true');
              if (resolvedName) localStorage.setItem(`rb_customer_name_${phone}`, resolvedName);
            }

            setUser(mergedUser);
            localStorage.setItem('rb_user', JSON.stringify(mergedUser));
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
    const phone = (userData?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
    const localName = phone ? localStorage.getItem(`rb_customer_name_${phone}`) : null;
    const hasCustomName = Boolean(
      userData?.name &&
      userData.name.trim() !== '' &&
      !userData.name.startsWith('Customer ') &&
      userData.name !== 'Customer'
    );
    const isOnboarded = checkCustomerOnboarded(userData);
    const resolvedName = (hasCustomName ? userData.name : localName) || userData?.name || (phone ? `Customer ${phone.slice(-4)}` : 'Customer');

    const mergedTutorialStatus = {
      dashboard: Boolean(userData?.tutorialStatus?.dashboard || isModuleTutorialDoneLocally('dashboard', userData)),
      transactions: Boolean(userData?.tutorialStatus?.transactions || isModuleTutorialDoneLocally('transactions', userData)),
      recurring: Boolean(userData?.tutorialStatus?.recurring || isModuleTutorialDoneLocally('recurring', userData)),
      reports: Boolean(userData?.tutorialStatus?.reports || isModuleTutorialDoneLocally('reports', userData)),
    };

    const mergedUser = {
      ...userData,
      name: resolvedName,
      isOnboarded,
      tutorialStatus: mergedTutorialStatus,
    };

    if (phone && isOnboarded) {
      localStorage.setItem(`rb_customer_onboarded_${phone}`, 'true');
      if (resolvedName) localStorage.setItem(`rb_customer_name_${phone}`, resolvedName);
    }

    setUser(mergedUser);
    localStorage.setItem('rb_token', authToken);
    localStorage.setItem('rb_user', JSON.stringify(mergedUser));
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
      const phone = (res.user.phoneNumber || user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
      const updatedUser = {
        ...res.user,
        isOnboarded: true,
      };
      if (phone) {
        localStorage.setItem(`rb_customer_onboarded_${phone}`, 'true');
        if (data.name) localStorage.setItem(`rb_customer_name_${phone}`, data.name.trim());
      }
      setUser(updatedUser);
      localStorage.setItem('rb_user', JSON.stringify(updatedUser));
    }
    return res;
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      const phone = (res.user.phoneNumber || user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
      const updatedUser = {
        ...res.user,
        isOnboarded: true,
      };
      if (phone && data.name) {
        localStorage.setItem(`rb_customer_onboarded_${phone}`, 'true');
        localStorage.setItem(`rb_customer_name_${phone}`, data.name.trim());
      }
      setUser(updatedUser);
      localStorage.setItem('rb_user', JSON.stringify(updatedUser));
    }
    return res;
  };

  const setModuleTutorialDone = async (module) => {
    try {
      const phone = (user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
      const rawId = user?._id || user?.id || '';
      // Mark permanently under all possible customer keys in browser localStorage
      if (phone) localStorage.setItem(`rb_tut_${module}_${phone}`, 'done');
      if (rawId) localStorage.setItem(`rb_tut_${module}_${rawId}`, 'done');
      localStorage.setItem(`rb_tut_${module}_customer`, 'done');
      localStorage.setItem(`rb_tut_${module}_done`, 'done');

      // Optimistic state update
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
      const phone = (user?.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);
      const rawId = user?._id || user?.id || '';
      const clearKeys = (m) => {
        if (phone) localStorage.removeItem(`rb_tut_${m}_${phone}`);
        if (rawId) localStorage.removeItem(`rb_tut_${m}_${rawId}`);
        localStorage.removeItem(`rb_tut_${m}_customer`);
        localStorage.removeItem(`rb_tut_${m}_done`);
      };

      if (targetModule) {
        clearKeys(targetModule);
      } else {
        ['dashboard', 'transactions', 'recurring', 'reports'].forEach(clearKeys);
      }

      setUser((prev) => {
        if (!prev) return prev;
        const current = { ...(prev.tutorialStatus || {}) };
        if (targetModule) {
          current[targetModule] = false;
        } else {
          current.dashboard = false;
          current.transactions = false;
          current.recurring = false;
          current.reports = false;
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
