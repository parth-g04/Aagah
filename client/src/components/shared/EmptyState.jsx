import React from 'react';
import { COLORS, FONTS } from '../../styles/tokens';

export default function EmptyState({ message = "No data available", ctaText, onCtaClick }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: COLORS.cream,
        border: `1px dashed ${COLORS.soil}40`,
        borderRadius: '12px',
        textAlign: 'center',
        gap: '16px',
        margin: '16px 0'
      }}
    >
      <div style={{ fontSize: '48px', color: COLORS.soilLight, opacity: 0.7 }} aria-hidden="true">
        🌱
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: '16px',
          fontWeight: '600',
          color: COLORS.inkMuted,
          maxWidth: '400px'
        }}
      >
        {message}
      </div>
      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          style={{
            backgroundColor: COLORS.turmeric,
            color: COLORS.cream,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: FONTS.body,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            outline: 'none'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = COLORS.soil)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = COLORS.turmeric)}
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
