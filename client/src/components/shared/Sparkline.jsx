import React from 'react';
import { stressColor } from '../../styles/tokens';

export default function Sparkline({ data = [], width = 100, height = 30 }) {
  if (!Array.isArray(data) || data.length < 2) {
    return <span style={{ color: '#6B6253', fontSize: '12px' }}>—</span>;
  }

  const max = 100;
  const min = 0;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    // Map 0-100 range to SVG height (inverted coordinates)
    const y = height - padding - ((val - min) / (max - min)) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p}`).join(' ');
  
  const latestValue = data[data.length - 1];
  const color = stressColor(latestValue);

  const lastPoint = points[points.length - 1].split(',');
  const endX = parseFloat(lastPoint[0]);
  const endY = parseFloat(lastPoint[1]);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'inline-block', verticalAlign: 'middle' }}>
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={endX}
        cy={endY}
        r="4"
        fill={color}
        stroke="#FBF8F1"
        strokeWidth="1.5"
      />
    </svg>
  );
}
