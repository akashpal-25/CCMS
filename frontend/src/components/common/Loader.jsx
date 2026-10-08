import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = 'Loading CCMS records...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '0.75rem' }}>
      <Loader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{message}</span>
    </div>
  );
};

export default Loader;