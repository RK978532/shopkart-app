const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  mrp: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  image: { type: String, default: '' }, // uploaded photo base64 data URI yahan save hota hai
  badge: { type: String, default: '' },
  desc: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
