const express = require('express');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// GET /api/products/:id (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product nahi mila' });
    res.json(product);
  } catch (e) {
    res.status(404).json({ error: 'Product nahi mila' });
  }
});

// POST /api/products (admin only) — image field mein uploaded photo ka base64 data aata hai
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Naam, category aur price zaroori hain' });
    }
    const product = await Product.create({
      name,
      category,
      price: Number(price) || 0,
      mrp: Number(req.body.mrp) || 0,
      rating: Number(req.body.rating) || 0,
      reviews: Number(req.body.reviews) || 0,
      image: req.body.image || '',
      badge: req.body.badge || '',
      desc: req.body.desc || ''
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// PUT /api/products/:id (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    ['price', 'mrp', 'rating', 'reviews'].forEach(k => {
      if (update[k] !== undefined) update[k] = Number(update[k]);
    });
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product nahi mila' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// DELETE /api/products/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product nahi mila' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
