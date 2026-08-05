const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders (public — checkout)
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, address, items } = req.body;
    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Naam, phone, address aur cart items zaroori hain' });
    }

    let total = 0;
    const orderItems = [];
    for (const it of items) {
      let p = null;
      try { p = await Product.findById(it.id); } catch (e) { p = null; }
      const price = p ? p.price : 0;
      const qty = Number(it.qty) || 1;
      total += price * qty;
      orderItems.push({
        productId: it.id,
        name: p ? p.name : 'Unknown product',
        image: p ? p.image : '',
        price,
        qty
      });
    }

    const order = await Order.create({
      orderNumber: 'ORD' + Date.now(),
      customerName,
      phone,
      address,
      items: orderItems,
      total,
      status: 'Placed'
    });
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// GET /api/orders (admin only — poori order history)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// GET /api/orders/track/:phone (public — customer apna order history dekhein)
router.get('/track/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ phone: req.params.phone }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// PUT /api/orders/:id/status (admin only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order nahi mila' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
