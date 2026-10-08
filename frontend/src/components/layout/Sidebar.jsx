import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Bell, User, Users, Shield, BarChart3, Settings, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { isStudentUser, isSuperAdminUser } from '../../utils/permissions';
const Sidebar = () => {
  const { user } = useAuthStore();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const isStudent = isStudentUser(user);
  const isSuperAdmin = isSuperAdminUser(user);
  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/complaints/new', label: 'Submit Complaint', icon: PlusCircle },
    { to: '/student/complaints', label: 'My Complaints', icon: FileText },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'My Profile', icon: User }
  ];
  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/complaints', label: 'Complaint Queue', icon: FileText },
    { to: '/admin/escalated', label: 'Escalations', icon: Shield },
    { to: '/admin/reports', label: 'Reports & SLA', icon: BarChart3 },
    ...(isSuperAdmin ? [
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/roles', label: 'Role Permissions', icon: Shield },
      { to: '/admin/settings', label: 'Settings', icon: Settings }
    ] : [])
  ];
  const links = isStudent ? studentLinks : adminLinks;
  return (
    <>
      <div className="sidebar-overlay" onClick={closeSidebar}
        style={{ display: isSidebarOpen ? 'block' : 'none' }} />
      <aside className={`app-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}
        style={{
          width: '240px', backgroundColor: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)', display: 'flex',
          flexDirection: 'column', padding: '1.5rem 0.75rem', gap: '0.375rem'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 0.75rem 1rem 0.75rem', borderBottom: '1px solid var(--color-border)',
          marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isStudent ? 'Student Workspace' : 'Administration'}
          </span>
          <button className="hide-desktop" onClick={closeSidebar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={closeSidebar}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem', fontWeight: 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                transition: 'var(--transition-fast)'
              })}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </aside>
    </>
  );
};
export default Sidebar;