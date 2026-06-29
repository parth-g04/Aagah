import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../styles/tokens';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

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
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: FONTS.display,
    fontSize: '14px',
    fontWeight: '700',
    color: isActive ? COLORS.cream : COLORS.soil,
    backgroundColor: isActive ? COLORS.soil : 'transparent',
    transition: 'all 0.2s ease',
    border: `1px solid ${isActive ? COLORS.soil : 'transparent'}`
  });

  return (
    <header
      style={{
        backgroundColor: COLORS.cream,
        borderBottom: `2px solid ${COLORS.parchmentDeep}`,
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(92, 64, 51, 0.05)'
      }}
    >
      {/* Brand Logo */}
      <div
        onClick={() => navigate(getOverviewPath())}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
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
          Kisan Alert
          <span style={{ fontSize: '12px', fontWeight: '400', color: COLORS.inkMuted, marginLeft: '8px', fontFamily: FONTS.body }}>
            {user.district}, {user.state}
          </span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <a
          href={getOverviewPath()}
          onClick={(e) => {
            e.preventDefault();
            navigate(getOverviewPath());
          }}
          style={tabStyle(isOverviewActive)}
        >
          Overview
        </a>
        <a
          href="/interventions"
          onClick={(e) => {
            e.preventDefault();
            navigate('/interventions');
          }}
          style={tabStyle(isInterventionsActive)}
        >
          Interventions Log
        </a>
      </nav>

      {/* User Details & Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontFamily: FONTS.body, fontSize: '13px', fontWeight: '600', color: COLORS.ink }}>
            {user.name}
          </span>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: COLORS.cream,
              backgroundColor: user.role === 'mp' ? COLORS.soilLight : COLORS.turmeric,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}
          >
            {user.role === 'mp' ? 'Elected MP' : 'RSK Officer'}
          </span>
        </div>
        
        {/* User avatar circle */}
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
            border: `1px solid ${COLORS.soil}20`
          }}
        >
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>

        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.clay}40`,
            borderRadius: '6px',
            padding: '6px 12px',
            color: COLORS.clay,
            fontFamily: FONTS.body,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
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
          Sign Out
        </button>
      </div>
    </header>
  );
}
