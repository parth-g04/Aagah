const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/authMiddleware');

// GET /api/interventions
router.get('/', authMiddleware, (req, res) => {
  const { status, blockId, q } = req.query;

  let query = `
    SELECT i.*, b.name as block_name, b.mandal as block_mandal, u.name as officer_name
    FROM interventions i
    JOIN blocks b ON i.block_id = b.id
    LEFT JOIN users u ON i.created_by = u.id
  `;
  const params = [];
  const clauses = [];

  if (status && status !== 'all' && status !== 'All') {
    clauses.push('i.status = ?');
    params.push(status.toLowerCase());
  }
  if (blockId) {
    clauses.push('i.block_id = ?');
    params.push(parseInt(blockId, 10));
  }
  if (q) {
    clauses.push('(i.type LIKE ? OR i.detail LIKE ? OR i.notes LIKE ?)');
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (clauses.length > 0) {
    query += ' WHERE ' + clauses.join(' AND ');
  }

  query += ' ORDER BY i.created_at DESC';

  try {
    const interventions = db.prepare(query).all(...params);
    return res.json(interventions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/interventions (officer + admin only)
router.post('/', authMiddleware, roleGuard('officer', 'admin'), (req, res) => {
  const { block_id, type, detail, resources_deployed, status, notes } = req.body;

  if (!block_id || !type || !detail || !resources_deployed) {
    return res.status(400).json({ error: 'block_id, type, detail, and resources_deployed are required' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    const createdBy = req.user.userId;
    const now = Date.now();

    // 1. Insert intervention
    const info = db.prepare(`
      INSERT INTO interventions (block_id, type, detail, resources_deployed, status, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      parseInt(block_id, 10),
      type,
      detail,
      resources_deployed,
      status || 'scheduled',
      notes || null,
      createdBy,
      now
    );

    // 2. Demo logic: Update block stress index and shift stress history
    const block = db.prepare('SELECT stress_index, stress_history FROM blocks WHERE id = ?').get(block_id);
    if (block) {
      let history = [];
      try {
        history = JSON.parse(block.stress_history || '[]');
      } catch (e) {}

      // Shift history to make room for new value
      if (history.length >= 7) {
        history.shift();
      }

      // Simulate index improvement (lower stress) when intervention is active or completed
      let newStress = block.stress_index;
      if (status === 'active' || status === 'completed') {
        newStress = Math.max(0, block.stress_index - 8);
      }

      history.push(newStress);

      db.prepare(`
        UPDATE blocks 
        SET stress_index = ?, stress_history = ?, updated_at = ? 
        WHERE id = ?
      `).run(newStress, JSON.stringify(history), now, block_id);

      // Recalculate district alert level
      updateDistrictAlertLevel(block_id);
    }

    db.exec('COMMIT');

    const newIntervention = db.prepare(`
      SELECT i.*, u.name as officer_name 
      FROM interventions i 
      LEFT JOIN users u ON i.created_by = u.id 
      WHERE i.id = ?
    `).get(info.lastInsertRowid);

    return res.status(201).json(newIntervention);
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/interventions/:id (officer + admin only)
router.patch('/:id', authMiddleware, roleGuard('officer', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(id);
    if (!intervention) {
      return res.status(404).json({ error: `Intervention ID ${id} not found` });
    }

    db.prepare(`
      UPDATE interventions 
      SET status = ?, notes = ? 
      WHERE id = ?
    `).run(status.toLowerCase(), notes || null, id);

    // If completed, check if we want to reduce the block stress further
    if (status === 'completed' || status === 'completed') {
      const block = db.prepare('SELECT stress_index, stress_history FROM blocks WHERE id = ?').get(intervention.block_id);
      if (block) {
        let history = [];
        try {
          history = JSON.parse(block.stress_history || '[]');
        } catch (e) {}

        if (history.length >= 7) {
          history.shift();
        }

        const newStress = Math.max(0, block.stress_index - 5);
        history.push(newStress);

        db.prepare(`
          UPDATE blocks 
          SET stress_index = ?, stress_history = ?, updated_at = ? 
          WHERE id = ?
        `).run(newStress, JSON.stringify(history), Date.now(), intervention.block_id);

        updateDistrictAlertLevel(intervention.block_id);
      }
    }

    const updated = db.prepare(`
      SELECT i.*, u.name as officer_name 
      FROM interventions i 
      LEFT JOIN users u ON i.created_by = u.id 
      WHERE i.id = ?
    `).get(id);

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper function to update district alert level based on block alerts
function updateDistrictAlertLevel(blockId) {
  const block = db.prepare('SELECT district_id FROM blocks WHERE id = ?').get(blockId);
  if (!block) return;

  const districtBlocks = db.prepare('SELECT alert_level FROM blocks WHERE district_id = ?').all(block.district_id);
  
  let newLevel = 'green';
  if (districtBlocks.some(b => b.alert_level === 'red')) {
    newLevel = 'red';
  } else if (districtBlocks.some(b => b.alert_level === 'yellow')) {
    newLevel = 'yellow';
  }

  db.prepare('UPDATE districts SET alert_level = ? WHERE id = ?').run(newLevel, block.district_id);
}

module.exports = router;
