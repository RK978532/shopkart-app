const express = require('express');
const Settings = require('../models/Settings');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings (public) — display settings jaise product image size
router.get('/', async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// PUT /api/settings (admin only)
router.put('/', requireAdmin, async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = new Settings({});
    if (req.body.productImageHeight !== undefined) {
      s.productImageHeight = Number(req.body.productImageHeight) || 150;
    }
    await s.save();
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
