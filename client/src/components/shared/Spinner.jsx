import React from 'react';
import { COLORS } from '../../styles/tokens';

export default function Spinner({ size = 40, color = COLORS.turmeric }) {
  const spinKeyframes = `
    @keyframes aagah-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <style>{spinKeyframes}</style>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `4px solid ${COLORS.parchmentDeep}`,
          borderTop: `4px solid ${color}`,
          borderRadius: '50%',
          animation: 'aagah-spin 0.8s linear infinite'
        }}
        aria-label="Loading"
      />
    </div>
  );
}
