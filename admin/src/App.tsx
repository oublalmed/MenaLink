import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAdminAuth } from './store/adminAuthStore';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import DisputesPage from './pages/DisputesPage';
import SettingsPage from './pages/SettingsPage';

const ClientsPage = React.lazy(() => import('./pages/ClientsPage'));
const ProvidersPage = React.lazy(() => import('./pages/ProvidersPage'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App(): React.JSX.Element {
  const { isAuthenticated, isInitialized, initialize } = useAdminAuth();

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#FBF4EC',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route
            path="users/clients"
            element={
              <React.Suspense fallback={<Spin />}>
                <ClientsPage />
              </React.Suspense>
            }
          />
          <Route
            path="users/providers"
            element={
              <React.Suspense fallback={<Spin />}>
                <ProvidersPage />
              </React.Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <React.Suspense fallback={<Spin />}>
                <PaymentsPage />
              </React.Suspense>
            }
          />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        {/* Catch-all: redirect unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
