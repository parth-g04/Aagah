const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');
const { generateWeeklySummary } = require('../utils/headlineSummary');
const { getWeeklyHeadlineSummary, parseNaturalLanguageQuery } = require('../utils/groqService');

// GET /api/mp/summary
router.get('/summary', authMiddleware, roleGuard('mp', 'officer', 'admin'), async (req, res) => {
  const user = db.prepare('SELECT district FROM users WHERE id = ?').get(req.user.userId);
  if (!user || !user.district) {
    return res.status(400).json({ error: 'User does not have a district assigned' });
  }

  const district = db.prepare('SELECT * FROM districts WHERE name = ?').get(user.district);
  if (!district) {
    return res.status(404).json({ error: `District '${user.district}' not found` });
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Fetch all blocks in district
  const blocks = db.prepare('SELECT * FROM blocks WHERE district_id = ?').all(district.id);

  // Fetch interventions in last 7 days for these blocks
  const blockIds = blocks.map(b => b.id);
  let interventions = [];
  if (blockIds.length > 0) {
    const placeholders = blockIds.map(() => '?').join(',');
    interventions = db.prepare(`
      SELECT * FROM interventions 
      WHERE block_id IN (${placeholders}) 
        AND created_at >= ?
    `).all(...blockIds, sevenDaysAgo);
  }

  // Count blocks that crossed stress threshold >= 75 this week
  let newlyStressedCount = 0;
  for (const block of blocks) {
    let history = [];
    try {
      history = JSON.parse(block.stress_history || '[]');
    } catch (e) {}
    const secondToLast = history.length >= 2 ? history[history.length - 2] : 0;
    if (block.stress_index >= 75 && secondToLast < 75) {
      newlyStressedCount++;
    }
  }

  // Weekly interventions count
  const weeklyInterventionsCount = interventions.length;

  // Generate headline via LLM
  let headline;
  try {
    headline = await getWeeklyHeadlineSummary(blocks, interventions);
  } catch (err) {
    console.log('[MP Summary] Falling back to rule-based summary due to error:', err.message);
    headline = generateWeeklySummary(blocks, interventions);
  }

  // Translate headline if requested language is not English
  const { lang } = req.query;
  if (lang && lang !== 'en') {
    const { translateText } = require('../utils/groqService');
    try {
      headline = await translateText(headline, lang);
    } catch (err) {
      console.error('[MP Summary Translation Error]:', err.message);
    }
  }

  // Fetch live weather for Anantapur HQs
  let weather = null;
  try {
    const { fetchLiveWeather } = require('../utils/weatherService');
    weather = await fetchLiveWeather(14.68, 77.60);
  } catch (err) {
    console.log('[MP Summary Weather] Failed to fetch weather:', err.message);
  }

  return res.json({
    id: district.id,
    name: district.name,
    state: district.state,
    alert_level: district.alert_level,
    total_farmers: district.total_farmers,
    total_blocks: district.total_blocks,
    weekly_interventions: weeklyInterventionsCount,
    newly_stressed_blocks: newlyStressedCount,
    headline,
    weather
  });
});

// POST /api/mp/query
router.post('/query', authMiddleware, roleGuard('mp', 'admin'), async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const user = db.prepare('SELECT district FROM users WHERE id = ?').get(req.user.userId);
  if (!user || !user.district) {
    return res.status(400).json({ error: 'User does not have a district assigned' });
  }

  const district = db.prepare('SELECT id FROM districts WHERE name = ?').get(user.district);
  if (!district) {
    return res.status(404).json({ error: `District '${user.district}' not found` });
  }

  try {
    const blocks = db.prepare('SELECT * FROM blocks WHERE district_id = ?').all(district.id);
    const result = await parseNaturalLanguageQuery(query, blocks);
    return res.json(result);
  } catch (err) {
    console.error('[MP Query API Error]:', err);
    return res.status(500).json({ error: 'Failed to process natural language query. Please try again.' });
  }
});

// GET /api/mp/weather/device
router.get('/weather/device', authMiddleware, async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required.' });
  }

  try {
    const { fetchLiveWeather } = require('../utils/weatherService');
    const weather = await fetchLiveWeather(parseFloat(lat), parseFloat(lng));
    return res.json({ weather });
  } catch (err) {
    console.error('[Device Weather Route Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve weather for device location.' });
  }
});

// GET /api/mp/news
router.get('/news', authMiddleware, async (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: 'location query parameter is required.' });
  }

  try {
    const { fetchLocalCropNews } = require('../utils/newsService');
    const articles = await fetchLocalCropNews(location);
    return res.json({ articles });
  } catch (err) {
    console.error('[Device News Route Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve crop news for location.' });
  }
});

// GET /api/mp/device-blocks
router.get('/device-blocks', authMiddleware, async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required.' });
  }

  try {
    const { getDeviceNearbyBlocks } = require('../utils/deviceLocationService');
    const blocks = await getDeviceNearbyBlocks(parseFloat(lat), parseFloat(lng));
    return res.json({ blocks });
  } catch (err) {
    console.error('[Device Blocks Route Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve dynamic blocks for device coordinates.' });
  }
});

// GET /api/mp/blocks
router.get('/blocks', authMiddleware, roleGuard('mp', 'admin'), async (req, res) => {
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

  // Parse JSON strings to structures for the frontend
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

module.exports = router;
