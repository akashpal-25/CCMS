import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </div>
  );
};

export default PublicLayout;