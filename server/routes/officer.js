const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

// GET /api/officer/blocks
router.get('/blocks', authMiddleware, roleGuard('officer', 'admin'), async (req, res) => {
  const user = db.prepare('SELECT district FROM users WHERE id = ?').get(req.user.userId);
  if (!user || !user.district) {
    return res.status(400).json({ error: 'User does not have a district assigned' });
  }

  const district = db.prepare('SELECT id FROM districts WHERE name = ?').get(user.district);
  if (!district) {
    return res.status(404).json({ error: `District '${user.district}' not found` });
  }

  const blocks = db.prepare(`
    SELECT b.*, 
      (SELECT COUNT(*) FROM interventions WHERE block_id = b.id AND status IN ('active', 'scheduled')) as active_interventions_count 
    FROM blocks b 
    WHERE b.district_id = ? 
    ORDER BY b.stress_index DESC
  `).all(district.id);

  const formattedBlocks = blocks.map(b => {
    let history = [];
    let coverage = {};
    try {
      history = JSON.parse(b.stress_history || '[]');
    } catch (e) {}
    try {
      coverage = JSON.parse(b.crop_coverage || '{}');
    } catch (e) {}

    return {
      ...b,
      stress_history: history,
      crop_coverage: coverage,
      weather: null
    };
  });

  // Fetch live weather for the first 3 blocks (sub-regions cards)
  try {
    const { fetchLiveWeather } = require('../utils/weatherService');
    const weatherPromises = formattedBlocks.slice(0, 3).map(async (block) => {
      try {
        const weather = await fetchLiveWeather(block.lat, block.lng);
        block.weather = weather;
      } catch (err) {
        console.log(`Failed to fetch weather for block ${block.name}:`, err.message);
      }
    });
    await Promise.all(weatherPromises);
  } catch (err) {
    console.error('Failed to fetch weather for top blocks:', err.message);
  }

  return res.json(formattedBlocks);
});

// Express raw body parser for image upload bytes
const rawParser = express.raw({ type: 'image/*', limit: '5mb' });
const { diagnoseCropImage } = require('../utils/aiService');

// POST /api/officer/diagnose
router.post('/diagnose', authMiddleware, roleGuard('officer', 'admin'), rawParser, async (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: 'No image data received. Make sure Content-Type is image/*.' });
  }

  try {
    const result = await diagnoseCropImage(req.body);
    return res.json(result);
  } catch (err) {
    console.error('[Officer Diagnose Error]:', err.message);
    return res.status(500).json({ error: 'Failed to process AI crop diagnosis.' });
  }
});

module.exports = router;
