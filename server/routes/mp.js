const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');
const { generateWeeklySummary } = require('../utils/headlineSummary');

// GET /api/mp/summary
router.get('/summary', authMiddleware, roleGuard('mp', 'admin'), (req, res) => {
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

  // Generate headline
  const headline = generateWeeklySummary(blocks, interventions);

  return res.json({
    id: district.id,
    name: district.name,
    state: district.state,
    alert_level: district.alert_level,
    total_farmers: district.total_farmers,
    total_blocks: district.total_blocks,
    weekly_interventions: weeklyInterventionsCount,
    newly_stressed_blocks: newlyStressedCount,
    headline
  });
});

// GET /api/mp/blocks
router.get('/blocks', authMiddleware, roleGuard('mp', 'admin'), (req, res) => {
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
      crop_coverage: coverage
    };
  });

  return res.json(formattedBlocks);
});

module.exports = router;
