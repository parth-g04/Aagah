import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from '../styles/tokens';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: COLORS.parchment,
        color: COLORS.soil,
        fontFamily: FONTS.display,
        gap: '24px'
      }}
    >
      {/* Centered Sprout SVG logo */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: COLORS.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${COLORS.soil}20`,
          boxShadow: '0 4px 12px rgba(92, 64, 51, 0.05)'
        }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 22C12 22 12 17 9 14C6 11 2 11 2 11C2 11 6 10 9 7C12 4 12 2 12 2C12 2 12 4 15 7C18 10 22 11 22 11C22 11 18 11 15 14C12 17 12 22 12 22Z"
            fill={COLORS.rice}
          />
          <path
            d="M12 22V8"
            stroke={COLORS.soil}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Kisan Alert
        </h1>
        <p style={{ fontFamily: FONTS.body, fontSize: '14px', color: COLORS.inkMuted, fontWeight: '500' }}>
          Agricultural Monitoring & Distress System
        </p>
      </div>
    </div>
  );
}
