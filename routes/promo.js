const express = require('express');
const PromoStrip = require('../models/PromoStrip');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/promo (public) — sirf active offer texts, homepage strip ke liye
router.get('/', async (req, res) => {
  try {
    const items = await PromoStrip.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// GET /api/promo/all (admin only) — inactive bhi dikhein, admin panel ke liye
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const items = await PromoStrip.find().sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Offer/ad text zaroori hai' });
    const item = await PromoStrip.create({ text, order: Number(req.body.order) || 0, active: true });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await PromoStrip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Nahi mila' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await PromoStrip.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
