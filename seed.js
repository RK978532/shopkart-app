const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Category = require('./models/Category');
const BannerSlide = require('./models/BannerSlide');
const PromoStrip = require('./models/PromoStrip');
const Settings = require('./models/Settings');
const Admin = require('./models/Admin');

const DEFAULT_CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Books", "Sports"];

const DEFAULT_PRODUCTS = [
  { name: "Wireless Bluetooth Headphones", category: "Electronics", price: 1499, mrp: 2999, rating: 4.3, reviews: 2150, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", badge: "Bestseller", desc: "Deep bass wireless headphones, 20hr battery life aur comfortable ear cushions." },
  { name: "Men's Casual Cotton Shirt", category: "Fashion", price: 699, mrp: 1299, rating: 4.1, reviews: 850, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", badge: "", desc: "100% cotton casual shirt, sabhi seasons ke liye perfect." },
  { name: "Non-Stick Frying Pan", category: "Home & Kitchen", price: 549, mrp: 999, rating: 4.5, reviews: 1320, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", badge: "New", desc: "Durable non-stick coating, easy to clean, gas aur induction dono ke liye suitable." },
  { name: "Herbal Face Wash", category: "Beauty", price: 199, mrp: 349, rating: 4.0, reviews: 640, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400", badge: "", desc: "Natural ingredients se bana face wash, sabhi skin types ke liye." },
  { name: "Bestselling Novel - Fiction", category: "Books", price: 249, mrp: 499, rating: 4.6, reviews: 980, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", badge: "Bestseller", desc: "Ek dilchasp kahani jo aapko last page tak baandhe rakhegi." },
  { name: "Yoga Mat Anti-Slip", category: "Sports", price: 449, mrp: 799, rating: 4.4, reviews: 560, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400", badge: "", desc: "6mm thick anti-slip yoga mat, carry strap ke saath." }
];

const DEFAULT_SLIDES = [
  { image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400", title: "Bade Deals, Bade Discounts", sub: "Electronics, Fashion aur bahut kuch — sabse sasta sirf ShopKart par", height: "large", order: 0 },
  { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400", title: "Fashion Sale — 60% Tak Off", sub: "Naye collection par exclusive offers", height: "large", order: 1 },
  { image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1400", title: "Electronics Mega Sale", sub: "Top brands, best prices", height: "large", order: 2 }
];

const DEFAULT_PROMOS = [
  { text: "🚚 Free Delivery — orders above ₹499 par", order: 0 },
  { text: "🎉 Naya user? Pehla order pe extra 10% off", order: 1 },
  { text: "⚡ Aaj ke Deals — limited time offer", order: 2 }
];

async function seed() {
  if (await Category.countDocuments() === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
    console.log('✅ Default categories seed ho gayi');
  }
  if (await Product.countDocuments() === 0) {
    await Product.insertMany(DEFAULT_PRODUCTS);
    console.log('✅ Default products seed ho gaye');
  }
  if (await BannerSlide.countDocuments() === 0) {
    await BannerSlide.insertMany(DEFAULT_SLIDES);
    console.log('✅ Default banner slides seed ho gaye');
  }
  if (await PromoStrip.countDocuments() === 0) {
    await PromoStrip.insertMany(DEFAULT_PROMOS);
    console.log('✅ Default promo strip seed ho gayi');
  }
  if (await Settings.countDocuments() === 0) {
    await Settings.create({});
  }
  if (await Admin.countDocuments() === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await Admin.create({ username: 'admin', passwordHash });
    console.log('✅ Default admin bana diya -> username: admin | password: admin123');
    console.log('⚠️  Isko turant Admin Panel se change kar lein.');
  }
}

module.exports = { seed };
