import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAdminAuth } from './store/adminAuthStore';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import UsersPage from './pages/UsersPage';
import ProvidersPage from './pages/ProvidersPage';
import TransactionsPage from './pages/TransactionsPage';
import DisputesPage from './pages/DisputesPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import SettingsPage from './pages/SettingsPage';

export default function App(): React.JSX.Element {
  const { isAuthenticated, isInitialized } = useAdminAuth();

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
