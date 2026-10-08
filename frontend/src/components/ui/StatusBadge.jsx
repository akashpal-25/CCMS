import React from 'react';
import { COMPLAINT_STATUS, COMPLAINT_STATUS_LABELS } from '../../utils/constants';

const StatusBadge = ({ status }) => {
  const getStatusColors = () => {
    switch (status) {
      case COMPLAINT_STATUS.SUBMITTED:
      case COMPLAINT_STATUS.UNDER_REVIEW:
        return { bg: 'var(--status-under-review-bg)', color: 'var(--status-under-review-text)' };
      case COMPLAINT_STATUS.PENDING_STUDENT_CONFIRMATION:
        return { bg: 'var(--status-in-progress-bg)', color: 'var(--status-in-progress-text)' };
      case COMPLAINT_STATUS.ESCALATED:
        return { bg: 'var(--status-escalated-bg)', color: 'var(--status-escalated-text)' };
      case COMPLAINT_STATUS.RESOLVED:
        return { bg: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)' };
      case COMPLAINT_STATUS.NOT_SOLVED:
        return { bg: 'var(--status-not-solved-bg)', color: 'var(--status-not-solved-text)' };
      default:
        return { bg: 'var(--status-closed-bg)', color: 'var(--status-closed-text)' };
    }
  };

  const { bg, color } = getStatusColors();

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.2rem 0.625rem', borderRadius: 'var(--radius-full)',
      fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.025em', backgroundColor: bg, color: color
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
      {COMPLAINT_STATUS_LABELS[status] || status || 'UNKNOWN'}
    </span>
  );
};

export default StatusBadge;