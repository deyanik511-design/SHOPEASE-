// home.js - home page: banner slider, category tiles, deals, search results, filters.
const params = new URLSearchParams(location.search);
const state = { q: params.get('q') || '', category: params.get('category') || '', sort: params.get('sort') || '' };
const ICONS = { 'Mobiles': '📱', 'Electronics': '💻', 'Fashion': '👗', 'Books': '📚', 'Home & Kitchen': '🏠' };

// ----- banner slider -----
(function slider() {
  const slides = $('#slides'), n = slides.children.length;
  let i = 0, timer;
  $('#dots').innerHTML = Array.from({ length: n }, (_, k) => `<button data-i="${k}"></button>`).join('');
  const go = (k) => { i = (k + n) % n; slides.style.transform = `translateX(-${i * 100}%)`; $$('#dots button').forEach((b, j) => b.classList.toggle('on', j === i)); };
  $('#dots').addEventListener('click', (e) => { if (e.target.dataset.i) { go(+e.target.dataset.i); restart(); } });
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 4500); };
  go(0); restart();
})();

async function load() {
  renderNavbar(state.category);
  renderFooter();
  const filtering = state.q || state.category || state.sort;
  $('#catSection').classList.toggle('hidden', !!filtering);
  $('#dealsSection').classList.toggle('hidden', !!filtering);
  $('#hero').classList.toggle('hidden', !!filtering);
  $('#sort').value = state.sort;

  $('#products').innerHTML = '<div class="skeleton"></div>'.repeat(4);
  try {
    const { categories } = await api('/api/categories');
    $('#catTiles').innerHTML = categories.map((c) => `<button class="cat-tile" onclick="location.href='index.html?category=${encodeURIComponent(c)}'"><span class="ic">${ICONS[c] || '🛍️'}</span><b>${esc(c)}</b></button>`).join('');
    $('#chips').innerHTML = ['', ...categories].map((c) => `<button class="chip ${state.category === c ? 'on' : ''}" data-c="${esc(c)}">${c || 'All'}</button>`).join('');

    if (!filtering) {
      const d = await api('/api/products?sort=discount');
      $('#deals').innerHTML = d.products.slice(0, 4).map(productCard).join('');
    }
    const r = await api('/api/products?' + new URLSearchParams(state).toString());
    $('#listTitle').textContent = state.q ? `Results for "${state.q}"` : state.category || 'All products';
    $('#resultCount').textContent = r.products.length + ' item' + (r.products.length === 1 ? '' : 's');
    $('#products').innerHTML = r.products.length
      ? r.products.map(productCard).join('')
      : '<div class="empty" style="grid-column:1/-1"><div class="ic">🔍</div><h2>No products found</h2><p>Try a different word or category.</p><a class="btn btn-primary" href="index.html">Show all products</a></div>';
  } catch (e) {
    $('#products').innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="ic">⚠️</div><h2>Could not load products</h2><p>${esc(e.message)}</p></div>`;
  }
}

$('#chips').addEventListener('click', (e) => {
  if (e.target.dataset.c === undefined) return;
  const p = new URLSearchParams(location.search);
  e.target.dataset.c ? p.set('category', e.target.dataset.c) : p.delete('category');
  p.delete('q');
  location.search = p.toString();
});
$('#sort').addEventListener('change', (e) => {
  const p = new URLSearchParams(location.search);
  e.target.value ? p.set('sort', e.target.value) : p.delete('sort');
  location.search = p.toString();
});
load();
