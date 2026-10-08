import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, FileText, Download } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { COMPLAINT_STATUS } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import SLATimer from '../../components/complaints/SLATimer';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';
import Loader from '../../components/common/Loader';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';

const AdminComplaintDetails = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [loadError, setLoadError] = useState(null);

  const load = async () => {
    try {
      const data = await complaintService.getComplaintDetail(complaintId);
      const atts = await complaintService.listAttachments(complaintId);
      setComplaint(data);
      setAttachments(atts);
      setLoading(false);
    } catch (err) {
      setLoadError(err.response?.data?.detail || 'Could not load this complaint.');
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [complaintId]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await complaintService.performAction(complaint.id, action, remarks || null);
      setRemarks('');
      await load();
    } catch (err) {
      alert(getErrorMessage(err, 'Action failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (att) => {
    complaintService.downloadAttachment(att.id, att.original_file_name);
  };

  if (loading || !complaint) return <Loader message="Loading grievance audit file..." />;
  if (loadError) return <p style={{ padding: '2rem', color: 'var(--status-not-solved-text)' }}>{loadError}</p>;

  const canStartReview = complaint.status === COMPLAINT_STATUS.SUBMITTED || complaint.status === COMPLAINT_STATUS.ESCALATED;
  const canMarkActionTaken = complaint.status === COMPLAINT_STATUS.UNDER_REVIEW;
  const isClosed = complaint.status === COMPLAINT_STATUS.RESOLVED || complaint.status === COMPLAINT_STATUS.NOT_SOLVED;
  const awaitingStudent = complaint.status === COMPLAINT_STATUS.PENDING_STUDENT_CONFIRMATION;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/admin/complaints')} style={{ alignSelf: 'flex-start' }}>
        Back to Queue
      </Button>

      <Card style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
              {complaint.complaint_number}
            </span>
            <StatusBadge status={complaint.status} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem' }}>{complaint.title}</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Student: <strong>{complaint.student_name}</strong> ({complaint.student_college_id}) • {complaint.department_name} • Filed: {formatDate(complaint.created_at)}
          </span>
        </div>
      </Card>

      <SLATimer deadline={complaint.sla_deadline_at} status={complaint.status} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>Grievance Description</h4>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{complaint.description}</p>
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

          <Card style={{ border: '2px solid var(--color-primary)', padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>Administrative Action Console</h4>

            {isClosed && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                This complaint is closed ({complaint.status === COMPLAINT_STATUS.RESOLVED ? 'Resolved' : 'Not Solved'}) and cannot be modified further.
              </p>
            )}

            {awaitingStudent && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Action has been recorded. Waiting for the student to confirm whether the issue is resolved.
              </p>
            )}

            {(canStartReview || canMarkActionTaken) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {canMarkActionTaken && (
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Remarks (what action was taken)</label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Describe the action taken to resolve this complaint..."
                      style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '0.25rem', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {canStartReview && (
                    <Button variant="primary" icon={PlayCircle} isLoading={actionLoading} onClick={() => handleAction('start_review')}>
                      Start Review
                    </Button>
                  )}
                  {canMarkActionTaken && (
                    <Button variant="primary" icon={CheckCircle} isLoading={actionLoading} onClick={() => handleAction('mark_action_taken')}>
                      Mark Action Taken
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Audit Timeline</h4>
            <ComplaintTimeline events={complaint.events} />
          </Card>
        </div>

      </div>

    </div>
  );
};

export default AdminComplaintDetails;