import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { AdminLayout } from './AdminLayout';

export const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-16 h-16 rounded-3xl bg-white p-2.5 flex items-center justify-center mb-4 shadow-purple-lg border border-white/20 animate-pulse">
          <img src="/logo-icon.png" alt="ERM Emblem" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-bold tracking-wider text-brand-200">
          Loading ERM Admin Portal...
        </p>
        <p className="text-xs text-brand-400 mt-1 font-medium">
          Every Rupee Matters • Central Control
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};
