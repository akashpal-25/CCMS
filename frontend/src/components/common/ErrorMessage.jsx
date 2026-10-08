import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--status-not-solved-bg)',
      color: 'var(--status-not-solved-text)',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    }}>
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;