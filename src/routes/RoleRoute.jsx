import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowedRoles }) {
  const { role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}