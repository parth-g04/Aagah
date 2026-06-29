const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

// GET /api/officer/blocks
router.get('/blocks', authMiddleware, roleGuard('officer', 'admin'), (req, res) => {
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
      crop_coverage: coverage
    };
  });

  return res.json(formattedBlocks);
});

module.exports = router;
