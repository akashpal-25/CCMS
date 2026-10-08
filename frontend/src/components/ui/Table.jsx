import React from 'react';

const Table = ({ headers, children }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
            {headers.map((h, idx) => (
              <th
                key={idx}
                style={{
                  padding: '0.75rem 1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ divideY: '1px solid var(--color-border)' }}>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;