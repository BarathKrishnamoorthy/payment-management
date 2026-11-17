import React from 'react';
import { Navigate } from 'react-router-dom';

export const OnboardingPage = () => {
  return <Navigate to="/dashboard" replace />;
};
