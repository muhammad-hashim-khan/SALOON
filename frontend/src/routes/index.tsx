import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleRoute } from '../components/auth/RoleRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { WorkerLayout } from '../components/layout/WorkerLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminBillsPage } from '../pages/admin/AdminBillsPage';
import { AdminWorkersPage } from '../pages/admin/AdminWorkersPage';
import { AdminExpensesPage } from '../pages/admin/AdminExpensesPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { WorkerBillingPage } from '../pages/worker/WorkerBillingPage';
import { WorkerBillsPage } from '../pages/worker/WorkerBillsPage';
import { ReceiptPage } from '../pages/worker/ReceiptPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * Root Index Redirection Component
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/worker/billing" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Intelligent Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Routes (Role: ADMIN only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="bills" element={<AdminBillsPage />} />
        <Route path="workers" element={<AdminWorkersPage />} />
        <Route path="expenses" element={<AdminExpensesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Worker Protected Routes (Role: WORKER only) */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['WORKER']}>
              <WorkerLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/worker/billing" replace />} />
        <Route path="billing" element={<WorkerBillingPage />} />
        <Route path="bills" element={<WorkerBillsPage />} />
        <Route path="bills/:id" element={<ReceiptPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
