import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ title = 'No records found', description, actionLabel, onAction, icon: Icon = Inbox }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3.5rem 1.5rem',
      backgroundColor: 'var(--color-bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--color-border)',
      textAlign: 'center',
      gap: '0.75rem'
    }}>
      <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>
        <Icon size={32} />
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{title}</h4>
      {description && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '400px' }}>{description}</p>}
      {actionLabel && onAction && (
        <div style={{ marginTop: '0.5rem' }}>
          <Button variant="primary" size="sm" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;