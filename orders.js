// orders.js - order history with status tracker and cancel button
renderNavbar(); renderFooter();
const STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'];

async function load() {
  if (!requireLogin()) return;
  try {
    const { orders } = await api('/api/orders');
    if (!orders.length) { $('#page').innerHTML = `<div class="empty panel"><div class="ic">📦</div><h2>No orders yet</h2><p>When you place an order it will show up here.</p><a class="btn btn-primary" href="index.html">Start shopping</a></div>`; return; }
    $('#page').innerHTML = orders.map((o) => {
      const idx = STEPS.indexOf(o.status);
      return `<div class="order">
        <div class="order-head">
          <div><small>Order placed</small>${esc(o.date)}</div>
          <div><small>Total</small><b>${money(o.total)}</b></div>
          <div><small>Payment</small>${esc(o.payment)}</div>
          <div><small>Ship to</small>${esc(o.address)}</div>
          <div style="margin-left:auto"><small>Order #${o.id}</small><span class="status st-${o.status}">${o.status}</span></div>
        </div>
        <div class="order-body">
          ${o.items.map((i) => `<div class="order-item"><div class="em">${esc(i.emoji)}</div><div style="flex:1"><a href="product.html?id=${i.productId}"><b>${esc(i.name)}</b></a><br><small style="color:var(--muted)">Qty ${i.qty} × ${money(i.price)}</small></div><b>${money(i.qty * i.price)}</b></div>`).join('')}
          ${o.status === 'Cancelled' ? '' : `<div class="track">${STEPS.map((s, k) => `<div class="${k <= idx ? 'done' : ''}">${s}</div>`).join('')}</div>`}
          ${o.status === 'Placed' ? `<button class="btn btn-danger btn-sm" style="margin-top:10px" onclick="cancelOrder(${o.id})">Cancel order</button>` : ''}
        </div></div>`;
    }).join('');
  } catch (e) { $('#page').innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2></div>`; }
}
async function cancelOrder(id) {
  if (!(await askConfirm('Cancel this order?', 'Cancel order'))) return;
  try { await api('/api/orders/cancel', { method: 'POST', data: { id } }); toast('Order cancelled', 'ok'); load(); } catch (e) { toast(e.message, 'err'); }
}
load();
