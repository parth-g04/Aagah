import React from 'react';
import { COLORS, FONTS } from '../../styles/tokens';

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div
      style={{
        backgroundColor: COLORS.clayLight,
        border: `2px solid ${COLORS.clay}`,
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        fontFamily: FONTS.body
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px', color: COLORS.clay }} aria-hidden="true">⚠️</span>
        <span style={{ color: COLORS.ink, fontSize: '14px', fontWeight: '500' }}>
          {message}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: COLORS.clay,
            color: COLORS.cream,
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: FONTS.body,
            outline: 'none'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
