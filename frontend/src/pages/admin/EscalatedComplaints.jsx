import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { COMPLAINT_STATUS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const EscalatedComplaints = () => {
  const navigate = useNavigate();
  const [escalated, setEscalated] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await adminService.getAdminComplaints({ status: COMPLAINT_STATUS.ESCALATED });
      setEscalated(data);
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Apex Escalation Center</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Grievances flagged due to SLA breach or student rejection of resolution.
        </p>
      </div>

      {escalated.length === 0 ? (
        <EmptyState title="Zero active escalations" description="All department grievances are proceeding within SLA tolerances." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {escalated.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate(`/admin/complaints/${c.id}`)}
              style={{ cursor: 'pointer', borderLeft: '4px solid var(--status-escalated-text)', padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{c.complaint_number}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.2rem' }}>{c.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Student: {c.student_name} • Dept: {c.department_name}
                    {c.assigned_to_name ? ` • Now with: ${c.assigned_to_name}` : ''}
                  </span>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EscalatedComplaints;