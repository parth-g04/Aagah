import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getOfficerBlocks } from '../api/officerApi';
import { getMPSummary, getLocalCropNews, getDeviceBlocks, getDeviceWeather } from '../api/mpApi';
import { AuthContext } from '../context/AuthContext';
import { TRANSLATIONS } from '../utils/translations';
import { COLORS, FONTS, stressColor, stressBg, stressLabel } from '../styles/tokens';

const REGION_MAP = {
  'Kalyandurg': 0,
  'Rayadurg': 1,
  'Tadipatri': 2,
  'Dharmavaram': 3,
  'Kadiri': 4,
  'Guntakal': 5,
  'Hindupur': 6,
  'Penukonda': 7
};

const speakText = (text, callback) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (indVoice) utterance.voice = indVoice;
    utterance.onend = () => { if (callback) callback(); };
    utterance.onerror = () => { if (callback) callback(); };
    window.speechSynthesis.speak(utterance);
  } else if (callback) {
    callback();
  }
};

const startListening = (onResult, onEnd) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onEnd(new Error('Speech recognition not supported in this browser.'));
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    onResult(speechToText);
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    onEnd(new Error(event.error));
  };
  recognition.onend = () => { onEnd(); };
  recognition.start();
  return recognition;
};
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
  const { language, user } = useContext(AuthContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [blocks, setBlocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredMiniBlock, setHoveredMiniBlock] = useState(null);

  // Voice Hotline Demo States
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState('ringing');
  const [recognitionText, setRecognitionText] = useState('');
  const [recognitionObj, setRecognitionObj] = useState(null);

  // Device Geolocation & Weather
  const [deviceLocationName, setDeviceLocationName] = useState('');
  const [deviceWeather, setDeviceWeather] = useState(null);
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [headerLocation, setHeaderLocation] = useState('');
  const [localNews, setLocalNews] = useState([]);

  const fetchDeviceLocationAndWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDeviceCoords({ lat, lng });
        let locName = 'Anantapur';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            locName = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.county || 'Your Area';
            const stateName = addr.state || 'India';
            const formattedHeader = `${locName} Lok Sabha, ${stateName}`;
            sessionStorage.setItem('aagah_live_location', formattedHeader);
            setHeaderLocation(formattedHeader);
            setDeviceLocationName(locName);
          }
        } catch (e) {
          console.error('Nominatim address lookup failed:', e);
          setDeviceLocationName('Your Location');
        }

        try {
          const weatherRes = await getDeviceWeather(lat, lng);
          if (weatherRes && weatherRes.weather) {
            setDeviceWeather(weatherRes.weather);
          }
        } catch (e) {
          console.error('Device weather fetch failed:', e);
        }

        try {
          const newsRes = await getLocalCropNews(locName || 'Anantapur');
          if (newsRes && newsRes.articles) {
            setLocalNews(newsRes.articles);
          }
        } catch (e) {
          console.error('Device local news fetch failed:', e);
        }

        try {
          const blocksRes = await getDeviceBlocks(lat, lng);
          if (blocksRes && blocksRes.blocks && blocksRes.blocks.length > 0) {
            setBlocks(prevBlocks => {
              return prevBlocks.map((block, idx) => {
                const deviceBlock = blocksRes.blocks[idx];
                if (deviceBlock) {
                  return {
                    ...block,
                    name: deviceBlock.name,
                    mandal: deviceBlock.mandal,
                    lat: deviceBlock.lat,
                    lng: deviceBlock.lng,
                    stress_index: deviceBlock.stress_index,
                    stress_history: deviceBlock.stress_history,
                    rainfall_deficit_pct: deviceBlock.rainfall_deficit_pct,
                    mandi_price_drop_pct: deviceBlock.mandi_price_drop_pct,
                    soil_moisture_pct: deviceBlock.soil_moisture_pct,
                    rainfall_mm: deviceBlock.rainfall_mm,
                    active_interventions_count: deviceBlock.active_interventions_count,
                    weather: deviceBlock.weather
                  };
                }
                return block;
              });
            });
          }
        } catch (e) {
          console.error('Device blocks fetch failed:', e);
        }
      }, (err) => {
        console.log('Device location access denied:', err.message);
      });
    }
  };

  useEffect(() => {
    fetchDeviceLocationAndWeather();
    const interval = setInterval(fetchDeviceLocationAndWeather, 300000); // update device weather every 5 mins
    return () => clearInterval(interval);
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    setError('');
    try {
      const [blocksData, summaryData, newsData] = await Promise.all([
        getOfficerBlocks(),
        getMPSummary(language),
        getLocalCropNews('Anantapur')
      ]);
      setBlocks(blocksData);
      setSummary(summaryData);
      setLocalNews(newsData.articles || []);
    } catch (err) {
      setError(err.message || 'Failed to load block worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 300000); // refresh blocks data every 5 minutes
    return () => clearInterval(interval);
  }, [language]);

  const handleAcceptCall = () => {
    setCallState('speaking');
    const alertMessage = "Warning. Aagah Emergency Alert. Kalyandurg Block has crossed the distress threshold of 75. Soil moisture is critical at 12 percent. Would you like to deploy a water tanker intervention now?";
    
    speakText(alertMessage, () => {
      setCallState('listening');
      
      const recognition = startListening(
        (result) => {
          setRecognitionText(result);
          const cleanText = result.toLowerCase();
          if (cleanText.includes('deploy') || cleanText.includes('yes') || cleanText.includes('tanker') || cleanText.includes('do it') || cleanText.includes('sure')) {
            handleVoiceConfirmDeployment();
          } else {
            speakText("Relief cancelled. Call ended.", () => {
              handleDeclineCall();
            });
          }
        },
        (err) => {
          console.error(err);
          handleDeclineCall();
        }
      );
      setRecognitionObj(recognition);
    });
  };

  const handleVoiceConfirmDeployment = async () => {
    setCallState('resolving');
    const token = localStorage.getItem('aagah_token');
    try {
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          block_id: 1, // Kalyandurg
          type: 'Water tanker delivery',
          detail: 'Automated emergency voice hotline deployment',
          resources_deployed: '1 Tanker (6000L)',
          status: 'active',
          notes: 'Triggered by Officer via voice command hotline.'
        })
      });

      if (!response.ok) throw new Error('Deployment failed');

      setCallState('done');
      speakText("Confirmed. Deploying water tanker to Kalyandurg. Ticket resolved.", () => {
        setTimeout(() => {
          handleDeclineCall();
          fetchBlocks(); // Refresh dashboard!
        }, 1200);
      });
    } catch (err) {
      console.error(err);
      speakText("Deployment failed. Manual check required.", () => {
        handleDeclineCall();
      });
    }
  };

  const handleDeclineCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionObj) {
      try {
        recognitionObj.stop();
      } catch (e) {}
    }
    setIsCallActive(false);
    setRecognitionText('');
    setRecognitionObj(null);
  };

  const getBlockStress = (regionId) => {
    const idx = REGION_MAP[regionId];
    const block = blocks[idx];
    return block ? block.stress_index : 0;
  };

  const getBlockId = (regionId) => {
    const idx = REGION_MAP[regionId];
    const block = blocks[idx];
    return block ? block.id : null;
  };

  // Table header definitions
  const headers = [
    { key: 'name', label: t.colBlock, isSortable: true },
    { key: 'stress_index', label: t.colStressIndex, isSortable: true, isNumeric: true },
    { key: 'trend', label: t.colTrend, isSortable: false },
    { key: 'rainfall_deficit_pct', label: t.colRainDeficit, isSortable: true, isNumeric: true },
    { key: 'mandi_price_drop_pct', label: t.colMandiDrop, isSortable: true, isNumeric: true },
    { key: 'active_interventions_count', label: t.colActiveInterventions, isSortable: true, isNumeric: true },
    { key: 'actions', label: t.colAction, isSortable: false }
  ];

  if (loading) {
    return (
      <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar customLocation={headerLocation} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
            {t.btnDeploy}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '48px', boxSizing: 'border-box' }}>
      <Navbar customLocation={headerLocation} />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Large Weekly Weather & Distress Summary Hero Banner */}
        {summary && (
          <div
            style={{
              position: 'relative',
              backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.45) 100%), url(/weather-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '20px',
              padding: '36px 32px',
              color: '#FFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              flexWrap: 'wrap',
              gap: '32px',
              boxShadow: '0 8px 32px rgba(28, 25, 23, 0.15)',
              border: `1.5px solid ${COLORS.soil}30`,
              overflow: 'hidden',
              marginBottom: '8px'
            }}
          >
            {/* Left Section: Welcome & AI Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 2, minWidth: '280px', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: COLORS.turmericLight, letterSpacing: '0.08em', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontFamily: FONTS.display }}>
                    {t.weatherSummary}
                  </span>
                  <span style={{ fontSize: '11px', color: COLORS.parchment, opacity: 0.8, fontFamily: FONTS.body }}>
                    {user.district} Lok Sabha HQs
                  </span>
                </div>
                <h2 style={{ fontFamily: FONTS.display, fontSize: '32px', fontWeight: '800', color: COLORS.turmeric, letterSpacing: '-0.02em', lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  "{summary.headline}"
                </h2>
                <p style={{ fontFamily: FONTS.body, fontSize: '14px', color: COLORS.parchment, opacity: 0.9, marginTop: '8px', lineHeight: '1.5', maxWidth: '640px' }}>
                  Live overview of crop stress, moisture deficit, and retail fluctuations. Use decision support queries below to identify and deploy emergency relief tankers or credits.
                </p>

                {/* Local Crop News Feed Panel */}
                {localNews.length > 0 && (
                  <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '640px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: COLORS.turmeric, letterSpacing: '0.05em', opacity: 0.9 }}>
                      📰 {t.localNewsLabel.replace('(Your Location)', `(${deviceLocationName || `${user.district} District`})`)}
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {localNews.slice(0, 2).map((item, idx) => (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          key={idx}
                          style={{
                            flex: 1,
                            minWidth: '260px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            textDecoration: 'none',
                            color: '#FFF',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.turmericLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.title}</span>
                            <span style={{ fontSize: '9px', opacity: 0.6, fontWeight: 'normal' }}>{item.source}</span>
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                            {item.description}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'auto' }}>
                <button
                  onClick={() => {
                    setIsCallActive(true);
                    setCallState('ringing');
                  }}
                  style={{
                    backgroundColor: COLORS.clay,
                    color: COLORS.cream,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontFamily: FONTS.display,
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(168, 71, 46, 0.3)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>🚨</span> {t.voiceHotlineDemo}
                </button>
              </div>
            </div>

            {/* Right Section: Glassmorphism Weather Info Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '300px', justifyContent: 'center' }}>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: FONTS.display, fontSize: '13px', fontWeight: '700', color: COLORS.turmericLight, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📍 {deviceLocationName || `${user.district} Central`}
                  </span>
                  {(deviceWeather?.icon || summary.weather?.icon) && (
                    <img 
                      src={`https://openweathermap.org/img/wn/${deviceWeather ? deviceWeather.icon : summary.weather.icon}.png`} 
                      alt="Weather Icon" 
                      style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: '42px', fontWeight: '700', color: '#FFF' }}>
                    {deviceWeather ? `${deviceWeather.temp}°C` : (summary.weather ? `${summary.weather.temp}°C` : '--°C')}
                  </span>
                  <span style={{ fontSize: '13px', fontFamily: FONTS.body, color: COLORS.parchment, textTransform: 'capitalize', fontWeight: '600' }}>
                    {deviceWeather ? deviceWeather.description : (summary.weather ? summary.weather.description : 'Weather API Offline (401)')}
                  </span>
                </div>

                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.15)', 
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontFamily: FONTS.mono,
                    color: COLORS.parchment,
                    opacity: 0.95
                  }}
                >
                  <span>💨 Wind: {deviceWeather ? `${deviceWeather.wind_speed} m/s` : (summary.weather ? `${summary.weather.wind_speed} m/s` : '-- m/s')}</span>
                  <span>💧 Humidity: {deviceWeather ? `${deviceWeather.humidity}%` : (summary.weather ? `${summary.weather.humidity}%` : '--%')}</span>
                </div>
              </div>

              {/* Sub-regions Glass Cards */}
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {blocks && blocks.length > 0 ? (
                  blocks.slice(0, 3).map((block, index) => {
                    const tempVal = block.weather ? `${block.weather.temp}°C` : '--';
                    const iconVal = block.weather ? block.weather.icon : null;
                    
                    const desc = block.weather?.description?.toLowerCase() || '';
                    let emoji = index === 0 ? '⛅' : index === 1 ? '🌧️' : '☀️';
                    if (block.weather) {
                      if (desc.includes('rain') || desc.includes('drizzle')) emoji = '🌧️';
                      else if (desc.includes('cloud')) emoji = '⛅';
                      else if (desc.includes('snow')) emoji = '❄️';
                      else if (desc.includes('thunder')) emoji = '⛈️';
                      else if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) emoji = '🌫️';
                      else emoji = '☀️';
                    }

                    return (
                      <div 
                        key={block.id || index}
                        onClick={() => navigate(`/officer/blocks/${block.id}`)}
                        style={{ 
                          flex: 1, 
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                          backdropFilter: 'blur(10px)', 
                          WebkitBackdropFilter: 'blur(10px)', 
                          border: '1px solid rgba(255, 255, 255, 0.12)', 
                          borderRadius: '10px', 
                          padding: '10px', 
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, background-color 0.2s',
                          minWidth: 0
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                      >
                        <div style={{ fontSize: '9px', fontFamily: FONTS.display, fontWeight: '700', textTransform: 'uppercase', color: COLORS.turmericLight, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {block.name}
                        </div>
                        <div style={{ fontSize: '13px', fontFamily: FONTS.mono, fontWeight: '700', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {tempVal}
                          {iconVal ? (
                            <img 
                              src={`https://openweathermap.org/img/wn/${iconVal}.png`} 
                              alt="icon" 
                              style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                            />
                          ) : (
                            <span>{emoji}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontFamily: FONTS.display, fontWeight: '700', textTransform: 'uppercase', color: COLORS.turmericLight }}>Dharmavaram</div>
                      <div style={{ fontSize: '13px', fontFamily: FONTS.mono, fontWeight: '700', margin: '2px 0 0 0' }}>30°C ⛅</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontFamily: FONTS.display, fontWeight: '700', textTransform: 'uppercase', color: COLORS.turmericLight }}>Kalyandurg</div>
                      <div style={{ fontSize: '13px', fontFamily: FONTS.mono, fontWeight: '700', margin: '2px 0 0 0' }}>28°C 🌧️</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', fontFamily: FONTS.display, fontWeight: '700', textTransform: 'uppercase', color: COLORS.turmericLight }}>Kadiri</div>
                      <div style={{ fontSize: '13px', fontFamily: FONTS.mono, fontWeight: '700', margin: '2px 0 0 0' }}>29°C ☀️</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '24px', fontWeight: '700', color: COLORS.soil, marginBottom: '6px' }}>
            {t.worklistOverview}
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.inkMuted }}>
            {t.reviewInterventionsDescription}
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
                {t.spatialContextMap}
              </h4>
              <span style={{ fontFamily: FONTS.body, fontSize: '11px', color: COLORS.inkMuted }}>
                {deviceCoords 
                  ? t.liveTrackingDescription
                  : `Centering on district headquarters (${user.district} HQs).`}
              </span>
            </div>

            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${COLORS.soil}20`,
                height: '240px',
                width: '100%',
                backgroundColor: COLORS.parchmentDeep + '40',
                position: 'relative'
              }}
            >
              <iframe
                title="OpenStreetMap Live Device Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={deviceCoords 
                  ? `https://www.openstreetmap.org/export/embed.html?bbox=${deviceCoords.lng - 0.015}%2C${deviceCoords.lat - 0.01}%2C${deviceCoords.lng + 0.015}%2C${deviceCoords.lat + 0.01}&layer=mapnik&marker=${deviceCoords.lat}%2C${deviceCoords.lng}`
                  : `https://www.openstreetmap.org/export/embed.html?bbox=77.58%2C14.67%2C77.62%2C14.69&layer=mapnik&marker=14.68%2C77.60`
                }
                style={{ border: 'none' }}
              />
            </div>
          </div>

        </div>
      </main>

      {isCallActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            fontFamily: FONTS.body
          }}
        >
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.3; }
              100% { opacity: 1; }
            }
          `}</style>
          <div
            style={{
              backgroundColor: '#1C1918',
              color: '#F9F6F0',
              width: '320px',
              height: '460px',
              borderRadius: '24px',
              border: `3px solid ${COLORS.soil}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '40px 24px',
              boxSizing: 'border-box',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            {/* Header info */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                style={{ 
                  fontSize: '44px', 
                  margin: '0 auto 12px auto',
                  animation: callState === 'ringing' ? 'pulse 1s infinite' : 'none',
                  backgroundColor: callState === 'ringing' ? COLORS.clay : '#3E3B39',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📞
              </div>
              <h3 style={{ fontFamily: FONTS.display, fontSize: '20px', fontWeight: '700', margin: 0, color: COLORS.turmeric }}>
                Aagah Distress Hotline
              </h3>
              <span style={{ fontSize: '12px', color: '#EBE2CD', opacity: 0.8 }}>
                {callState === 'ringing' && 'Incoming Call...'}
                {callState === 'speaking' && 'Speaking...'}
                {callState === 'listening' && 'Listening for command...'}
                {callState === 'resolving' && 'Processing deployment...'}
                {callState === 'done' && 'Completed'}
              </span>
            </div>

            {/* Conversation Log / Visual Status */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifycontent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0', textAlign: 'center' }}>
              {callState === 'ringing' && (
                <div style={{ fontSize: '13px', color: '#EBE2CD', fontStyle: 'italic' }}>
                  Emergency warning signal detected from Kalyandurg Block.
                </div>
              )}
              {callState === 'speaking' && (
                <div style={{ fontSize: '13px', color: COLORS.cream, lineHeight: '1.4', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  "Kalyandurg Block crossed stress threshold of 75. Soil moisture is critical at 12%. Deploy emergency water relief?"
                </div>
              )}
              {callState === 'listening' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: COLORS.turmeric, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', animation: 'blink 1.2s infinite' }}>
                    🎙️ Speak now: Say "Deploy" or "Yes"
                  </div>
                  {recognitionText ? (
                    <div style={{ fontSize: '15px', fontWeight: '700', color: COLORS.riceLight }}>
                      "{recognitionText}"
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#EBE2CD', opacity: 0.6, fontStyle: 'italic' }}>
                      Listening to microphone...
                    </div>
                  )}
                </div>
              )}
              {callState === 'resolving' && (
                <div style={{ fontSize: '13px', color: COLORS.turmericLight, fontWeight: '700' }}>
                  Deploying water relief resources...
                </div>
              )}
              {callState === 'done' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '28px', color: COLORS.rice }}>✓</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.rice }}>Relief Deployed</div>
                  <div style={{ fontSize: '11px', color: '#EBE2CD', opacity: 0.6 }}>Kalyandurg stress index reduced by 8%</div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
              {callState === 'ringing' ? (
                <>
                  <button
                    onClick={handleDeclineCall}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.clay,
                      color: 'white',
                      border: 'none',
                      fontSize: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    🚫
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.rice,
                      color: 'white',
                      border: 'none',
                      fontSize: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(61, 122, 77, 0.4)',
                      outline: 'none'
                    }}
                  >
                    📞
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDeclineCall}
                  style={{
                    backgroundColor: COLORS.clay,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontFamily: FONTS.display,
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  End Call
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
