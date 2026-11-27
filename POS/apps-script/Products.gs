// POS · Products.gs — products, categories, stock count, product history, units sold
/* ---------- products ---------- */
function prodFrom_(p) {
  const cid = str_(p.categoryId, 40);
  const cat = readAll_('Categories').filter(function (c) { return c.id === cid; })[0];
  return {
    sku: str_(p.sku, 40), barcode: str_(p.barcode, 60), name: str_(p.name, 120, true, 'Product name'),
    categoryId: cat ? cat.id : '', categoryName: cat ? cat.name : '',
    price: num_(p.price, 'Price'), cost: num_(p.cost, 'Cost'), stock: num_(p.stock, 'Stock'),
    lowStockLimit: num_(p.lowStockLimit === undefined || p.lowStockLimit === '' ? 5 : p.lowStockLimit, 'Low stock limit'),
    imageUrl: safeUrl_(p.imageUrl)
  };
}
function dupCheck_(d, id) {
  readAll_('Products').forEach(function (x) {
    if (!isAct_(x) || x.id === id) return;
    if (d.sku && String(x.sku).toLowerCase() === d.sku.toLowerCase()) throw UErr('Another product already uses that SKU.');
    if (d.barcode && String(x.barcode) === d.barcode) throw UErr('Another product already uses that barcode.');
  });
}
function getProducts_() { return readAll_('Products').filter(isAct_).map(function (x) { const o = pub_(x); if (!isAdmin_()) delete o.cost; return o; }); }
function saveProduct_(p) {
  const d = prodFrom_(p); dupCheck_(d, '');
  const o = Object.assign({ id: uid_('P'), active: true, createdAt: now_(), updatedAt: now_() }, d);
  appendRow_('Products', o);
  return o;
}
function findProduct_(id) {
  id = str_(id, 40, true, 'Product');
  const r = readAll_('Products').filter(function (x) { return x.id === id && isAct_(x); })[0];
  if (!r) throw UErr('Product not found.');
  return r;
}
function updateProduct_(p) {
  const r = findProduct_(p.id), d = prodFrom_(p); dupCheck_(d, r.id);
  const o = Object.assign({}, r, d, { updatedAt: now_() });
  setRow_('Products', r._row, o);
  return pub_(o);
}
function deleteProduct_(p) {
  const r = findProduct_(p.id);
  setRow_('Products', r._row, Object.assign({}, r, { active: false, updatedAt: now_() }));
  return { id: r.id };
}

/* ---------- categories ---------- */
function getCategories_() { return readAll_('Categories').filter(isAct_).map(pub_); }
function saveCategory_(p) {
  const id = str_(p.id, 40), name = str_(p.name, 60, true, 'Category name'), desc = str_(p.description, 200);
  const rows = readAll_('Categories');
  const clash = rows.some(function (x) { return isAct_(x) && x.id !== id && String(x.name).toLowerCase() === name.toLowerCase(); });
  if (clash && p.active !== false) throw UErr('That category already exists.');
  if (id) {
    const r = rows.filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Category not found.');
    const o = Object.assign({}, r, { name: name, description: desc, active: p.active === false ? false : true, updatedAt: now_() });
    setRow_('Categories', r._row, o);
    if (o.name !== r.name) {
      const col = SCHEMAS.Products.indexOf('categoryName') + 1;
      readAll_('Products').filter(function (x) { return x.categoryId === r.id; }).forEach(function (x) { sh_('Products').getRange(x._row, col).setValue(name); });
    }
    return pub_(o);
  }
  const n = { id: uid_('C'), name: name, description: desc, active: true, createdAt: now_(), updatedAt: now_() };
  appendRow_('Categories', n);
  return n;
}

/* ---------- stock adjustments / stocktake (NEW) ---------- */
const ADJ_TYPES = ['Stocktake', 'Damaged', 'Lost', 'Found', 'Other'];
function adjustStock_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const type = str_(p.type, 20, true, 'Type');
    if (ADJ_TYPES.indexOf(type) < 0) throw UErr('Choose a valid reason type.');
    if (!Array.isArray(p.items) || !p.items.length) throw UErr('Nothing to adjust.');
    if (p.items.length > 500) throw UErr('Too many products in one go.');
    const prods = {}; readAll_('Products').forEach(function (x) { if (isAct_(x)) prods[x.id] = x; });
    const plan = [];
    p.items.forEach(function (i) {
      const pr = prods[str_(i.productId, 40, true, 'Product')];
      if (!pr) throw UErr('A product was not found.');
      const ns = num_(i.newStock, 'Counted stock');
      if (ns !== Number(pr.stock)) plan.push({ pr: pr, ns: ns });
    });
    let adjDate = today_();
    if (p.date) { adjDate = checkDate_(p.date); if (adjDate > today_()) throw UErr('The date cannot be in the future.'); }
    const ts = now_(), reason = str_(p.reason, 200);
    plan.forEach(function (x) {
      appendRow_('StockAdjustments', { id: uid_('A'), date: adjDate, productId: x.pr.id, sku: x.pr.sku, productName: x.pr.name, oldStock: Number(x.pr.stock), newStock: x.ns, change: r2_(x.ns - Number(x.pr.stock)), type: type, reason: reason, createdBy: who_(), createdAt: ts });
      setRow_('Products', x.pr._row, Object.assign({}, x.pr, { stock: x.ns, updatedAt: ts }));
    });
    return { count: plan.length };
  } finally { lock.releaseLock(); }
}
function getStockAdjustments_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10);
  return readAll_('StockAdjustments').filter(function (x) { return (!from || x.date >= from) && (!to || x.date <= to); }).map(pub_)
    .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).slice(0, 300);
}

/* ---------- units sold per product (NEW) ---------- */
// Used to sort products by best / least selling. Profit is only returned to Admin.
function getProductSales_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10), ids = {};
  readAll_('Sales').forEach(function (s) { if ((!from || s.date >= from) && (!to || s.date <= to)) ids[s.id] = 1; });
  const out = {};
  readAll_('SaleItems').forEach(function (i) {
    if (!ids[i.saleId] || i.kind === 'Replacement') return;
    const o = out[i.productId] = out[i.productId] || { qty: 0, revenue: 0, profit: 0 };
    const rev = Number(i.lineTotal) - Number(i.discount);
    o.qty += Number(i.quantity); o.revenue += rev; o.profit += rev - Number(i.quantity) * Number(i.unitCost);
  });
  Object.keys(out).forEach(function (k) {
    const o = out[k]; o.qty = r2_(o.qty); o.revenue = r2_(o.revenue);
    if (isAdmin_()) o.profit = r2_(o.profit); else delete o.profit;
  });
  return out;
}

/* ---------- product history: who bought it, and every stock movement (NEW) ---------- */
function getProductHistory_(p) {
  const pr = findProduct_(str_(p.productId, 40, true, 'Product')), admin = isAdmin_();
  const sku = String(pr.sku || '').toLowerCase(), cur = Number(pr.stock) || 0;
  const sales = {}; readAll_('Sales').forEach(function (s) { sales[s.id] = s; });
  const ev = [], cust = {}; let sold = 0, rev = 0, profit = 0, lastSale = '', lastRecv = '', received = 0;
  const replInv = {};
  readAll_('SaleItems').forEach(function (i) {
    if (i.productId !== pr.id) return;
    const s = sales[i.saleId]; if (!s) return;
    const q = Number(i.quantity) || 0, repl = i.kind === 'Replacement', amt = r2_(Number(i.lineTotal) - Number(i.discount));
    if (repl) replInv[i.invoiceId] = 1;
    const key = s.customerId || 'walkin', c = cust[key] = cust[key] || { key: key, name: s.customerName || 'Walk-in customer', orders: {}, qty: 0, revenue: 0, lastDate: '', lines: [] };
    c.orders[s.id] = 1; c.qty += q; c.revenue += amt; if (String(s.date) > c.lastDate) c.lastDate = s.date;
    c.lines.push({ date: s.date, invoiceId: s.invoiceId, qty: q, price: Number(i.unitPrice) || 0, total: amt, kind: repl ? 'Replacement' : 'Sale' });
    sold += q; rev += amt; if (admin) profit += amt - q * Number(i.unitCost);
    if (String(s.date) > lastSale) lastSale = s.date;
    ev.push({ date: s.date, at: s.date + ' ' + (i.createdAt || ''), type: repl ? 'Replacement' : 'Sold', ref: s.invoiceId, party: s.customerName || 'Walk-in customer', inQ: 0, outQ: q });
  });
  const recvRows = []; let pending = 0;
  readAll_('SupplierInvoices').forEach(function (v) {
    let items = []; try { items = JSON.parse(v.itemsJson || '[]'); } catch (e) { items = []; }
    let q = 0, net = 0, up = 0, dp = 0, free = false, any = false;
    items.forEach(function (i) {
      if (String(i.code).toLowerCase() !== sku || !sku) return;
      any = true; q += Number(i.quantity) || 0; up = Number(i.unitPrice) || up; dp = Number(i.discPct) || 0; free = free || !!i.free;
      net += (Number(i.amount) || 0) * (1 - (Number(i.discPct) || 0) / 100);
    });
    if (!any) return;
    q = r2_(q); const got = v.status === 'Received';
    recvRows.push({ date: got ? (v.receivedDate || v.date) : v.date, invoiceNo: v.invoiceNo, supplier: v.supplier, qty: q, status: got ? 'Received' : 'Not received yet',
      unitPrice: admin ? up : undefined, discPct: admin ? dp : undefined, netCost: admin ? (q ? r2_(net / q) : 0) : undefined, free: free });
    if (got) { received += q; const d = v.receivedDate || v.date; if (String(d) > lastRecv) lastRecv = d; ev.push({ date: d, at: d + ' ', type: 'Received', ref: v.invoiceNo, party: v.supplier || 'Supplier', inQ: q, outQ: 0 }); }
    else pending += q;
  });
  readAll_('Returns').forEach(function (r) {
    if (r.productId === pr.id) {
      const q = Number(r.quantity) || 0;
      if (r.status === 'Restocked' || (r.condition === 'Good' && r.resolution)) ev.push({ date: r.date, at: r.date + ' ' + (r.createdAt || ''), type: 'Customer return', ref: r.saleInvoice || '', party: r.customerName || '', inQ: q, outQ: 0 });
      if (r.replaced && !replInv[r.saleInvoice]) ev.push({ date: r.date, at: r.date + ' ' + (r.createdAt || ''), type: 'Replacement', ref: r.saleInvoice || '', party: r.customerName || '', inQ: 0, outQ: q });
    }
    if (r.creditType === 'Free items' && String(r.creditNote).indexOf('Free: ') === 0) {
      const m = new RegExp(String(pr.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' x([0-9.]+)').exec(r.creditNote);
      if (m) ev.push({ date: r.creditedDate || r.date, at: (r.creditedDate || r.date) + ' ', type: 'Free from supplier', ref: r.claimRef || r.creditInvoiceNo || '', party: 'Supplier credit', inQ: Number(m[1]), outQ: 0 });
    }
  });
  readAll_('DeletedSales').forEach(function (d) {
    let its = []; try { its = JSON.parse(d.itemsJson || '[]'); } catch (e) { its = []; }
    its.forEach(function (i) { if (i.productId === pr.id) ev.push({ date: d.date, at: d.date + ' ' + (d.deletedAt || ''), type: 'Sold (sale deleted later)', ref: d.invoiceId, party: d.customerName || 'Walk-in customer', inQ: 0, outQ: Number(i.qty) || 0 }); });
  });
  readAll_('StockAdjustments').forEach(function (a) {
    if (a.productId !== pr.id) return; const ch = Number(a.change) || 0;
    ev.push({ date: a.date, at: a.date + ' ' + (ch > 0 ? '' : (a.createdAt || '')), type: 'Adjustment (' + (a.type || 'Other') + ')', ref: a.reason || '', party: a.createdBy || '', inQ: ch > 0 ? ch : 0, outQ: ch < 0 ? -ch : 0 });
  });
  ev.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  let bal = cur;
  const ledger = ev.map(function (e) { const row = { date: e.date, type: e.type, ref: e.ref, party: e.party, inQ: r2_(e.inQ), outQ: r2_(e.outQ), balance: r2_(bal) }; bal -= (e.inQ - e.outQ); return row; });
  const customers = Object.keys(cust).map(function (k) {
    const c = cust[k]; c.lines.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return { key: k, name: c.name, orders: Object.keys(c.orders).length, qty: r2_(c.qty), revenue: r2_(c.revenue), lastDate: c.lastDate, lines: c.lines.slice(0, 40) };
  }).sort(function (a, b) { return b.qty - a.qty; });
  recvRows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  const out = { productId: pr.id, name: pr.name, sku: pr.sku, stock: cur, sold: r2_(sold), revenue: r2_(rev), received: r2_(received), pending: r2_(pending), lastSale: lastSale, lastReceived: lastRecv,
    customers: customers, ledger: ledger.slice(0, 400), earlier: r2_(bal), received_rows: recvRows };
  if (admin) out.profit = r2_(profit);
  return out;
}
