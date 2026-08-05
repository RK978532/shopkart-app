const API = '/api';

let products = [], categories = [], slides = [], promos = [], settings = {};
let cart = JSON.parse(localStorage.getItem('shopkart_cart') || '[]'); // cart sirf browser mein, order backend mein save hota hai

async function api(path, opts) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Kuch galat ho gaya');
  return data;
}

async function init() {
  try {
    [products, categories, slides, promos, settings] = await Promise.all([
      api('/products'), api('/categories'), api('/slides'), api('/promo'), api('/settings')
    ]);
  } catch (e) {
    toast('Server se data load nahi ho paya: ' + e.message);
    products = []; categories = []; slides = []; promos = []; settings = {};
  }
  document.documentElement.style.setProperty('--product-img-height', (settings.productImageHeight || 150) + 'px');
  renderCatNav();
  renderCatFilter();
  renderPromoStrip();
  renderHeroCarousel();
  renderProducts();
  renderCartUI();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===== PROMO STRIP (rotating ad/offer text, admin-managed) ===== */
function renderPromoStrip() {
  const wrap = document.getElementById('promoStrip');
  if (promos.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = promos.map((p, i) => `<span class="promo-item ${i === 0 ? 'active' : ''}">${escapeHtml(p.text)}</span>`).join('');
  if (promos.length > 1) {
    let idx = 0;
    setInterval(() => {
      const items = wrap.querySelectorAll('.promo-item');
      items[idx].classList.remove('active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('active');
    }, 3500);
  }
}

/* ===== HERO CAROUSEL (multiple banners, admin-managed) ===== */
let heroIdx = 0, heroTimer = null;
function renderHeroCarousel() {
  const wrap = document.getElementById('heroCarousel');
  if (slides.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = slides.map((s, i) => `
    <div class="hero-slide hero-h-${s.height || 'medium'} ${i === 0 ? 'active' : ''}" data-i="${i}">
      <img src="${escapeAttr(s.image)}" alt="banner" onerror="this.src='https://placehold.co/1400x400?text=Banner'">
      <div class="hero-text"><h2>${escapeHtml(s.title || '')}</h2><p>${escapeHtml(s.sub || '')}</p></div>
    </div>
  `).join('') + (slides.length > 1 ? `
    <div class="hero-arrow left" onclick="heroGo(heroIdx-1)">‹</div>
    <div class="hero-arrow right" onclick="heroGo(heroIdx+1)">›</div>
    <div class="hero-dots">${slides.map((s, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" onclick="heroGo(${i})"></div>`).join('')}</div>
  ` : '');
  heroIdx = 0;
  if (slides.length > 1) {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => heroGo(heroIdx + 1), 5000);
  }
}
function heroGo(i) {
  const total = slides.length;
  heroIdx = ((i % total) + total) % total;
  document.querySelectorAll('.hero-slide').forEach((el, idx) => el.classList.toggle('active', idx === heroIdx));
  document.querySelectorAll('.hero-dot').forEach((el, idx) => el.classList.toggle('active', idx === heroIdx));
}

/* ===== RENDER: STORE ===== */
function renderCatNav() {
  document.getElementById('catNav').innerHTML = categories
    .map(c => `<a onclick="filterByCat('${escapeAttr(c)}')">${escapeHtml(c)}</a>`).join('');
}
function renderCatFilter() {
  document.getElementById('catFilter').innerHTML =
    '<option value="">Sabhi Categories</option>' +
    categories.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}

let currentFilter = { cat: '', q: '' };
function filterByCat(c) {
  currentFilter.cat = c;
  document.getElementById('catFilter').value = c;
  renderProducts();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}
function doSearch() {
  currentFilter.q = document.getElementById('searchInput').value.trim().toLowerCase();
  currentFilter.cat = document.getElementById('catFilter').value;
  renderProducts();
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  document.getElementById('catFilter').addEventListener('change', doSearch);
});

function renderProducts() {
  const wrap = document.getElementById('productsBySection');
  let list = products.filter(p => {
    const matchCat = !currentFilter.cat || p.category === currentFilter.cat;
    const matchQ = !currentFilter.q || p.name.toLowerCase().includes(currentFilter.q);
    return matchCat && matchQ;
  });

  if (list.length === 0) {
    wrap.innerHTML = `<div class="section-card"><p style="text-align:center;color:var(--muted);padding:30px;">Koi product nahi mila.</p></div>`;
    return;
  }
  if (currentFilter.cat || currentFilter.q) {
    wrap.innerHTML = `<div class="section-card"><h3>Search Results</h3><div class="grid">${list.map(productCardHtml).join('')}</div></div>`;
    return;
  }
  let html = '';
  categories.forEach(cat => {
    const items = products.filter(p => p.category === cat);
    if (items.length === 0) return;
    html += `<div class="section-card"><h3>${escapeHtml(cat)}</h3><div class="grid">${items.map(productCardHtml).join('')}</div></div>`;
  });
  const orphan = products.filter(p => !categories.includes(p.category));
  if (orphan.length) {
    html += `<div class="section-card"><h3>Other Products</h3><div class="grid">${orphan.map(productCardHtml).join('')}</div></div>`;
  }
  wrap.innerHTML = html || `<div class="section-card"><p style="text-align:center;color:var(--muted);padding:30px;">Abhi koi product nahi hai.</p></div>`;
}

function productCardHtml(p) {
  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return `
  <div class="pcard">
    ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ''}
    <img src="${escapeAttr(p.image)}" onclick="openProduct('${p._id}')" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
    <div class="pname" onclick="openProduct('${p._id}')">${escapeHtml(p.name)}</div>
    <div class="stars">${starStr(p.rating)} <span>(${p.reviews || 0})</span></div>
    <div class="price-row">
      <span class="price">₹${fmt(p.price)}</span>
      ${p.mrp ? `<span class="mrp">₹${fmt(p.mrp)}</span>` : ''}
      ${off ? `<span class="off">${off}% off</span>` : ''}
    </div>
    <button class="addbtn" onclick="addToCart('${p._id}',1)">Cart mein Add Karein</button>
  </div>`;
}
function starStr(r) { r = r || 0; const full = Math.round(r); return '★'.repeat(full) + '☆'.repeat(5 - full); }
function fmt(n) { return Number(n).toLocaleString('en-IN'); }

/* ===== PRODUCT MODAL ===== */
function openProduct(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-img"><img src="${escapeAttr(p.image)}" onerror="this.src='https://placehold.co/400x400?text=No+Image'"></div>
    <div class="modal-info">
      <h2>${escapeHtml(p.name)}</h2>
      <div class="stars">${starStr(p.rating)} <span>(${p.reviews || 0} ratings)</span></div>
      <div class="price-row" style="margin-top:10px;">
        <span class="price">₹${fmt(p.price)}</span>
        ${p.mrp ? `<span class="mrp">₹${fmt(p.mrp)}</span>` : ''}
        ${off ? `<span class="off">${off}% off</span>` : ''}
      </div>
      <div class="desc">${escapeHtml(p.desc || '')}</div>
      <div class="qty-row">
        <label>Quantity:</label>
        <select id="modalQty">${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}</option>`).join('')}</select>
      </div>
      <div class="buy-buttons">
        <button class="btn-cart" onclick="addToCart('${p._id}', parseInt(document.getElementById('modalQty').value)); closeModal();">🛒 Cart mein Add Karein</button>
        <button class="btn-buy" onclick="addToCart('${p._id}', parseInt(document.getElementById('modalQty').value)); closeModal(); openCart();">⚡ Abhi Kharidein</button>
      </div>
    </div>`;
  document.getElementById('productOverlay').classList.add('active');
}
function closeModal() { document.getElementById('productOverlay').classList.remove('active'); }

/* ===== CART (browser localStorage — order confirm hone par backend mein save hota hai) ===== */
function saveCart() { localStorage.setItem('shopkart_cart', JSON.stringify(cart)); }
function addToCart(id, qty) {
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += qty; else cart.push({ id, qty });
  saveCart(); renderCartUI(); toast('Product cart mein add ho gaya ✅');
}
function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart(); renderCartUI();
}
function removeFromCart(id) { cart = cart.filter(c => c.id !== id); saveCart(); renderCartUI(); }

function renderCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const wrap = document.getElementById('cartItems');
  document.getElementById('checkoutForm').classList.add('hidden');
  if (cart.length === 0) {
    wrap.innerHTML = `<div class="cart-empty">Aapka cart khali hai 🛒<br>Kuch products add karein!</div>`;
    document.getElementById('cartTotal').textContent = '₹0';
    return;
  }
  let total = 0;
  wrap.innerHTML = cart.map(c => {
    const p = products.find(x => x._id === c.id);
    if (!p) return '';
    total += p.price * c.qty;
    return `
    <div class="cart-item">
      <img src="${escapeAttr(p.image)}" onerror="this.src='https://placehold.co/64x64?text=NA'">
      <div class="ci-info">
        <div class="ci-name">${escapeHtml(p.name)}</div>
        <div class="ci-price">₹${fmt(p.price)}</div>
        <div class="ci-qty">
          <button onclick="changeQty('${p._id}',-1)">−</button><span>${c.qty}</span><button onclick="changeQty('${p._id}',1)">+</button>
        </div>
        <button class="ci-remove" onclick="removeFromCart('${p._id}')">Remove</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = '₹' + fmt(total);
}
function openCart() { document.getElementById('cartDrawer').classList.add('active'); document.getElementById('drawerOverlay').classList.add('active'); }
function closeCart() { document.getElementById('cartDrawer').classList.remove('active'); document.getElementById('drawerOverlay').classList.remove('active'); }

function showCheckoutForm() {
  if (cart.length === 0) { toast('Cart khali hai!'); return; }
  document.getElementById('checkoutForm').classList.remove('hidden');
}

async function placeOrder() {
  const customerName = document.getElementById('ckName').value.trim();
  const phone = document.getElementById('ckPhone').value.trim();
  const address = document.getElementById('ckAddress').value.trim();
  if (!customerName || !phone || !address) { toast('Sabhi fields bharein'); return; }

  try {
    const order = await api('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, phone, address, items: cart })
    });
    cart = []; saveCart(); renderCartUI(); closeCart();
    toast(`Order confirm ho gaya! Order ID: ${order.orderNumber}`);
    document.getElementById('ckName').value = '';
    document.getElementById('ckPhone').value = '';
    document.getElementById('ckAddress').value = '';
  } catch (e) {
    toast('Order place nahi ho paya: ' + e.message);
  }
}

/* ===== ORDER TRACKING ===== */
function openTrack() { document.getElementById('trackOverlay').classList.add('active'); }
function closeTrack() { document.getElementById('trackOverlay').classList.remove('active'); }
async function trackOrders() {
  const phone = document.getElementById('trackPhone').value.trim();
  const wrap = document.getElementById('trackResults');
  if (!phone) { toast('Phone number daalein'); return; }
  wrap.innerHTML = 'Loading...';
  try {
    const orders = await api('/orders/track/' + encodeURIComponent(phone));
    if (orders.length === 0) {
      wrap.innerHTML = `<p style="color:var(--muted);text-align:center;padding:20px;">Is number se koi order nahi mila.</p>`;
      return;
    }
    wrap.innerHTML = orders.map(o => `
      <div class="section-card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <b>${o.orderNumber}</b>
          <span class="status-pill status-${o.status}">${o.status}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${new Date(o.createdAt).toLocaleString('en-IN')}</div>
        ${o.items.map(it => `<div style="font-size:13px;">${escapeHtml(it.name)} × ${it.qty} — ₹${fmt(it.price * it.qty)}</div>`).join('')}
        <div style="margin-top:8px;font-weight:700;">Total: ₹${fmt(o.total)}</div>
      </div>
    `).join('');
  } catch (e) {
    wrap.innerHTML = `<p style="color:var(--price);">Error: ${e.message}</p>`;
  }
}

function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function escapeAttr(str) { return escapeHtml(str); }

init();
