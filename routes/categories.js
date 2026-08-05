const express = require('express');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find().sort({ createdAt: 1 });
    res.json(cats.map(c => c.name));
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Category naam zaroori hai' });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ error: 'Yeh category pehle se hai' });

    await Category.create({ name });
    const cats = await Category.find().sort({ createdAt: 1 });
    res.status(201).json(cats.map(c => c.name));
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.delete('/:name', requireAdmin, async (req, res) => {
  try {
    await Category.deleteOne({ name: decodeURIComponent(req.params.name) });
    const cats = await Category.find().sort({ createdAt: 1 });
    res.json(cats.map(c => c.name));
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
