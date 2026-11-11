// auth.js - login and register page
renderNavbar(); renderFooter();
const next = new URLSearchParams(location.search).get('next') || 'index.html';

function show(which) {
  $('#loginForm').classList.toggle('hidden', which !== 'login');
  $('#regForm').classList.toggle('hidden', which !== 'reg');
  $('#tabLogin').classList.toggle('on', which === 'login');
  $('#tabReg').classList.toggle('on', which === 'reg');
}
$('#tabLogin').onclick = () => show('login');
$('#tabReg').onclick = () => show('reg');

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/login', { method: 'POST', data: Object.fromEntries(new FormData(e.target)) });
    Session.save(r.token, r.user);
    location.href = r.user.role === 'admin' && next === 'index.html' ? 'admin.html' : next;
  } catch (err) { toast(err.message, 'err'); }
});
$('#regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  try {
    await api('/api/register', { method: 'POST', data });
    const r = await api('/api/login', { method: 'POST', data: { email: data.email, password: data.password } });   // log in right away
    Session.save(r.token, r.user);
    location.href = next;
  } catch (err) { toast(err.message, 'err'); }
});
