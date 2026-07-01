import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { sendOTP, googleLogin } from '../api/authApi';
import { COLORS, FONTS } from '../styles/tokens';
import { TRANSLATIONS } from '../utils/translations';
import ErrorBanner from '../components/shared/ErrorBanner';

export default function LoginPage() {
  const { token, user, login, language } = useContext(AuthContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const navigate = useNavigate();

  const [role, setRole] = useState('officer'); // Default selected role
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect immediately
  useEffect(() => {
    if (token && user) {
      if (user.role === 'mp') {
        navigate('/mp');
      } else {
        navigate('/officer');
      }
    }
  }, [token, user, navigate]);

  // Google OAuth Script Loader & Button Initialization
  useEffect(() => {
    const existingScript = document.getElementById('google-gsi-client');

    const initGsi = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "853488812234-stubid.apps.googleusercontent.com";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin
        });

        // Small delay to ensure DOM element is mounted and ready to draw
        setTimeout(() => {
          const btnElem = document.getElementById("google-signin-button");
          if (btnElem && window.google) {
            window.google.accounts.id.renderButton(
              btnElem,
              { theme: "outline", size: "large", width: 352, logo_alignment: "left" }
            );
          }
        }, 100);
      }
    };

    const handleGoogleLogin = async (response) => {
      setLoading(true);
      setError('');
      try {
        const result = await googleLogin(response.credential);
        login(result.token, result.user);
        if (result.user.role === 'mp') {
          navigate('/mp');
        } else {
          navigate('/officer');
        }
      } catch (err) {
        setError(err.message || 'Google OAuth verification failed.');
      } finally {
        setLoading(false);
      }
    };

    if (existingScript) {
      initGsi();
    } else {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGsi();
      };
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup check
    };
  }, [navigate]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Strip non-digits and limit length to 10
    const stripped = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(stripped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = `+91${phoneNumber}`;
    try {
      await sendOTP(fullPhone);
      navigate('/otp', { state: { phone: fullPhone } });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check the phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Preview descriptions for roles
  const rolePreviews = {
    mp: "Access district aggregate choropleth map & headline summaries.",
    officer: "Deploy, review, and log agricultural interventions in Anantapur blocks."
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.6) 100%), url(/agri-mist-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span style={{ fontSize: '28px' }}>🌱</span>
          <span style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '700', color: COLORS.soil }}>
            Aagah
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: '700', color: COLORS.ink, marginBottom: '6px' }}>
            Officer & Representative Portal
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted }}>
            Enter your registered mobile number to authenticate.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Role Toggle */}
          <div>
            <label style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
              {t.roleLabel}
            </label>
            <div style={{ display: 'flex', border: `1px solid ${COLORS.soil}30`, borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => {
                  setRole('officer');
                  // Auto-fill Priya's number for ease of demo
                  setPhoneNumber('9900000002');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: role === 'officer' ? COLORS.soil : COLORS.cream,
                  color: role === 'officer' ? COLORS.cream : COLORS.soil,
                  border: 'none',
                  fontFamily: FONTS.display,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                RSK Officer
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('mp');
                  // Auto-fill Ravi's number for ease of demo
                  setPhoneNumber('9900000001');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: role === 'mp' ? COLORS.soil : COLORS.cream,
                  color: role === 'mp' ? COLORS.cream : COLORS.soil,
                  border: 'none',
                  fontFamily: FONTS.display,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                Elected MP
              </button>
            </div>

            {/* Role Live Preview */}
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: COLORS.parchmentDeep + '50',
                borderLeft: `3px solid ${COLORS.soil}`,
                fontFamily: FONTS.body,
                fontSize: '12px',
                color: COLORS.inkMuted,
                fontStyle: 'italic',
                lineHeight: '1.4'
              }}
            >
              {rolePreviews[role]}
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label htmlFor="phone-input" style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
              {t.phoneLabel}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${COLORS.soil}40`, borderRadius: '8px', backgroundColor: '#FFFFFF', padding: '0 12px' }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '15px', color: COLORS.inkMuted, marginRight: '8px', userSelect: 'none' }}>
                +91
              </span>
              <input
                id="phone-input"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="9900000000"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  padding: '12px 0',
                  fontFamily: FONTS.mono,
                  fontSize: '15px',
                  color: COLORS.ink,
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: COLORS.turmeric,
              color: COLORS.cream,
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: FONTS.display,
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = COLORS.soil;
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = COLORS.turmeric;
            }}
          >
            {loading ? '...' : t.sendOtp}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.soil + '20' }} />
          <span style={{ fontFamily: FONTS.display, fontSize: '11px', fontWeight: '700', color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.soil + '20' }} />
        </div>

        {/* Google SSO Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div id="google-signin-button" style={{ width: '100%', minHeight: '40px', display: 'flex', justifyContent: 'center' }} />
          <span style={{ fontFamily: FONTS.body, fontSize: '10.5px', color: COLORS.inkMuted, fontStyle: 'italic', textAlign: 'center', lineHeight: '1.3' }}>
            Allows instant verification via government G-Suite identity.
          </span>
        </div>

        {/* Data Privacy Caption */}
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: COLORS.inkMuted,
            textAlign: 'center',
            lineHeight: '1.4',
            borderTop: `1px solid ${COLORS.soil}10`,
            paddingTop: '12px',
            marginTop: '8px'
          }}
        >
          🔒 <strong>Privacy Constraint:</strong> This dashboard collects only aggregated, block-level agronomic stress factors. No personal farmer names, identification details, or risk ratings are processed.
        </p>
      </div>
    </div>
  );
}
