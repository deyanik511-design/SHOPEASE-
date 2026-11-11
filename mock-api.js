// mock-api.js - DEMO ONLY. Pretends to be the C++ server inside the browser so the site can be
// previewed online. It answers the same /api/... URLs and keeps data in localStorage.
// The real project uses the C++ backend instead (do NOT include this file there).
(function () {
  const mem = {};
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
  };
  const KEY = 'shopease_demo_db_v1';
  const TYPES = { electronics: ['Warranty (months)', 0.18], fashion: ['Available sizes', 0.12], book: ['Author', 0.05], home: ['Material', 0.12] };
  const now = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const r2 = (n) => Math.round(n * 100) / 100;

  function seed() {
    const P = [
      ['electronics', 'Galaxy S24 5G (8GB/128GB)', 'Samsung', 'Mobiles', 54999, 74999, 4.5, 25, '📱', '12', '6.2-inch Dynamic AMOLED display, 50MP triple camera, Snapdragon processor and all-day battery.'],
      ['electronics', 'iPhone 15 (128GB)', 'Apple', 'Mobiles', 69900, 79900, 4.7, 18, '📱', '12', 'A16 Bionic chip, 48MP main camera, Dynamic Island and USB-C charging.'],
      ['electronics', 'Redmi Note 13 Pro', 'Xiaomi', 'Mobiles', 23999, 29999, 4.3, 40, '📱', '12', '200MP camera, 120Hz AMOLED screen, 67W turbo charging.'],
      ['electronics', 'OnePlus Nord CE4', 'OnePlus', 'Mobiles', 24999, 26999, 4.2, 30, '📱', '12', 'Smooth 120Hz display with 100W SUPERVOOC charging.'],
      ['electronics', 'ProBook 14 Laptop (i5, 16GB, 512GB SSD)', 'HP', 'Electronics', 52990, 69990, 4.4, 12, '💻', '24', 'Thin and light laptop with a Full HD anti-glare display for work and study.'],
      ['electronics', 'Aero Gaming Laptop RTX 4050', 'ASUS', 'Electronics', 79990, 99990, 4.5, 8, '🎮', '24', 'Ryzen 7 processor, RTX 4050 graphics and a 144Hz display for gaming.'],
      ['electronics', 'Wireless Noise Cancelling Headphones', 'Sony', 'Electronics', 9990, 19990, 4.6, 35, '🎧', '12', 'Industry-leading noise cancellation with 30-hour battery life.'],
      ['electronics', 'Smart Watch Active 2', 'boAt', 'Electronics', 2499, 7990, 4.0, 60, '⌚', '6', '1.83-inch display, Bluetooth calling, heart-rate and SpO2 monitoring.'],
      ['electronics', 'Bluetooth Speaker Boom 3', 'JBL', 'Electronics', 3999, 6999, 4.4, 4, '🔊', '12', 'Waterproof portable speaker with deep bass and 12-hour playtime.'],
      ['fashion', "Men's Slim Fit Cotton Shirt", 'Allen Solly', 'Fashion', 899, 1999, 4.1, 80, '👔', 'S, M, L, XL', 'Breathable pure cotton shirt for office and casual wear.'],
      ['fashion', "Women's Floral Kurti", 'Biba', 'Fashion', 1199, 2499, 4.3, 55, '👗', 'S, M, L, XL', 'Elegant printed kurti with comfortable fabric for daily wear.'],
      ['fashion', 'Running Shoes Air Glide', 'Nike', 'Fashion', 3495, 5995, 4.5, 45, '👟', 'UK 6-11', 'Lightweight cushioned running shoes with breathable mesh.'],
      ['fashion', 'Classic Denim Jacket', "Levi's", 'Fashion', 2799, 4999, 4.2, 20, '🧥', 'M, L, XL', 'Timeless denim jacket with a regular fit.'],
      ['fashion', 'Leather Wallet for Men', 'Wildhorn', 'Fashion', 449, 1299, 4.0, 100, '👛', 'Free size', 'Genuine leather bi-fold wallet with RFID protection.'],
      ['book', 'Clean Code', 'Prentice Hall', 'Books', 499, 899, 4.7, 50, '📘', 'Robert C. Martin', 'A handbook of agile software craftsmanship - write code others love to read.'],
      ['book', 'Atomic Habits', 'Penguin', 'Books', 399, 799, 4.8, 90, '📗', 'James Clear', 'Tiny changes, remarkable results: a proven way to build good habits.'],
      ['book', 'The C++ Programming Language', 'Addison-Wesley', 'Books', 1299, 1899, 4.6, 15, '📕', 'Bjarne Stroustrup', 'The definitive reference by the creator of C++.'],
      ['book', 'Wings of Fire', 'Universities Press', 'Books', 199, 350, 4.8, 120, '📙', 'A.P.J. Abdul Kalam', "The inspiring autobiography of India's Missile Man."],
      ['home', 'Non-stick Cookware Set (5 pcs)', 'Prestige', 'Home & Kitchen', 1999, 3999, 4.2, 30, '🍳', 'Aluminium', 'Induction-friendly non-stick cookware set with cool-touch handles.'],
      ['home', 'Electric Kettle 1.5L', 'Philips', 'Home & Kitchen', 899, 1595, 4.3, 70, '🫖', 'Stainless steel', 'Auto shut-off kettle that boils water in minutes.'],
      ['home', 'Ergonomic Office Chair', 'Green Soul', 'Home & Kitchen', 8999, 15999, 4.1, 3, '🪑', 'Mesh and nylon', 'Breathable mesh back, adjustable lumbar support and headrest.'],
      ['home', 'LED Desk Lamp', 'Wipro', 'Home & Kitchen', 649, 1199, 4.4, 65, '💡', 'Plastic', 'Touch dimmer with 3 colour modes and eye-care light.'],
      ['home', 'Mixer Grinder 750W', 'Bajaj', 'Home & Kitchen', 2799, 4290, 4.3, 22, '🥤', 'Stainless steel', 'Powerful 3-jar mixer grinder for everyday Indian cooking.'],
    ].map((p, i) => ({ id: i + 1, type: p[0], name: p[1], brand: p[2], category: p[3], price: p[4], mrp: p[5], rating: p[6], stock: p[7], emoji: p[8], extra: p[9], description: p[10], imageUrl: '' }));
    return {
      products: P, nextProduct: P.length + 1, nextUser: 3, nextOrder: 1, carts: {}, orders: [],
      users: [
        { id: 1, role: 'admin', name: 'Store Admin', email: 'admin@shopease.com', password: 'admin123', phone: '9999999999', address: 'Head Office', createdAt: now() },
        { id: 2, role: 'customer', name: 'Demo Customer', email: 'demo@shopease.com', password: 'demo123', phone: '9876543210', address: '12 MG Road, Bengaluru 560001', createdAt: now() },
      ],
    };
  }
  let db; try { db = JSON.parse(store.get(KEY)); } catch (e) { db = null; }
  if (!db || !db.products) db = seed();
  const save = () => store.set(KEY, JSON.stringify(db));
  let sessions; try { sessions = JSON.parse(store.get(KEY + '_sess') || '{}'); } catch (e) { sessions = {}; }
  const saveSess = () => store.set(KEY + '_sess', JSON.stringify(sessions));

  const pJson = (p) => ({ ...p, discount: p.mrp > p.price ? Math.round((p.mrp - p.price) * 100 / p.mrp) : 0, extraLabel: TYPES[p.type][0], taxRate: TYPES[p.type][1] });
  const uJson = (u) => { const { password, ...rest } = u; return rest; };
  const cartOf = (uid) => (db.carts[uid] = db.carts[uid] || {});
  const cartCount = (uid) => Object.values(cartOf(uid)).reduce((a, b) => a + b, 0);
  const ok = (o = {}) => ({ status: 200, body: { ok: true, ...o } });
  const fail = (status, error) => ({ status, body: { ok: false, error } });
  const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };

  function pricing(lines) {
    let subtotal = 0, tax = 0;
    lines.forEach(([p, q]) => { subtotal += p.price * q; tax += p.price * q * TYPES[p.type][1]; });
    tax = r2(tax);
    const shipping = subtotal > 0 && subtotal < 500 ? 40 : 0;
    return { subtotal: r2(subtotal), tax, shipping, total: r2(subtotal + tax + shipping) };
  }
  function readProduct(q) {
    const price = num(q.price);
    const d = { name: (q.name || '').trim(), brand: (q.brand || '').trim(), category: (q.category || '').trim(), description: (q.description || '').trim(),
      emoji: (q.emoji || '').trim() || '🛍️', imageUrl: (q.imageUrl || '').trim(), extra: (q.extra || '').trim(), price, mrp: Math.max(num(q.mrp), price),
      stock: parseInt(q.stock || '0', 10) || 0, rating: Math.min(5, Math.max(0, num(q.rating, 4))) };
    return d;
  }
  function validProduct(type, d) {
    if (!TYPES[type]) return 'Unknown product type.';
    if (!d.name) return 'Product name is required.';
    if (!d.category) return 'Category is required.';
    if (d.price <= 0) return 'Price must be greater than 0.';
    if (d.stock < 0) return 'Stock cannot be negative.';
    return '';
  }

  function route(method, path, q, token) {
    const user = db.users.find((u) => u.id === sessions[token]);
    if (method === 'GET' && path === '/api/products') {
      const term = (q.q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
      let list = db.products.filter((p) => {
        if (q.category && p.category !== q.category) return false;
        const hay = (p.name + ' ' + p.brand + ' ' + p.category + ' ' + p.description).toLowerCase();
        return term.every((w) => hay.includes(w));
      }).map(pJson);
      const s = q.sort;
      if (s === 'price_asc') list.sort((a, b) => a.price - b.price);
      else if (s === 'price_desc') list.sort((a, b) => b.price - a.price);
      else if (s === 'rating') list.sort((a, b) => b.rating - a.rating);
      else if (s === 'discount') list.sort((a, b) => b.discount - a.discount);
      return ok({ products: list });
    }
    if (method === 'GET' && path.startsWith('/api/products/')) {
      const p = db.products.find((x) => x.id === parseInt(path.slice(14), 10));
      if (!p) return fail(404, 'Product not found.');
      const related = db.products.filter((x) => x.category === p.category && x.id !== p.id).sort((a, b) => b.rating - a.rating).slice(0, 4).map(pJson);
      return ok({ product: pJson(p), related });
    }
    if (method === 'GET' && path === '/api/categories') return ok({ categories: [...new Set(db.products.map((p) => p.category))] });
    if (method === 'POST' && path === '/api/register') {
      const email = (q.email || '').trim().toLowerCase();
      if ((q.name || '').trim().length < 2) return fail(400, 'Please enter your full name.');
      if (!email.includes('@') || !email.includes('.')) return fail(400, 'Enter a valid email address.');
      if ((q.password || '').length < 6) return fail(400, 'Password must be at least 6 characters.');
      if (db.users.some((u) => u.email === email)) return fail(400, 'This email is already registered.');
      db.users.push({ id: db.nextUser++, role: 'customer', name: q.name.trim(), email, password: q.password, phone: (q.phone || '').trim(), address: '', createdAt: now() });
      save();
      return ok({ message: 'Account created. Please log in.' });
    }
    if (method === 'POST' && path === '/api/login') {
      const u = db.users.find((x) => x.email === (q.email || '').trim().toLowerCase());
      if (!u || u.password !== q.password) return fail(401, 'Wrong email or password.');
      const t = Math.random().toString(16).slice(2) + Date.now().toString(16);
      sessions[t] = u.id; saveSess();
      return ok({ token: t, user: uJson(u) });
    }
    if (!user) return fail(401, 'Please log in first.');
    const uid = user.id;
    if (method === 'POST' && path === '/api/logout') { delete sessions[token]; saveSess(); return ok(); }
    if (method === 'GET' && path === '/api/me') return ok({ user: uJson(user), cartCount: cartCount(uid) });
    if (method === 'GET' && path === '/api/cart') {
      const c = cartOf(uid), lines = [], items = [];
      Object.keys(c).forEach((pid) => {
        const p = db.products.find((x) => x.id === +pid);
        if (!p) { delete c[pid]; return; }
        lines.push([p, c[pid]]);
        items.push({ ...pJson(p), qty: c[pid], lineTotal: r2(p.price * c[pid]) });
      });
      save();
      return ok({ items, count: cartCount(uid), ...pricing(lines) });
    }
    if (method === 'POST' && path === '/api/cart/add') {
      const p = db.products.find((x) => x.id === parseInt(q.productId, 10));
      if (!p) return fail(400, 'Product not found.');
      const qty = Math.max(1, parseInt(q.qty || '1', 10) || 1), c = cartOf(uid);
      if ((c[p.id] || 0) + qty > p.stock) return fail(400, p.stock === 0 ? 'Sorry, this item is out of stock.' : `Only ${p.stock} left in stock.`);
      c[p.id] = (c[p.id] || 0) + qty; save();
      return ok({ message: 'Added to cart.', cartCount: cartCount(uid) });
    }
    if (method === 'POST' && path === '/api/cart/update') {
      const p = db.products.find((x) => x.id === parseInt(q.productId, 10));
      if (!p) return fail(400, 'Product not found.');
      const qty = parseInt(q.qty, 10) || 0;
      if (qty > p.stock) return fail(400, `Only ${p.stock} left in stock.`);
      if (qty <= 0) delete cartOf(uid)[p.id]; else cartOf(uid)[p.id] = qty;
      save(); return ok({ message: '' });
    }
    if (method === 'POST' && path === '/api/cart/remove') { delete cartOf(uid)[parseInt(q.productId, 10)]; save(); return ok(); }
    if (method === 'POST' && path === '/api/orders') {
      const address = (q.address || '').trim();
      if (address.length < 8) return fail(400, 'Please enter a complete delivery address.');
      if (!['COD', 'UPI', 'Card'].includes(q.payment)) return fail(400, 'Choose a payment method.');
      const c = cartOf(uid), ids = Object.keys(c);
      if (!ids.length) return fail(400, 'Your cart is empty.');
      const lines = [], items = [];
      for (const pid of ids) {
        const p = db.products.find((x) => x.id === +pid);
        if (!p) return fail(400, 'An item in your cart is no longer available.');
        if (c[pid] > p.stock) return fail(400, `Not enough stock for "${p.name}".`);
        lines.push([p, c[pid]]);
        items.push({ productId: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: c[pid] });
      }
      const pr = pricing(lines);
      lines.forEach(([p, qn]) => { p.stock -= qn; });
      const order = { id: db.nextOrder++, userId: uid, customer: user.name, date: now(), status: 'Placed', address, payment: q.payment, ...pr, items };
      db.orders.push(order); db.carts[uid] = {}; user.address = address; save();
      return ok({ message: 'Order placed successfully!', orderId: order.id });
    }
    if (method === 'GET' && path === '/api/orders') return ok({ orders: db.orders.filter((o) => o.userId === uid).reverse() });
    if (method === 'POST' && path === '/api/orders/cancel') {
      const o = db.orders.find((x) => x.id === parseInt(q.id, 10) && x.userId === uid);
      if (!o) return fail(400, 'Order not found.');
      if (o.status !== 'Placed') return fail(400, "Only orders that are still 'Placed' can be cancelled.");
      o.items.forEach((i) => { const p = db.products.find((x) => x.id === i.productId); if (p) p.stock += i.qty; });
      o.status = 'Cancelled'; save();
      return ok({ message: 'Order cancelled.' });
    }
    if (path.startsWith('/api/admin/')) {
      if (user.role !== 'admin') return fail(403, 'Admin access only.');
      if (method === 'GET' && path === '/api/admin/stats') {
        const byStatus = { Placed: 0, Packed: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
        let revenue = 0;
        db.orders.forEach((o) => { byStatus[o.status]++; if (o.status !== 'Cancelled') revenue += o.total; });
        return ok({ customers: db.users.filter((u) => u.role !== 'admin').length, products: db.products.length, orders: db.orders.length,
          revenue: r2(revenue), liveProductObjects: db.products.length, byStatus, lowStock: db.products.filter((p) => p.stock < 5).map(pJson) });
      }
      if (method === 'GET' && path === '/api/admin/orders') return ok({ orders: [...db.orders].reverse() });
      if (method === 'GET' && path === '/api/admin/users') return ok({ users: db.users.map(uJson) });
      if (method === 'POST' && path === '/api/admin/orders/status') {
        const o = db.orders.find((x) => x.id === parseInt(q.id, 10));
        if (!o) return fail(400, 'Order not found.');
        if (!['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(q.status)) return fail(400, 'Invalid status.');
        o.status = q.status; save(); return ok({ message: 'Status updated.' });
      }
      if (method === 'POST' && path === '/api/admin/products') {
        const d = readProduct(q), err = validProduct(q.type, d);
        if (err) return fail(400, err);
        db.products.push({ id: db.nextProduct++, type: q.type, ...d }); save(); return ok({ message: 'Product added.' });
      }
      if (method === 'POST' && path === '/api/admin/products/update') {
        const p = db.products.find((x) => x.id === parseInt(q.id, 10));
        if (!p) return fail(400, 'Product not found.');
        const d = readProduct(q), err = validProduct(q.type, d);
        if (err) return fail(400, err);
        Object.assign(p, d, { type: q.type }); save(); return ok({ message: 'Product updated.' });
      }
      if (method === 'POST' && path === '/api/admin/products/delete') {
        const n = db.products.length;
        db.products = db.products.filter((x) => x.id !== parseInt(q.id, 10)); save();
        return db.products.length < n ? ok({ message: 'Product deleted.' }) : fail(400, 'Product not found.');
      }
    }
    return fail(404, 'Unknown API endpoint.');
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    const u = new URL(url, location.href);
    if (!u.pathname.startsWith('/api/')) return realFetch(url, opts);
    const q = Object.fromEntries(u.searchParams);
    if (opts.body) Object.assign(q, Object.fromEntries(new URLSearchParams(opts.body)));
    const token = (opts.headers && opts.headers['X-Token']) || '';
    let r;
    try { r = route((opts.method || 'GET').toUpperCase(), u.pathname, q, token); } catch (e) { r = fail(500, 'Demo error: ' + e.message); }
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };

  // slim demo banner
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.style.cssText = 'background:#fff4d6;color:#6b4e00;font:600 12.5px/1.4 system-ui,sans-serif;padding:7px 16px;text-align:center';
    bar.innerHTML = 'Live demo: this page runs in your browser (data is saved only on this device). The real C++ backend is in your project files. <a href="#" id="resetDemo" style="color:#1d4ed8;text-decoration:underline">Reset demo data</a>';
    document.body.prepend(bar);
    document.getElementById('resetDemo').onclick = (e) => { e.preventDefault(); store.del(KEY); store.del(KEY + '_sess'); try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (x) {} location.href = 'index.html'; };
  });
})();
