import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  helperText,
  name
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}
        >
          {label} {required && <span style={{ color: 'var(--status-not-solved-text)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--status-not-solved-text)' : 'var(--color-border)'}`,
          backgroundColor: disabled ? 'var(--color-bg-muted)' : 'var(--color-bg-surface)',
          color: 'var(--color-text-main)',
          outline: 'none',
          fontSize: '0.875rem'
        }}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--status-not-solved-text)' }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{helperText}</span>}
    </div>
  );
};

export default Input;