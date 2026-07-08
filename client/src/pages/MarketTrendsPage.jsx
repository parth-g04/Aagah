import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/layout/Navbar';
import { getMarketTrends } from '../api/mpApi';
import { COLORS, FONTS } from '../styles/tokens';
import { AuthContext } from '../context/AuthContext';
import { TRANSLATIONS } from '../utils/translations';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';

function MarketSparkline({ values = [], width = 100, height = 30 }) {
  if (!Array.isArray(values) || values.length < 2) {
    return <span style={{ color: '#6B6253', fontSize: '12px' }}>—</span>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;

  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p}`).join(' ');
  const latestValue = values[values.length - 1];
  const firstValue = values[0];
  const color = latestValue >= firstValue ? '#3D7A4D' : '#A8472E';

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

export default function MarketTrendsPage() {
  const { language, user } = useContext(AuthContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrends = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMarketTrends();
      setTrends(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load market trends.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [language]);

  // Compute metrics for high-level cards
  const stats = React.useMemo(() => {
    if (trends.length === 0) return null;

    let highestCrop = '';
    let highestVal = 0;
    let maxGrowthCrop = '';
    let maxGrowthVal = -Infinity;

    trends.forEach(t => {
      const first = t.values[0] || 100;
      const last = t.values[t.values.length - 1] || 100;
      const growth = ((last - first) / first) * 100;

      if (last > highestVal) {
        highestVal = last;
        highestCrop = t.crop;
      }
      if (growth > maxGrowthVal) {
        maxGrowthVal = growth;
        maxGrowthCrop = t.crop;
      }
    });

    return {
      highestCrop,
      highestVal,
      maxGrowthCrop,
      maxGrowthVal: maxGrowthVal.toFixed(1)
    };
  }, [trends]);

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
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '60px', boxSizing: 'border-box' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700', color: COLORS.soil, marginBottom: '6px' }}>
              🌾 {t.marketTrends || 'Market Price Index'}
            </h2>
            <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted }}>
              Annual Wholesale Price Index (WPI) trends of major agricultural commodities compiled by NITI Aayog.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#3D7A4D', letterSpacing: '0.05em', backgroundColor: 'rgba(61, 122, 77, 0.1)', padding: '6px 14px', borderRadius: '20px', fontFamily: FONTS.display }}>
            Data Source: data.gov.in
          </span>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchTrends} />}

        {/* Highlight Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
                Highest Final Index (2011-12)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '800', color: COLORS.soil }}>
                  {stats.highestCrop}
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: '22px', fontWeight: '700', color: '#3D7A4D' }}>
                  {stats.highestVal.toFixed(0)}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
                Peak wholesale value multiplier relative to 2004-05 base.
              </span>
            </div>

            <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
                Greatest Wholesale Growth
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '800', color: COLORS.soil }}>
                  {stats.maxGrowthCrop}
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: '22px', fontWeight: '700', color: '#3D7A4D' }}>
                  +{stats.maxGrowthVal}%
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
                Highest relative growth over the 8-year NITI Aayog cycle.
              </span>
            </div>

            <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
                Reference Base Year
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '800', color: COLORS.soil }}>
                  2004-05
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: '16px', fontWeight: '700', color: COLORS.inkMuted }}>
                  (Index = 100)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
                All wholesale price index points are scaled relative to this cycle.
              </span>
            </div>
          </div>
        )}

        {/* WPI Main Table Card */}
        <div
          style={{
            backgroundColor: COLORS.cream,
            border: `1px solid ${COLORS.soil}20`,
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: '700', color: COLORS.soil, margin: 0 }}>
              Commodity Price Index (WPI) Breakdown
            </h3>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${COLORS.soil}30` }}>
                  <th style={{ padding: '12px 8px', fontFamily: FONTS.display, fontSize: '12px', color: COLORS.inkMuted, textTransform: 'uppercase', fontWeight: '700' }}>Crop / Commodity</th>
                  <th style={{ padding: '12px 8px', fontFamily: FONTS.display, fontSize: '12px', color: COLORS.inkMuted, textTransform: 'uppercase', fontWeight: '700', width: '110px' }}>8-Year Trend</th>
                  {['2004-05', '2005-06', '2006-07', '2007-08', '2008-09', '2009-10', '2010-11', '2011-12'].map(yr => (
                    <th key={yr} style={{ padding: '12px 8px', fontFamily: FONTS.display, fontSize: '12px', color: COLORS.inkMuted, textTransform: 'uppercase', fontWeight: '700', textAlign: 'right' }}>{yr}</th>
                  ))}
                  <th style={{ padding: '12px 8px', fontFamily: FONTS.display, fontSize: '12px', color: COLORS.inkMuted, textTransform: 'uppercase', fontWeight: '700', textAlign: 'right' }}>Overall Growth</th>
                </tr>
              </thead>
              <tbody>
                {trends && trends.length > 0 ? (
                  trends.map((trend, idx) => {
                    const first = trend.values[0] || 100;
                    const last = trend.values[trend.values.length - 1] || 100;
                    const growth = ((last - first) / first * 100).toFixed(1);
                    const isPositive = parseFloat(growth) >= 0;

                    return (
                      <tr 
                        key={trend.crop || idx} 
                        style={{ 
                          borderBottom: `1px solid ${COLORS.soil}10`,
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(92, 64, 51, 0.02)',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(217, 142, 47, 0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(92, 64, 51, 0.02)'}
                      >
                        <td style={{ padding: '14px 8px', fontFamily: FONTS.display, fontSize: '14px', fontWeight: '700', color: COLORS.soil }}>
                          {trend.crop}
                        </td>
                        <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                          <MarketSparkline values={trend.values} />
                        </td>
                        {trend.values.map((val, vIdx) => (
                          <td key={vIdx} style={{ padding: '14px 8px', fontFamily: FONTS.mono, fontSize: '13px', textAlign: 'right', color: COLORS.ink }}>
                            {val.toFixed(0)}
                          </td>
                        ))}
                        <td style={{ 
                          padding: '14px 8px', 
                          fontFamily: FONTS.mono, 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          textAlign: 'right', 
                          color: isPositive ? '#3D7A4D' : '#A8472E' 
                        }}>
                          {isPositive ? `+${growth}%` : `${growth}%`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: COLORS.inkMuted, fontFamily: FONTS.body, fontSize: '14px' }}>
                      No market trends data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
