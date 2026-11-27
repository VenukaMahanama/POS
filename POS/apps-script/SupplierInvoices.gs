// POS · SupplierInvoices.gs — supplier invoices (import, receive stock, dates) and supplier payments
/* ---------- supplier invoices (NEW) ---------- */
function getSupplierInvoices_() {
  return readAll_('SupplierInvoices').map(function (o) {
    const c = pub_(o);
    try { c.items = JSON.parse(o.itemsJson || '[]'); } catch (e) { c.items = []; }
    delete c.itemsJson;
    c.returnCredit = Number(o.returnCredit) || 0;
    c.paidAmount = Number(o.paidAmount) || 0;
    c.netDue = r2_(Number(o.total) - c.returnCredit);
    c.balance = Math.max(0, r2_(c.netDue - c.paidAmount));
    c.payStatus = c.balance <= 0.004 ? 'Paid' : (c.paidAmount > 0 ? 'Partly paid' : 'Unpaid');
    return c;
  }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); });
}
function sameInv_(x, no, so, tm) {
  if (so && tm && String(x.soNo) === so && String(x.postingTime) === tm) return true;
  return String(x.invoiceNo) === no && (!x.soNo || !so || String(x.soNo) === so) && (!x.postingTime || !tm || String(x.postingTime) === tm);
}
function saveSupplierInvoice_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const no = str_(p.invoiceNo, 60, true, 'Invoice number'), so = str_(p.soNo, 40), tm = str_(p.postingTime, 20);
    // The same invoice number can be printed on several invoices, so SO no. + time also tell them apart.
    if (readAll_('SupplierInvoices').some(function (x) { return sameInv_(x, no, so, tm); })) throw UErr('Invoice ' + no + (so ? ' (SO ' + so + (tm ? ', ' + tm : '') + ')' : '') + ' is already saved.');
    if (!Array.isArray(p.items) || !p.items.length) throw UErr('Add at least one item.');
    if (p.items.length > 300) throw UErr('Too many items on one invoice.');
    let sub = 0, dis = 0;
    const items = p.items.map(function (i) {
      const q = num_(i.qty, 'Quantity'), dp = num_(i.disc || 0, 'Discount', 0, 100), amt = num_(i.amount, 'Amount');
      if (q <= 0) throw UErr('Quantity must be greater than zero.');
      sub += amt; dis += amt * dp / 100;
      return {
        code: str_(i.code, 60, true, 'Item code'), description: str_(i.description, 200), quantity: q, uom: str_(i.uom, 20),
        unitPrice: num_(i.unitPrice, 'Unit price'), discPct: dp, amount: amt, netUnitCost: r2_(amt * (1 - dp / 100) / q), free: i.free === true || i.free === 'true'
      };
    });
    const subtotal = Number(p.subtotal) > 0 ? num_(p.subtotal, 'Subtotal') : r2_(sub);
    const discount = Number(p.discount) > 0 ? num_(p.discount, 'Discount') : r2_(dis);
    const total = Number(p.total) > 0 ? num_(p.total, 'Total') : r2_(subtotal - discount);
    const ts = now_();
    const o = {
      id: uid_('V'), invoiceNo: no, date: checkDate_(p.date), supplier: str_(p.supplier, 100), customerName: str_(p.customerName, 100),
      payMethod: str_(p.payMethod, 40), subtotal: subtotal, discount: discount, total: total, itemsJson: JSON.stringify(items),
      status: 'Pending', receivedDate: '', notes: str_(p.notes, 300), createdAt: ts, updatedAt: ts, returnCredit: 0, paidAmount: 0, orderId: '', orderNo: '',
      taxInvoiceNo: str_(p.taxInvoiceNo, 60), soNo: str_(p.soNo, 40), poNo: str_(p.poNo, 60), postingTime: str_(p.postingTime, 20), place: str_(p.place, 60),
      vatAmount: Number(p.vat) > 0 ? num_(p.vat, 'VAT') : 0, salesperson: str_(p.salesperson, 60)
    };
    appendRow_('SupplierInvoices', o);
    // Every item on the invoice must exist in Products. Missing ones are added now with stock 0; stock comes in when the invoice is received.
    const have = {}; readAll_('Products').forEach(function (x) { if (isAct_(x)) have[String(x.sku).toLowerCase()] = 1; });
    let created = 0;
    items.forEach(function (i) {
      const k = String(i.code).toLowerCase();
      if (have[k]) return;
      have[k] = 1;
      appendRow_('Products', {
        id: uid_('P'), sku: str_(i.code, 40), barcode: '', name: str_(String(i.description || '').replace(/\s*\(FREE\)$/, ''), 120) || str_(i.code, 40), categoryId: '', categoryName: '',
        price: r2_(i.unitPrice), cost: i.free ? 0 : r2_(i.netUnitCost), stock: 0, lowStockLimit: 5, imageUrl: '', active: true, createdAt: ts, updatedAt: ts
      });
      created++;
    });
    return { id: o.id, invoiceNo: no, created: created };
  } finally { lock.releaseLock(); }
}
// Adds the invoice quantities to stock. Matches products by SKU (= invoice item code); unknown codes become new products.
function receiveSupplierInvoice_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Invoice');
    const inv = readAll_('SupplierInvoices').filter(function (x) { return x.id === id; })[0];
    if (!inv) throw UErr('Invoice not found.');
    if (inv.status === 'Received') throw UErr('This invoice was already received into stock.');
    let items = [];
    try { items = JSON.parse(inv.itemsJson || '[]'); } catch (e) { items = []; }
    if (!items.length) throw UErr('This invoice has no items.');
    let recvDate = today_();
    if (p.receivedDate) { recvDate = checkDate_(p.receivedDate); if (recvDate > today_()) throw UErr('The received date cannot be in the future.'); }
    const prices = (p.prices && typeof p.prices === 'object') ? p.prices : {};
    const grp = {}, order = [];
    items.forEach(function (i) {
      const k = String(i.code).toLowerCase();
      if (!grp[k]) { grp[k] = { code: i.code, description: i.description, qty: 0, net: 0, unitPrice: 0 }; order.push(k); }
      grp[k].qty = r2_(grp[k].qty + Number(i.quantity));
      grp[k].unitPrice = Number(i.unitPrice) || 0;
      grp[k].net += Number(i.amount) * (1 - (Number(i.discPct) || 0) / 100);
    });
    const bySku = {};
    readAll_('Products').filter(isAct_).forEach(function (x) { const k = String(x.sku).toLowerCase(); if (k && !bySku[k]) bySku[k] = x; });
    const upd = p.updatePrices === true || p.updatePrices === 'true';
    let updated = 0, created = 0;
    const ts = now_();
    order.forEach(function (k) {
      const g = grp[k], cost = r2_(g.net / g.qty), pr = bySku[k];
      if (pr) {
        setRow_('Products', pr._row, Object.assign({}, pr, { stock: r2_(Number(pr.stock) + g.qty), cost: cost, price: upd ? r2_(g.unitPrice) : pr.price, updatedAt: ts }));
        updated++;
      } else {
        let price = prices[g.code] === undefined ? g.unitPrice : Number(prices[g.code]); if (!isFinite(price) || price < 0) price = 0;
        appendRow_('Products', {
          id: uid_('P'), sku: str_(g.code, 40), barcode: '', name: str_(g.description, 120) || str_(g.code, 40), categoryId: '', categoryName: '',
          price: r2_(price), cost: cost, stock: g.qty, lowStockLimit: 5, imageUrl: '', active: true, createdAt: ts, updatedAt: ts
        });
        created++;
      }
    });
    setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { status: 'Received', receivedDate: recvDate, updatedAt: ts }));
    return { id: id, updated: updated, created: created };
  } finally { lock.releaseLock(); }
}
// Admin: change the invoice date, and (for an invoice whose stock was received) the received date. Stock and money are not touched.
function setInvoiceDates_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Invoice');
    const inv = readAll_('SupplierInvoices').filter(function (x) { return x.id === id; })[0];
    if (!inv) throw UErr('Invoice not found.');
    const d = checkDate_(p.date); if (d > today_()) throw UErr('The invoice date cannot be in the future.');
    let rd = inv.receivedDate || '';
    if (inv.status === 'Received') { rd = checkDate_(p.receivedDate || inv.receivedDate || d); if (rd > today_()) throw UErr('The received date cannot be in the future.'); }
    setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { date: d, receivedDate: rd, updatedAt: now_() }));
    return { id: id, date: d, receivedDate: rd };
  } finally { lock.releaseLock(); }
}
// Deleting an invoice never deletes products. If its stock was already received, that quantity is taken back out of stock.
function deleteSupplierInvoice_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Invoice');
    const r = readAll_('SupplierInvoices').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Invoice not found.');
    if (Number(r.paidAmount) > 0) throw UErr('This invoice has payments recorded. Undo the payments first.');
    if (Number(r.returnCredit) > 0) throw UErr('A return credit was applied to this invoice, so it cannot be deleted.');
    let deducted = 0; const short = [];
    if (r.status === 'Received') {
      let items = []; try { items = JSON.parse(r.itemsJson || '[]'); } catch (e) { items = []; }
      const grp = {}; items.forEach(function (i) { const k = String(i.code).toLowerCase(); grp[k] = r2_((grp[k] || 0) + Number(i.quantity)); });
      const ts = now_();
      readAll_('Products').filter(isAct_).forEach(function (pr) {
        const k = String(pr.sku).toLowerCase(), q = grp[k];
        if (!q) return;
        const old = Number(pr.stock) || 0, ns = Math.max(0, r2_(old - q));
        if (old < q) short.push(pr.name);
        setRow_('Products', pr._row, Object.assign({}, pr, { stock: ns, updatedAt: ts }));
        appendRow_('StockAdjustments', { id: uid_('A'), date: today_(), productId: pr.id, sku: pr.sku, productName: pr.name, oldStock: old, newStock: ns, change: r2_(ns - old), type: 'Other', reason: 'Invoice ' + r.invoiceNo + ' deleted', createdBy: who_(), createdAt: ts });
        deducted++; delete grp[k];
      });
    }
    sh_('SupplierInvoices').deleteRow(r._row);
    return { id: id, deducted: deducted, short: short };
  } finally { lock.releaseLock(); }
}

/* ---------- supplier payments (NEW) ---------- */
const SUP_METHODS = ['Cheque', 'Bank Transfer'];
function paySupplierInvoice_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Invoice');
    const inv = readAll_('SupplierInvoices').filter(function (x) { return x.id === id; })[0];
    if (!inv) throw UErr('Invoice not found.');
    const method = str_(p.method, 20, true, 'Payment method');
    if (SUP_METHODS.indexOf(method) < 0) throw UErr('Pay by Cheque or Bank Transfer.');
    const amt = num_(p.amount, 'Amount');
    if (amt <= 0) throw UErr('Amount must be greater than zero.');
    const paid = Number(inv.paidAmount) || 0, net = r2_(Number(inv.total) - (Number(inv.returnCredit) || 0)), bal = r2_(net - paid);
    if (amt > bal + 0.005) throw UErr('The amount is more than the balance owed (' + bal + ').');
    const ts = now_();
    const o = { id: uid_('Q'), invoiceId: inv.id, invoiceNo: inv.invoiceNo, date: p.date ? checkDate_(p.date) : today_(), method: method, amount: amt, note: str_(p.note, 200), createdBy: who_(), createdAt: ts };
    appendRow_('SupplierPayments', o);
    setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { paidAmount: r2_(paid + amt), updatedAt: ts }));
    return o;
  } finally { lock.releaseLock(); }
}
function getSupplierPayments_(p) {
  const iid = str_(p.invoiceId, 40);
  return readAll_('SupplierPayments').filter(function (x) { return !iid || x.invoiceId === iid; }).map(pub_)
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); });
}
function deleteSupplierPayment_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Payment');
    const pay = readAll_('SupplierPayments').filter(function (x) { return x.id === id; })[0];
    if (!pay) throw UErr('Payment not found.');
    const inv = readAll_('SupplierInvoices').filter(function (x) { return x.id === pay.invoiceId; })[0];
    if (inv) setRow_('SupplierInvoices', inv._row, Object.assign({}, inv, { paidAmount: Math.max(0, r2_((Number(inv.paidAmount) || 0) - Number(pay.amount))), updatedAt: now_() }));
    sh_('SupplierPayments').deleteRow(pay._row);
    return { id: id };
  } finally { lock.releaseLock(); }
}
