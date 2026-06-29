const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/blocks/:id
router.get('/:id', authMiddleware, (req, res) => {
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

  return res.json({
    block,
    alerts,
    interventions
  });
});

module.exports = router;
