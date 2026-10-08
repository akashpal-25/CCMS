import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { COMPLAINT_STATUS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Loader from '../../components/common/Loader';

const Reports = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAdminComplaints().then((data) => {
      setComplaints(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED).length;
    const notSolved = complaints.filter((c) => c.status === COMPLAINT_STATUS.NOT_SOLVED).length;
    const escalated = complaints.filter((c) => c.status === COMPLAINT_STATUS.ESCALATED).length;
    const breached = complaints.filter((c) => c.sla_status === 'BREACHED').length;
    const open = total - resolved - notSolved;

    const slaComplianceRate = total > 0 ? Math.round(((total - breached) / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, resolved, notSolved, escalated, breached, open, slaComplianceRate, escalationRate, resolutionRate };
  }, [complaints]);

  const domainBreakdown = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const key = c.domain_name || 'Unspecified';
      if (!map[key]) map[key] = { domain: key, total: 0, resolved: 0, escalated: 0, breached: 0 };
      map[key].total += 1;
      if (c.status === COMPLAINT_STATUS.RESOLVED) map[key].resolved += 1;
      if (c.status === COMPLAINT_STATUS.ESCALATED) map[key].escalated += 1;
      if (c.sla_status === 'BREACHED') map[key].breached += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [complaints]);

  if (loading) return <Loader message="Compiling institutional reports..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Institutional Redressal & SLA Reports</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Live performance snapshot computed from current complaint records in your visibility scope.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>SLA Compliance Rate</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--status-resolved-text)' }}>{stats.slaComplianceRate}%</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Complaints still within SLA deadline (not breached), out of {stats.total} total.
          </p>
        </Card>

        <Card>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Resolution Rate</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.resolutionRate}%</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {stats.resolved} of {stats.total} complaints confirmed resolved by students.
          </p>
        </Card>

        <Card>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Escalation Rate</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--status-escalated-text)' }}>{stats.escalationRate}%</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {stats.escalated} complaints currently escalated beyond first-level authority.
          </p>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</h3>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>OPEN / IN-PROGRESS</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.open}</h3>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>RESOLVED</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-resolved-text)' }}>{stats.resolved}</h3>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>NOT SOLVED</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-not-solved-text)' }}>{stats.notSolved}</h3>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SLA BREACHED</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-not-solved-text)' }}>{stats.breached}</h3>
        </Card>
      </div>

      <div>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>Domain-wise Breakdown</h3>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['Domain', 'Total', 'Resolved', 'Escalated', 'SLA Breached']}>
            {domainBreakdown.map((d) => (
              <tr key={d.domain} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{d.domain}</td>
                <td style={{ padding: '1rem' }}>{d.total}</td>
                <td style={{ padding: '1rem', color: 'var(--status-resolved-text)' }}>{d.resolved}</td>
                <td style={{ padding: '1rem', color: 'var(--status-escalated-text)' }}>{d.escalated}</td>
                <td style={{ padding: '1rem', color: 'var(--status-not-solved-text)' }}>{d.breached}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Reports;