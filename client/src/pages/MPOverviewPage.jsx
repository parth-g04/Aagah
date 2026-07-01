import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getMPSummary, getMPBlocks, queryMPBlocks, getDeviceWeather, getLocalCropNews, getDeviceBlocks } from '../api/mpApi';
import { AuthContext } from '../context/AuthContext';
import { TRANSLATIONS } from '../utils/translations';
import { COLORS, FONTS, stressColor, stressBg, stressLabel } from '../styles/tokens';
import Spinner from '../components/shared/Spinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import Sparkline from '../components/shared/Sparkline';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

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

function MapGeoJsonLayer({ blocks, hoveredBlock, setHoveredBlock, navigate, activeQueryIds }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Clear previous data
    try {
      map.data.forEach((feature) => map.data.remove(feature));
    } catch (e) {}

    // Load GeoJSON
    try {
      map.data.loadGeoJson('/anantapur-mandals.geojson');
    } catch (e) {
      console.error('GeoJSON load error:', e);
    }

    // Dynamic Style Polygons
    map.data.setStyle((feature) => {
      const featureName = feature.getProperty('name');
      const idx = REGION_MAP[featureName];
      const block = blocks[idx];
      const stress = block ? block.stress_index : 0;
      const isMatched = activeQueryIds.length === 0 || activeQueryIds.includes(block?.id);

      const fill = stressBg(stress);
      const isHovered = hoveredBlock && block && hoveredBlock.id === block.id;

      return {
        fillColor: fill,
        fillOpacity: isMatched ? (isHovered ? 0.85 : 0.6) : 0.15,
        strokeColor: isHovered ? COLORS.turmeric : COLORS.soil,
        strokeWeight: isHovered ? 2.5 : 1,
        strokeOpacity: isMatched ? 1.0 : 0.3
      };
    });

    // Set Listeners
    const mouseOverEvent = map.data.addListener('mouseover', (event) => {
      const featureName = event.feature.getProperty('name');
      const idx = REGION_MAP[featureName];
      const block = blocks[idx];
      if (block) {
        setHoveredBlock({
          name: block.name,
          stress: block.stress_index,
          id: block.id
        });
      }
    });

    const mouseOutEvent = map.data.addListener('mouseout', () => {
      setHoveredBlock(null);
    });

    const clickEvent = map.data.addListener('click', (event) => {
      const featureName = event.feature.getProperty('name');
      const idx = REGION_MAP[featureName];
      const block = blocks[idx];
      if (block) {
        navigate(`/mp/blocks/${block.id}`);
      }
    });

    return () => {
      google.maps.event.removeListener(mouseOverEvent);
      google.maps.event.removeListener(mouseOutEvent);
      google.maps.event.removeListener(clickEvent);
    };
  }, [map, blocks, hoveredBlock, activeQueryIds]);

  return null;
}

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

import { useRef } from 'react';

function LeafletDistrictMap({ blocks, hoveredBlock, setHoveredBlock, navigate, activeQueryIds, deviceCoords }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;

    // Initialize Leaflet map
    if (!mapInstance.current) {
      const initialCenter = deviceCoords ? [deviceCoords.lat, deviceCoords.lng] : [14.68, 77.60];
      const initialZoom = deviceCoords ? 10 : 9;

      const map = window.L.map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false
      });

      // Use CartoDB Dark Matter tile layer for premium look
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstance.current = map;
    }

    const map = mapInstance.current;

    // Update center if device coordinates change
    if (deviceCoords) {
      map.setView([deviceCoords.lat, deviceCoords.lng], 10);
    } else {
      map.setView([14.68, 77.60], 9);
    }

    // Clear previous GeoJSON layer
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    // Clear previous markers
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }
    markersLayerRef.current = window.L.layerGroup().addTo(map);

    // If we have device coordinates (e.g. Nagpur), render block markers around Nagpur instead of Anantapur GeoJSON
    if (deviceCoords) {
      // Draw a pulsing marker for the user's location
      const pulseIcon = window.L.divIcon({
        className: 'gps-pulse-marker',
        html: '<div class="pulse"></div><div class="dot"></div>',
        iconSize: [20, 20]
      });
      window.L.marker([deviceCoords.lat, deviceCoords.lng], { icon: pulseIcon }).addTo(markersLayerRef.current);

      // Draw markers/circles for each of the 8 blocks
      blocks.forEach((block) => {
        if (block.lat && block.lng) {
          const isMatched = activeQueryIds.length === 0 || activeQueryIds.includes(block.id);
          if (!isMatched) return;

          const color = stressColor(block.stress_index);
          const circleMarker = window.L.circleMarker([block.lat, block.lng], {
            radius: 12,
            fillColor: color,
            color: '#FFF',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(markersLayerRef.current);

          circleMarker.on({
            mouseover: () => {
              setHoveredBlock({
                name: block.name,
                stress: block.stress_index,
                id: block.id
              });
            },
            mouseout: () => {
              setHoveredBlock(null);
            },
            click: () => {
              navigate(`/mp/blocks/${block.id}`);
            }
          });
        }
      });
    } else {
      // Normal Mode: Load Anantapur GeoJSON
      fetch('/anantapur-mandals.geojson')
        .then(res => res.json())
        .then(geoJsonData => {
          const style = (feature) => {
            const featureName = feature.properties.name;
            const idx = REGION_MAP[featureName];
            const block = blocks[idx];
            const stress = block ? block.stress_index : 0;
            const isMatched = activeQueryIds.length === 0 || activeQueryIds.includes(block?.id);

            const fill = stressBg(stress);
            const isHovered = hoveredBlock && block && hoveredBlock.id === block.id;

            return {
              fillColor: fill,
              weight: isHovered ? 2.5 : 1,
              opacity: 1,
              color: isHovered ? COLORS.turmeric : COLORS.soil,
              fillOpacity: isMatched ? (isHovered ? 0.85 : 0.6) : 0.15
            };
          };

          const geojsonLayer = window.L.geoJSON(geoJsonData, {
            style: style,
            onEachFeature: (feature, layer) => {
              const featureName = feature.properties.name;
              const idx = REGION_MAP[featureName];
              const block = blocks[idx];

              if (block) {
                layer.on({
                  mouseover: (e) => {
                    setHoveredBlock({
                      name: block.name,
                      stress: block.stress_index,
                      id: block.id
                    });
                    layer.setStyle({
                      weight: 2.5,
                      color: COLORS.turmeric,
                      fillOpacity: 0.85
                    });
                  },
                  mouseout: (e) => {
                    setHoveredBlock(null);
                    geojsonLayer.resetStyle(layer);
                  },
                  click: (e) => {
                    navigate(`/mp/blocks/${block.id}`);
                  }
                });
              }
            }
          }).addTo(map);

          geojsonLayerRef.current = geojsonLayer;
        })
        .catch(err => console.error('Leaflet GeoJSON load error:', err));
    }
  }, [blocks, hoveredBlock, activeQueryIds, deviceCoords]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .gps-pulse-marker {
          position: relative;
        }
        .gps-pulse-marker .dot {
          width: 10px;
          height: 10px;
          background-color: #3b82f6;
          border-radius: 50%;
          position: absolute;
          top: 5px;
          left: 5px;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
        }
        .gps-pulse-marker .pulse {
          width: 20px;
          height: 20px;
          background-color: rgba(59, 130, 246, 0.4);
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 0;
          animation: gpsPulse 2s infinite ease-out;
        }
        @keyframes gpsPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-container {
          background-color: #1c1917 !important;
        }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
    </div>
  );
}

export default function MPOverviewPage() {
  const navigate = useNavigate();
  const { language, user } = useContext(AuthContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [summary, setSummary] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredBlock, setHoveredBlock] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, blocksData, newsData] = await Promise.all([
        getMPSummary(language),
        getMPBlocks(),
        getLocalCropNews('Anantapur')
      ]);
      setSummary(sumData);
      setBlocks(blocksData);
      setLocalNews(newsData.articles || []);
    } catch (err) {
      setError(err.message || 'Failed to load MP Overview data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // refresh summary every 5 minutes
    return () => clearInterval(interval);
  }, [language]);

  // Map block names from DB to region templates
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

  const getBlockObject = (regionId) => {
    const idx = REGION_MAP[regionId];
    return blocks[idx] || null;
  };

  const [queryText, setQueryText] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

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
  const [activeQueryIds, setActiveQueryIds] = useState([]);
  const [activeQueryExplanation, setActiveQueryExplanation] = useState('');

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || queryLoading) return;

    setQueryLoading(true);
    try {
      const result = await queryMPBlocks(queryText);
      setActiveQueryIds(result.matchingBlockIds || []);
      setActiveQueryExplanation(result.explanation || 'Query parsed.');
    } catch (err) {
      console.error('[Frontend Query Error]:', err.message);
      setError(err.message || 'Failed to process natural language query.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleClearQuery = () => {
    setQueryText('');
    setActiveQueryIds([]);
    setActiveQueryExplanation('');
  };

  // Voice Hotline Demo States
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState('ringing');
  const [recognitionText, setRecognitionText] = useState('');
  const [recognitionObj, setRecognitionObj] = useState(null);

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
          notes: 'Triggered by MP via voice command hotline.'
        })
      });

      if (!response.ok) throw new Error('Deployment failed');

      setCallState('done');
      speakText("Confirmed. Deploying water tanker to Kalyandurg. Ticket resolved.", () => {
        setTimeout(() => {
          handleDeclineCall();
          fetchData(); // Refresh dashboard!
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

  // Find top 3 stressed blocks or filtered search
  const displayedBlocks = activeQueryIds.length > 0
    ? blocks.filter(b => activeQueryIds.includes(b.id))
    : [...blocks].sort((a, b) => b.stress_index - a.stress_index).slice(0, 3);

  const listHeader = activeQueryIds.length > 0
    ? `Filtered Blocks (${displayedBlocks.length})`
    : `${t.criticalBlocks} (Top 3)`;

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

  return (
    <div style={{ backgroundColor: COLORS.parchment, minHeight: '100vh', paddingBottom: '48px', boxSizing: 'border-box' }}>
      <Navbar customLocation={headerLocation} />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

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
              overflow: 'hidden'
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
                    📍 {deviceLocationName || 'Anantapur Central'}
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

              {/* Sub-regions Glass Cards (like Bandung, Jakarta in inspiration) */}
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
                        onClick={() => navigate(`/mp/blocks/${block.id}`)}
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

        {/* Natural Language Query Box */}
        <div style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.soil}20`, borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontFamily: FONTS.display, fontSize: '14px', fontWeight: '700', color: COLORS.soil, margin: 0 }}>
            🔎 Natural-Language Decision Support Query
          </h3>
          <form onSubmit={handleQuerySubmit} style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask the dashboard (e.g. 'show blocks with high stress' or 'soil moisture less than 15%')"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${COLORS.soil}30`,
                  fontSize: '14px',
                  fontFamily: FONTS.body,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                disabled={queryLoading}
              />
              {queryLoading && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Spinner size={18} />
                </div>
              )}
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: COLORS.turmeric,
                color: COLORS.soil,
                border: `1.5px solid ${COLORS.soil}`,
                borderRadius: '8px',
                padding: '10px 20px',
                fontFamily: FONTS.display,
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.1s',
                outline: 'none'
              }}
              disabled={queryLoading || !queryText.trim()}
            >
              Filter
            </button>
            {activeQueryExplanation && (
              <button
                type="button"
                onClick={handleClearQuery}
                style={{
                  backgroundColor: 'transparent',
                  color: COLORS.clay,
                  border: `1.5px solid ${COLORS.clay}40`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontFamily: FONTS.body,
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  outline: 'none'
                }}
              >
                Clear
              </button>
            )}
          </form>
          {activeQueryExplanation && (
            <div style={{ fontSize: '12px', color: COLORS.rice, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONTS.body }}>
              <span>✓</span> {activeQueryExplanation}
            </div>
          )}
        </div>

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
                {t.spatialContextMap}
              </h3>
              <p style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>
                Hover to inspect aggregate mandal stats. Click block to drill down into crop coverage, moisture trends, and logs.
              </p>
            </div>

            {/* SVG Choropleth Map / Google Map Switcher */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.parchmentDeep + '40',
                borderRadius: '8px',
                padding: '0',
                border: `1px solid ${COLORS.soil}10`,
                height: '350px',
                overflow: 'hidden',
                flex: '1.3',
                minWidth: '320px'
              }}
            >
              <LeafletDistrictMap
                blocks={blocks}
                hoveredBlock={hoveredBlock}
                setHoveredBlock={setHoveredBlock}
                navigate={navigate}
                activeQueryIds={activeQueryIds}
                deviceCoords={deviceCoords}
              />

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
                {listHeader}
              </h3>
              <p style={{ fontFamily: FONTS.body, fontSize: '12px', color: COLORS.inkMuted }}>
                {activeQueryIds.length > 0 
                  ? "Blocks matching your active search criteria." 
                  : "Mandal clusters currently posting the highest aggregate stress index."}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedBlocks.map((block) => {
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0', textAlign: 'center' }}>
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
