const express = require('express');
const BannerSlide = require('../models/BannerSlide');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/slides (public) — homepage carousel ke sabhi banners
router.get('/', async (req, res) => {
  try {
    const slides = await BannerSlide.find().sort({ order: 1, createdAt: 1 });
    res.json(slides);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// POST /api/slides (admin only) — naya banner add karein, image = uploaded photo base64
router.post('/', requireAdmin, async (req, res) => {
  try {
    const slide = await BannerSlide.create({
      image: req.body.image || '',
      title: req.body.title || '',
      sub: req.body.sub || '',
      height: req.body.height || 'medium',
      order: Number(req.body.order) || 0
    });
    res.status(201).json(slide);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// PUT /api/slides/:id (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.order !== undefined) update.order = Number(update.order);
    const slide = await BannerSlide.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!slide) return res.status(404).json({ error: 'Slide nahi mila' });
    res.json(slide);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// DELETE /api/slides/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await BannerSlide.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
