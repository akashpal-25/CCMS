import { ROLES } from './constants';

export const getUserRoleNames = (user) => (user?.roles || []).map((r) => r.role_name);

export const isStudentUser = (user) => getUserRoleNames(user).includes(ROLES.STUDENT);

export const isSuperAdminUser = (user) => getUserRoleNames(user).includes(ROLES.SUPER_ADMIN);

export const getPrimaryRoleName = (user) => {
  const names = getUserRoleNames(user);
  return names.length > 0 ? names[0] : null;
};