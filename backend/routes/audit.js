const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all audit logs
router.get('/', authMiddleware, async (req, res) => {
  // Allow all authenticated users to see logs, or restrict to admin/manager
  try {
    const result = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
});

module.exports = router;
