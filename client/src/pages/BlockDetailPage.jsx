import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getBlockDetail } from '../api/blocksApi';
import { createIntervention } from '../api/interventionsApi';
import { COLORS, FONTS, stressColor, stressBg, stressLabel } from '../styles/tokens';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import AlertBadge from '../components/shared/AlertBadge';
import EmptyState from '../components/shared/EmptyState';

export default function BlockDetailPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Inline Form State
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('Water tanker delivery');
  const [formDetail, setFormDetail] = useState('');
  const [formResources, setFormResources] = useState('');
  const [formStatus, setFormStatus] = useState('scheduled');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const blockData = await getBlockDetail(id);
      setData(blockData);
    } catch (err) {
      setError(err.message || 'Failed to load block details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formDetail || !formResources) {
      setFormError('Please fill in both the Detail and Resources Deployed fields.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      await createIntervention({
        block_id: id,
        type: formType,
        detail: formDetail,
        resources_deployed: formResources,
        status: formStatus,
        notes: formNotes
      });
      
      // Reset form
      setFormDetail('');
      setFormResources('');
      setFormNotes('');
      setFormStatus('scheduled');
      setShowForm(false);
      
      // Reload details to show the new intervention and updated stress index
      await fetchDetail();
    } catch (err) {
      setFormError(err.message || 'Failed to log intervention.');
    } finally {
      setFormSubmitting(false);
    }
  };

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

  if (error || !data) {
    return (
      <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh' }}>
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
          <ErrorBanner message={error || 'Block details not found.'} onRetry={fetchDetail} />
          <button
            onClick={() => navigate(user?.role === 'mp' ? '/mp' : '/officer')}
            style={{
              backgroundColor: COLORS.soil,
              color: COLORS.cream,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '14px',
              fontFamily: FONTS.display,
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  const { block, alerts, interventions } = data;

  // Trend computation
  const history = block.stress_history || [];
  const prevStress = history.length >= 2 ? history[history.length - 2] : block.stress_index;
  const stressDiff = block.stress_index - prevStress;

  // Derived trend indicators
  const stressTrend = stressDiff > 0 ? { char: '▲', color: COLORS.clay } : (stressDiff < 0 ? { char: '▼', color: COLORS.rice } : { char: '—', color: COLORS.inkMuted });
  const rainDiff = stressDiff * 0.3; // Simulated deficit shift
  const rainTrend = rainDiff > 0 ? { char: '▲', color: COLORS.clay } : (rainDiff < 0 ? { char: '▼', color: COLORS.rice } : { char: '—', color: COLORS.inkMuted });
  const priceDiff = stressDiff * 0.2; // Simulated drop shift
  const priceTrend = priceDiff > 0 ? { char: '▲', color: COLORS.clay } : (priceDiff < 0 ? { char: '▼', color: COLORS.rice } : { char: '—', color: COLORS.inkMuted });

  const activeInterventionsCount = interventions.filter(i => i.status !== 'completed').length;

  return (
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '60px', boxSizing: 'border-box' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Breadcrumb and Back Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontFamily: FONTS.body, color: COLORS.inkMuted }}>
          <span 
            onClick={() => navigate(user?.role === 'mp' ? '/mp' : '/officer')}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Overview
          </span>
          <span>&gt;</span>
          <span>{block.name} Block</span>
        </div>

        {/* Header Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: `2px solid ${COLORS.parchmentDeep}`,
            paddingBottom: '16px'
          }}
        >
          <div>
            <h2 style={{ fontFamily: FONTS.display, fontSize: '28px', fontWeight: '700', color: COLORS.soil }}>
              {block.name} Block
            </h2>
            <span style={{ fontFamily: FONTS.body, fontSize: '14px', color: COLORS.inkMuted }}>
              Mandal Region: <strong>{block.mandal}</strong> · Last Inspected: <strong style={{ fontFamily: FONTS.mono }}>{block.last_inspected_at || '—'}</strong>
            </span>
          </div>
          <AlertBadge stress={block.stress_index} />
        </div>

        {/* 4-Metric Grid Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%'
          }}
        >
          {/* Card 1: Stress Index */}
          <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
              Stress Index
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '28px', fontWeight: '600', color: stressColor(block.stress_index) }}>
                {block.stress_index}%
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: stressTrend.color }} title="Trend compared to last week">
                {stressTrend.char}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
              Aggregate block-level stress score
            </span>
          </div>

          {/* Card 2: Rainfall Deficit */}
          <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
              Rainfall Deficit
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '28px', fontWeight: '600', color: COLORS.soil }}>
                {block.rainfall_deficit_pct}%
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: rainTrend.color }}>
                {rainTrend.char}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
              Average seasonal deficit versus normal
            </span>
          </div>

          {/* Card 3: Mandi Price Drop */}
          <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
              Mandi Price Drop
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '28px', fontWeight: '600', color: COLORS.soil }}>
                {block.mandi_price_drop_pct}%
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: priceTrend.color }}>
                {priceTrend.char}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
              Wholesale price dip versus 3yr average
            </span>
          </div>

          {/* Card 4: Active Interventions */}
          <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.inkMuted, letterSpacing: '0.05em' }}>
              Active Interventions
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '28px', fontWeight: '600', color: COLORS.soil }}>
                {activeInterventionsCount}
              </span>
              <span style={{ fontSize: '14px', color: COLORS.inkMuted }}>
                —
              </span>
            </div>
            <span style={{ fontSize: '11px', color: COLORS.inkMuted, display: 'block', marginTop: '4px' }}>
              Current scheduled & live interventions
            </span>
          </div>
        </div>

        {/* Crop Coverage & Explainer */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Crop details */}
          <div style={{ flex: 1, minWidth: '280px', backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: '700', color: COLORS.soil, marginBottom: '12px' }}>
              Mandal Crop Coverage
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(block.crop_coverage || {}).map(([crop, hectares]) => (
                <div key={crop} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.soil}10`, paddingBottom: '6px' }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: '14px', fontWeight: '500', color: COLORS.ink }}>
                    {crop}
                  </span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: '14px', fontWeight: '600', color: COLORS.soil }}>
                    {hectares.toLocaleString()} Ha
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px' }}>
                <span style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>Soil Moisture (Avg):</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: '600', color: COLORS.soil }}>{block.soil_moisture_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>Rainfall (Avg):</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: '600', color: COLORS.soil }}>{block.rainfall_mm} mm</span>
              </div>
            </div>
          </div>

          {/* Explainer card */}
          <div style={{ flex: 1.5, minWidth: '280px', backgroundColor: COLORS.parchmentDeep + '60', border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: '700', color: COLORS.soil }}>
              🔒 Privacy-first Monitoring Principles
            </h3>
            <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.ink, lineHeight: '1.5' }}>
              This system tracks agricultural anomalies at the aggregate cluster level to determine optimal resource deployment (water, pesticide, credit).
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted, lineHeight: '1.5' }}>
              To safeguard civic liberties, the database schema contains <strong>no farmer names, Aadhar card numbers, or individual risk metrics</strong>. Distressed regions are flagged solely on sensor and wholesale pricing fluctuations.
            </p>
          </div>

        </div>

        {/* Alerts List */}
        <div>
          <h3 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: '700', color: COLORS.soil, marginBottom: '12px' }}>
            Active Crop Alerts
          </h3>
          {alerts.length === 0 ? (
            <div style={{ padding: '16px', backgroundColor: COLORS.cream, borderRadius: '8px', textAlign: 'center', color: COLORS.inkMuted, fontSize: '13px', border: `1px solid ${COLORS.soil}10` }}>
              No active alerts reported for this block.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}15`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>
                      {alert.type === 'pest' ? '🐛' : alert.type === 'drought' ? '☀️' : '🌧️'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontFamily: FONTS.body, fontSize: '14px', fontWeight: '600', color: COLORS.ink }}>
                        {alert.type.toUpperCase()}: {alert.affected_metric}
                      </span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: COLORS.inkMuted }}>
                        Reported At: {new Date(alert.reported_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <AlertBadge level={alert.severity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interventions Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: '700', color: COLORS.soil }}>
              Log of Interventions
            </h3>
            {user?.role !== 'mp' && !showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setFormError('');
                }}
                style={{
                  backgroundColor: COLORS.turmeric,
                  color: COLORS.cream,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontFamily: FONTS.display,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Deploy New Intervention
              </button>
            )}
          </div>

          {/* Inline Log Form (Visible only to Officers when showForm is true) */}
          {showForm && (
            <form
              onSubmit={handleFormSubmit}
              style={{
                backgroundColor: COLORS.cream,
                border: `2px solid ${COLORS.turmeric}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <h4 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: '700', color: COLORS.soil }}>
                New Intervention Form
              </h4>

              {formError && <ErrorBanner message={formError} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '6px' }}>
                    Intervention Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option>Water tanker delivery</option>
                    <option>Seed distribution</option>
                    <option>Pesticide sprayers deployment</option>
                    <option>Subsidy credit release</option>
                    <option>Soil treatment campaign</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '6px' }}>
                  Resources Deployed
                </label>
                <input
                  type="text"
                  value={formResources}
                  onChange={(e) => setFormResources(e.target.value)}
                  placeholder="e.g. 15 Water Tankers, Rs 15,000 credit allotment"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, backgroundColor: '#FFFFFF', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '6px' }}>
                  Intervention Details
                </label>
                <textarea
                  value={formDetail}
                  onChange={(e) => setFormDetail(e.target.value)}
                  placeholder="Describe the operations being initiated..."
                  required
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, backgroundColor: '#FFFFFF', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional field notes..."
                  rows="2"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, backgroundColor: '#FFFFFF', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.soil}30`,
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontFamily: FONTS.body,
                    fontSize: '13px',
                    color: COLORS.soil,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    backgroundColor: COLORS.turmeric,
                    color: COLORS.cream,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontFamily: FONTS.display,
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: formSubmitting ? 'not-allowed' : 'pointer',
                    opacity: formSubmitting ? 0.7 : 1
                  }}
                >
                  {formSubmitting ? 'Submitting...' : 'Log & Deploy'}
                </button>
              </div>
            </form>
          )}

          {/* Interventions Listing */}
          {interventions.length === 0 ? (
            <EmptyState
              message="No interventions have been logged for this block yet."
              ctaText={user?.role !== 'mp' ? "Deploy first intervention" : null}
              onCtaClick={user?.role !== 'mp' ? () => setShowForm(true) : null}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {interventions.map(inter => (
                <div
                  key={inter.id}
                  style={{
                    backgroundColor: COLORS.cream,
                    border: `1px solid ${COLORS.soil}15`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📌</span>
                      <h4 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: '700', color: COLORS.soil }}>
                        {inter.type}
                      </h4>
                    </div>
                    <AlertBadge level={inter.status} />
                  </div>
                  
                  <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.ink, lineHeight: '1.4' }}>
                    {inter.detail}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: COLORS.inkMuted, borderTop: `1px solid ${COLORS.soil}10`, paddingTop: '10px', marginTop: '4px' }}>
                    <span>📦 Resources: <strong>{inter.resources_deployed}</strong></span>
                    <span>👮 Officer: <strong>{inter.officer_name || 'System Admin'}</strong></span>
                    <span style={{ fontFamily: FONTS.mono }}>Date: {new Date(inter.created_at).toLocaleDateString()}</span>
                  </div>

                  {inter.notes && (
                    <div style={{ padding: '8px 12px', backgroundColor: COLORS.parchmentDeep + '40', borderRadius: '6px', fontSize: '12px', fontStyle: 'italic', color: COLORS.inkMuted }}>
                      📝 Note: {inter.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
