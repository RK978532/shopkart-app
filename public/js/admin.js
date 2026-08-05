const API = '/api';
let products = [], categories = [], slides = [], promos = [], settings = {}, orders = [];

function getToken() { return localStorage.getItem('shopkart_admin_token'); }
function setToken(t) { localStorage.setItem('shopkart_admin_token', t); }
function clearToken() { localStorage.removeItem('shopkart_admin_token'); }

async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Kuch galat ho gaya');
  return data;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===== FILE -> BASE64 helper (photo upload, URL nahi) ===== */
function readFileAsDataURL(fileInputId) {
  return new Promise((resolve, reject) => {
    const input = document.getElementById(fileInputId);
    const file = input.files[0];
    if (!file) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function previewFile(fileInputId, previewImgId) {
  const input = document.getElementById(fileInputId);
  const file = input.files[0];
  const img = document.getElementById(previewImgId);
  if (!file) { img.classList.remove('show'); return; }
  const reader = new FileReader();
  reader.onload = () => { img.src = reader.result; img.classList.add('show'); };
  reader.readAsDataURL(file);
}

/* ===== LOGIN ===== */
window.addEventListener('DOMContentLoaded', () => {
  if (getToken()) showPanel();
});

async function tryAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const errBox = document.getElementById('adminErr');
  errBox.classList.add('hidden');
  try {
    const { token } = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    setToken(token);
    showPanel();
  } catch (e) {
    errBox.textContent = e.message;
    errBox.classList.remove('hidden');
  }
}
function adminLogout(e) {
  if (e) e.preventDefault();
  clearToken();
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('adminGate').classList.remove('hidden');
}
async function showPanel() {
  document.getElementById('adminGate').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  await loadAll();
}

async function loadAll() {
  try {
    [products, categories, slides, settings] = await Promise.all([
      api('/products'), api('/categories'), api('/slides'), api('/settings')
    ]);
    promos = await api('/promo/all');
    orders = await api('/orders');
  } catch (e) {
    if (e.message.includes('Login') || e.message.includes('Session')) {
      clearToken();
      adminLogout();
      toast('Dobara login karein');
      return;
    }
    toast('Data load nahi ho paya: ' + e.message);
  }
  renderCategorySelectOptions();
  renderAdminProductTable();
  renderCatChips();
  renderSlideList();
  renderPromoList();
  document.getElementById('setImgHeight').value = settings.productImageHeight || 150;
  renderOrderHistory();
}

/* ===== TABS ===== */
function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.admin-panel-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
}

/* ===== PRODUCTS ===== */
function renderCategorySelectOptions() {
  document.getElementById('pCategory').innerHTML = categories.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}
function renderAdminProductTable() {
  const body = document.getElementById('adminProductBody');
  document.getElementById('prodCount').textContent = products.length;
  document.getElementById('noProductsNote').classList.toggle('hidden', products.length > 0);
  body.innerHTML = products.map(p => `
    <tr>
      <td><img src="${escapeAttr(p.image)}" onerror="this.src='https://placehold.co/44x44?text=NA'"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>₹${fmt(p.price)}</td>
      <td>${p.rating || '-'}</td>
      <td>
        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;margin-right:6px;" onclick="editProduct('${p._id}')">✏️ Edit</button>
        <button class="btn-danger" onclick="deleteProduct('${p._id}')">🗑️ Delete</button>
      </td>
    </tr>`).join('');
}
function resetProductForm() {
  document.getElementById('editProductId').value = '';
  document.getElementById('pImageCurrent').value = '';
  ['pName','pPrice','pMrp','pRating','pReviews','pBadge','pDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pImageFile').value = '';
  document.getElementById('pImagePreview').classList.remove('show');
  document.getElementById('prodFormTitle').textContent = 'Naya Product Add Karein';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}
function editProduct(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  document.getElementById('editProductId').value = p._id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pMrp').value = p.mrp || '';
  document.getElementById('pRating').value = p.rating || '';
  document.getElementById('pReviews').value = p.reviews || '';
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pDesc').value = p.desc || '';
  document.getElementById('pImageCurrent').value = p.image || '';
  document.getElementById('pImageFile').value = '';
  const prev = document.getElementById('pImagePreview');
  if (p.image) { prev.src = p.image; prev.classList.add('show'); } else { prev.classList.remove('show'); }
  document.getElementById('prodFormTitle').textContent = 'Product Edit Karein: ' + p.name;
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth' });
}
async function saveProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  if (!name || isNaN(price)) { toast('Product naam aur price zaroori hai!'); return; }
  if (categories.length === 0) { toast('Pehle ek category add karein!'); return; }

  const newImage = await readFileAsDataURL('pImageFile');
  const currentImage = document.getElementById('pImageCurrent').value;
  const editId = document.getElementById('editProductId').value;

  const payload = {
    name,
    category: document.getElementById('pCategory').value || categories[0],
    price,
    mrp: parseFloat(document.getElementById('pMrp').value) || 0,
    rating: parseFloat(document.getElementById('pRating').value) || 0,
    reviews: parseInt(document.getElementById('pReviews').value) || 0,
    image: newImage || currentImage || 'https://placehold.co/300x300?text=Product',
    badge: document.getElementById('pBadge').value.trim(),
    desc: document.getElementById('pDesc').value.trim()
  };
  try {
    if (editId) {
      await api('/products/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast('Product update ho gaya ✅');
    } else {
      await api('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast('Naya product add ho gaya ✅');
    }
    products = await api('/products');
    resetProductForm();
    renderAdminProductTable();
  } catch (e) { toast('Error: ' + e.message); }
}
async function deleteProduct(id) {
  if (!confirm('Kya aap sach mein is product ko delete karna chahte hain?')) return;
  try {
    await api('/products/' + id, { method: 'DELETE' });
    products = products.filter(p => p._id !== id);
    renderAdminProductTable();
    toast('Product delete ho gaya 🗑️');
  } catch (e) { toast('Error: ' + e.message); }
}

/* ===== CATEGORIES ===== */
function renderCatChips() {
  const wrap = document.getElementById('catChipsWrap');
  if (categories.length === 0) { wrap.innerHTML = `<p class="empty-note">Koi category nahi hai.</p>`; return; }
  wrap.innerHTML = categories.map(c => `<span class="catchip">${escapeHtml(c)} <button onclick="deleteCategory('${escapeAttr(c)}')">✕</button></span>`).join('');
}
async function addCategory() {
  const input = document.getElementById('newCatName');
  const val = input.value.trim();
  if (!val) { toast('Category ka naam likhein'); return; }
  try {
    categories = await api('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: val }) });
    input.value = '';
    renderCatChips(); renderCategorySelectOptions();
    toast('Category add ho gayi ✅');
  } catch (e) { toast('Error: ' + e.message); }
}
async function deleteCategory(c) {
  if (!confirm(`"${c}" category delete karein?`)) return;
  try {
    categories = await api('/categories/' + encodeURIComponent(c), { method: 'DELETE' });
    renderCatChips(); renderCategorySelectOptions();
    toast('Category delete ho gayi 🗑️');
  } catch (e) { toast('Error: ' + e.message); }
}

/* ===== BANNERS (multiple slides) ===== */
function renderSlideList() {
  const wrap = document.getElementById('slideList');
  document.getElementById('noSlidesNote').classList.toggle('hidden', slides.length > 0);
  wrap.innerHTML = slides.map(s => `
    <div class="slide-item">
      <img src="${escapeAttr(s.image)}" onerror="this.src='https://placehold.co/110x70?text=NA'">
      <div class="slide-info">
        <b>${escapeHtml(s.title || '(no title)')}</b>
        <div>${escapeHtml(s.sub || '')}</div>
        <div>Size: ${s.height} | Order: ${s.order}</div>
      </div>
      <div>
        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;margin-right:6px;" onclick="editSlide('${s._id}')">✏️ Edit</button>
        <button class="btn-danger" onclick="deleteSlide('${s._id}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}
function resetSlideForm() {
  document.getElementById('editSlideId').value = '';
  document.getElementById('sImageCurrent').value = '';
  document.getElementById('sTitle').value = '';
  document.getElementById('sSub').value = '';
  document.getElementById('sHeight').value = 'medium';
  document.getElementById('sOrder').value = '0';
  document.getElementById('sImageFile').value = '';
  document.getElementById('sImagePreview').classList.remove('show');
  document.getElementById('slideFormTitle').textContent = 'Naya Banner Add Karein';
  document.getElementById('cancelSlideEditBtn').classList.add('hidden');
}
function editSlide(id) {
  const s = slides.find(x => x._id === id);
  if (!s) return;
  document.getElementById('editSlideId').value = s._id;
  document.getElementById('sImageCurrent').value = s.image || '';
  document.getElementById('sTitle').value = s.title || '';
  document.getElementById('sSub').value = s.sub || '';
  document.getElementById('sHeight').value = s.height || 'medium';
  document.getElementById('sOrder').value = s.order || 0;
  document.getElementById('sImageFile').value = '';
  const prev = document.getElementById('sImagePreview');
  if (s.image) { prev.src = s.image; prev.classList.add('show'); } else { prev.classList.remove('show'); }
  document.getElementById('slideFormTitle').textContent = 'Banner Edit Karein';
  document.getElementById('cancelSlideEditBtn').classList.remove('hidden');
}
async function saveSlide() {
  const newImage = await readFileAsDataURL('sImageFile');
  const currentImage = document.getElementById('sImageCurrent').value;
  const editId = document.getElementById('editSlideId').value;
  const image = newImage || currentImage;
  if (!image) { toast('Banner ke liye photo upload karein'); return; }

  const payload = {
    image,
    title: document.getElementById('sTitle').value.trim(),
    sub: document.getElementById('sSub').value.trim(),
    height: document.getElementById('sHeight').value,
    order: parseInt(document.getElementById('sOrder').value) || 0
  };
  try {
    if (editId) {
      await api('/slides/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast('Banner update ho gaya ✅');
    } else {
      await api('/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast('Naya banner add ho gaya ✅');
    }
    slides = await api('/slides');
    resetSlideForm();
    renderSlideList();
  } catch (e) { toast('Error: ' + e.message); }
}
async function deleteSlide(id) {
  if (!confirm('Is banner ko delete karein?')) return;
  try {
    await api('/slides/' + id, { method: 'DELETE' });
    slides = slides.filter(s => s._id !== id);
    renderSlideList();
    toast('Banner delete ho gaya 🗑️');
  } catch (e) { toast('Error: ' + e.message); }
}

/* ===== OFFERS / ADS STRIP ===== */
function renderPromoList() {
  const wrap = document.getElementById('promoList');
  document.getElementById('noPromoNote').classList.toggle('hidden', promos.length > 0);
  wrap.innerHTML = promos.map(p => `
    <div class="promo-item-row">
      <span>${escapeHtml(p.text)}</span>
      <select onchange="togglePromoActive('${p._id}', this.value)">
        <option value="true" ${p.active ? 'selected' : ''}>Active</option>
        <option value="false" ${!p.active ? 'selected' : ''}>Inactive</option>
      </select>
      <button class="btn-danger" onclick="deletePromo('${p._id}')">🗑️</button>
    </div>`).join('');
}
async function addPromo() {
  const input = document.getElementById('newPromoText');
  const val = input.value.trim();
  if (!val) { toast('Offer/ad text likhein'); return; }
  try {
    await api('/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val }) });
    input.value = '';
    promos = await api('/promo/all');
    renderPromoList();
    toast('Offer/ad add ho gaya ✅');
  } catch (e) { toast('Error: ' + e.message); }
}
async function togglePromoActive(id, val) {
  try {
    await api('/promo/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: val === 'true' }) });
    const p = promos.find(x => x._id === id);
    if (p) p.active = val === 'true';
    toast('Update ho gaya ✅');
  } catch (e) { toast('Error: ' + e.message); }
}
async function deletePromo(id) {
  if (!confirm('Is offer/ad ko delete karein?')) return;
  try {
    await api('/promo/' + id, { method: 'DELETE' });
    promos = promos.filter(p => p._id !== id);
    renderPromoList();
    toast('Delete ho gaya 🗑️');
  } catch (e) { toast('Error: ' + e.message); }
}

/* ===== DISPLAY SETTINGS ===== */
async function saveDisplaySettings() {
  const h = parseInt(document.getElementById('setImgHeight').value) || 150;
  try {
    settings = await api('/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productImageHeight: h }) });
    toast('Display settings save ho gayi ✅');
  } catch (e) { toast('Error: ' + e.message); }
}

/* ===== ORDER HISTORY ===== */
function renderOrderHistory() {
  const body = document.getElementById('adminOrderBody');
  document.getElementById('orderCount').textContent = orders.length;
  document.getElementById('noOrdersNote').classList.toggle('hidden', orders.length > 0);
  body.innerHTML = orders.map(o => `
    <tr>
      <td>${o.orderNumber}</td>
      <td>${escapeHtml(o.customerName)}</td>
      <td>${escapeHtml(o.phone)}</td>
      <td>${o.items.map(it => escapeHtml(it.name) + ' ×' + it.qty).join('<br>')}</td>
      <td>₹${fmt(o.total)}</td>
      <td>
        <select onchange="updateOrderStatus('${o._id}', this.value)" style="font-size:12px;padding:4px;border-radius:4px;">
          ${['Placed','Shipped','Delivered','Cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:12px;">${new Date(o.createdAt).toLocaleString('en-IN')}</td>
    </tr>`).join('');
}
async function updateOrderStatus(id, status) {
  try {
    await api('/orders/' + id + '/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const o = orders.find(x => x._id === id);
    if (o) o.status = status;
    toast('Order status update ho gaya ✅');
  } catch (e) { toast('Error: ' + e.message); }
}

function fmt(n) { return Number(n).toLocaleString('en-IN'); }
function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function escapeAttr(str) { return escapeHtml(str); }
