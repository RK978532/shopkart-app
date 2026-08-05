require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const { PORT } = require('./config');
const { seed } = require('./seed');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // photo uploads base64 mein aate hain, isliye zyada limit
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/promo', require('./routes/promo'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB se connect ho gaya');
    await seed(); // sirf pehli baar (jab data khali ho) default data daalta hai
    app.listen(PORT, () => {
      console.log(`🛒 ShopKart server chal raha hai: http://localhost:${PORT}`);
      console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB se connect nahi ho paya:', err.message);
    console.error('👉 .env file mein MONGODB_URI check karein (README mein setup steps hain).');
    process.exit(1);
  });
