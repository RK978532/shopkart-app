const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { requireAdmin } = require('../middleware/auth');
const { JWT_SECRET } = require('../config');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Galat username ya password' });

    const valid = bcrypt.compareSync(password || '', admin.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Galat username ya password' });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, username });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.put('/password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Naya password kam se kam 6 characters ka ho' });
    }
    const admin = await Admin.findOne();
    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    await admin.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

module.exports = router;
