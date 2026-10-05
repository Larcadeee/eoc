import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AccountPending from './pages/auth/AccountPending';
import AccessDenied from './pages/auth/AccessDenied';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import EncoderDashboard from './pages/encoder/EncoderDashboard';
import ViewerDashboard from './pages/viewer/ViewerDashboard';

// Helper component: routes active authenticated users to their corresponding dashboard
function RoleHomeDispatcher() {
  const { role } = useAuth();

  switch (role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'SUPERVISOR':
      return <Navigate to="/supervisor" replace />;
    case 'ENCODER':
      return <Navigate to="/encoder" replace />;
    case 'VIEWER':
      return <Navigate to="/viewer" replace />;
    default:
      return <Navigate to="/access-denied" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account-pending" element={<AccountPending />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Protected Operational Routes (Must be Authenticated and ACTIVE) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleHomeDispatcher />} />

          {/* ADMIN-only routes */}
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* SUPERVISOR-only routes */}
          <Route element={<RoleRoute allowedRoles={['SUPERVISOR', 'ADMIN']} />}>
            <Route path="/supervisor" element={<SupervisorDashboard />} />
          </Route>

          {/* ENCODER routes */}
          <Route element={<RoleRoute allowedRoles={['ENCODER', 'SUPERVISOR', 'ADMIN']} />}>
            <Route path="/encoder" element={<EncoderDashboard />} />
          </Route>

          {/* VIEWER routes */}
          <Route element={<RoleRoute allowedRoles={['VIEWER', 'ENCODER', 'SUPERVISOR', 'ADMIN']} />}>
            <Route path="/viewer" element={<ViewerDashboard />} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}