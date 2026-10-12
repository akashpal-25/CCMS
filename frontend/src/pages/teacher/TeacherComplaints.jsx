import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

// Teacher ki apni file ki hui complaints (sirf wahi dekh sakta hai)
const TeacherComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    complaintService
      .getTeacherComplaints()
      .then(setComplaints)
      .catch((err) => setError(err.response?.data?.detail || 'Could not load your complaints.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading your complaints..." />;

  const typeLabel = (c) => (c.complaint_type === 'TEACHER_STUDENT_REPORT' ? 'Student Report' : 'My Complaint');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Complaints</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Complaints and student reports filed by you. Only you and the concerned authority can see them.
          </p>
        </div>
        <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/admin/teacher/new')}>
          New Complaint
        </Button>
      </div>

      {error && <p style={{ fontSize: '0.8125rem', color: 'var(--status-not-solved-text)' }}>{error}</p>}

      {complaints.length === 0 ? (
        <EmptyState title="No complaints yet" description="Complaints you file will appear here." />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['Complaint No.', 'Title', 'Type', 'Status', 'Filed On']}>
            {complaints.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/admin/complaints/${c.id}`)}
                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{c.complaint_number}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{typeLabel(c)}</td>
                <td style={{ padding: '1rem' }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherComplaints;
