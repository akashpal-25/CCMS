import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const EVENT_LABELS = {
  COMPLAINT_SUBMITTED: 'Complaint Submitted',
  START_REVIEW: 'Review Started',
  MARK_ACTION_TAKEN: 'Action Taken by Authority',
  CONFIRM_RESOLVED: 'Confirmed Resolved by Student',
  REJECT_RESOLUTION: 'Marked Not Solved by Student',
  SLA_BREACH_AUTO_ESCALATED: 'Auto-Escalated (SLA Breach)',
  COMPLAINT_UNRESOLVED_FINAL: 'Closed as Unresolved',
  COMPLAINT_CLOSED_UNRESOLVED: 'Closed as Unresolved',
};

const ComplaintTimeline = ({ events = [] }) => {
  const sorted = [...events].reverse(); // newest first

  if (sorted.length === 0) {
    return <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No activity yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
      {sorted.map((item, index) => (
        <div key={item.id || index} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
          {index !== sorted.length - 1 && (
            <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '-20px', width: '2px', backgroundColor: 'var(--color-border)' }} />
          )}
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: index === 0 ? 'var(--color-primary)' : 'var(--color-bg-muted)',
            color: index === 0 ? '#fff' : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1
          }}>
            {index === 0 ? <CheckCircle2 size={14} /> : <Clock size={12} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                {EVENT_LABELS[item.event_type] || item.event_type}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                {formatDate(item.created_at)}
              </span>
            </div>
            {item.description && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplaintTimeline;