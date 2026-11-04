import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ModuleGuidanceModal } from './components/guidance/ModuleGuidanceModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RecurringPage } from './pages/RecurringPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { api } from './services/api';

// Branded loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center text-white">
    <div className="w-12 h-12 rounded-2xl bg-brand-600 animate-spin flex items-center justify-center mb-4 shadow-purple-lg">
      <div className="w-4 h-4 bg-white rounded-full" />
    </div>
    <p className="text-sm font-bold tracking-wider text-brand-200">
      Loading RB Payment Management...
    </p>
  </div>
);

// Public Route Guard (Login / Auth)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    if (!isOnboarded) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Onboarding Route Guard (First-time customers)
const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboarded) return <Navigate to="/dashboard" replace />;
  return children;
};

// Main Authenticated Application Layout
const AppLayout = ({ children, activeModule }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch customer notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      if (res && res.success) {
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FAF7FF] flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative organic purple background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-purple-200/50 via-purple-100/25 to-transparent blur-[80px] pointer-events-none -z-0" />

      {/* Top Navbar with Mobile Hamburger Button */}
      <Navbar
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        isMobileMenuOpen={isMobileSidebarOpen}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full relative z-10">
        {/* Sidebar (Desktop icon dock + Mobile responsive slide-out drawer) */}
        <Sidebar
          onOpenGuidance={() => setShowGuidance(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Page Canvas with Error Boundary */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-x-hidden">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onNavigateToRecurring={() => navigate('/recurring')}
      />

      {/* Module "How to Use" Guidance Modal */}
      <ModuleGuidanceModal
        isOpen={showGuidance}
        onClose={() => setShowGuidance(false)}
        moduleKey={activeModule || 'dashboard'}
      />
    </div>
  );
};

// Protected Route Guard
const ProtectedRoute = ({ children, moduleKey }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout activeModule={moduleKey}>
      {children}
    </AppLayout>
  );
};

export function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* 1. Public Authentication Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* 2. Customer Onboarding Route */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage onComplete={() => navigate('/dashboard')} />
          </OnboardingRoute>
        }
      />

      {/* 3. Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 4. Protected Core Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute moduleKey="dashboard">
            <DashboardPage
              setActivePage={(path) => navigate(`/${path}`)}
              onTriggerAddTxn={(type) => navigate(`/transactions?type=${type}`)}
              onTriggerAddRecurring={() => navigate('/recurring?action=add')}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute moduleKey="transactions">
            <TransactionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recurring"
        element={
          <ProtectedRoute moduleKey="recurring">
            <RecurringPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute moduleKey="reports">
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute moduleKey="profile">
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* 5. 404 Catch-All Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
