import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { isStudentUser } from '../../utils/permissions';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const NOTIF_TYPE_LABELS = {
  COMPLAINT_ASSIGNED: 'New Complaint Assigned',
  ACTION_TAKEN_CONFIRM_NEEDED: 'Action Taken — Confirmation Needed',
  STUDENT_REJECTED: 'Student Marked Not Solved',
  COMPLAINT_ESCALATED: 'Complaint Escalated to You',
  SLA_BREACH_ESCALATED: 'Auto-Escalated (SLA Breach)',
  COMPLAINT_UNRESOLVED_FINAL: 'Complaint Closed (Unresolved)',
  COMPLAINT_CLOSED_UNRESOLVED: 'Complaint Closed (Unresolved)',
  MAX_ESCALATION_REACHED: 'Maximum Escalation Reached',
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const isStudent = isStudentUser(user);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (n) => {
    if (!n.is_read) await markRead(n.id);
    if (n.complaint_id) {
      navigate(isStudent ? `/student/complaints/${n.complaint_id}` : `/admin/complaints/${n.complaint_id}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notifications</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Grievance alerts and status updates.</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You are all caught up." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                cursor: 'pointer',
                padding: '1rem',
                backgroundColor: n.is_read ? 'var(--color-bg-surface)' : 'var(--color-primary-light)',
                borderLeft: n.is_read ? '1px solid var(--color-border)' : '4px solid var(--color-primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {NOTIF_TYPE_LABELS[n.type] || n.type}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>{formatDate(n.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>{n.message}</p>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notifications;