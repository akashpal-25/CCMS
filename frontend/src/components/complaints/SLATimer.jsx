import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SLATimer = ({ deadline, status, onSimulateBreach, onSimulateApproach }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);
  const [isApproaching, setIsApproaching] = useState(false);

  useEffect(() => {
    if (!deadline || status === 'RESOLVED' || status === 'CLOSED') {
      setTimeLeft('Resolved / Stopped');
      return;
    }

    const calculate = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft('00:00:00 (Breached)');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setIsApproaching(hours < 12);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline, status]);

  const getContainerStyle = () => {
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return { bg: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)' };
    }
    if (isBreached) {
      return { bg: 'var(--status-not-solved-bg)', color: 'var(--status-not-solved-text)' };
    }
    if (isApproaching) {
      return { bg: 'var(--status-escalated-bg)', color: 'var(--status-escalated-text)' };
    }
    return { bg: 'var(--status-under-review-bg)', color: 'var(--status-under-review-text)' };
  };

  const style = getContainerStyle();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.color}30`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isBreached ? <AlertTriangle size={18} /> : <Clock size={18} />}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>72-Hour Resolution SLA</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9375rem' }}>
          {timeLeft}
        </span>
      </div>

      {/* Demo simulation toolbar */}
      {(onSimulateBreach || onSimulateApproach) && status !== 'RESOLVED' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', borderTop: `1px solid ${style.color}20`, paddingTop: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem', color: style.color, opacity: 0.8 }}>SLA Demo Controls:</span>
          {onSimulateApproach && (
            <button
              onClick={onSimulateApproach}
              style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: style.color, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Test Approaching (&lt;12h)
            </button>
          )}
          {onSimulateBreach && (
            <button
              onClick={onSimulateBreach}
              style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: style.color, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Test Breached (0h)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SLATimer;