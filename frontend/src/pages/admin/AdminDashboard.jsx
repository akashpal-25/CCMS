import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import { getRoleDisplayName, formatDate } from '../../utils/formatters';
import { getPrimaryRoleName } from '../../utils/permissions';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = await adminService.getAdminStats();
      const list = await adminService.getAdminComplaints();
      setStats(s);
      setRecentComplaints(list.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader message="Compiling administrative queue..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Card style={{ backgroundColor: 'var(--color-bg-surface)', padding: '1.5rem', borderLeft: '5px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {getRoleDisplayName(getPrimaryRoleName(user))}
            </span>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0.2rem 0' }}>Authority Overview: {user?.full_name}</h2>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/admin/complaints')}>
            Open Full Queue
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <Card>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>QUEUE TOTAL</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats?.total || 0}</h3>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-under-review-text)', fontWeight: 600 }}>UNDER REVIEW</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--status-under-review-text)' }}>{stats?.underReview || 0}</h3>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-in-progress-text)', fontWeight: 600 }}>AWAITING STUDENT</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--status-in-progress-text)' }}>{stats?.pendingConfirmation || 0}</h3>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-escalated-text)', fontWeight: 600 }}>ESCALATED</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--status-escalated-text)' }}>{stats?.escalated || 0}</h3>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)', fontWeight: 600 }}>SLA BREACHED</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--status-not-solved-text)' }}>{stats?.breached || 0}</h3>
        </Card>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Grievances Pending Action</h3>
          <Button variant="outline" size="sm" icon={ArrowRight} onClick={() => navigate('/admin/complaints')}>
            View All
          </Button>
        </div>

        {recentComplaints.length === 0 ? (
          <EmptyState title="No complaints in your queue" description="Nothing assigned to you right now." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentComplaints.map((c) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/admin/complaints/${c.id}`)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{c.complaint_number}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>• Student: {c.student_name} ({c.department_name})</span>
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{c.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Domain: {c.domain_name} • Submitted: {formatDate(c.created_at)}</span>
                </div>
                <StatusBadge status={c.status} />
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;