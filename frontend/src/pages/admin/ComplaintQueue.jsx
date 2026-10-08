import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { COMPLAINT_STATUS, COMPLAINT_STATUS_LABELS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const ComplaintQueue = () => {
  const navigate = useNavigate();
  const [allComplaints, setAllComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await adminService.getAdminComplaints();
    setAllComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const domainOptions = useMemo(() => {
    const unique = new Set(allComplaints.map((c) => c.domain_name).filter(Boolean));
    return Array.from(unique);
  }, [allComplaints]);
  const departmentOptions = useMemo(() => {
    const unique = new Set(allComplaints.map((c) => c.department_name).filter(Boolean));
    return Array.from(unique).sort();
  }, [allComplaints]);

  const filtered = allComplaints.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.complaint_number.toLowerCase().includes(q) || (c.student_name || '').toLowerCase().includes(q);
    const matchesDomain = domainFilter === 'ALL' || c.domain_name === domainFilter;
    const matchesDepartment = departmentFilter === 'ALL' || c.department_name === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesDomain && matchesDepartment && matchesStatus;
  });

  const headers = ['Complaint No.', 'Student', 'Department', 'Domain', 'Status', 'Date', 'Action'];

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Institutional Complaint Queue</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Role-filtered queue of grievances assigned to your administrative unit.</p>
      </div>

      <Card style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <Input
            placeholder="Search by student, ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}
        >
          <option value="ALL">All Departments</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
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
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState title="No complaints match this queue filter" />
        ) : (
          <Table headers={headers}>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{c.complaint_number}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.student_college_id}</div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{c.department_name}</td>
                <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{c.domain_name}</td>
                <td style={{ padding: '1rem' }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</td>
                <td style={{ padding: '1rem' }}>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/complaints/${c.id}`)}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};

export default ComplaintQueue;