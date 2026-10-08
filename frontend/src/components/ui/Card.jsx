import React from 'react';

const Card = ({ children, style = {}, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem',
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export default Card;