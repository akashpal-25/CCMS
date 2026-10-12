import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserRoleNames } from '../utils/permissions';

// allowedRoles: in mein se koi ek role ho to andar jaane do (khali = koi bhi login user)
// excludeRoles: in roles ke alawa koi bhi role (custom roles bhi) ho to andar jaane do
const RoleRoute = ({ allowedRoles = [], excludeRoles = [] }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoleNames = getUserRoleNames(user);

  let hasAccess;
  if (excludeRoles.length > 0) {
    hasAccess = userRoleNames.some((r) => !excludeRoles.includes(r));
  } else {
    hasAccess = allowedRoles.length === 0 || userRoleNames.some((r) => allowedRoles.includes(r));
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;