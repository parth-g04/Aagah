import React from 'react';
import { COLORS, FONTS } from '../../styles/tokens';

export default function StatCard({ title, value, subtext, icon, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.cream,
        border: `1px solid ${COLORS.soil}20`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: '1',
        minWidth: '200px',
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: '20px' }} aria-hidden="true">{icon}</span>}
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: '28px', fontWeight: '600', color: COLORS.soil }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '12px', color: COLORS.inkMuted, fontFamily: FONTS.body }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
