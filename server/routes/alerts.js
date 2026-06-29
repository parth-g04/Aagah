const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

// GET /api/alerts
router.get('/', authMiddleware, (req, res) => {
  const { status, blockId } = req.query;

  let query = `
    SELECT a.*, b.name as block_name, b.mandal as block_mandal
    FROM alerts a
    JOIN blocks b ON a.block_id = b.id
  `;
  const params = [];
  const clauses = [];

  if (status) {
    clauses.push('a.status = ?');
    params.push(status);
  }
  if (blockId) {
    clauses.push('a.block_id = ?');
    params.push(parseInt(blockId, 10));
  }

  if (clauses.length > 0) {
    query += ' WHERE ' + clauses.join(' AND ');
  }

  query += ' ORDER BY a.reported_at DESC';

  try {
    const alerts = db.prepare(query).all(...params);
    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts (officer + admin only)
router.post('/', authMiddleware, roleGuard('officer', 'admin'), (req, res) => {
  const { block_id, type, severity, affected_metric } = req.body;

  if (!block_id || !type || !severity) {
    return res.status(400).json({ error: 'block_id, type, and severity are required' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO alerts (block_id, type, severity, affected_metric, status, reported_at, resolved_at)
      VALUES (?, ?, ?, ?, 'open', ?, NULL)
    `).run(parseInt(block_id, 10), type, severity, affected_metric || null, Date.now());

    // Automatically recalculate block's alert level based on alert statuses
    // For example, if there's any active critical/high alert, set block level to red, else yellow if any open alert, else green.
    // Let's implement a quick utility to update the block alert level.
    updateBlockAlertLevel(block_id);

    const newAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json(newAlert);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id (officer + admin only)
router.patch('/:id', authMiddleware, roleGuard('officer', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status, resolved_at } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!alert) {
      return res.status(404).json({ error: `Alert ID ${id} not found` });
    }

    const resolvedTime = status === 'resolved' ? (resolved_at || Date.now()) : null;

    db.prepare(`
      UPDATE alerts 
      SET status = ?, resolved_at = ? 
      WHERE id = ?
    `).run(status, resolvedTime, id);

    // Update block alert level
    updateBlockAlertLevel(alert.block_id);

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper function to update block alert level based on active alerts
function updateBlockAlertLevel(blockId) {
  const activeAlerts = db.prepare(`
    SELECT severity FROM alerts 
    WHERE block_id = ? AND status != 'resolved'
  `).all(blockId);

  let newLevel = 'green';
  if (activeAlerts.length > 0) {
    const hasHigh = activeAlerts.some(a => a.severity === 'high');
    newLevel = hasHigh ? 'red' : 'yellow';
  }

  db.prepare('UPDATE blocks SET alert_level = ? WHERE id = ?').run(newLevel, blockId);
}

module.exports = router;
