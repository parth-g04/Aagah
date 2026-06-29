import React from 'react';
import { COLORS, stressColor, stressBg, stressLabel } from '../../styles/tokens';

export default function AlertBadge({ stress, level, text }) {
  let badgeColor = COLORS.ink;
  let badgeBg = COLORS.parchmentDeep;
  let label = text || '';

  if (stress !== undefined) {
    const parsedStress = parseInt(stress, 10);
    badgeColor = stressColor(parsedStress);
    badgeBg = stressBg(parsedStress);
    label = label || `${parsedStress}% (${stressLabel(parsedStress)})`;
  } else if (level) {
    const l = level.toLowerCase();
    if (l === 'red' || l === 'high' || l === 'critical' || l === 'clay' || l === 'open') {
      badgeColor = COLORS.clay;
      badgeBg = COLORS.clayLight;
      label = label || level;
    } else if (l === 'yellow' || l === 'medium' || l === 'moderate' || l === 'turmeric' || l === 'monitoring' || l === 'scheduled' || l === 'active') {
      badgeColor = COLORS.turmeric;
      badgeBg = COLORS.turmericLight;
      label = label || level;
    } else if (l === 'green' || l === 'low' || l === 'rice' || l === 'resolved' || l === 'completed') {
      badgeColor = COLORS.rice;
      badgeBg = COLORS.riceLight;
      label = label || level;
    } else {
      label = label || level;
    }
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        backgroundColor: badgeBg,
        color: badgeColor,
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  );
}
