const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  productImageHeight: { type: Number, default: 150 } // px — admin panel se adjustable
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
