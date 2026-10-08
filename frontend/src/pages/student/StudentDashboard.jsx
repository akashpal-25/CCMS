import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { DOMAIN_CODES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const domainTiles = [
  { code: DOMAIN_CODES.ACADEMIC, label: 'Academic', desc: 'Courses, lectures, faculty, labs & internal marks' },
  { code: DOMAIN_CODES.EXAMINATION, label: 'Examination', desc: 'Hall tickets, grade sheets, re-checks & schedules' },
  { code: DOMAIN_CODES.LIBRARY, label: 'Library', desc: 'Book issues, journals, reading hall & digital access' },
  { code: DOMAIN_CODES.FINANCE, label: 'Finance / Fees', desc: 'Fee receipts, scholarships, dues clearance & refunds' },
  { code: DOMAIN_CODES.GENERAL, label: 'General', desc: 'Campus facilities, Wi-Fi, canteen & misc issues' },
  { code: DOMAIN_CODES.HOSTEL, label: 'Hostel', desc: 'Room maintenance, mess food & hostel facilities' },
  { code: DOMAIN_CODES.TRANSPORT, label: 'Transport', desc: 'Bus routes, timing & transport related issues' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { complaints, stats, isLoading, fetchMyComplaints } = useStudentStore();

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  if (isLoading && !stats) return <Loader message="Fetching your student dashboard..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Card style={{
        background: 'linear-gradient(135deg, rgba(30,64,175,0.88) 0%, rgba(14,165,233,0.72) 100%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        backdropFilter: 'blur(16px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.35)',
        color: '#fff',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Student Redressal Portal
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>Welcome, {user?.full_name}</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>{user?.email}</p>
          </div>
          <Button variant="success" size="lg" icon={PlusCircle} onClick={() => navigate('/student/complaints/new')}>
            Submit New Complaint
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL SUBMITTED</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.total || 0}</h3>
          </div>
        </Card>

        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-under-review-bg)', color: 'var(--status-under-review-text)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>UNDER REVIEW</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.underReview || 0}</h3>
          </div>
        </Card>

        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-in-progress-bg)', color: 'var(--status-in-progress-text)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>AWAITING YOUR CONFIRMATION</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.pendingConfirmation || 0}</h3>
          </div>
        </Card>

        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>RESOLVED</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.resolved || 0}</h3>
          </div>
        </Card>
      </div>

      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Grievance Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {domainTiles.map((d) => (
            <Card
              key={d.code}
              onClick={() => navigate('/student/complaints/new', { state: { defaultDomainCode: d.code } })}
              style={{ cursor: 'pointer', transition: 'var(--transition-fast)', borderLeft: '4px solid var(--color-accent)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{d.label}</h4>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{d.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Grievances</h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/complaints')}>
            View All Complaints
          </Button>
        </div>

        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints filed yet"
            description="If you are experiencing issues with academics, exams, fees or campus facilities, submit a complaint."
            actionLabel="Submit Complaint"
            onAction={() => navigate('/student/complaints/new')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {complaints.slice(0, 4).map((c) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/student/complaints/${c.id}`)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {c.complaint_number}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>• {c.domain_name}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{c.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    Submitted on {formatDate(c.created_at)}
                  </span>
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

export default StudentDashboard;