import React from 'react';

const Badge = ({ children, variant = 'neutral' }) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: variant === 'primary' ? 'var(--color-primary-light)' : 'var(--color-bg-muted)',
    color: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-text-muted)'
  };
  return <span style={styles}>{children}</span>;
};

export default Badge;