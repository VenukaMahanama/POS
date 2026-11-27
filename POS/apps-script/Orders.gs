// POS · Orders.gs — purchase orders to suppliers
/* ---------- purchase orders (NEW) ---------- */
function orderCalc_(o, invs, prods) {
  let items = []; try { items = JSON.parse(o.itemsJson || '[]'); } catch (e) { items = []; }
  let notes = {}; try { notes = JSON.parse(o.missingNotes || '{}') || {}; } catch (e) { notes = {}; }
  const skuOf = {}; prods.forEach(function (x) { skuOf[x.id] = String(x.sku || ''); });
  const rows = [], idx = {};
  items.forEach(function (i) {
    const sku = skuOf[i.productId] || '', key = sku ? sku.toLowerCase() : 'id:' + i.productId;
    if (idx[key] === undefined) { idx[key] = rows.length; rows.push({ key: key, productId: i.productId, productName: i.productName, sku: sku, ordered: 0, invoiced: 0 }); }
    rows[idx[key]].ordered = r2_(rows[idx[key]].ordered + Number(i.quantity));
  });
  const linked = invs.filter(function (v) { return v.orderId === o.id; });
  linked.forEach(function (v) {
    let vi = []; try { vi = JSON.parse(v.itemsJson || '[]'); } catch (e) { vi = []; }
    vi.forEach(function (i) {
      const key = String(i.code).toLowerCase();
      if (idx[key] === undefined) { idx[key] = rows.length; rows.push({ key: key, productId: '', productName: i.description || i.code, sku: i.code, ordered: 0, invoiced: 0 }); }
      rows[idx[key]].invoiced = r2_(rows[idx[key]].invoiced + Number(i.quantity));
    });
  });
  let missing = 0, extra = 0;
  rows.forEach(function (r) {
    r.missing = Math.max(0, r2_(r.ordered - r.invoiced)); r.extra = Math.max(0, r2_(r.invoiced - r.ordered)); r.note = notes[r.key] || '';
    missing += r.missing; extra += r.extra;
  });
  let status = o.status;
  if (status === 'Ordered') status = !linked.length ? 'Ordered' : (missing > 0 ? 'Missing items' : 'Complete');
  return { rows: rows, invoices: linked.map(function (v) { return { id: v.id, invoiceNo: v.invoiceNo, date: v.date }; }), missingUnits: r2_(missing), extraUnits: r2_(extra), status: status };
}
function getOrders_() {
  const invs = readAll_('SupplierInvoices'), prods = readAll_('Products');
  return readAll_('Orders').map(function (o) {
    const c = pub_(o), k = orderCalc_(o, invs, prods);
    try { c.items = JSON.parse(o.itemsJson || '[]'); } catch (e) { c.items = []; }
    delete c.itemsJson; delete c.missingNotes;
    c.status = k.status; c.missingUnits = k.missingUnits; c.invoiceNos = k.invoices.map(function (v) { return v.invoiceNo; });
    return c;
  }).reverse();
}
function findOrder_(id) {
  id = str_(id, 40, true, 'Order');
  const r = readAll_('Orders').filter(function (x) { return x.id === id; })[0];
  if (!r) throw UErr('Order not found.');
  return r;
}
function getOrderCheck_(p) {
  const o = findOrder_(p.id), k = orderCalc_(o, readAll_('SupplierInvoices'), readAll_('Products'));
  return { id: o.id, orderNo: o.orderNo, supplier: o.supplier, storedStatus: o.status, status: k.status, rows: k.rows, invoices: k.invoices, missingUnits: k.missingUnits, extraUnits: k.extraUnits };
}
function saveOrderNote_(p) {
  const o = findOrder_(p.id), key = str_(p.key, 80, true, 'Item');
  let notes = {}; try { notes = JSON.parse(o.missingNotes || '{}') || {}; } catch (e) { notes = {}; }
  const note = str_(p.note, 200);
  if (note) notes[key] = note; else delete notes[key];
  setRow_('Orders', o._row, Object.assign({}, o, { missingNotes: JSON.stringify(notes), updatedAt: now_() }));
  return { key: key };
}
// Accept a shortage (Closed) or reopen the order.
function closeOrder_(p) {
  const o = findOrder_(p.id), st = p.reopen ? 'Ordered' : 'Closed';
  if (o.status === 'Cancelled') throw UErr('This order was cancelled.');
  setRow_('Orders', o._row, Object.assign({}, o, { status: st, updatedAt: now_() }));
  return { id: o.id, status: st };
}
function linkInvoiceToOrder_(p) {
  const id = str_(p.invoiceId, 40, true, 'Invoice'), oid = str_(p.orderId, 40);
  const inv = readAll_('SupplierInvoices').filter(function (x) { return x.id === id; })[0];
  if (!inv) throw UErr('Invoice not found.');
  let no = '';
  if (oid) { const o = findOrder_(oid); if (o.status === 'Cancelled') throw UErr('That order was cancelled.'); no = o.orderNo; }
  setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { orderId: oid, orderNo: no, updatedAt: now_() }));
  return { id: id, orderNo: no };
}
function saveOrder_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    if (!Array.isArray(p.items) || !p.items.length) throw UErr('Add at least one item.');
    if (p.items.length > 200) throw UErr('Too many items in one order.');
    let cost = 0, rev = 0;
    const items = p.items.map(function (i) {
      const it = {
        productId: str_(i.productId, 40, true, 'Product'), productName: str_(i.productName, 120),
        quantity: num_(i.quantity, 'Quantity'), realCost: num_(i.realCost || 0, 'Real cost'),
        actualPrice: num_(i.actualPrice, 'Actual price'), sellingPrice: num_(i.sellingPrice || 0, 'Selling price')
      };
      if (it.quantity <= 0) throw UErr('Quantity must be greater than zero.');
      cost += it.actualPrice * it.quantity; rev += it.sellingPrice * it.quantity;
      return it;
    });
    const ts = now_();
    const o = {
      id: uid_('O'), orderNo: 'PO-' + ('0000' + (readAll_('Orders').length + 1)).slice(-4), date: today_(),
      supplier: str_(p.supplier, 100), status: 'Ordered', itemsJson: JSON.stringify(items), totalCost: r2_(cost),
      expectedRevenue: r2_(rev), notes: str_(p.notes, 300), receivedDate: '', createdAt: ts, updatedAt: ts
    };
    appendRow_('Orders', o);
    return { id: o.id, orderNo: o.orderNo };
  } finally { lock.releaseLock(); }
}
function updateOrderStatus_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Order'), status = str_(p.status, 20, true, 'Status');
    if (ORDER_STATUS.indexOf(status) < 0) throw UErr('Invalid status.');
    const r = readAll_('Orders').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Order not found.');
    setRow_('Orders', r._row, Object.assign({}, r, { status: status, receivedDate: status === 'Received' ? today_() : '', updatedAt: now_() }));
    return { id: id, status: status };
  } finally { lock.releaseLock(); }
}
