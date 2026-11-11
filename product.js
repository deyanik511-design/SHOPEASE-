// product.js - single product page
renderNavbar(); renderFooter();
const id = new URLSearchParams(location.search).get('id');
let qty = 1;

(async function () {
  try {
    const { product: p, related } = await api('/api/products/' + id);
    document.title = p.name + ' - ShopEase';
    const out = p.stock === 0;
    $('#page').innerHTML = `
      <div class="crumbs"><a href="index.html">Home</a> › <a href="index.html?category=${encodeURIComponent(p.category)}">${esc(p.category)}</a> › ${esc(p.name)}</div>
      <div class="detail">
        <div class="detail-img" style="${tint(p.category)}">${visual(p)}</div>
        <div>
          <div class="brand">${esc(p.brand)}</div>
          <h1>${esc(p.name)}</h1>
          <span class="pill">${p.rating.toFixed(1)} ★</span>
          <div style="margin:16px 0 4px"><span class="big-price">${money(p.price)}</span>
            ${p.mrp > p.price ? `&nbsp;<s style="color:var(--muted)">${money(p.mrp)}</s>&nbsp;<span class="off" style="color:var(--green);font-weight:800">${p.discount}% off</span>` : ''}</div>
          <small style="color:var(--muted)">Inclusive of offers · GST ${Math.round(p.taxRate * 100)}% added at checkout</small>
          <p style="margin:16px 0">${esc(p.description)}</p>
          <div class="specs">
            <div><span>Category</span>${esc(p.category)}</div>
            <div><span>Brand</span>${esc(p.brand)}</div>
            <div><span>${esc(p.extraLabel)}</span>${esc(p.extra || '-')}</div>
            <div><span>Availability</span>${out ? '<b style="color:var(--red)">Out of stock</b>' : p.stock < 5 ? `<b style="color:#c2410c">Only ${p.stock} left</b>` : '<b style="color:var(--green)">In stock</b>'}</div>
          </div>
          ${out ? '' : `<div class="actions">
            <div class="qty"><button id="minus">−</button><span id="qty">1</span><button id="plus">+</button></div>
            <button class="btn btn-amber" id="add">🛒 Add to Cart</button>
            <button class="btn btn-primary" id="buy">⚡ Buy Now</button>
          </div>`}
          <div class="perks"><span>🚚 Free delivery over ₹500</span><span>↩️ 7-day returns</span><span>🔒 Secure checkout</span></div>
        </div>
      </div>
      ${related.length ? `<section class="section"><div class="section-head"><h2>You may also like</h2></div><div class="grid">${related.map(productCard).join('')}</div></section>` : ''}`;
    if (!out) {
      $('#plus').onclick = () => { if (qty < p.stock) $('#qty').textContent = ++qty; else toast('Only ' + p.stock + ' available', 'err'); };
      $('#minus').onclick = () => { if (qty > 1) $('#qty').textContent = --qty; };
      $('#add').onclick = () => addToCart(p.id, qty);
      $('#buy').onclick = async () => { if (!requireLogin()) return; try { await api('/api/cart/add', { method: 'POST', data: { productId: p.id, qty } }); location.href = 'cart.html'; } catch (e) { toast(e.message, 'err'); } };
    }
  } catch (e) {
    $('#page').innerHTML = `<div class="empty"><div class="ic">😕</div><h2>${esc(e.message)}</h2><a class="btn btn-primary" href="index.html">Back to home</a></div>`;
  }
})();
