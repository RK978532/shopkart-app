const mongoose = require('mongoose');

const promoStripSchema = new mongoose.Schema({
  text: { type: String, required: true },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PromoStrip', promoStripSchema);
