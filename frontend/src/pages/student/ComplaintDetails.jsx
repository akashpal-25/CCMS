import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { useStudentStore } from '../../store/studentStore';
import { complaintService } from '../../services/complaintService';
import { COMPLAINT_STATUS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import SLATimer from '../../components/complaints/SLATimer';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';
import Loader from '../../components/common/Loader';
import { formatDate, formatFileSize } from '../../utils/formatters';

const StudentComplaintDetails = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { activeComplaint, attachments, fetchComplaintDetail, confirmResolved, rejectResolution, isLoading } = useStudentStore();
  const [feedbackNote, setFeedbackNote] = useState('');

  useEffect(() => {
    if (complaintId) fetchComplaintDetail(complaintId);
  }, [complaintId]);

  if (isLoading || !activeComplaint) return <Loader message="Loading grievance record..." />;

  const handleConfirm = async () => {
    await confirmResolved(activeComplaint.id, feedbackNote);
    setFeedbackNote('');
  };

  const handleReject = async () => {
    await rejectResolution(activeComplaint.id, feedbackNote);
    setFeedbackNote('');
  };

  const handleDownload = (att) => {
    complaintService.downloadAttachment(att.id, att.original_file_name);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/student/complaints')} style={{ alignSelf: 'flex-start' }}>
        Back to My Complaints
      </Button>

      <Card style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
              {activeComplaint.complaint_number}
            </span>
            <StatusBadge status={activeComplaint.status} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem' }}>{activeComplaint.title}</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Domain: {activeComplaint.domain_name}
            {activeComplaint.category_name ? ` • Category: ${activeComplaint.category_name}` : ''}
            {' '}• Submitted: {formatDate(activeComplaint.created_at)}
          </span>
        </div>
      </Card>

      {activeComplaint.assigned_to_name && (
        <Card style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Currently handled by: <strong style={{ color: 'var(--color-text-main)' }}>{activeComplaint.assigned_to_name}</strong>
            {activeComplaint.assigned_to_role ? ` (${activeComplaint.assigned_to_role})` : ''}
          </span>
        </Card>
      )}

      <SLATimer deadline={activeComplaint.sla_deadline_at} status={activeComplaint.status} />

      {activeComplaint.status === COMPLAINT_STATUS.PENDING_STUDENT_CONFIRMATION && (
        <Card style={{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-accent)', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
            Student Resolution Confirmation
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
            The assigned authority has taken action on your complaint. Has the issue been resolved?
          </p>
          <textarea
            rows={2}
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            placeholder="Optional remarks..."
            style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.8125rem', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button size="sm" variant="success" icon={CheckCircle2} onClick={handleConfirm}>
              YES — Problem Solved
            </Button>
            <Button size="sm" variant="danger" icon={XCircle} onClick={handleReject}>
              NO — Problem Not Solved (Escalate)
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Grievance Statement</h4>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-main)', whiteSpace: 'pre-line' }}>
              {activeComplaint.description}
            </p>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Attached Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attachments.map((att) => (
                  <div key={att.id} onClick={() => handleDownload(att)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{att.original_file_name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>({formatFileSize(att.file_size)})</span>
                    </div>
                    <Download size={14} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Lifecycle Audit Trail</h4>
            <ComplaintTimeline events={activeComplaint.events} />
          </Card>
        </div>

      </div>

    </div>
  );
};

export default StudentComplaintDetails;