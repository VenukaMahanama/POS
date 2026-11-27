// POS · Sales.gs — creating, editing, deleting sales; returns inside a sale; discounts
/* ---------- sales ---------- */
function getSales_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10), cid = str_(p.customerId, 40), by = {}, rb = {};
  readAll_('Returns').forEach(function (r) { if (r.resolution) (rb[r.saleInvoice] = rb[r.saleInvoice] || []).push({ productName: r.productName, quantity: r.quantity, resolution: r.resolution, condition: r.condition, value: Number(r.value) || 0, reason: r.reason, status: r.status }); });
  readAll_('SaleItems').forEach(function (i) { (by[i.saleId] = by[i.saleId] || []).push(pub_(i)); });
  return readAll_('Sales').filter(function (s) {
    return (!from || s.date >= from) && (!to || s.date <= to) && (!cid || s.customerId === cid);
  }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); })
    .slice(0, 500).map(function (s) { const o = pub_(s); o.returnDeduction = Number(o.returnDeduction) || 0; o.refund = Number(o.refund) || 0; o.returns = rb[s.invoiceId] || []; o.items = (by[s.id] || []).map(function (i) { if (!isAdmin_()) delete i.unitCost; return i; }); return o; });
}
// A sale can also carry customer returns (p.returns). For each return the customer is either given a replacement item
// (recorded as a zero-price "Replacement" line in the same sale, stock goes down) or the value is deducted from the bill
// (anything beyond the bill is paid back as a cash refund). Faulty returns are kept to be sent to the company; good ones go back to stock.
function createSale_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  const w = { sales: [], items: [], rets: [], stock: [] };
  try {
    const items = Array.isArray(p.items) ? p.items : [], rets = Array.isArray(p.returns) ? p.returns : [];
    if (!items.length && !rets.length) throw UErr('Cart is empty.');
    if (items.length > 200 || rets.length > 100) throw UErr('Too many items in one sale.');
    const byId = {};
    readAll_('Products').forEach(function (x) { if (isAct_(x)) byId[x.id] = x; });
    const cid0 = str_(p.customerId, 40), sp = {};
    if (cid0) readAll_('CustomerPrices').forEach(function (x) { if (x.customerId === cid0) sp[x.productId] = Number(x.price); });
    const need = {}, eligP = {};
    items.forEach(function (i) {
      const id = str_(i.productId, 40, true, 'Product'), q = num_(i.quantity, 'Quantity');
      eligP[id] = eligP[id] || !(i.noDiscount === true || i.noDiscount === 'true'); // a product gets the discount unless every row of it is marked "no discount"
      if (q <= 0) throw UErr('Quantity must be greater than zero.');
      if (!byId[id]) throw UErr('A product in your cart is no longer available.');
      need[id] = r2_((need[id] || 0) + q);
    });
    const rl = [];
    rets.forEach(function (r) {
      const pr = byId[str_(r.productId, 40, true, 'Returned item')];
      if (!pr) throw UErr('A returned item is no longer available.');
      const q = num_(r.quantity, 'Return quantity');
      if (q <= 0) throw UErr('Return quantity must be greater than zero.');
      const res = r.resolution === 'Cash deducted' ? 'Cash deducted' : 'Replacement given', cond = r.condition === 'Good' ? 'Good' : 'Faulty';
      let val = 0;
      if (res === 'Cash deducted') { val = num_(r.value, 'Return value'); if (val <= 0) throw UErr('Enter the value to deduct for ' + pr.name + '.'); }
      rl.push({ pr: pr, q: q, res: res, cond: cond, val: val, reason: str_(r.reason, 200) });
    });
    // net stock change per product: sold and replacement items go out, good returns come back
    const delta = {};
    Object.keys(need).forEach(function (id) { delta[id] = -need[id]; });
    rl.forEach(function (r) {
      if (r.res === 'Replacement given') delta[r.pr.id] = r2_((delta[r.pr.id] || 0) - r.q);
      if (r.cond === 'Good') delta[r.pr.id] = r2_((delta[r.pr.id] || 0) + r.q);
    });
    Object.keys(delta).forEach(function (id) {
      const pr = byId[id];
      if (r2_(Number(pr.stock) + delta[id]) < 0) throw UErr('Not enough stock for ' + pr.name + ' (available: ' + pr.stock + ').');
    });
    let sub = 0; const lines = [];
    Object.keys(need).forEach(function (id) {
      const pr = byId[id], pp = sp[id] !== undefined ? sp[id] : pr.price;
      const lt = r2_(need[id] * pp); sub += lt; lines.push({ pr: pr, q: need[id], lt: lt, price: pp, elig: !!eligP[id] });
    });
    sub = r2_(sub);
    let eligSub = 0; lines.forEach(function (l) { if (l.elig) eligSub += l.lt; }); eligSub = r2_(eligSub);
    const dt = p.discountType === 'percent' ? 'percent' : 'amount', dv = num_(p.discountValue || 0, 'Discount');
    if (dt === 'percent' && dv > 100) throw UErr('Discount cannot exceed 100%.');
    let disc = r2_(dt === 'percent' ? eligSub * dv / 100 : dv);
    if (disc > eligSub) throw UErr(eligSub < sub ? 'Discount cannot exceed the total of the items that get the discount.' : 'Discount cannot exceed the subtotal.');
    const st = getSettings_(), rate = st.taxEnabled === 'true' ? (Number(st.taxRate) || 0) : 0;
    const tax = Math.round((sub - disc) * rate) / 100;
    let ded = 0; rl.forEach(function (r) { if (r.res === 'Cash deducted') ded += r.q * r.val; });
    ded = r2_(ded);
    const net = r2_(sub - disc + tax - ded), total = Math.max(0, net), refund = net < 0 ? r2_(-net) : 0;
    const pay = total > 0 && PAY.indexOf(p.paymentMethod) > -1 ? p.paymentMethod : 'Cash';
    const cid = str_(p.customerId, 40); let cname = '';
    if (cid) {
      const c = readAll_('Customers').filter(function (x) { return x.id === cid; })[0];
      if (!c) throw UErr('Customer not found.');
      cname = c.name;
    }
    let date = today_();
    if (isAdmin_() && p.date) { date = checkDate_(p.date); if (date > today_()) throw UErr('The sale date cannot be in the future.'); }
    const ts = now_();
    let seq = 0;
    readAll_('Sales').forEach(function (s) { if (s.date === date) { const m = /-(\d+)$/.exec(String(s.invoiceId)); seq = Math.max(seq, m ? Number(m[1]) : 0); } });
    const inv = 'INV-' + date.replace(/-/g, '') + '-' + ('000' + (seq + 1)).slice(-4);
    const sid = uid_('S'), repl = rl.filter(function (r) { return r.res === 'Replacement given'; });
    const sale = { id: sid, invoiceId: inv, customerId: cid, customerName: cname, subtotal: sub, discount: disc, tax: tax, total: total, paymentMethod: pay, itemCount: lines.length + repl.length, date: date, createdAt: ts, returnDeduction: ded, refund: refund };
    const out = lines.map(function (l) {
      return {
        id: uid_('I'), saleId: sid, invoiceId: inv, productId: l.pr.id, productName: l.pr.name, sku: l.pr.sku, quantity: l.q,
        unitPrice: l.price, unitCost: l.pr.cost, discount: l.elig && eligSub > 0 ? r2_(disc * l.lt / eligSub) : 0, lineTotal: l.lt, createdAt: ts, kind: 'Sale'
      };
    });
    repl.forEach(function (r) {
      out.push({ id: uid_('I'), saleId: sid, invoiceId: inv, productId: r.pr.id, productName: r.pr.name, sku: r.pr.sku, quantity: r.q, unitPrice: 0, unitCost: r.pr.cost, discount: 0, lineTotal: 0, createdAt: ts, kind: 'Replacement' });
    });
    const retRows = rl.map(function (r) {
      return {
        id: uid_('R'), date: date, customerId: cid, customerName: cname, productId: r.pr.id, sku: r.pr.sku, productName: r.pr.name, quantity: r.q,
        unitCost: Number(r.pr.cost) || 0, reason: r.reason, replaced: r.res === 'Replacement given', status: r.cond === 'Faulty' ? 'With us' : 'Restocked',
        sentDate: '', claimRef: '', saleInvoice: inv, creditType: '', creditAmount: 0, creditInvoiceNo: '', creditNote: '', creditedDate: '',
        createdAt: ts, updatedAt: ts, resolution: r.res, condition: r.cond, value: r.val
      };
    });
    w.sales.push(appendRow_('Sales', sale));
    out.forEach(function (o) { w.items.push(appendRow_('SaleItems', o)); });
    retRows.forEach(function (o) { w.rets.push(appendRow_('Returns', o)); });
    const col = SCHEMAS.Products.indexOf('stock') + 1;
    Object.keys(delta).forEach(function (id) {
      if (!delta[id]) return;
      const pr = byId[id];
      sh_('Products').getRange(pr._row, col).setValue(r2_(Number(pr.stock) + delta[id]));
      w.stock.push({ row: pr._row, col: col, old: pr.stock });
    });
    const res = pub_(sale); res.items = out;
    res.returns = retRows.map(function (r) { return { productName: r.productName, quantity: r.quantity, resolution: r.resolution, condition: r.condition, value: r.value, reason: r.reason, status: r.status }; });
    return res;
  } catch (e) {
    try {
      w.stock.forEach(function (s) { sh_('Products').getRange(s.row, s.col).setValue(s.old); });
      w.rets.reverse().forEach(function (r) { sh_('Returns').deleteRow(r); });
      w.items.reverse().forEach(function (r) { sh_('SaleItems').deleteRow(r); });
      w.sales.forEach(function (r) { sh_('Sales').deleteRow(r); });
    } catch (x) { console.error(x); }
    throw e;
  } finally { lock.releaseLock(); }
}

// Admin only. Deleting a sale puts its stock back: items sold and replacement items given come back, good items that were
// taken back from customers go out again. Faulty returns still "With us" are removed with the sale; unpaid cheque/credit records too.
function deleteSale_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Sale'), reason = str_(p.reason, 200);
    if (!reason) throw UErr('Enter the reason for deleting this sale.');
    const sale = readAll_('Sales').filter(function (x) { return x.id === id; })[0];
    if (!sale) throw UErr('Sale not found.');
    const items = readAll_('SaleItems').filter(function (x) { return x.saleId === id; });
    const rets = readAll_('Returns').filter(function (r) { return r.resolution && r.saleInvoice === sale.invoiceId; });
    if (rets.some(function (r) { return r.status === 'Sent' || r.status === 'Credited'; })) throw UErr('A return on this sale was already sent to the company. Remove that return from the company side first.');
    const pays = readAll_('Payments').filter(function (x) { return x.invoiceId === sale.invoiceId; });
    if (pays.some(payLocked_)) throw UErr('Money was already received on this sale\'s cheque/credit, or a cheque of it was rejected. Remove that first (Cheques & Credits).');
    const delta = {};
    items.forEach(function (i) { delta[i.productId] = r2_((delta[i.productId] || 0) + Number(i.quantity)); });
    rets.forEach(function (r) { if (r.condition === 'Good') delta[r.productId] = r2_((delta[r.productId] || 0) - Number(r.quantity)); });
    const ts = now_(), short = []; let restored = 0;
    readAll_('Products').forEach(function (pr) {
      const d = delta[pr.id]; if (!d) return;
      const old = Number(pr.stock) || 0, ns = r2_(old + d);
      if (ns < 0) short.push(pr.name);
      const fin = Math.max(0, ns);
      setRow_('Products', pr._row, Object.assign({}, pr, { stock: fin, updatedAt: ts }));
      appendRow_('StockAdjustments', { id: uid_('A'), date: today_(), productId: pr.id, sku: pr.sku, productName: pr.name, oldStock: old, newStock: fin, change: r2_(fin - old), type: 'Sale deleted', reason: sale.invoiceId + ': ' + reason, createdBy: who_(), createdAt: ts });
      restored++;
    });
    appendRow_('DeletedSales', { id: uid_('X'), saleId: id, invoiceId: sale.invoiceId, date: sale.date, customerId: sale.customerId || '', customerName: sale.customerName || '', total: Number(sale.total) || 0, paymentMethod: sale.paymentMethod || '', reason: reason, deletedBy: who_(), deletedAt: ts, deletedDate: today_(),
      itemsJson: JSON.stringify(items.map(function (i) { return { productId: i.productId, name: i.productName, qty: Number(i.quantity) || 0, kind: i.kind || 'Sale' }; })) });
    function drop(name, rows) { rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (r) { sh_(name).deleteRow(r); }); }
    drop('Returns', rets); drop('Payments', pays); drop('SaleItems', items); drop('Sales', [sale]);
    return { id: id, restored: restored, short: short };
  } finally { lock.releaseLock(); }
}

// Admin only. Edits a sale in place (same invoice number). The priced lines are replaced by the new ones and stock is balanced
// by the difference. Replacement lines and returns that belong to the sale are kept as they are.
function updateSale_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Sale');
    const sale = readAll_('Sales').filter(function (x) { return x.id === id; })[0];
    if (!sale) throw UErr('Sale not found.');
    const oldItems = readAll_('SaleItems').filter(function (x) { return x.saleId === id; });
    const oldPriced = oldItems.filter(function (i) { return i.kind !== 'Replacement'; }), repl = oldItems.filter(function (i) { return i.kind === 'Replacement'; });
    const rets = readAll_('Returns').filter(function (r) { return r.resolution && r.saleInvoice === sale.invoiceId; });
    const items = Array.isArray(p.items) ? p.items : [];
    if (!items.length && !repl.length && !rets.length) throw UErr('A sale needs at least one item.');
    if (items.length > 200) throw UErr('Too many items in one sale.');
    const prods = {}; readAll_('Products').forEach(function (x) { prods[x.id] = x; });
    const oldQty = {}, oldLine = {};
    oldPriced.forEach(function (i) { oldQty[i.productId] = r2_((oldQty[i.productId] || 0) + Number(i.quantity)); if (!oldLine[i.productId]) oldLine[i.productId] = i; });
    const cid = str_(p.customerId, 40); let cname = '';
    if (cid) { const c = readAll_('Customers').filter(function (x) { return x.id === cid; })[0]; if (!c) throw UErr('Customer not found.'); cname = c.name; }
    const sp = {}; if (cid) readAll_('CustomerPrices').forEach(function (x) { if (x.customerId === cid) sp[x.productId] = Number(x.price); });
    const lines = [], newQty = {};
    let sub = 0;
    items.forEach(function (i) {
      const pid = str_(i.productId, 40, true, 'Product'), pr = prods[pid];
      if (!pr || (!isAct_(pr) && !oldQty[pid])) throw UErr('A product on this sale is no longer available.');
      const q = num_(i.quantity, 'Quantity'); if (q <= 0) throw UErr('Quantity must be greater than zero.');
      const price = (i.price === undefined || i.price === '' || i.price === null) ? (oldLine[pid] ? Number(oldLine[pid].unitPrice) : (sp[pid] !== undefined ? sp[pid] : Number(pr.price))) : num_(i.price, 'Price');
      const lt = r2_(q * price); sub += lt;
      lines.push({ pr: pr, q: q, price: price, lt: lt, cost: oldLine[pid] ? Number(oldLine[pid].unitCost) : Number(pr.cost), elig: !(i.noDiscount === true || i.noDiscount === 'true') });
      newQty[pid] = r2_((newQty[pid] || 0) + q);
    });
    sub = r2_(sub);
    const delta = {};
    Object.keys(oldQty).forEach(function (k) { delta[k] = r2_((delta[k] || 0) + oldQty[k]); });
    Object.keys(newQty).forEach(function (k) { delta[k] = r2_((delta[k] || 0) - newQty[k]); });
    Object.keys(delta).forEach(function (k) {
      const pr = prods[k];
      if (pr && r2_(Number(pr.stock) + delta[k]) < 0) throw UErr('Not enough stock for ' + pr.name + ' (available: ' + r2_(Number(pr.stock) + (oldQty[k] || 0)) + ').');
    });
    let eligSub = 0; lines.forEach(function (l) { if (l.elig) eligSub += l.lt; }); eligSub = r2_(eligSub);
    const dt = p.discountType === 'percent' ? 'percent' : 'amount', dv = num_(p.discountValue || 0, 'Discount');
    if (dt === 'percent' && dv > 100) throw UErr('Discount cannot exceed 100%.');
    const disc = r2_(dt === 'percent' ? eligSub * dv / 100 : dv);
    if (disc > eligSub) throw UErr(eligSub < sub ? 'Discount cannot exceed the total of the items that get the discount.' : 'Discount cannot exceed the subtotal.');
    const st = getSettings_(), rate = st.taxEnabled === 'true' ? (Number(st.taxRate) || 0) : 0, tax = Math.round((sub - disc) * rate) / 100;
    const ded = Number(sale.returnDeduction) || 0, net = r2_(sub - disc + tax - ded), total = Math.max(0, net), refund = net < 0 ? r2_(-net) : 0;
    const pay = total > 0 ? (PAY.indexOf(p.paymentMethod) > -1 ? p.paymentMethod : sale.paymentMethod) : 'Cash';
    let date = sale.date;
    if (p.date) { date = checkDate_(p.date); if (date > today_()) throw UErr('The sale date cannot be in the future.'); }
    // cheque / credit record that goes with the sale
    const eps = readAll_('Payments').filter(function (x) { return x.invoiceId === sale.invoiceId; });
    const changed = pay !== sale.paymentMethod || Math.abs(total - Number(sale.total)) > 0.004;
    if (changed && eps.some(payLocked_)) throw UErr('Money was already received on this sale\'s cheque/credit, or a cheque of it was rejected. Remove that first (Cheques & Credits), then edit the sale.');
    const newType = total > 0 && (pay === 'Credit' || pay === 'Cheque') ? pay : '';
    const same = newType ? eps.filter(function (x) { return x.type === newType; })[0] : null;
    // split cheques: the bill is paid with several cheques, each one is its own record
    const chqList = chequeList_(newType === 'Cheque' && Array.isArray(p.cheques) && p.cheques.length ? p.cheques : null, total), chq = chqList.length > 0;
    if (chq && eps.some(payLocked_)) throw UErr('Money was already received on this sale\'s cheque/credit, or a cheque of it was rejected. Remove that first (Cheques & Credits), then edit the sale.');
    const oldChq = eps.filter(function (x) { return x.type === 'Cheque'; });
    if (!chq && newType === 'Cheque' && oldChq.length > 1 && changed) throw UErr('This sale was paid with several cheques. Enter the cheques again so they add up to the new total.');
    let payDate = '';
    if (newType && !chq) {
      if (p.payDate) payDate = checkDate_(p.payDate); else if (!same) throw UErr('Enter the ' + (newType === 'Cheque' ? 'banking' : 'due') + ' date.');
    }
    // ---- everything is valid: write ----
    const ts = now_();
    const dropRows = function (name, rows) { rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (r) { sh_(name).deleteRow(r); }); };
    dropRows('SaleItems', oldPriced);
    const out = lines.map(function (l) {
      return { id: uid_('I'), saleId: id, invoiceId: sale.invoiceId, productId: l.pr.id, productName: l.pr.name, sku: l.pr.sku, quantity: l.q, unitPrice: l.price, unitCost: l.cost, discount: l.elig && eligSub > 0 ? r2_(disc * l.lt / eligSub) : 0, lineTotal: l.lt, createdAt: ts, kind: 'Sale' };
    });
    out.forEach(function (o) { appendRow_('SaleItems', o); });
    const fresh = readAll_('Sales').filter(function (x) { return x.id === id; })[0];
    setRow_('Sales', fresh._row, Object.assign({}, fresh, { customerId: cid, customerName: cname, date: date, subtotal: sub, discount: disc, tax: tax, total: total, paymentMethod: pay, itemCount: out.length + repl.length, returnDeduction: ded, refund: refund, editedAt: ts, editedBy: who_() }));
    if (cid !== (sale.customerId || '')) {
      rets.forEach(function (r) { const cur = readAll_('Returns').filter(function (x) { return x.id === r.id; })[0]; if (cur) setRow_('Returns', cur._row, Object.assign({}, cur, { customerId: cid, customerName: cname, updatedAt: ts })); });
    }
    Object.keys(delta).forEach(function (k) {
      if (!delta[k]) return;
      const pr = readAll_('Products').filter(function (x) { return x.id === k; })[0]; if (!pr) return;
      const old = Number(pr.stock) || 0, ns = Math.max(0, r2_(old + delta[k]));
      setRow_('Products', pr._row, Object.assign({}, pr, { stock: ns, updatedAt: ts }));
      appendRow_('StockAdjustments', { id: uid_('A'), date: today_(), productId: pr.id, sku: pr.sku, productName: pr.name, oldStock: old, newStock: ns, change: r2_(ns - old), type: 'Other', reason: 'Sale ' + sale.invoiceId + ' edited', createdBy: who_(), createdAt: ts });
    });
    const eps2 = readAll_('Payments').filter(function (x) { return x.invoiceId === sale.invoiceId; });
    if (chq) {
      dropRows('Payments', eps2);
      chqList.forEach(function (c, n) { appendRow_('Payments', chequeRow_(c, n, chqList.length, { invoiceId: sale.invoiceId, saleId: id, customerId: cid, customerName: cname, billDate: date }, ts)); });
    } else if (newType === 'Cheque' && eps2.filter(function (x) { return x.type === 'Cheque'; }).length > 1) {
      dropRows('Payments', eps2.filter(function (x) { return x.type !== 'Cheque'; }));
      eps2.filter(function (x) { return x.type === 'Cheque'; }).forEach(function (x) {
        const cur = readAll_('Payments').filter(function (z) { return z.id === x.id; })[0];
        if (cur) setRow_('Payments', cur._row, Object.assign({}, cur, { customerId: cid, customerName: cname, updatedAt: ts }));
      });
    } else if (newType) {
      const keep = eps2.filter(function (x) { return x.type === newType; })[0];
      dropRows('Payments', eps2.filter(function (x) { return x !== keep && x.id !== (keep && keep.id); }));
      if (keep) {
        const cur = readAll_('Payments').filter(function (x) { return x.id === keep.id; })[0];
        setRow_('Payments', cur._row, Object.assign({}, cur, { amount: total, customerId: cid, customerName: cname, date: payDate || cur.date, chequeNo: p.chequeNo !== undefined ? str_(p.chequeNo, 40) : cur.chequeNo, bank: p.bank !== undefined ? str_(p.bank, 60) : cur.bank, updatedAt: ts }));
      } else {
        appendRow_('Payments', { id: uid_('Y'), type: newType, invoiceId: sale.invoiceId, saleId: id, customerId: cid, customerName: cname, amount: total, date: payDate, chequeNo: str_(p.chequeNo, 40), bank: str_(p.bank, 60), status: 'Unpaid', paidDate: '', createdAt: ts, updatedAt: ts });
      }
    } else {
      dropRows('Payments', eps2);
    }
    return { id: id, invoiceId: sale.invoiceId, total: total, refund: refund };
  } finally { lock.releaseLock(); }
}
