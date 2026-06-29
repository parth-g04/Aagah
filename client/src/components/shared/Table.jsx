import React, { useState, useMemo } from 'react';
import { COLORS, FONTS } from '../../styles/tokens';

export default function Table({ headers, data, initialSortKey, initialSortDirection = 'desc', renderRow, style = {} }) {
  const [sortKey, setSortKey] = useState(initialSortKey || '');
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? aVal - bVal 
          : bVal - aVal;
      }
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', backgroundColor: COLORS.cream, ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: FONTS.body }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.parchmentDeep, borderBottom: `2px solid ${COLORS.soil}30` }}>
            {headers.map((h) => {
              const isSortable = h.isSortable !== false;
              const cursorStyle = isSortable ? 'pointer' : 'default';
              return (
                <th
                  key={h.key}
                  onClick={() => isSortable && handleSort(h.key)}
                  style={{
                    padding: '12px 16px',
                    fontFamily: FONTS.display,
                    fontSize: '12px',
                    fontWeight: '700',
                    color: COLORS.soil,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: cursorStyle,
                    userSelect: 'none',
                    textAlign: h.align || (h.isNumeric ? 'right' : 'left'),
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {h.label}
                    {isSortable && sortKey === h.key && (
                      <span style={{ fontSize: '10px' }}>
                        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: '32px 16px', textAlign: 'center', color: COLORS.inkMuted, fontFamily: FONTS.body }}>
                No records found.
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              if (renderRow) {
                return renderRow(row, index);
              }

              return (
                <tr
                  key={row.id || index}
                  style={{
                    borderBottom: index === sortedData.length - 1 ? 'none' : `1px solid ${COLORS.soil}10`,
                    backgroundColor: index % 2 === 0 ? COLORS.cream : `${COLORS.parchment}15`,
                  }}
                >
                  {headers.map((h) => {
                    const val = row[h.key];
                    const formatted = val === null || val === undefined ? '—' : val;
                    return (
                      <td
                        key={h.key}
                        style={{
                          padding: '14px 16px',
                          color: COLORS.ink,
                          fontSize: '14px',
                          fontFamily: h.isNumeric || h.isMono ? FONTS.mono : FONTS.body,
                          textAlign: h.align || (h.isNumeric ? 'right' : 'left'),
                        }}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
