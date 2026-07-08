import React, { useState, useContext, useEffect, useRef } from 'react';
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

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile data states (starts empty)
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileDob, setProfileDob] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);



  // Refs to avoid stale closures in Google OAuth callback
  const profileNameRef = useRef(profileName);
  const profileAgeRef = useRef(profileAge);
  const profileGenderRef = useRef(profileGender);
  const profileDobRef = useRef(profileDob);
  const consentCheckedRef = useRef(consentChecked);

  useEffect(() => {
    profileNameRef.current = profileName;
    profileAgeRef.current = profileAge;
    profileGenderRef.current = profileGender;
    profileDobRef.current = profileDob;
    consentCheckedRef.current = consentChecked;
  }, [profileName, profileAge, profileGender, profileDob, consentChecked]);

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
      if (!profileNameRef.current.trim() || !profileAgeRef.current || !profileGenderRef.current || !profileDobRef.current) {
        setError('Please fill in Name, Age, Gender, and Date of Birth first.');
        return;
      }
      if (!consentCheckedRef.current) {
        setError('You must check the consent checkbox to share your data first.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await googleLogin(response.credential);
        login(result.token, {
          ...result.user,
          name: profileNameRef.current,
          age: parseInt(profileAgeRef.current, 10),
          gender: profileGenderRef.current,
          dob: profileDobRef.current
        });
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

    // Auto-fill demo profiles based on the typed phone number
    if (stripped === '9900000001') {
      setProfileName('Ravi Kumar');
      setProfileAge('45');
      setProfileGender('male');
      setProfileDob('1981-08-15');
    } else if (stripped === '9900000002') {
      setProfileName('Priya Sharma');
      setProfileAge('32');
      setProfileGender('female');
      setProfileDob('1994-04-12');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileAge || !profileGender || !profileDob) {
      setError('Please fill in Name, Age, Gender, and Date of Birth.');
      return;
    }
    if (!consentChecked) {
      setError('You must check the consent checkbox to share your data before proceeding.');
      return;
    }
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = `+91${phoneNumber}`;
    try {
      await sendOTP(fullPhone);
      navigate('/otp', { 
        state: { 
          phone: fullPhone,
          profileName,
          profileAge: parseInt(profileAge, 10),
          profileGender,
          profileDob
        } 
      });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check the phone number.');
    } finally {
      setLoading(false);
    }
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


          {/* User Profile Inputs (Required before phone/Google auth) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="name-input" style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${COLORS.soil}30`,
                  fontSize: '14px',
                  fontFamily: FONTS.body,
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
              <div>
                <label htmlFor="age-input" style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Age
                </label>
                <input
                  id="age-input"
                  type="number"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  placeholder="Age"
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${COLORS.soil}30`,
                    fontSize: '14px',
                    fontFamily: FONTS.body,
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                    height: '40px'
                  }}
                />
              </div>
              <div>
                <label htmlFor="gender-input" style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Gender
                </label>
                <select
                  id="gender-input"
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${COLORS.soil}30`,
                    fontSize: '14px',
                    fontFamily: FONTS.body,
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                    height: '40px'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

              </div>
            </div>

            <div>
              <label htmlFor="dob-input" style={{ display: 'block', fontFamily: FONTS.display, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: COLORS.soil, marginBottom: '8px', letterSpacing: '0.05em' }}>
                Date of Birth
              </label>
              <input
                id="dob-input"
                type="date"
                value={profileDob}
                onChange={(e) => setProfileDob(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${COLORS.soil}30`,
                  fontSize: '14px',
                  fontFamily: FONTS.body,
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <label htmlFor="consent-checkbox" style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted, lineHeight: '1.4', cursor: 'pointer', userSelect: 'none' }}>
                I agree to share my name, age, gender, and date of birth with Aagah for dashboard authentication.
              </label>
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
