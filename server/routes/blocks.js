const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { fetchLiveWeather } = require('../utils/weatherService');

const RSK_CENTERS = {
  Kalyandurg: { name: 'Kalyandurg Rural RSK', lat: 14.558, lng: 77.108 },
  Rayadurg: { name: 'Rayadurg Town RSK', lat: 14.698, lng: 76.852 },
  Tadipatri: { name: 'Tadipatri Central RSK', lat: 14.915, lng: 78.012 },
  Dharmavaram: { name: 'Dharmavaram Rural RSK', lat: 14.422, lng: 77.715 },
  Kadiri: { name: 'Kadiri Urban RSK', lat: 14.115, lng: 78.165 },
  Guntakal: { name: 'Guntakal Junction RSK', lat: 15.170, lng: 77.382 },
  Uravakonda: { name: 'Uravakonda HQs RSK', lat: 14.945, lng: 77.268 },
  Singanamala: { name: 'Singanamala Central RSK', lat: 14.805, lng: 77.718 }
};

async function getRSKTravelInfo(block) {
  const rsk = RSK_CENTERS[block.name] || { name: 'Anantapur Central RSK', lat: 14.68, lng: 77.60 };
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${rsk.lat},${rsk.lng}&destinations=${block.lat},${block.lng}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
          const element = data.rows[0].elements[0];
          if (element.status === 'OK') {
            return {
              rskName: rsk.name,
              distance: element.distance.text,
              duration: element.duration.text,
              rskLat: rsk.lat,
              rskLng: rsk.lng
            };
          }
        }
      }
    } catch (err) {
      console.error('[Distance Matrix API] Failed, falling back to math estimation:', err.message);
    }
  }

  // Fallback math calculation (Haversine formula + road multiplier)
  const dLat = (block.lat - rsk.lat) * (Math.PI / 180);
  const dLon = (block.lng - rsk.lng) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rsk.lat * (Math.PI / 180)) * Math.cos(block.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusKm = 6371;
  const straightLineDistance = earthRadiusKm * c;
  
  const estimatedDistance = straightLineDistance * 1.3; // Road winding multiplier
  const estimatedDurationMinutes = Math.max(3, Math.round((estimatedDistance / 40) * 60)); // 40 km/h average speed

  return {
    rskName: rsk.name,
    distance: `${estimatedDistance.toFixed(1)} km`,
    duration: `${estimatedDurationMinutes} mins`,
    rskLat: rsk.lat,
    rskLng: rsk.lng
  };
}

// GET /api/blocks/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const blockId = req.params.id;

  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId);
  if (!block) {
    return res.status(404).json({ error: `Block ID ${blockId} not found.` });
  }

  // Parse JSON properties
  try {
    block.stress_history = JSON.parse(block.stress_history || '[]');
  } catch (e) {
    block.stress_history = [];
  }
  try {
    block.crop_coverage = JSON.parse(block.crop_coverage || '{}');
  } catch (e) {
    block.crop_coverage = {};
  }

  // Fetch alerts
  const alerts = db.prepare('SELECT * FROM alerts WHERE block_id = ? ORDER BY reported_at DESC').all(blockId);

  // Fetch interventions with creator details
  const interventions = db.prepare(`
    SELECT i.*, u.name as officer_name 
    FROM interventions i 
    LEFT JOIN users u ON i.created_by = u.id 
    WHERE i.block_id = ? 
    ORDER BY i.created_at DESC
  `).all(blockId);

  // Fetch live weather conditions
  let weather = null;
  if (block.lat && block.lng) {
    try {
      weather = await fetchLiveWeather(block.lat, block.lng);
    } catch (err) {
      console.log(`[Blocks Route] Live weather fetch failed for block ${block.name}:`, err.message);
    }
  }

  // Fetch RSK travel time info
  let rskInfo = null;
  if (block.lat && block.lng) {
    try {
      rskInfo = await getRSKTravelInfo(block);
    } catch (err) {
      console.log(`[Blocks Route] RSK info calculation failed for block ${block.name}:`, err.message);
    }
  }

  return res.json({
    block,
    alerts,
    interventions,
    weather,
    rskInfo
  });
});

module.exports = router;
