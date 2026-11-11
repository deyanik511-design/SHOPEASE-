// cart.js - cart management + checkout + order placed screen
renderNavbar(); renderFooter();
let cart = null;

async function loadCart() {
  if (!Session.token) {
    $('#page').innerHTML = `<div class="empty panel" style="margin-top:18px"><div class="ic">🔐</div><h2>Please login to view your cart</h2><p>Your cart is saved to your account.</p><a class="btn btn-primary" href="login.html?next=cart.html">Login</a></div>`;
    return;
  }
  try { cart = await api('/api/cart'); draw(); } catch (e) { $('#page').innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2></div>`; }
}

function summary(btn) {
  return `<div class="panel">
    <h2>Price details</h2>
    <div class="summary-row"><span>Price (${cart.count} item${cart.count > 1 ? 's' : ''})</span><span>${money(cart.subtotal)}</span></div>
    <div class="summary-row"><span>GST</span><span>${money(cart.tax)}</span></div>
    <div class="summary-row"><span>Delivery</span>${cart.shipping ? `<span>${money(cart.shipping)}</span>` : '<span class="free">FREE</span>'}</div>
    <div class="summary-row total"><span>Total</span><span>${money(cart.total)}</span></div>
    ${cart.shipping ? `<p style="font-size:.8rem;color:var(--muted)">Add ${money(500 - cart.subtotal)} more for free delivery</p>` : ''}
    ${btn}</div>`;
}

function draw() {
  if (!cart.items.length) {
    $('#page').innerHTML = `<div class="empty panel" style="margin-top:18px"><div class="ic">🛒</div><h2>Your cart is empty</h2><p>Looks like you haven't added anything yet.</p><a class="btn btn-primary" href="index.html">Start shopping</a></div>`;
    return;
  }
  $('#page').innerHTML = `<div class="two-col">
    <div class="panel">${cart.items.map((p) => `
      <div class="cart-row">
        <a class="cart-thumb" href="product.html?id=${p.id}" style="${tint(p.category)}">${visual(p)}</a>
        <div>
          <div class="brand">${esc(p.brand)}</div>
          <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
          <div style="margin:6px 0 10px"><b>${money(p.price)}</b> ${p.mrp > p.price ? `<s style="color:var(--muted);font-size:.85rem">${money(p.mrp)}</s>` : ''}</div>
          <div class="qty"><button onclick="setQty(${p.id},${p.qty - 1})">−</button><span>${p.qty}</span><button onclick="setQty(${p.id},${p.qty + 1})">+</button></div>
          <button class="link-btn" onclick="removeItem(${p.id})">Remove</button>
        </div>
        <div class="line">${money(p.lineTotal)}</div>
      </div>`).join('')}</div>
    ${summary('<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="checkout()">Proceed to Checkout</button>')}
  </div>`;
}

async function setQty(id, qty) {
  try { await api('/api/cart/update', { method: 'POST', data: { productId: id, qty } }); await loadCart(); setCartBadge(cart.count); }
  catch (e) { toast(e.message, 'err'); }
}
async function removeItem(id) { await api('/api/cart/remove', { method: 'POST', data: { productId: id } }); await loadCart(); setCartBadge(cart.count); toast('Item removed'); }

function checkout() {
  const u = Session.user || {};
  $('#page').innerHTML = `<div class="two-col">
    <form class="panel" id="orderForm">
      <h2>1. Delivery address</h2>
      <div class="field"><label>Full address (house, street, city, PIN)</label><textarea name="address" rows="3" required minlength="8" placeholder="12 MG Road, Bengaluru 560001"></textarea></div>
      <h2 style="margin-top:20px">2. Payment method</h2>
      <label class="radio-card"><input type="radio" name="payment" value="COD" checked> 💵 Cash on Delivery</label>
      <label class="radio-card"><input type="radio" name="payment" value="UPI"> 📲 UPI (demo)</label>
      <label class="radio-card"><input type="radio" name="payment" value="Card"> 💳 Credit / Debit Card (demo)</label>
      <p style="font-size:.8rem;color:var(--muted)">No real payment is taken - this is a college project.</p>
      <button class="btn btn-primary" style="margin-top:12px">Place Order · ${money(cart.total)}</button>
      <button type="button" class="btn btn-ghost" style="margin-top:12px" onclick="draw()">← Back to cart</button>
    </form>
    ${summary('')}
  </div>`;
  api('/api/me').then((r) => { $('#orderForm textarea').value = r.user.address || ''; });
  $('#orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const r = await api('/api/orders', { method: 'POST', data: { address: f.get('address'), payment: f.get('payment') } });
      setCartBadge(0);
      $('#page').innerHTML = `<div class="empty panel" style="margin-top:18px"><div class="ic">🎉</div><h2>Order placed successfully!</h2><p>Your order <b>#${r.orderId}</b> is confirmed. Thank you for shopping with ShopEase.</p>
        <a class="btn btn-primary" href="orders.html">View my orders</a> <a class="btn btn-ghost" href="index.html">Continue shopping</a></div>`;
    } catch (err) { toast(err.message, 'err'); }
  });
}
loadCart();
