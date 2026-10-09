// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Navigation & Layout
import AdminSidebar from './components/navigation/AdminSidebar';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AccountPending from './pages/auth/AccountPending';
import AccessDenied from './pages/auth/AccessDenied';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import EncoderDashboard from './pages/encoder/EncoderDashboard';
import WeatherDashboard from './pages/weather/WeatherDashboard';
import SitRepWorkspace from './pages/encoder/SitRepWorkspace';
import ViewerDashboard from './pages/viewer/ViewerDashboard';

// Layout: Conditionally renders AdminSidebar ONLY for the ADMIN role
function AppLayout() {
  const { profile } = useAuth();
  const isAdmin = (profile?.role || '').toUpperCase() === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar rendered strictly for ADMIN */}
      {isAdmin && <AdminSidebar />}

      {/* Main content takes full width for non-admins, flex-1 when sidebar is mounted */}
      <main className="flex-1 overflow-x-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

// Resilient Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500 font-sans">
        Authenticating CDRRMD Portal Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const status = (profile?.status || '').toUpperCase();
  if (status === 'PENDING') {
    return <Navigate to="/account-pending" replace />;
  }
  if (status !== 'ACTIVE') {
    return <Navigate to="/access-denied" replace />;
  }

  const userRole = (profile?.role || '').toUpperCase();

  // ADMIN has universal clearance across all desks
  if (userRole === 'ADMIN') {
    return children;
  }

  // Role restrictions for non-admin accounts
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    if (!normalizedAllowed.includes(userRole)) {
      const fallback = userRole === 'SUPERVISOR' ? '/supervisor' : '/encoder';
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}

// Dynamic Root Redirection based on role
function RootRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500 font-sans">
        Loading Operations Desk...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const status = (profile?.status || '').toUpperCase();
  if (status === 'PENDING') {
    return <Navigate to="/account-pending" replace />;
  }
  if (status !== 'ACTIVE') {
    return <Navigate to="/access-denied" replace />;
  }

  const role = (profile?.role || '').toUpperCase();
  if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'SUPERVISOR') {
    return <Navigate to="/supervisor" replace />;
  }
  if (role === 'ENCODER') {
    return <Navigate to="/encoder" replace />;
  }
  if (role === 'VIEWER'){
    return <Navigate to="/viewer" replace />;
  }
  return <Navigate to="/account-pending" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/account-pending" element={<AccountPending />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Root dynamic redirect */}
          <Route path="/" element={<RootRoute />} />

          {/* Core Shell (Persistent Sidebar exclusively for ADMIN) */}
          <Route element={<AppLayout />}>
            {/* 1. Main Command Desk - Strictly restricted to ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 2. Supervisor Desk - Accessible to SUPERVISOR & ADMIN */}
            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />

            {/* 3. Encoder Operations Desk - Accessible to ENCODER & ADMIN */}
            <Route
              path="/encoder"
              element={
                <ProtectedRoute allowedRoles={['ENCODER', 'ADMIN']}>
                  <EncoderDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/viewer" element={
              <ProtectedRoute allowedRoles={['VIEWER', 'ADMIN']}>
                <ViewerDashboard />
              </ProtectedRoute>
            } />


            {/* 4. Weather & Hazards Monitoring - Accessible to all authorized roles */}
            <Route
              path="/weather"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'ENCODER']}>
                  <WeatherDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Full-width Workspace (No sidebar interference for all roles during intake & PDF print) */}
          <Route
            path="/sitrep/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'ENCODER']}>
                <SitRepWorkspace />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}