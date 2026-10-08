import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/ui/Card';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem' }}>
        <ShieldX size={48} style={{ color: 'var(--status-not-solved-text)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          You do not have the required administrative role or department permissions to view this resource.
        </p>
        <Button variant="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Card>
    </div>
  );
};

export default Unauthorized;