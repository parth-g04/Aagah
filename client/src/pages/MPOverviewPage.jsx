import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getMPSummary, getMPBlocks } from '../api/mpApi';
import { COLORS, FONTS, stressColor, stressBg, stressLabel } from '../styles/tokens';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import Sparkline from '../components/shared/Sparkline';

// Stylized SVG Block Map Coordinates
// Scaled for a 500x320 viewport
const MAP_REGIONS = [
  { id: 'Rayadurg', name: 'Rayadurg', points: '10,20 80,10 90,70 20,80', textX: 45, textY: 45 },
  { id: 'Guntakal', name: 'Guntakal', points: '80,10 160,10 170,60 90,70', textX: 120, textY: 40 },
  { id: 'Tadipatri', name: 'Tadipatri', points: '160,10 260,10 240,80 170,60', textX: 205, textY: 40 },
  { id: 'Kalyandurg', name: 'Kalyandurg', points: '20,80 90,70 120,130 40,150', textX: 65, textY: 110 },
  { id: 'Dharmavaram', name: 'Dharmavaram', points: '90,70 170,60 190,140 120,130', textX: 140, textY: 105 },
  { id: 'Kadiri', name: 'Kadiri', points: '190,140 280,130 260,220 170,220', textX: 220, textY: 175 },
  { id: 'Penukonda', name: 'Penukonda', points: '120,130 190,140 170,220 90,210', textX: 145, textY: 175 },
  { id: 'Hindupur', name: 'Hindupur', points: '90,210 170,220 150,290 80,280', textX: 120, textY: 255 }
];

export default function MPOverviewPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredBlock, setHoveredBlock] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, blocksData] = await Promise.all([
        getMPSummary(),
        getMPBlocks()
      ]);
      setSummary(sumData);
      setBlocks(blocksData);
    } catch (err) {
      setError(err.message || 'Failed to load MP Overview data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map block names from DB to region templates
  const getBlockStress = (name) => {
    const block = blocks.find(b => b.name.toLowerCase() === name.toLowerCase());
    return block ? block.stress_index : 0;
  };

  const getBlockId = (name) => {
    const block = blocks.find(b => b.name.toLowerCase() === name.toLowerCase());
    return block ? block.id : null;
  };

  const getBlockObject = (name) => {
    return blocks.find(b => b.name.toLowerCase() === name.toLowerCase());
  };

  // Find top 3 stressed blocks
  const topStressedBlocks = [...blocks]
    .sort((a, b) => b.stress_index - a.stress_index)
    .slice(0, 3);

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

  return (
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '48px', boxSizing: 'border-box' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        {/* 1. Large Weekly Headline Card */}
        {summary && (
          <div
            style={{
              backgroundColor: COLORS.soil,
              color: COLORS.cream,
              borderRadius: '12px',
              padding: '32px 24px',
              border: `1px solid ${COLORS.soil}30`,
              boxShadow: '0 4px 12px rgba(92, 64, 51, 0.08)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.turmericLight, letterSpacing: '0.05em' }}>
                Weekly Distress Summary Card
              </span>
              <h2 style={{ fontFamily: FONTS.display, fontSize: '28px', fontWeight: '700', color: COLORS.turmeric, letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                "{summary.headline}"
              </h2>
              <p style={{ fontFamily: FONTS.body, fontSize: '14px', color: COLORS.parchment, opacity: 0.85, marginTop: '4px' }}>
                Tracking agricultural anomalies across 8 mandal blocks in Anantapur District, Andhra Pradesh.
              </p>
            </div>
          </div>
        )}

        {/* 2. Map and Side Cards Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          {/* Choropleth SVG Map (Flex Left) */}
          <div
            style={{
              flex: '1.3',
              minWidth: '320px',
              backgroundColor: COLORS.cream,
              border: `1px solid ${COLORS.soil}20`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <h3 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: '700', color: COLORS.soil, marginBottom: '4px' }}>
                District Choropleth Stress Map
              </h3>
              <p style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>
                Hover to inspect aggregate mandal stats. Click block to drill down into crop coverage, moisture trends, and logs.
              </p>
            </div>

            {/* SVG Choropleth Map */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.parchmentDeep + '40',
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${COLORS.soil}10`
              }}
            >
              <svg viewBox="0 0 300 320" width="100%" height="auto" style={{ maxWidth: '380px' }}>
                {MAP_REGIONS.map((region) => {
                  const stress = getBlockStress(region.id);
                  const blockId = getBlockId(region.id);
                  const fill = stressBg(stress);
                  const stroke = hoveredBlock?.id === region.id ? COLORS.turmeric : COLORS.soil;
                  const strokeWidth = hoveredBlock?.id === region.id ? '2.5' : '1';

                  return (
                    <g
                      key={region.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredBlock({ ...region, stress, id: getBlockId(region.id) })}
                      onMouseLeave={() => setHoveredBlock(null)}
                      onClick={() => blockId && navigate(`/mp/blocks/${blockId}`)}
                    >
                      <polygon
                        points={region.points}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        style={{ transition: 'all 0.15s ease' }}
                      />
                      <text
                        x={region.textX}
                        y={region.textY}
                        fill={COLORS.ink}
                        fontFamily={FONTS.display}
                        fontSize="10px"
                        fontWeight="700"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {region.name}
                      </text>
                      <text
                        x={region.textX}
                        y={region.textY + 12}
                        fill={stressColor(stress)}
                        fontFamily={FONTS.mono}
                        fontSize="9px"
                        fontWeight="700"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {stress}%
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Live Legend */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backgroundColor: COLORS.cream,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${COLORS.soil}15`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold', fontFamily: FONTS.display, color: COLORS.ink }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.clayLight, border: `1px solid ${COLORS.clay}` }} />
                  High (≥75)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold', fontFamily: FONTS.display, color: COLORS.ink }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.turmericLight, border: `1px solid ${COLORS.turmeric}` }} />
                  Moderate (≥45)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold', fontFamily: FONTS.display, color: COLORS.ink }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.riceLight, border: `1px solid ${COLORS.rice}` }} />
                  Low Distress
                </div>
              </div>

              {/* Custom SVG Tooltip */}
              {hoveredBlock && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: COLORS.ink,
                    color: COLORS.cream,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: `1px solid ${COLORS.turmeric}`
                  }}
                >
                  <span style={{ fontFamily: FONTS.display, fontWeight: '700' }}>
                    {hoveredBlock.name} Block
                  </span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: COLORS.turmericLight }}>
                    Stress Index: {hoveredBlock.stress}%
                  </span>
                  <span style={{ fontSize: '10px', color: COLORS.parchmentDeep }}>
                    Status: {stressLabel(hoveredBlock.stress)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top Stressed Blocks Panel (Flex Right) */}
          <div
            style={{
              flex: '1',
              minWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <h3 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: '700', color: COLORS.soil }}>
                Critical Blocks (Top 3)
              </h3>
              <p style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>
                Mandal clusters currently posting the highest aggregate stress index.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topStressedBlocks.map((block) => {
                const isHigh = block.stress_index >= 75;
                const statusColor = stressColor(block.stress_index);
                const statusBgColor = stressBg(block.stress_index);

                return (
                  <div
                    key={block.id}
                    onClick={() => navigate(`/mp/blocks/${block.id}`)}
                    style={{
                      backgroundColor: COLORS.cream,
                      border: `1px solid ${isHigh ? COLORS.clay + '40' : COLORS.soil + '20'}`,
                      borderLeft: `5px solid ${statusColor}`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'transform 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyItems: 'center', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: '700', color: COLORS.soil }}>
                          {block.name}
                        </h4>
                        <span style={{ fontSize: '11px', color: COLORS.inkMuted, fontFamily: FONTS.body }}>
                          ({block.mandal})
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: COLORS.inkMuted, fontFamily: FONTS.body }}>
                        🌾 Cover: {Object.keys(block.crop_coverage).join(', ')}
                      </div>
                      
                      {/* Subtext describing interventions */}
                      <div style={{ fontSize: '11px', color: COLORS.inkMuted, fontFamily: FONTS.body, fontStyle: 'italic' }}>
                        🛡️ Active Interventions: <strong style={{ color: COLORS.soil, fontFamily: FONTS.mono }}>{block.active_interventions_count}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: '20px', fontWeight: '700', color: statusColor }}>
                          {block.stress_index}%
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', fontFamily: FONTS.display, color: statusColor }}>
                          {stressLabel(block.stress_index)}
                        </span>
                      </div>

                      {/* Sparkline trend representation */}
                      <div style={{ marginTop: '4px' }}>
                        <Sparkline data={block.stress_history} width={70} height={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
