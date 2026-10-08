import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentStore } from '../../store/studentStore';
import { COMPLAINT_STATUS, COMPLAINT_STATUS_LABELS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const MyComplaints = () => {
  const navigate = useNavigate();
  const { complaints, fetchMyComplaints } = useStudentStore();

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const domainOptions = useMemo(() => {
    const unique = new Set(complaints.map((c) => c.domain_name).filter(Boolean));
    return Array.from(unique);
  }, [complaints]);

  const filteredComplaints = complaints.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(q) || c.complaint_number.toLowerCase().includes(q);
    const matchesDomain = domainFilter === 'ALL' || c.domain_name === domainFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesDomain && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Complaint Records</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Track resolution status, SLA countdowns, and official updates.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/student/complaints/new')}>
          + New Complaint
        </Button>
      </div>

      <Card style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <Input
            placeholder="Search by ID or Subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Domains</option>
            {domainOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Statuses</option>
            {Object.values(COMPLAINT_STATUS).map((s) => (
              <option key={s} value={s}>{COMPLAINT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {filteredComplaints.length === 0 ? (
        <EmptyState
          title="No grievances matching filter criteria"
          description="Try resetting your search query or status filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredComplaints.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate(`/student/complaints/${c.id}`)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', transition: 'var(--transition-fast)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                    {c.complaint_number}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    • {c.domain_name}{c.category_name ? ` (${c.category_name})` : ''}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{c.title}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  <span>Filed: {formatDate(c.created_at)}</span>
                  {c.assigned_to_name && <span>Assigned To: {c.assigned_to_name}</span>}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyComplaints;