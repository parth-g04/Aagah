import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getOfficerBlocks } from '../api/officerApi';
import { COLORS, FONTS, stressColor, stressBg, stressLabel } from '../styles/tokens';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import Table from '../components/shared/Table';
import Sparkline from '../components/shared/Sparkline';
import AlertBadge from '../components/shared/AlertBadge';

// Scaled down SVG coordinates for the mini map
const MINI_MAP_REGIONS = [
  { id: 'Rayadurg', name: 'R', points: '5,10 40,5 45,35 10,40', textX: 22, textY: 22 },
  { id: 'Guntakal', name: 'G', points: '40,5 80,5 85,30 45,35', textX: 60, textY: 20 },
  { id: 'Tadipatri', name: 'T', points: '80,5 130,5 120,40 85,30', textX: 102, textY: 20 },
  { id: 'Kalyandurg', name: 'Ky', points: '10,40 45,35 60,65 20,75', textX: 32, textY: 55 },
  { id: 'Dharmavaram', name: 'D', points: '45,35 85,30 95,70 60,65', textX: 70, textY: 52 },
  { id: 'Kadiri', name: 'Kd', points: '95,70 140,65 130,110 85,110', textX: 110, textY: 88 },
  { id: 'Penukonda', name: 'P', points: '60,65 95,70 85,110 45,105', textX: 72, textY: 88 },
  { id: 'Hindupur', name: 'H', points: '45,105 85,110 75,145 40,140', textX: 60, textY: 128 }
];

export default function OfficerOverviewPage() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredMiniBlock, setHoveredMiniBlock] = useState(null);

  const fetchBlocks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOfficerBlocks();
      setBlocks(data);
    } catch (err) {
      setError(err.message || 'Failed to load block worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const getBlockStress = (name) => {
    const block = blocks.find(b => b.name.toLowerCase() === name.toLowerCase());
    return block ? block.stress_index : 0;
  };

  const getBlockId = (name) => {
    const block = blocks.find(b => b.name.toLowerCase() === name.toLowerCase());
    return block ? block.id : null;
  };

  // Table header definitions
  const headers = [
    { key: 'name', label: 'Block (Mandal)', isSortable: true },
    { key: 'stress_index', label: 'Stress Index', isSortable: true, isNumeric: true },
    { key: 'trend', label: '7-Day Trend', isSortable: false },
    { key: 'rainfall_deficit_pct', label: 'Rain Deficit', isSortable: true, isNumeric: true },
    { key: 'mandi_price_drop_pct', label: 'Mandi Drop', isSortable: true, isNumeric: true },
    { key: 'active_interventions_count', label: 'Active Interventions', isSortable: true, isNumeric: true },
    { key: 'actions', label: 'Action', isSortable: false }
  ];

  if (loading) {
    return (
      <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  // Row mapping for custom elements inside the Table
  const renderRow = (row, index) => {
    const isHigh = row.stress_index >= 75;
    return (
      <tr
        key={row.id}
        style={{
          borderBottom: `1px solid ${COLORS.soil}15`,
          backgroundColor: index % 2 === 0 ? COLORS.cream : `${COLORS.parchment}15`,
          transition: 'background-color 0.15s ease'
        }}
      >
        {/* Block name and Mandal */}
        <td style={{ padding: '14px 16px', fontFamily: FONTS.display, fontWeight: '700', color: COLORS.soil }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{row.name}</span>
            <span style={{ fontFamily: FONTS.body, fontSize: '11px', fontWeight: '400', color: COLORS.inkMuted }}>
              {row.mandal}
            </span>
          </div>
        </td>

        {/* Stress score AlertBadge */}
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          <AlertBadge stress={row.stress_index} />
        </td>

        {/* SVG Sparkline widget */}
        <td style={{ padding: '14px 16px' }}>
          <Sparkline data={row.stress_history} width={80} height={20} />
        </td>

        {/* Rain Deficit */}
        <td style={{ padding: '14px 16px', fontFamily: FONTS.mono, fontSize: '14px', textAlign: 'right', color: row.rainfall_deficit_pct >= 25 ? COLORS.clay : COLORS.ink }}>
          {row.rainfall_deficit_pct >= 0 ? `${row.rainfall_deficit_pct.toFixed(1)}%` : '—'}
        </td>

        {/* Mandi Price Drop */}
        <td style={{ padding: '14px 16px', fontFamily: FONTS.mono, fontSize: '14px', textAlign: 'right', color: row.mandi_price_drop_pct >= 20 ? COLORS.clay : COLORS.ink }}>
          {row.mandi_price_drop_pct >= 0 ? `${row.mandi_price_drop_pct.toFixed(1)}%` : '—'}
        </td>

        {/* Active Interventions Count */}
        <td style={{ padding: '14px 16px', fontFamily: FONTS.mono, fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
          {row.active_interventions_count}
        </td>

        {/* Action Button */}
        <td style={{ padding: '14px 16px' }}>
          <button
            onClick={() => navigate(`/officer/blocks/${row.id}`)}
            style={{
              backgroundColor: COLORS.turmeric,
              color: COLORS.cream,
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontFamily: FONTS.display,
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = COLORS.soil)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = COLORS.turmeric)}
          >
            Deploy
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '48px', boxSizing: 'border-box' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '24px', fontWeight: '700', color: COLORS.soil, marginBottom: '6px' }}>
            Agricultural Worklist Overview
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted }}>
            Review, prioritize, and deploy interventions to Anantapur mandal blocks experiencing agricultural stress.
          </p>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchBlocks} />}

        {/* Layout Row: Table left, Mini Map right */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '24px' }}>
          
          {/* Main Sortable Table (Left) */}
          <div style={{ flex: '3', minWidth: '320px' }}>
            <Table
              headers={headers}
              data={blocks}
              initialSortKey="stress_index"
              initialSortDirection="desc"
              renderRow={renderRow}
            />
          </div>

          {/* Mini Map Thumbnail Widget (Right) */}
          <div
            style={{
              flex: '1',
              minWidth: '240px',
              backgroundColor: COLORS.cream,
              border: `1px solid ${COLORS.soil}20`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignSelf: 'flex-start'
            }}
          >
            <div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: '14px', fontWeight: '700', color: COLORS.soil, marginBottom: '4px' }}>
                Spatial Context Map
              </h4>
              <span style={{ fontFamily: FONTS.body, fontSize: '11px', color: COLORS.inkMuted }}>
                Click a grid area below to navigate to that block's details.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.parchmentDeep + '40',
                borderRadius: '8px',
                padding: '12px',
                border: `1px solid ${COLORS.soil}10`,
                position: 'relative'
              }}
            >
              <svg viewBox="0 0 150 160" width="100%" height="auto" style={{ maxWidth: '180px' }}>
                {MINI_MAP_REGIONS.map((region) => {
                  const stress = getBlockStress(region.id);
                  const blockId = getBlockId(region.id);
                  const fill = stressBg(stress);
                  const stroke = hoveredMiniBlock?.id === region.id ? COLORS.turmeric : COLORS.soil;
                  const strokeWidth = hoveredMiniBlock?.id === region.id ? '2' : '0.8';

                  return (
                    <g
                      key={region.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredMiniBlock({ id: region.id, name: region.id, stress })}
                      onMouseLeave={() => setHoveredMiniBlock(null)}
                      onClick={() => blockId && navigate(`/officer/blocks/${blockId}`)}
                    >
                      <polygon
                        points={region.points}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                      />
                      <text
                        x={region.textX}
                        y={region.textY}
                        fill={COLORS.ink}
                        fontFamily={FONTS.display}
                        fontSize="9px"
                        fontWeight="700"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {region.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip for mini map */}
              {hoveredMiniBlock && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: COLORS.ink,
                    color: COLORS.cream,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: FONTS.body,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: `1px solid ${COLORS.turmeric}`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{hoveredMiniBlock.name}</span>
                  <span style={{ fontFamily: FONTS.mono }}>Stress: {hoveredMiniBlock.stress}%</span>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '700', fontFamily: FONTS.display }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.clayLight, border: `1px solid ${COLORS.clay}` }} />
                High
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '700', fontFamily: FONTS.display }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.turmericLight, border: `1px solid ${COLORS.turmeric}` }} />
                Mod
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '700', fontFamily: FONTS.display }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.riceLight, border: `1px solid ${COLORS.rice}` }} />
                Low
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
