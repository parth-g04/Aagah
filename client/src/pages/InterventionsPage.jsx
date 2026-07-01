import React, { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from '../components/layout/Navbar';
import { getInterventions } from '../api/interventionsApi';
import { COLORS, FONTS } from '../styles/tokens';
import { AuthContext } from '../context/AuthContext';
import { TRANSLATIONS } from '../utils/translations';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import AlertBadge from '../components/shared/AlertBadge';
import EmptyState from '../components/shared/EmptyState';

export default function InterventionsPage() {
  const { language, user } = useContext(AuthContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInterventions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all interventions first, to count and filter locally
      const data = await getInterventions('', '', '', language);
      setInterventions(data);
    } catch (err) {
      setError(err.message || 'Failed to load interventions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [language]);

  // Compute status counts from the raw dataset
  const counts = useMemo(() => {
    return {
      all: interventions.length,
      active: interventions.filter(i => i.status === 'active').length,
      scheduled: interventions.filter(i => i.status === 'scheduled').length,
      completed: interventions.filter(i => i.status === 'completed').length
    };
  }, [interventions]);

  // Filter & Search dataset
  const filteredInterventions = useMemo(() => {
    return interventions.filter(i => {
      // 1. Status Filter
      if (selectedStatus !== 'All' && i.status !== selectedStatus.toLowerCase()) {
        return false;
      }
      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const typeMatch = (i.type || '').toLowerCase().includes(query);
        const detailMatch = (i.detail || '').toLowerCase().includes(query);
        const blockMatch = (i.block_name || '').toLowerCase().includes(query);
        const notesMatch = (i.notes || '').toLowerCase().includes(query);
        return typeMatch || detailMatch || blockMatch || notesMatch;
      }
      return true;
    });
  }, [interventions, selectedStatus, searchQuery]);

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

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '24px', fontWeight: '700', color: COLORS.soil, marginBottom: '6px' }}>
            {t.interventionsLog}
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted }}>
            Historical record of all mitigative actions deployed in {user?.district || 'your'} blocks.
          </p>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchInterventions} />}

        {/* Filters and Search Bar Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: COLORS.cream,
            border: `1px solid ${COLORS.soil}20`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Active', 'Scheduled', 'Completed'].map((status) => {
              const countKey = status.toLowerCase();
              const countVal = countKey === 'all' ? counts.all : counts[countKey];
              const isActive = selectedStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  style={{
                    backgroundColor: isActive ? COLORS.soil : COLORS.parchment,
                    color: isActive ? COLORS.cream : COLORS.soil,
                    border: `1px solid ${isActive ? COLORS.soil : COLORS.soil + '20'}`,
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: FONTS.display,
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{status}</span>
                  <span
                    style={{
                      backgroundColor: isActive ? COLORS.cream : COLORS.soil + '15',
                      color: isActive ? COLORS.soil : COLORS.soil,
                      borderRadius: '10px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontFamily: FONTS.mono,
                      fontWeight: '700'
                    }}
                  >
                    {countVal}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div style={{ flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by block, type, or detail..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.soil}30`,
                outline: 'none',
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS.ink,
                backgroundColor: '#FFFFFF'
              }}
            />
          </div>
        </div>

        {/* Interventions Output List */}
        {filteredInterventions.length === 0 ? (
          <EmptyState
            message="No interventions match your filters."
            ctaText="Clear Filters"
            onCtaClick={() => {
              setSelectedStatus('All');
              setSearchQuery('');
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredInterventions.map((inter) => (
              <div
                key={inter.id}
                style={{
                  backgroundColor: COLORS.cream,
                  border: `1px solid ${COLORS.soil}15`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }} aria-hidden="true">📍</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: '700', color: COLORS.soil }}>
                        {inter.type}
                      </span>
                      <span style={{ fontFamily: FONTS.body, fontSize: '11px', color: COLORS.inkMuted }}>
                        Block: <strong>{inter.block_name}</strong> ({inter.block_mandal})
                      </span>
                    </div>
                  </div>
                  <AlertBadge level={inter.status} />
                </div>

                {/* Details text */}
                <p style={{ fontFamily: FONTS.body, fontSize: '13.5px', color: COLORS.ink, lineHeight: '1.5' }}>
                  {inter.detail}
                </p>

                {/* Footer Metadata */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                    color: COLORS.inkMuted,
                    borderTop: `1px solid ${COLORS.soil}10`,
                    paddingTop: '12px',
                    marginTop: '4px'
                  }}
                >
                  <span>📦 Resources Deployed: <strong>{inter.resources_deployed}</strong></span>
                  <span>👮 Officer: <strong>{inter.officer_name || 'System Admin'}</strong></span>
                  <span style={{ fontFamily: FONTS.mono }}>Date: {new Date(inter.created_at).toLocaleDateString()}</span>
                </div>

                {/* Optional Notes */}
                {inter.notes && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: COLORS.parchmentDeep + '40',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: COLORS.inkMuted,
                      fontStyle: 'italic',
                      lineHeight: '1.4'
                    }}
                  >
                    📝 Field Notes: {inter.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
