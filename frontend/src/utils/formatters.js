export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getRoleDisplayName = (role) => {
  const map = {
    STUDENT: 'Student',
    CLASS_TEACHER: 'Class Teacher',
    HOD: 'Head of Department (HOD)',
    EXAM_ADMIN: 'Examination Controller',
    HR_FINANCE: 'Finance & Accounts Officer',
    WARDEN: 'Chief Hostel Warden',
    TRANSPORT_SUPERVISOR: 'Transport Supervisor',
    DIRECTOR: 'Director',
    SUPER_ADMIN: 'Super Administrator'
  };
  return map[role] || role || 'User';
};