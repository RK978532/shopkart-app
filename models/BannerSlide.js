const mongoose = require('mongoose');

const bannerSlideSchema = new mongoose.Schema({
  image: { type: String, default: '' }, // uploaded photo base64 data URI
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  height: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }, // admin size control
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BannerSlide', bannerSlideSchema);
