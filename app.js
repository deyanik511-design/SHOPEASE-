// app.js - code shared by ALL pages: talking to the C++ server, navbar, toasts, product cards.

// ---------- 1. Session (who is logged in?) kept in the browser's localStorage ----------
const Session = {
  get token() { return localStorage.getItem('token') || ''; },
  get user() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; } },
  save(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
};

// ---------- 2. api(): send a request to the C++ backend ----------
// Example:  const data = await api('/api/cart/add', { method: 'POST', data: { productId: 3, qty: 1 } });
async function api(path, { method = 'GET', data = null } = {}) {
  const opts = { method, headers: { 'X-Token': Session.token } };
  if (data) {
    opts.body = new URLSearchParams(data).toString();
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  let res;
  try { res = await fetch(path, opts); }
  catch (e) { throw new Error('Cannot reach the server. Is the C++ program running?'); }
  const json = await res.json().catch(() => ({ ok: false, error: 'Bad reply from server' }));
  if (res.status === 401 && Session.token) { Session.clear(); }   // token expired (server restarted)
  if (!json.ok) { const err = new Error(json.error || 'Something went wrong'); err.status = res.status; throw err; }
  return json;
}

// ---------- 3. Small helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: Number(n) % 1 ? 2 : 0 });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, type = '') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function requireLogin() {
  if (!Session.token) { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return false; }
  return true;
}

function hueOf(str) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function tint(category) {
  const h = hueOf(category || 'x');
  return `--c1:hsl(${h} 85% 95%);--c2:hsl(${(h + 35) % 360} 80% 86%)`;
}
function visual(p) {   // product picture: real image if admin gave a URL, otherwise a big emoji
  return p.imageUrl
    ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" onerror="this.outerHTML='<span class=emoji>${esc(p.emoji)}</span>'">`
    : `<span class="emoji">${esc(p.emoji)}</span>`;
}

// ---------- 4. Product card (used on home page and related products) ----------
function productCard(p) {
  const stock = p.stock === 0 ? '<div class="stock-note out">Out of stock</div>'
              : p.stock < 5 ? `<div class="stock-note low">Only ${p.stock} left!</div>` : '';
  return `
  <article class="card" onclick="location.href='product.html?id=${p.id}'">
    <div class="card-img" style="${tint(p.category)}">${visual(p)}${p.discount ? `<span class="badge">-${p.discount}%</span>` : ''}</div>
    <div class="card-body">
      <div class="brand">${esc(p.brand)}</div>
      <h3>${esc(p.name)}</h3>
      <span class="pill">${p.rating.toFixed(1)} ★</span>
      <div class="price"><b>${money(p.price)}</b>${p.mrp > p.price ? `<s>${money(p.mrp)}</s><span class="off">${p.discount}% off</span>` : ''}</div>
      ${stock}
    </div>
    <button class="btn btn-amber" ${p.stock === 0 ? 'disabled' : ''} onclick="event.stopPropagation();addToCart(${p.id})">Add to Cart</button>
  </article>`;
}

async function addToCart(productId, qty = 1) {
  if (!requireLogin()) return;
  try {
    const r = await api('/api/cart/add', { method: 'POST', data: { productId, qty } });
    setCartBadge(r.cartCount);
    toast('Added to cart ✓', 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

function setCartBadge(n) { const b = $('#cartBadge'); if (b) { b.textContent = n; b.classList.toggle('hidden', !n); } }

// ---------- 5. Navbar + footer, injected into every page ----------
const SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const SVG_CART = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21.5 7H6"/><circle cx="10" cy="20.5" r="1.4"/><circle cx="18" cy="20.5" r="1.4"/></svg>';

async function renderNavbar(active = '') {
  const u = Session.user;
  const params = new URLSearchParams(location.search);
  const account = u
    ? `<div class="menu"><button class="nav-link" tabindex="0"><small>Hello, ${esc(u.name.split(' ')[0])}</small><b>Account ▾</b></button>
         <div class="menu-list">
           <a href="orders.html">📦 My Orders</a>
           ${u.role === 'admin' ? '<a href="admin.html">🛠️ Admin Dashboard</a>' : ''}
           <button onclick="logout()">🚪 Logout</button>
         </div></div>`
    : `<a class="nav-link" href="login.html"><small>Hello, Guest</small><b>Login / Sign up</b></a>`;

  $('#navbar').outerHTML = `
  <header class="topbar">
    <div class="container nav-main">
      <a class="logo" href="index.html">Shop<span>Ease</span></a>
      <form class="search" id="searchForm">
        <select id="searchCat" aria-label="Category"><option value="">All</option></select>
        <input id="searchInput" type="search" placeholder="Search for products, brands and more" value="${esc(params.get('q') || '')}" autocomplete="off">
        <button type="submit" aria-label="Search">${SVG_SEARCH}</button>
      </form>
      <div class="nav-actions">
        ${account}
        <a class="nav-link hide-sm" href="orders.html"><small>Returns</small><b>& Orders</b></a>
        <a class="nav-link cart-link" href="cart.html">${SVG_CART}<span id="cartBadge" class="cart-badge hidden">0</span><span class="hide-sm">Cart</span></a>
      </div>
    </div>
    <nav class="subnav"><div class="container" id="subnav"><a href="index.html" class="${active === '' ? 'active' : ''}">All Products</a></div></nav>
  </header>`;

  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#searchInput').value.trim(), c = $('#searchCat').value;
    location.href = 'index.html?' + new URLSearchParams({ ...(q && { q }), ...(c && { category: c }) });
  });

  try {   // categories for the dropdown and the second navigation row
    const { categories } = await api('/api/categories');
    $('#searchCat').insertAdjacentHTML('beforeend', categories.map((c) => `<option ${params.get('category') === c ? 'selected' : ''}>${esc(c)}</option>`).join(''));
    $('#subnav').insertAdjacentHTML('beforeend', categories.map((c) => `<a href="index.html?category=${encodeURIComponent(c)}" class="${active === c ? 'active' : ''}">${esc(c)}</a>`).join('')
      + '<a href="index.html?sort=discount">🔥 Today\'s Deals</a>');
  } catch (e) { /* server offline - the page itself will show the error */ }

  if (Session.token) api('/api/me').then((r) => setCartBadge(r.cartCount)).catch(() => { if (!Session.token) location.reload(); });
}

function renderFooter() {
  const f = $('#footer');
  if (!f) return;
  f.outerHTML = `
  <footer class="footer"><div class="container">
    <div class="cols">
      <div><h4>ShopEase</h4><p>A college OOP project: C++ backend + HTML/CSS/JS frontend.</p></div>
      <div><h4>Shop</h4><a href="index.html">All products</a><a href="index.html?sort=discount">Deals</a><a href="cart.html">Your cart</a></div>
      <div><h4>Account</h4><a href="login.html">Login / Register</a><a href="orders.html">Order history</a></div>
      <div><h4>Policies</h4><a>Free delivery over ₹500</a><a>7-day easy returns</a><a>Secure payments (demo)</a></div>
    </div>
    <div class="copy">© 2026 ShopEase · Built with C++ &amp; JavaScript</div>
  </div></footer>`;
}

async function logout() {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
  Session.clear();
  location.href = 'index.html';
}

// In-page yes/no dialog (works everywhere, unlike the browser's confirm())
function askConfirm(message, okLabel = 'Yes') {
  return new Promise((resolve) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="max-width:380px"><h2>${esc(message)}</h2><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost" data-v="0">No</button><button class="btn btn-primary" data-v="1">${esc(okLabel)}</button></div></div>`;
    bg.addEventListener('click', (e) => { const v = e.target.dataset.v; if (v !== undefined) { bg.remove(); resolve(v === '1'); } });
    document.body.appendChild(bg);
  });
}
