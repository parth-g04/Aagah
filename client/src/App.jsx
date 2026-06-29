import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import MPOverviewPage from './pages/MPOverviewPage';
import OfficerOverviewPage from './pages/OfficerOverviewPage';
import BlockDetailPage from './pages/BlockDetailPage';
import InterventionsPage from './pages/InterventionsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OTPPage />} />

          {/* MP Protected Routes */}
          <Route
            path="/mp"
            element={
              <ProtectedRoute allowedRoles={['mp', 'admin']}>
                <MPOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mp/blocks/:id"
            element={
              <ProtectedRoute allowedRoles={['mp', 'officer', 'admin']}>
                <BlockDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Officer Protected Routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['officer', 'admin']}>
                <OfficerOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/blocks/:id"
            element={
              <ProtectedRoute allowedRoles={['mp', 'officer', 'admin']}>
                <BlockDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/interventions"
            element={
              <ProtectedRoute allowedRoles={['mp', 'officer', 'admin']}>
                <InterventionsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
