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
        backgroundImage: 'linear-gradient(135deg, rgba(241, 248, 243, 0.8) 0%, rgba(225, 236, 229, 0.85) 100%), url(/agri-mist-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: COLORS.soil,
        fontFamily: FONTS.display,
        gap: '24px'
      }}
    >
      {/* Centered Sprout SVG logo - glassmorphic */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px 0 rgba(92, 64, 51, 0.08)'
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

      <div style={{ 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px 28px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 32px 0 rgba(92, 64, 51, 0.05)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Aagah
        </h1>
        <p style={{ fontFamily: FONTS.body, fontSize: '14px', color: COLORS.inkMuted, fontWeight: '500' }}>
          MP's Agricultural Distress & Decision Support System
        </p>
      </div>
    </div>
  );
}
