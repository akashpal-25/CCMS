import React, { useState } from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  icon: Icon = null
}) => {
  const [hover, setHover] = useState(false);
  const isDisabled = disabled || isLoading;

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    transition: 'var(--transition-fast)',
    transform: hover && !isDisabled ? 'translateY(-1px)' : 'translateY(0)',
    padding: size === 'sm' ? '0.4rem 0.85rem' : size === 'lg' ? '0.8rem 1.75rem' : '0.55rem 1.15rem',
    fontSize: size === 'sm' ? '0.8125rem' : size === 'lg' ? '1rem' : '0.875rem'
  };

  const variantStyles = {
    primary: {
      background: 'var(--gradient-primary)',
      color: '#fff',
      boxShadow: hover && !isDisabled ? 'var(--shadow-hover)' : 'var(--shadow-sm)'
    },
    secondary: {
      backgroundColor: hover ? 'var(--color-border)' : 'var(--color-bg-muted)',
      color: 'var(--color-text-main)',
      borderColor: 'var(--color-border)'
    },
    outline: {
      backgroundColor: hover ? 'var(--color-primary-light)' : 'transparent',
      borderColor: hover ? 'var(--color-accent)' : 'var(--color-border)',
      color: hover ? 'var(--color-primary)' : 'var(--color-text-main)'
    },
    danger: {
      backgroundColor: hover ? '#991b1b' : 'var(--status-not-solved-text)',
      color: '#fff',
      boxShadow: hover && !isDisabled ? '0 8px 16px -4px rgba(185,28,28,0.3)' : 'none'
    },
    success: {
      backgroundColor: hover ? '#166534' : 'var(--status-resolved-text)',
      color: '#fff',
      boxShadow: hover && !isDisabled ? '0 8px 16px -4px rgba(21,128,61,0.3)' : 'none'
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      className={className}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 18} />
      )}
      {children}
    </button>
  );
};

export default Button;