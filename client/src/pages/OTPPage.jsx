import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { verifyOTP, sendOTP } from '../api/authApi';
import { COLORS, FONTS } from '../styles/tokens';
import ErrorBanner from '../components/shared/ErrorBanner';

export default function OTPPage() {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Get phone from state (fallback if direct page load)
  const phone = location.state?.phone || '+919900000002';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Resend Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time (e.g. 04:59)
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index, val) => {
    // Allow digits only
    if (val && !/^\d$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (val && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous cell and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else if (otp[index]) {
        // Clear current cell
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // Reject if not exactly 6 digits

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs[5].current.focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(phone, fullCode);
      // login in context
      login(response.token, response.user);
      
      // Navigate based on role
      if (response.user.role === 'mp') {
        navigate('/mp');
      } else {
        navigate('/officer');
      }
    } catch (err) {
      setError(err.message || 'Incorrect OTP. Try again.');
      setIsShaking(true);
      // Clear OTP cells
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
      // Stop shaking after 500ms
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOTP(phone);
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger auto submit when 6th digit is entered
  useEffect(() => {
    if (otp.join('').length === 6) {
      handleSubmit();
    }
  }, [otp]);

  // CSS Keyframe Shake Animation
  const shakeAnimation = `
    @keyframes otp-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: COLORS.parchment,
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <style>{shakeAnimation}</style>
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: COLORS.cream,
          border: `1px solid ${COLORS.soil}20`,
          borderRadius: '12px',
          padding: '32px 24px',
          boxShadow: '0 4px 16px rgba(92, 64, 51, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          transform: isShaking ? 'scale(1)' : 'none',
          animation: isShaking ? 'otp-shake 0.5s ease-in-out' : 'none'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '20px', fontWeight: '700', color: COLORS.soil, marginBottom: '8px' }}>
            Verify Identity
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted, lineHeight: '1.4' }}>
            We've sent a 6-digit verification code to
            <span style={{ fontFamily: FONTS.mono, fontWeight: '600', color: COLORS.ink, marginLeft: '4px' }}>
              {phone}
            </span>
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          {/* 6 Digit Grid */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '6px',
                  border: `2px solid ${error ? COLORS.clay : (digit ? COLORS.turmeric : COLORS.soil + '30')}`,
                  backgroundColor: '#FFFFFF',
                  fontFamily: FONTS.mono,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: COLORS.soil,
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {timeLeft > 0 ? (
              <span style={{ fontFamily: FONTS.mono, fontSize: '13px', color: COLORS.inkMuted }}>
                Resend code in <strong style={{ color: COLORS.soil }}>{formatTime()}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: FONTS.display,
                  fontSize: '13px',
                  fontWeight: '700',
                  color: COLORS.turmeric,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  outline: 'none'
                }}
              >
                Resend OTP
              </button>
            )}

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              style={{
                backgroundColor: COLORS.soil,
                color: COLORS.cream,
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontFamily: FONTS.display,
                fontSize: '14px',
                fontWeight: '700',
                cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer',
                opacity: (loading || otp.join('').length < 6) ? 0.6 : 1,
                outline: 'none'
              }}
            >
              Verify
            </button>
          </div>
        </form>

        {/* Demo Helper Caption */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: COLORS.inkMuted,
            textAlign: 'center',
            backgroundColor: COLORS.parchmentDeep + '60',
            padding: '10px',
            borderRadius: '6px',
            border: `1px solid ${COLORS.soil}10`,
            lineHeight: '1.4'
          }}
        >
          ⚙️ <strong>Demo Mode Active:</strong> Standard lockout is bypassed. You can use the stage bypass code <strong style={{ fontFamily: FONTS.mono, color: COLORS.clay }}>246800</strong> to log in. OTPs are also printed in the server terminal output.
        </div>
      </div>
    </div>
  );
}
