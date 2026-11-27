// POS · Returns.gs — customer returns sent back to the supplier
/* ---------- returns (NEW) ---------- */
// A customer returns a faulty item -> we give a good one from our stock -> the returned item is kept here
// until it is sent to the company -> the company gives credit (cost deduction on an invoice, or free items).
const RET_TYPES = ['Deduction', 'Free items'];
function getReturns_() {
  return readAll_('Returns').map(function (x) { const o = pub_(x); if (!isAdmin_()) delete o.unitCost; return o; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); });
}
function saveReturn_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const pr = findProduct_(p.productId), q = num_(p.quantity, 'Quantity');
    if (q <= 0) throw UErr('Quantity must be greater than zero.');
    const replaced = p.replaced === true || p.replaced === 'true';
    if (replaced && Number(pr.stock) < q) throw UErr('Not enough stock to give a replacement (available: ' + pr.stock + ').');
    const cid = str_(p.customerId, 40); let cname = '';
    if (cid) {
      const c = readAll_('Customers').filter(function (x) { return x.id === cid; })[0];
      if (!c) throw UErr('Customer not found.');
      cname = c.name;
    }
    const saleInv = str_(p.saleInvoice, 40);
    if (saleInv) {
      let sold = 0, back = 0;
      readAll_('SaleItems').forEach(function (x) { if (x.invoiceId === saleInv && x.productId === pr.id) sold += Number(x.quantity); });
      readAll_('Returns').forEach(function (x) { if (x.saleInvoice === saleInv && x.productId === pr.id) back += Number(x.quantity); });
      if (q + back > sold) throw UErr('Cannot return more than was sold on that invoice (sold ' + sold + ', already returned ' + back + ').');
    }
    const ts = now_();
    const o = {
      id: uid_('R'), date: today_(), customerId: cid, customerName: cname, productId: pr.id, sku: pr.sku, productName: pr.name,
      quantity: q, unitCost: Number(pr.cost) || 0, reason: str_(p.reason, 200), replaced: replaced, status: 'With us', sentDate: '',
      claimRef: '', saleInvoice: saleInv, creditType: '', creditAmount: 0, creditInvoiceNo: '', creditNote: '', creditedDate: '', createdAt: ts, updatedAt: ts
    };
    appendRow_('Returns', o);
    if (replaced) setRow_('Products', pr._row, Object.assign({}, pr, { stock: r2_(Number(pr.stock) - q), updatedAt: ts }));
    return o;
  } finally { lock.releaseLock(); }
}
function retRows_(ids, status) {
  if (!Array.isArray(ids) || !ids.length) throw UErr('Select at least one return.');
  const all = readAll_('Returns'), out = [];
  ids.forEach(function (id) {
    const r = all.filter(function (x) { return x.id === String(id); })[0];
    if (!r) throw UErr('Return not found.');
    if (r.status !== status) throw UErr('Some of the selected returns are not "' + status + '".');
    out.push(r);
  });
  return out;
}
function markReturnsSent_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const rows = retRows_(p.ids, 'With us'), ref = str_(p.claimRef, 60), ts = now_();
    rows.forEach(function (r) { setRow_('Returns', r._row, Object.assign({}, r, { status: 'Sent', sentDate: today_(), claimRef: ref, updatedAt: ts })); });
    return { count: rows.length };
  } finally { lock.releaseLock(); }
}
function creditReturns_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const rows = retRows_(p.ids, 'Sent'), type = str_(p.type, 20, true, 'Type'), note = str_(p.note, 200), ts = now_();
    if (RET_TYPES.indexOf(type) < 0) throw UErr('Choose how the company compensated.');
    let amount = 0, invNo = '', summary = note;
    if (type === 'Deduction') {
      amount = num_(p.amount, 'Credit amount');
      if (amount <= 0) throw UErr('Credit amount must be greater than zero.');
      invNo = str_(p.invoiceNo, 60);
      const invId = str_(p.invoiceId, 40);
      if (invNo || invId) {
        const inv = readAll_('SupplierInvoices').filter(function (x) { return invId ? x.id === invId : String(x.invoiceNo) === invNo; })[0];
        if (!inv) throw UErr('Invoice not found.');
        invNo = inv.invoiceNo;
        const nc = r2_((Number(inv.returnCredit) || 0) + amount);
        if (nc > Number(inv.total)) throw UErr('The credit is more than the invoice total.');
        setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { returnCredit: nc, updatedAt: ts }));
      }
    } else {
      if (!Array.isArray(p.freeItems) || !p.freeItems.length) throw UErr('Add the free items received.');
      const names = [];
      p.freeItems.forEach(function (f) { const q = num_(f.quantity, 'Quantity'); if (q <= 0) throw UErr('Quantity must be greater than zero.'); findProduct_(f.productId); });
      p.freeItems.forEach(function (f) {
        const pr = findProduct_(f.productId), q = num_(f.quantity, 'Quantity');
        setRow_('Products', pr._row, Object.assign({}, pr, { stock: r2_(Number(pr.stock) + q), updatedAt: ts })); // cost is left unchanged
        names.push(pr.name + ' x' + q);
      });
      summary = 'Free: ' + names.join(', ') + (note ? ' | ' + note : '');
    }
    let total = 0; rows.forEach(function (r) { total += Number(r.quantity) * Number(r.unitCost); });
    let left = amount;
    rows.forEach(function (r, i) {
      let share = 0;
      if (type === 'Deduction') {
        share = (i === rows.length - 1) ? r2_(left) : r2_(total > 0 ? amount * (Number(r.quantity) * Number(r.unitCost)) / total : amount / rows.length);
        left = r2_(left - share);
      }
      setRow_('Returns', r._row, Object.assign({}, r, { status: 'Credited', creditType: type, creditAmount: share, creditInvoiceNo: invNo, creditNote: summary, creditedDate: today_(), updatedAt: ts }));
    });
    return { count: rows.length };
  } finally { lock.releaseLock(); }
}
