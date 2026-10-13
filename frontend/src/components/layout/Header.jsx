import React from 'react';
import { Bell, LogOut, User as UserIcon, Menu, MoreVertical, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getRoleDisplayName } from '../../utils/formatters';
import { isStudentUser, getPrimaryRoleName } from '../../utils/permissions';
import { useUIStore } from '../../store/uiStore';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, deferredInstallPrompt, clearInstallPrompt } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isStudentRole = isStudentUser(user);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    clearInstallPrompt();
    setMenuOpen(false);
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="hide-desktop"
          onClick={toggleSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        >
          <Menu size={22} />
        </button>
        <img src="/icons/axis-logo.png" alt="Axis" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, whiteSpace: 'nowrap' }}>
            CCMS Portal
          </h1>
          <span className="hide-mobile" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>College Grievance Redressal</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={() => navigate(isStudentRole ? '/student/notifications' : '/admin/notifications')}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--status-not-solved-text)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        <div
          onClick={() => navigate(isStudentRole ? '/student/profile' : '/admin/settings')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)' }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-main)'
          }}>
            <UserIcon size={18} />
          </div>
          <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{user?.full_name}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{getRoleDisplayName(getPrimaryRoleName(user))}</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '2rem', backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)', minWidth: '160px', zIndex: 300, overflow: 'hidden'
            }}>
              {deferredInstallPrompt && (
                <div
                  onClick={handleInstall}
                  style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}
                >
                  <Download size={16} /> Install App
                </div>
              )}
              <div
                onClick={handleLogout}
                style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-not-solved-text)' }}
              >
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;