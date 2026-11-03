import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ModuleGuidanceModal } from './components/guidance/ModuleGuidanceModal';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RecurringPage } from './pages/RecurringPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';

export function App() {
  const { isAuthenticated, isOnboarded, loading, user, resetAllTutorials } = useAuth();

  const [activePage, setActivePage] = useState('dashboard');
  const [showGuidance, setShowGuidance] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Quick action props
  const [txnPresetType, setTxnPresetType] = useState(null);

  // Key to force re-mounting page when user clicks "Replay Tour"
  const [replayKey, setReplayKey] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      fetchNotifications();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      fetchNotifications();
    } catch (e) {
      console.warn(e);
    }
  };

  // Replay tour for current active module
  const handleReplayTour = async () => {
    try {
      await api.resetTutorialStatus(activePage);
      // Update local context
      if (user && user.tutorialStatus) {
        user.tutorialStatus[activePage] = false;
      }
      setReplayKey((prev) => prev + 1);
    } catch (e) {
      console.warn(e);
    }
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 animate-spin flex items-center justify-center mb-4">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
        <p className="text-sm font-bold tracking-wider text-brand-200">
          Loading RB Payment Management...
        </p>
      </div>
    );
  }

  // 1. Not Authenticated -> Show Login & OTP
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 2. First-time login -> Customer Onboarding
  if (!isOnboarded) {
    return <OnboardingPage onComplete={() => setActivePage('dashboard')} />;
  }

  // 3. Authenticated & Onboarded -> Main Application Layout
  return (
    <div className="min-h-screen bg-brand-50/50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setTxnPresetType(null);
          setActivePage(page);
        }}
        onOpenGuidance={() => setShowGuidance(true)}
        onReplayTour={handleReplayTour}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activePage === 'dashboard' && (
          <DashboardPage
            key={`dash-${replayKey}`}
            setActivePage={(p) => {
              setTxnPresetType(null);
              setActivePage(p);
            }}
            onTriggerAddTxn={(type) => {
              setTxnPresetType(type);
              setActivePage('transactions');
            }}
            onTriggerAddRecurring={() => setActivePage('recurring')}
          />
        )}

        {activePage === 'transactions' && (
          <TransactionsPage
            key={`txn-${replayKey}`}
            initialType={txnPresetType}
          />
        )}

        {activePage === 'recurring' && (
          <RecurringPage key={`rec-${replayKey}`} />
        )}

        {activePage === 'reports' && (
          <ReportsPage key={`rep-${replayKey}`} />
        )}

        {activePage === 'profile' && (
          <ProfilePage key={`prof-${replayKey}`} />
        )}
      </main>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onNavigateToRecurring={() => setActivePage('recurring')}
      />

      {/* Module "How to Use" Guidance Modal */}
      <ModuleGuidanceModal
        isOpen={showGuidance}
        onClose={() => setShowGuidance(false)}
        moduleKey={activePage}
      />
    </div>
  );
}

export default App;
