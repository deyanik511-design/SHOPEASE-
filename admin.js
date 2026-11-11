// admin.js - admin dashboard: stats, product management, orders, users
renderNavbar(); renderFooter();
const u = Session.user;
let tab = 'dash', products = [];

if (!u || u.role !== 'admin') {
  $('#tabs').classList.add('hidden');
  $('#page').innerHTML = `<div class="empty panel"><div class="ic">🔒</div><h2>Admin access only</h2><p>Please login with an admin account.</p><a class="btn btn-primary" href="login.html?next=admin.html">Login</a></div>`;
} else {
  $('#tabs').addEventListener('click', (e) => {
    if (!e.target.dataset.tab) return;
    tab = e.target.dataset.tab;
    $$('#tabs .chip').forEach((c) => c.classList.toggle('on', c === e.target));
    show();
  });
  show();
}

function show() { ({ dash, products: productsTab, orders, users })[tab]().catch((e) => { $('#page').innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2></div>`; }); }

async function dash() {
  const s = await api('/api/admin/stats');
  const max = Math.max(1, ...Object.values(s.byStatus));
  $('#page').innerHTML = `
    <div class="stats">
      <div class="stat"><span class="ic">💰</span><small>Revenue</small><b>${money(s.revenue)}</b></div>
      <div class="stat"><span class="ic">🧾</span><small>Orders</small><b>${s.orders}</b></div>
      <div class="stat"><span class="ic">📦</span><small>Products</small><b>${s.products}</b></div>
      <div class="stat"><span class="ic">👥</span><small>Customers</small><b>${s.customers}</b></div>
      <div class="stat"><span class="ic">🧠</span><small>Product objects in memory</small><b>${s.liveProductObjects}</b></div>
    </div>
    <div class="two-col" style="grid-template-columns:1fr 1fr">
      <div class="panel"><h2>Orders by status</h2><div class="bars">${['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((k) => [k, s.byStatus[k] || 0]).map(([k, v]) => `<div class="bar"><span>${k}</span><i style="width:${v / max * 100}%"></i><b>${v}</b></div>`).join('')}</div></div>
      <div class="panel"><h2>⚠️ Low stock (under 5)</h2>${s.lowStock.length ? s.lowStock.map((p) => `<div class="summary-row"><span>${esc(p.emoji)} ${esc(p.name)}</span><b style="color:${p.stock ? '#c2410c' : 'var(--red)'}">${p.stock}</b></div>`).join('') : '<p style="color:var(--muted)">All products are well stocked.</p>'}</div>
    </div>`;
}

async function productsTab() {
  products = (await api('/api/products')).products;
  $('#page').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>${products.length} products</b><button class="btn btn-primary" onclick="editProduct()">＋ Add product</button></div>
    <div class="table-wrap"><table><thead><tr><th></th><th>ID</th><th>Name</th><th>Type</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>
    ${products.map((p) => `<tr><td style="font-size:1.6rem">${esc(p.emoji)}</td><td>${p.id}</td><td><b>${esc(p.name)}</b><br><small style="color:var(--muted)">${esc(p.brand)}</small></td><td>${p.type}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td>
      <td><b style="color:${p.stock === 0 ? 'var(--red)' : p.stock < 5 ? '#c2410c' : 'inherit'}">${p.stock}</b></td>
      <td><div class="row-actions"><button class="btn btn-ghost btn-sm" onclick="editProduct(${p.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="delProduct(${p.id})">Delete</button></div></td></tr>`).join('')}
    </tbody></table></div>`;
}

function editProduct(id) {
  const p = products.find((x) => x.id === id) || { type: 'electronics', rating: 4, stock: 10, emoji: '🛍️' };
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<form class="modal"><h2>${id ? 'Edit product' : 'Add new product'}</h2>
    <div class="form-grid">
      <div class="field full"><label>Name *</label><input name="name" required value="${esc(p.name || '')}"></div>
      <div class="field"><label>Type (class) *</label><select name="type">${['electronics', 'fashion', 'book', 'home'].map((t) => `<option ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Category *</label><input name="category" required list="cats" value="${esc(p.category || '')}" placeholder="e.g. Mobiles"><datalist id="cats">${[...new Set(products.map((x) => x.category))].map((c) => `<option>${esc(c)}</option>`).join('')}</datalist></div>
      <div class="field"><label>Brand</label><input name="brand" value="${esc(p.brand || '')}"></div>
      <div class="field"><label>Extra info <small id="xl" style="color:var(--muted)"></small></label><input name="extra" value="${esc(p.extra || '')}"></div>
      <div class="field"><label>Selling price (₹) *</label><input name="price" type="number" step="0.01" min="1" required value="${p.price || ''}"></div>
      <div class="field"><label>MRP (₹)</label><input name="mrp" type="number" step="0.01" min="0" value="${p.mrp || ''}"></div>
      <div class="field"><label>Stock *</label><input name="stock" type="number" min="0" required value="${p.stock}"></div>
      <div class="field"><label>Rating (0-5)</label><input name="rating" type="number" step="0.1" min="0" max="5" value="${p.rating}"></div>
      <div class="field"><label>Emoji picture</label><input name="emoji" value="${esc(p.emoji)}"></div>
      <div class="field"><label>Image URL (optional)</label><input name="imageUrl" value="${esc(p.imageUrl || '')}" placeholder="https://..."></div>
      <div class="field full"><label>Description</label><textarea name="description" rows="3">${esc(p.description || '')}</textarea></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary">Save product</button></div></form>`;
  document.body.appendChild(bg);
  const labels = { electronics: '(warranty in months)', fashion: '(sizes)', book: '(author)', home: '(material)' };
  const form = $('form', bg);
  const upd = () => { $('#xl').textContent = labels[form.type.value]; };
  form.type.onchange = upd; upd();
  $('#cancel', bg).onclick = () => bg.remove();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (id) data.id = id;
    try { const r = await api(id ? '/api/admin/products/update' : '/api/admin/products', { method: 'POST', data }); toast(r.message, 'ok'); bg.remove(); productsTab(); }
    catch (err) { toast(err.message, 'err'); }
  };
}

async function delProduct(id) {
  if (!(await askConfirm('Delete this product permanently?', 'Delete'))) return;
  try { await api('/api/admin/products/delete', { method: 'POST', data: { id } }); toast('Product deleted', 'ok'); productsTab(); } catch (e) { toast(e.message, 'err'); }
}

async function orders() {
  const { orders } = await api('/api/admin/orders');
  $('#page').innerHTML = orders.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
    ${orders.map((o) => `<tr><td><b>#${o.id}</b></td><td>${esc(o.date)}</td><td>${esc(o.customer)}<br><small style="color:var(--muted)">${esc(o.address)}</small></td>
      <td>${o.items.map((i) => `${esc(i.emoji)} ${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td><b>${money(o.total)}</b></td><td>${esc(o.payment)}</td>
      <td><select class="input" style="padding:6px" onchange="setStatus(${o.id}, this.value)">${['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty panel"><div class="ic">🧾</div><h2>No orders yet</h2></div>';
}
async function setStatus(id, status) {
  try { await api('/api/admin/orders/status', { method: 'POST', data: { id, status } }); toast('Status updated', 'ok'); } catch (e) { toast(e.message, 'err'); }
}

async function users() {
  const { users } = await api('/api/admin/users');
  $('#page').innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead><tbody>
    ${users.map((x) => `<tr><td>${x.id}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td><td><span class="status ${x.role === 'admin' ? 'st-Shipped' : 'st-Placed'}">${x.role}</span></td><td>${esc(x.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
}
