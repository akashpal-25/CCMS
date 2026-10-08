import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/ui/Card';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>404</h1>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Page Not Found</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          The requested CCMS route does not exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </Card>
    </div>
  );
};

export default NotFound;