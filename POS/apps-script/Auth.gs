// POS · Auth.gs — login, users, roles (Admin / Cashier)
/* ---------- login & roles (NEW) ---------- */
// Admin can do everything. Cashier can only use the actions listed in CASHIER_ACTIONS (and never sees costs).
let CUR_ = null;
const OPEN_ACTIONS = ['authStatus', 'login', 'setupAdmin'];
const CASHIER_ACTIONS = ['getSettings', 'getProducts', 'getCategories', 'getCustomers', 'saveCustomer', 'getSales', 'createSale', 'getDashboardData',
  'getPayments', 'rejectCheque', 'getReturns', 'saveReturn', 'getCustomerPrices', 'receiveCollection', 'getReceipts', 'getProductSales', 'getCustomerSales', 'getDayClose', 'saveDayClose', 'getDayCloses', 'changePassword', 'logout'];
function isAdmin_() { return !!CUR_ && CUR_.role === 'Admin'; }
function who_() { return CUR_ ? CUR_.username : ''; }
function hex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }
function hash_(salt, pw) {
  let h = salt + ':' + pw;
  for (let i = 0; i < 50; i++) h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + h));
  return h;
}
function pwOk_(pw) { pw = String(pw || ''); if (pw.length < 6) throw UErr('Password must be at least 6 characters.'); return pw; }
function userPub_(u) { return { id: u.id, username: u.username, role: u.role, active: isAct_(u) }; }
function newSession_(u) {
  const t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('t_' + t, JSON.stringify({ id: u.id }), 21600);
  return { token: t, user: userPub_(u) };
}
function authUser_(token) {
  token = String(token || ''); if (!token) return null;
  const c = CacheService.getScriptCache().get('t_' + token); if (!c) return null;
  let u; try { u = JSON.parse(c); } catch (e) { return null; }
  const row = readAll_('Users').filter(function (x) { return x.id === u.id; })[0];
  return (row && isAct_(row)) ? { id: row.id, username: row.username, role: row.role } : null;
}
function authStatus_() { return { hasUsers: readAll_('Users').some(isAct_) }; }
function userName_(v) {
  v = String(v || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(v)) throw UErr('Username must be 3-30 letters or numbers (no spaces).');
  return v;
}
function addUser_(username, pw, role) {
  const salt = uid_('s'), ts = now_();
  const o = { id: uid_('N'), username: username, salt: salt, hash: hash_(salt, pwOk_(pw)), role: role, active: true, createdAt: ts, updatedAt: ts };
  appendRow_('Users', o);
  return o;
}
function setupAdmin_(p) {
  if (readAll_('Users').length) throw UErr('Setup is already done. Please log in.');
  return newSession_(addUser_(userName_(p.username), p.password, 'Admin'));
}
function login_(p) {
  const un = String(p.username || '').trim().toLowerCase(), cache = CacheService.getScriptCache(), fk = 'f_' + un;
  const fails = Number(cache.get(fk)) || 0;
  if (fails >= 5) throw UErr('Too many wrong attempts. Please wait 5 minutes.');
  const u = readAll_('Users').filter(function (x) { return String(x.username).toLowerCase() === un && isAct_(x); })[0];
  if (!u || hash_(u.salt, String(p.password || '')) !== u.hash) { cache.put(fk, String(fails + 1), 300); throw UErr('Wrong username or password.'); }
  cache.remove(fk);
  return newSession_(u);
}
function logout_(p) { CacheService.getScriptCache().remove('t_' + String(p.token || '')); return {}; }
function changePassword_(p) {
  const u = readAll_('Users').filter(function (x) { return x.id === CUR_.id; })[0];
  if (!u || hash_(u.salt, String(p.oldPassword || '')) !== u.hash) throw UErr('Your current password is wrong.');
  const salt = uid_('s');
  setRow_('Users', u._row, Object.assign({}, u, { salt: salt, hash: hash_(salt, pwOk_(p.newPassword)), updatedAt: now_() }));
  return {};
}
function getUsers_() { return readAll_('Users').map(userPub_); }
function saveUser_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40), role = p.role === 'Admin' ? 'Admin' : 'Cashier', active = !(p.active === false || p.active === 'false');
    const users = readAll_('Users');
    if (!id) {
      const un = userName_(p.username);
      if (users.some(function (x) { return String(x.username).toLowerCase() === un; })) throw UErr('That username is already used.');
      return userPub_(addUser_(un, p.password, role));
    }
    const r = users.filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('User not found.');
    if (id === CUR_.id && !active) throw UErr('You cannot switch off your own account.');
    const otherAdmins = users.filter(function (x) { return x.id !== id && isAct_(x) && x.role === 'Admin'; }).length;
    if (r.role === 'Admin' && isAct_(r) && !(role === 'Admin' && active) && otherAdmins === 0) throw UErr('There must be at least one active Admin.');
    const o = Object.assign({}, r, { role: role, active: active, updatedAt: now_() });
    if (p.password) { o.salt = uid_('s'); o.hash = hash_(o.salt, pwOk_(p.password)); }
    setRow_('Users', r._row, o);
    CacheService.getScriptCache().remove('f_' + String(r.username).toLowerCase());
    return userPub_(o);
  } finally { lock.releaseLock(); }
}
