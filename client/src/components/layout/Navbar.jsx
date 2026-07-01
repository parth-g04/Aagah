import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../styles/tokens';
import { TRANSLATIONS } from '../../utils/translations';

export default function Navbar({ customLocation }) {
  const { user, logout, language, changeLanguage } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getOverviewPath = () => {
    return user.role === 'mp' ? '/mp' : '/officer';
  };

  const isOverviewActive = location.pathname === '/mp' || location.pathname === '/officer' || location.pathname.includes('/blocks/');
  const isInterventionsActive = location.pathname === '/interventions';

  const tabStyle = (isActive) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: FONTS.display,
    fontSize: '14px',
    fontWeight: '700',
    color: isActive ? COLORS.cream : COLORS.soil,
    backgroundColor: isActive ? COLORS.soil : 'transparent',
    transition: 'all 0.2s ease',
    border: `1px solid ${isActive ? COLORS.soil : 'transparent'}`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const displayLoc = customLocation || sessionStorage.getItem('aagah_live_location') || `${user.district} Lok Sabha, ${user.state}`;

  // CSS Styles for Left Side Drawers and Top Bar
  const sidebarStyles = `
    body {
      padding-left: 0 !important; /* Body padding is 0 since drawers overlay page */
    }
    .aagah-top-bar {
      background-color: ${COLORS.cream};
      border-bottom: 2px solid ${COLORS.parchmentDeep};
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: 0 2px 8px rgba(92, 64, 51, 0.05);
      box-sizing: border-box;
      width: 100%;
    }
    .aagah-hamburger-btn {
      background: none;
      border: 1px solid ${COLORS.soil}20;
      color: ${COLORS.soil};
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      outline: none;
      background-color: #FFFFFF;
    }
    .aagah-hamburger-btn:hover {
      background-color: ${COLORS.parchment};
    }
    .aagah-drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(26, 37, 30, 0.4);
      backdrop-filter: blur(4px);
      WebkitBackdropFilter: blur(4px);
      transition: opacity 0.3s ease;
    }
    .aagah-left-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      max-width: 85vw;
      height: 100vh;
      background-color: ${COLORS.cream};
      border-right: 2px solid ${COLORS.parchmentDeep};
      box-shadow: 8px 0 32px rgba(26, 37, 30, 0.15);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }
    .aagah-settings-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 340px;
      max-width: 85vw;
      height: 100vh;
      background-color: ${COLORS.cream};
      border-right: 2px solid ${COLORS.parchmentDeep};
      box-shadow: 8px 0 32px rgba(26, 37, 30, 0.15);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }
  `;

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Top Header Bar */}
      <header className="aagah-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 3 lines hamburger menu button */}
          <button 
            onClick={() => setIsNavbarOpen(true)}
            className="aagah-hamburger-btn"
            title="Open Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Brand Logo */}
          <div
            onClick={() => navigate(getOverviewPath())}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '24px' }}>🌱</span>
            <span
              style={{
                fontFamily: FONTS.display,
                fontSize: '18px',
                fontWeight: '700',
                color: COLORS.soil,
                letterSpacing: '-0.02em'
              }}
            >
              Aagah
            </span>
          </div>
        </div>

        {/* Right Location Subtitle */}
        <span style={{ fontSize: '12px', fontWeight: '500', color: COLORS.inkMuted, fontFamily: FONTS.body }}>
          {displayLoc}
        </span>
      </header>

      {/* Left Sidebar Drawer & Backdrop */}
      {isNavbarOpen && (
        <div className="aagah-drawer-backdrop" onClick={() => setIsNavbarOpen(false)} style={{ zIndex: 998 }} />
      )}

      <aside 
        className="aagah-left-drawer"
        style={{ 
          transform: isNavbarOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 999 
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.parchmentDeep}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: COLORS.parchmentDeep + '30'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌱</span>
            <span style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: '700', color: COLORS.soil }}>
              Aagah
            </span>
          </div>
          <button
            onClick={() => setIsNavbarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: COLORS.inkMuted,
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = `${COLORS.soil}15`}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px 16px', flex: 1 }}>
          <a
            href={getOverviewPath()}
            onClick={(e) => {
              e.preventDefault();
              setIsNavbarOpen(false);
              navigate(getOverviewPath());
            }}
            style={tabStyle(isOverviewActive)}
          >
            <span>📊</span> {t.overview}
          </a>
          <a
            href="/interventions"
            onClick={(e) => {
              e.preventDefault();
              setIsNavbarOpen(false);
              navigate('/interventions');
            }}
            style={tabStyle(isInterventionsActive)}
          >
            <span>📜</span> {t.interventionsLog}
          </a>
        </nav>

        {/* User Details & Bottom controls (Settings is on the left) */}
        <div style={{ padding: '20px 16px', borderTop: `1px solid ${COLORS.parchmentDeep}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: COLORS.parchmentDeep,
                color: COLORS.soil,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontFamily: FONTS.display,
                border: `1px solid ${COLORS.soil}20`,
                flexShrink: 0
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontFamily: FONTS.body, fontSize: '13px', fontWeight: '600', color: COLORS.ink }}>
                {user.name}
              </span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  color: COLORS.cream,
                  backgroundColor: user.role === 'mp' ? COLORS.soilLight : COLORS.turmeric,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  letterSpacing: '0.05em',
                  width: 'fit-content'
                }}
              >
                {user.role === 'mp' ? 'Elected MP' : 'RSK Officer'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Settings button is on the LEFT */}
            <button
              onClick={() => {
                setIsNavbarOpen(false);
                setIsSettingsOpen(true);
              }}
              style={{
                background: 'none',
                border: `1px solid ${COLORS.soil}20`,
                color: COLORS.soil,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.parchment}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              title={t.settings}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {/* Logout button is on the RIGHT */}
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${COLORS.clay}40`,
                borderRadius: '6px',
                padding: '8px 12px',
                color: COLORS.clay,
                fontFamily: FONTS.body,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.clay;
                e.currentTarget.style.color = COLORS.cream;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.clay;
              }}
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Backdrop & Settings Drawer (Also slides in from the LEFT) */}
      {isSettingsOpen && (
        <div className="aagah-drawer-backdrop" onClick={() => setIsSettingsOpen(false)} style={{ zIndex: 1000 }} />
      )}

      <div
        className="aagah-settings-drawer"
        style={{
          transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 1001
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.parchmentDeep}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: COLORS.parchmentDeep + '40'
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: '700', color: COLORS.soil }}>
            {t.settings}
          </span>
          <button
            onClick={() => setIsSettingsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: COLORS.inkMuted,
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = `${COLORS.soil}15`}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
          {/* Section 1: Account Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: COLORS.soil, letterSpacing: '0.05em' }}>
              Account Preferences
            </h3>
            
            {/* User Profile Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: COLORS.parchment, borderRadius: '8px', border: `1px solid ${COLORS.soil}15` }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: COLORS.soil, color: COLORS.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{user.name}</span>
                <span style={{ fontSize: '11px', color: COLORS.inkMuted }}>{user.phone}</span>
              </div>
            </div>

            {/* Dark Mode Theme */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Color Theme</span>
              <select 
                style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${COLORS.soil}30`, fontSize: '12px', fontFamily: FONTS.body, backgroundColor: '#FFFFFF', outline: 'none' }}
                defaultValue="light"
              >
                <option value="light">Light (Green Sage)</option>
                <option value="dark">Dark Forest</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            {/* Map Density */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Low-Bandwidth Map</span>
              <input type="checkbox" defaultChecked={false} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: COLORS.rice }} />
            </div>
          </div>

          {/* Section 2: Language Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: COLORS.soil, letterSpacing: '0.05em' }}>
              Language / भाषा / భాష
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { code: 'en', label: 'English' },
                { code: 'te', label: 'తెలుగు (Telugu)' },
                { code: 'hi', label: 'हिन्दी (Hindi)' },
                { code: 'mr', label: 'मराठी (Marathi)' }
              ].map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: `1.5px solid ${isActive ? COLORS.rice : COLORS.soil + '20'}`,
                      backgroundColor: isActive ? COLORS.riceLight : '#FFFFFF',
                      color: isActive ? COLORS.rice : COLORS.ink,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    {lang.code === 'te' && language === 'te' ? 'తెలుగు' :
                     lang.code === 'hi' && language === 'hi' ? 'हिन्दी' :
                     lang.code === 'mr' && language === 'mr' ? 'मराठी' :
                     lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Notification Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontFamily: FONTS.display, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: COLORS.soil, letterSpacing: '0.05em' }}>
              System Alerts
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Push Notifications</span>
                <span style={{ fontSize: '10px', color: COLORS.inkMuted }}>Immediate distress warnings</span>
              </div>
              <input type="checkbox" defaultChecked={true} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: COLORS.rice }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>SMS Alerts (Twilio)</span>
                <span style={{ fontSize: '10px', color: COLORS.inkMuted }}>Fallback offline interventions</span>
              </div>
              <input type="checkbox" defaultChecked={true} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: COLORS.rice }} />
            </div>
          </div>

          {/* Section 4: About / Info */}
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${COLORS.parchmentDeep}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: COLORS.inkMuted, lineHeight: '1.5' }}>
              <strong>Aagah Agri-Decision Support</strong> is active for Anantapur district (AP) and Nagpur (MH) regions.
            </div>
            <div style={{ fontSize: '11px', color: COLORS.inkMuted }}>
              App Version: <strong>v2.4.0 (Stable)</strong>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <a href="#" style={{ color: COLORS.rice, textDecoration: 'none', fontWeight: '600' }} onClick={(e) => { e.preventDefault(); alert("Displaying privacy disclosures: No farmer-level records are indexed."); }}>Privacy Policy</a>
              <span style={{ color: COLORS.parchmentDeep }}>|</span>
              <a href="#" style={{ color: COLORS.rice, textDecoration: 'none', fontWeight: '600' }} onClick={(e) => { e.preventDefault(); alert("Contacting Ministry of Agriculture helpline: +91-11-23383371"); }}>Helpline</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
