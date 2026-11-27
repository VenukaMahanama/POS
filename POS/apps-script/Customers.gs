// POS · Customers.gs — customers, purchases per customer, special prices
/* ---------- customers ---------- */
function getCustomers_() { return readAll_('Customers').map(function (x) { const o = pub_(x); o.discountPercent = Number(o.discountPercent) || 0; return o; }); }
function saveCustomer_(p) {
  const id = str_(p.id, 40);
  const o = {
    name: str_(p.name, 100, true, 'Name'), phone: String(p.phone || '').replace(/[^0-9+\-\s()]/g, '').slice(0, 25),
    email: str_(p.email, 100), address: str_(p.address, 200), route: str_(p.route, 60)
  };
  if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) throw UErr('Enter a valid email address.');
  if (id) {
    const r = readAll_('Customers').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Customer not found.');
    const n = Object.assign({}, r, o, { updatedAt: now_() });
    setRow_('Customers', r._row, n);
    return pub_(n);
  }
  const n = Object.assign({ id: uid_('U'), createdAt: now_(), updatedAt: now_(), discountPercent: 0 }, o);
  appendRow_('Customers', n);
  return n;
}

/* ---------- purchases per customer (NEW) ---------- */
function getCustomerSales_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10), out = {};
  readAll_('Sales').forEach(function (s) {
    if (!s.customerId || (from && s.date < from) || (to && s.date > to)) return;
    const o = out[s.customerId] = out[s.customerId] || { orders: 0, total: 0 };
    o.orders++; o.total += Number(s.total) || 0;
  });
  Object.keys(out).forEach(function (k) { out[k].total = r2_(out[k].total); });
  return out;
}

/* ---------- customer special prices (NEW) ---------- */
function getCustomerPrices_(p) {
  const cid = str_(p.customerId, 40, true, 'Customer');
  return readAll_('CustomerPrices').filter(function (x) { return x.customerId === cid; }).map(pub_);
}
function saveCustomerPrice_(p) {
  const cid = str_(p.customerId, 40, true, 'Customer'), pr = findProduct_(p.productId), price = num_(p.price, 'Price');
  if (!readAll_('Customers').some(function (c) { return c.id === cid; })) throw UErr('Customer not found.');
  const old = readAll_('CustomerPrices').filter(function (x) { return x.customerId === cid && x.productId === pr.id; })[0];
  const o = { id: old ? old.id : uid_('X'), customerId: cid, productId: pr.id, productName: pr.name, price: price, updatedAt: now_() };
  if (old) setRow_('CustomerPrices', old._row, o); else appendRow_('CustomerPrices', o);
  return o;
}
function deleteCustomerPrice_(p) {
  const id = str_(p.id, 40, true, 'Price');
  const r = readAll_('CustomerPrices').filter(function (x) { return x.id === id; })[0];
  if (!r) throw UErr('Price not found.');
  sh_('CustomerPrices').deleteRow(r._row);
  return { id: id };
}
