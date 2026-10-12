import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from '../utils/constants';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import AdminLayout from '../layouts/AdminLayout';

// Guard Routes
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Unauthorized from '../pages/auth/Unauthorized';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import SubmitComplaint from '../pages/student/SubmitComplaint';
import MyComplaints from '../pages/student/MyComplaints';
import StudentComplaintDetails from '../pages/student/ComplaintDetails';
import Notifications from '../pages/student/Notifications';
import StudentProfile from '../pages/student/StudentProfile';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ComplaintQueue from '../pages/admin/ComplaintQueue';
import AdminComplaintDetails from '../pages/admin/ComplaintDetails';
import EscalatedComplaints from '../pages/admin/EscalatedComplaints';
import UserManagement from '../pages/admin/UserManagement';
import RoleManagement from '../pages/admin/RoleManagement';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

// Teacher Pages
import TeacherComplaints from '../pages/teacher/TeacherComplaints';
import NewTeacherComplaint from '../pages/teacher/NewTeacherComplaint';
import ReportStudent from '../pages/teacher/ReportStudent';

// Error Pages
import NotFound from '../pages/error/NotFound';

import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Authenticated Root Redirect */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/login" replace />} />
      </Route>

      {/* Student Protected Portal */}
      <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="complaints/new" element={<SubmitComplaint />} />
          <Route path="complaints/:complaintId" element={<StudentComplaintDetails />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>
      </Route>

      {/* Admin Protected Portal */}
      {/* Student ke alawa koi bhi role (naye/custom roles bhi) /admin portal mein aa sakta hai */}
      <Route element={<RoleRoute excludeRoles={[ROLES.STUDENT]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<ComplaintQueue />} />
          <Route path="complaints/:complaintId" element={<AdminComplaintDetails />} />
          <Route path="escalated" element={<EscalatedComplaints />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route element={<RoleRoute allowedRoles={[ROLES.TEACHER, ROLES.CLASS_TEACHER]} />}>
            <Route path="teacher/complaints" element={<TeacherComplaints />} />
            <Route path="teacher/new" element={<NewTeacherComplaint />} />
            <Route path="teacher/report-student" element={<ReportStudent />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;