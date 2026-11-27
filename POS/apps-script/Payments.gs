// POS · Payments.gs — cheques and credits, receiving payments, rejected cheques
/* ---------- cheques & credits (NEW) ---------- */
// A cheque or credit bill. paidAmount is how much has been received so far (credit bills can be paid in parts).
function payPaid_(x) { const v = Number(x.paidAmount); if (x.paidAmount !== '' && x.paidAmount !== undefined && isFinite(v)) return v; return x.status === 'Paid' ? (Number(x.amount) || 0) : 0; }
function payNorm_(x) {
  const o = pub_(x), amt = Number(x.amount) || 0, paid = Math.min(amt, payPaid_(x));
  o.amount = amt; o.paidAmount = r2_(paid); o.remaining = Math.max(0, r2_(amt - paid));
  o.status = o.remaining <= 0.004 ? 'Paid' : (paid > 0 ? 'Partly paid' : 'Unpaid');
  o.rejected = !!x.rejectedDate; o.rejectedDate = x.rejectedDate || ''; o.rejectNote = x.rejectNote || '';
  if (o.rejected && o.remaining > 0.004) o.status = 'Rejected'; // a bounced cheque is owed again until the customer pays
  o.billDate = x.billDate || String(x.createdAt || '').slice(0, 10); o.source = x.source || 'Sale'; o.note = x.note || '';
  return o;
}
function setPaid_(row, paid, date) {
  const amt = Number(row.amount) || 0, rem = r2_(amt - paid), st = rem <= 0.004 ? 'Paid' : (paid > 0 ? 'Partly paid' : 'Unpaid');
  setRow_('Payments', row._row, Object.assign({}, row, { paidAmount: r2_(paid), status: st, paidDate: st === 'Paid' ? (date || today_()) : '', updatedAt: now_() }));
}
function payRank_(x) { return x.status === 'Rejected' ? 0 : (x.status === 'Paid' ? 2 : 1); } // rejected first, paid last
function payLocked_(x) { return payPaid_(x) > 0 || !!x.rejectedDate; }
function getPayments_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10), st = str_(p.status, 12), ty = str_(p.type, 10), cu = str_(p.customerId, 40);
  return readAll_('Payments').map(payNorm_).filter(function (x) {
    return (!cu || x.customerId === cu) && (x.status === 'Rejected' || ((!from || x.date >= from) && (!to || x.date <= to))) && (!ty || x.type === ty) &&
      (!st || (st === 'Outstanding' ? x.status !== 'Paid' : x.status === st));
  }).sort(function (a, b) {
    return payRank_(a) - payRank_(b) || (payRank_(a) === 2 ? String(b.paidDate).localeCompare(String(a.paidDate)) : String(a.date).localeCompare(String(b.date)));
  });
}
/* validates a list of cheques {amount, date, chequeNo, bank} that must add up to the bill total; returns [] when no list was given (REV 4) */
function chequeList_(list, total) {
  if (!list) return [];
  if (list.length > 20) throw UErr('Too many cheques.');
  const out = []; let sum = 0;
  list.forEach(function (c, n) {
    const a = num_(c.amount, 'Cheque amount'), w = list.length > 1 ? 'cheque ' + (n + 1) : 'the cheque';
    if (a <= 0) throw UErr('Enter an amount for ' + w + '.');
    if (!c.date) throw UErr('Enter the banking date for ' + w + '.');
    out.push({ amount: a, date: checkDate_(c.date), chequeNo: str_(c.chequeNo, 40), bank: str_(c.bank, 60) }); sum += a;
  });
  if (Math.abs(sum - Number(total)) > 0.01) throw UErr('The cheque amounts (' + r2_(sum) + ') must add up to the bill total (' + r2_(Number(total)) + ').');
  return out;
}
function chequeRow_(c, n, count, base, ts) {
  return { id: uid_('Y'), type: 'Cheque', invoiceId: base.invoiceId, saleId: base.saleId || '', customerId: base.customerId || '', customerName: base.customerName || '', amount: c.amount, date: c.date,
    chequeNo: c.chequeNo, bank: c.bank, status: 'Unpaid', paidDate: '', createdAt: ts, updatedAt: ts, paidAmount: 0, billDate: base.billDate, source: 'Sale', note: count > 1 ? 'Cheque ' + (n + 1) + ' of ' + count : '' };
}
function savePayment_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const type = str_(p.type, 10, true, 'Type');
    if (PAY_TYPES.indexOf(type) < 0) throw UErr('Type must be Cheque or Credit.');
    const inv = str_(p.invoiceId, 40), several = type === 'Cheque' && Array.isArray(p.cheques) && p.cheques.length > 0;
    if (inv) { // avoid duplicates if the browser retries
      const dups = readAll_('Payments').filter(function (x) { return x.invoiceId === inv && x.type === type; });
      if (dups.length) return several ? dups.map(payNorm_) : payNorm_(dups[0]);
    }
    const sale = readAll_('Sales').filter(function (s) { return (p.saleId && s.id === p.saleId) || (inv && s.invoiceId === inv); })[0];
    const ts = now_();
    if (several) { // one record per cheque; together they must equal the bill
      const list = chequeList_(p.cheques, sale ? sale.total : p.cheques.reduce(function (a, c) { return a + (Number(c.amount) || 0); }, 0));
      const base = { invoiceId: inv, saleId: str_(p.saleId, 40), customerId: str_(p.customerId, 40), customerName: str_(p.customerName, 100), billDate: sale ? sale.date : today_() };
      const rows = list.map(function (c, n) { return chequeRow_(c, n, list.length, base, ts); });
      rows.forEach(function (r) { appendRow_('Payments', r); });
      return rows.map(payNorm_);
    }
    const o = {
      id: uid_('Y'), type: type, invoiceId: inv, saleId: str_(p.saleId, 40), customerId: str_(p.customerId, 40),
      customerName: str_(p.customerName, 100), amount: num_(p.amount, 'Amount'), date: checkDate_(p.date),
      chequeNo: str_(p.chequeNo, 40), bank: str_(p.bank, 60), status: 'Unpaid', paidDate: '', createdAt: ts, updatedAt: ts,
      paidAmount: 0, billDate: sale ? sale.date : today_(), source: 'Sale', note: ''
    };
    appendRow_('Payments', o);
    return payNorm_(o);
  } finally { lock.releaseLock(); }
}
// A cheque bounced (REV 4). It goes back to being owed (status "Rejected", shown red) until the customer pays it by cash / bank transfer / a new cheque (receiveCollection).
// Anyone can record a rejection; only the Admin can undo one. reject:false undoes it (only while nothing was received on it).
function rejectCheque_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Cheque');
    const r = readAll_('Payments').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Cheque not found.');
    if (r.type !== 'Cheque') throw UErr('Only a cheque can be marked as rejected.');
    const ts = now_();
    if (p.reject === false || p.reject === 'false') {
      if (!isAdmin_()) throw UErr('Only the Admin can undo a rejection.');
      if (!r.rejectedDate) throw UErr('This cheque is not marked as rejected.');
      if (readAll_('Receipts').some(function (x) { return x.paymentId === r.id; })) throw UErr('Money was already received on this rejected cheque. Remove those payments first, then undo the rejection.');
      setRow_('Payments', r._row, Object.assign({}, r, { rejectedDate: '', rejectNote: '', paidAmount: 0, status: 'Unpaid', paidDate: '', updatedAt: ts }));
      return payNorm_(readAll_('Payments').filter(function (x) { return x.id === id; })[0]);
    }
    if (r.rejectedDate) throw UErr('This cheque is already marked as rejected.');
    let date = today_();
    if (isAdmin_() && p.date) { date = checkDate_(p.date); if (date > today_()) throw UErr('The date cannot be in the future.'); }
    // a cheque that was ticked as banked goes back to "not received"
    setRow_('Payments', r._row, Object.assign({}, r, { rejectedDate: date, rejectNote: str_(p.note, 200), paidAmount: 0, status: 'Unpaid', paidDate: '', updatedAt: ts }));
    return payNorm_(readAll_('Payments').filter(function (x) { return x.id === id; })[0]);
  } finally { lock.releaseLock(); }
}
// Cheques: tick = banked / paid. Credit bills: tick = everything still owed was received (a cash receipt is recorded); untick removes the receipts.
function markPayment_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Payment');
    const r = readAll_('Payments').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Record not found.');
    if (r.type === 'Cheque' && r.rejectedDate) throw UErr('This cheque was rejected. Receive the money from the customer instead (or undo the rejection).');
    const paid = p.paid === true || p.paid === 'true', amt = Number(r.amount) || 0;
    if (r.type === 'Cheque') setPaid_(r, paid ? amt : 0, today_());
    else if (paid) {
      const rem = r2_(amt - payPaid_(r));
      if (rem > 0.004) appendRow_('Receipts', { id: uid_('M'), paymentId: r.id, invoiceId: r.invoiceId, customerId: r.customerId, customerName: r.customerName, date: today_(), amount: rem, method: 'Cash', chequeNo: '', bank: '', note: 'Marked as paid', createdBy: who_(), createdAt: now_() });
      setPaid_(r, amt, today_());
    } else {
      readAll_('Receipts').filter(function (x) { return x.paymentId === r.id; }).map(function (x) { return x._row; }).sort(function (a, b) { return b - a; }).forEach(function (row) { sh_('Receipts').deleteRow(row); });
      setPaid_(r, 0, '');
    }
    return payNorm_(readAll_('Payments').filter(function (x) { return x.id === id; })[0]);
  } finally { lock.releaseLock(); }
}
const COLLECT_METHODS = ['Cash', 'Cheque', 'Bank Transfer'];
// Money received from a customer against credit bills. With paymentId it goes to that bill; without it the oldest bills are paid first.
function receiveCollection_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const amount = num_(p.amount, 'Amount');
    if (amount <= 0) throw UErr('Amount must be greater than zero.');
    const method = str_(p.method, 20, true, 'Payment method');
    if (COLLECT_METHODS.indexOf(method) < 0) throw UErr('Choose Cash, Cheque or Bank Transfer.');
    let date = today_();
    if (isAdmin_() && p.date) { date = checkDate_(p.date); if (date > today_()) throw UErr('The date cannot be in the future.'); }
    let chequeDate = ''; // paying by cheque: the cheque's banking date (any date, a post-dated cheque is normal)
    if (method === 'Cheque') { if (!p.chequeDate) throw UErr('Enter the cheque banking date.'); chequeDate = checkDate_(p.chequeDate); }
    const all = readAll_('Payments').filter(function (x) { return x.type === 'Credit' || (x.type === 'Cheque' && x.rejectedDate); });
    let targets = [];
    if (p.paymentId) {
      const id = str_(p.paymentId, 40), t = all.filter(function (x) { return x.id === id; })[0];
      if (!t) throw UErr('Credit bill or rejected cheque not found.');
      const rem = payNorm_(t).remaining;
      if (rem <= 0.004) throw UErr('This bill is already fully paid.');
      if (amount > rem + 0.005) throw UErr('The amount is more than the balance of this bill (' + rem + ').');
      targets = [{ row: t, amt: amount }];
    } else {
      const cid = str_(p.customerId, 40, true, 'Customer');
      const open = all.filter(function (x) { return x.customerId === cid && payNorm_(x).remaining > 0.004; })
        .sort(function (a, b) { return (b.rejectedDate ? 1 : 0) - (a.rejectedDate ? 1 : 0) || String(payNorm_(a).billDate).localeCompare(String(payNorm_(b).billDate)) || String(a.date).localeCompare(String(b.date)); });
      if (!open.length) throw UErr('This customer has no unpaid credit bills or rejected cheques.');
      const owed = r2_(open.reduce(function (s, x) { return s + payNorm_(x).remaining; }, 0));
      if (amount > owed + 0.005) throw UErr('The amount is more than the total owed (' + owed + ').');
      let left = amount;
      open.forEach(function (x) { if (left <= 0.004) return; const a = Math.min(left, payNorm_(x).remaining); targets.push({ row: x, amt: r2_(a) }); left = r2_(left - a); });
    }
    const ts = now_(), applied = [], rids = [], rnote = str_((p.note ? str_(p.note, 150) + ' · ' : '') + (method === 'Cheque' ? 'Cheque, banking ' + chequeDate : ''), 200);
    targets.forEach(function (t) {
      const n = payNorm_(t.row), paid = r2_(n.paidAmount + t.amt), rid = uid_('M');
      rids.push(rid);
      appendRow_('Receipts', { id: rid, paymentId: t.row.id, invoiceId: t.row.invoiceId, customerId: t.row.customerId, customerName: t.row.customerName, date: date, amount: t.amt, method: method, chequeNo: '', bank: '', note: rnote, createdBy: who_(), createdAt: ts });
      setPaid_(t.row, paid, date);
      applied.push({ paymentId: t.row.id, invoiceId: t.row.invoiceId, billDate: n.billDate, amount: t.amt, remaining: r2_(n.amount - paid) });
    });
    if (method === 'Cheque') { // the cheque itself now shows in Cheques & Credits until it is banked
      const refs = []; targets.forEach(function (t) { if (refs.indexOf(t.row.invoiceId) < 0) refs.push(t.row.invoiceId); });
      appendRow_('Payments', { id: uid_('Y'), type: 'Cheque', invoiceId: 'CHQ-' + refs[0] + (refs.length > 1 ? ' +' + (refs.length - 1) : ''), saleId: '', customerId: targets[0].row.customerId, customerName: targets[0].row.customerName,
        amount: r2_(amount), date: chequeDate, chequeNo: '', bank: '', status: 'Unpaid', paidDate: '', createdAt: ts, updatedAt: ts, paidAmount: 0, billDate: date, source: 'Collection',
        note: 'Cheque received for ' + refs.join(', '), rejectedDate: '', rejectNote: '', receiptId: rids.join(',') });
    }
    return { total: r2_(amount), date: date, method: method, chequeDate: chequeDate, customerId: targets[0].row.customerId, customerName: targets[0].row.customerName, applied: applied };
  } finally { lock.releaseLock(); }
}
function getReceipts_(p) {
  const pid = str_(p.paymentId, 40), cid = str_(p.customerId, 40), from = str_(p.from, 10), to = str_(p.to, 10);
  return readAll_('Receipts').filter(function (x) { return (!pid || x.paymentId === pid) && (!cid || x.customerId === cid) && (!from || x.date >= from) && (!to || x.date <= to); })
    .map(function (x) { const o = pub_(x); o.amount = Number(o.amount) || 0; return o; })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); });
}
// Admin: remove a receipt entered by mistake. The bill goes back to owing that amount.
function deleteReceipt_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const id = str_(p.id, 40, true, 'Receipt');
    const r = readAll_('Receipts').filter(function (x) { return x.id === id; })[0];
    if (!r) throw UErr('Receipt not found.');
    const pay = readAll_('Payments').filter(function (x) { return x.id === r.paymentId; })[0];
    const cq = r.method === 'Cheque' ? readAll_('Payments').filter(function (x) { return x.type === 'Cheque' && String(x.receiptId || '').split(',').indexOf(r.id) > -1; })[0] : null;
    if (cq && (payPaid_(cq) > 0 || cq.rejectedDate)) throw UErr('The cheque received with this payment was already banked or rejected. Undo that first (Cheques & Credits).');
    if (pay) setPaid_(pay, Math.max(0, r2_(payPaid_(pay) - Number(r.amount))), today_());
    if (cq) {
      const left = String(cq.receiptId).split(',').filter(function (x) { return x && x !== r.id; });
      const cur = readAll_('Payments').filter(function (x) { return x.id === cq.id; })[0];
      if (!left.length) sh_('Payments').deleteRow(cur._row);
      else setRow_('Payments', cur._row, Object.assign({}, cur, { amount: r2_(Number(cur.amount) - Number(r.amount)), receiptId: left.join(','), updatedAt: now_() }));
    }
    const rr = readAll_('Receipts').filter(function (x) { return x.id === id; })[0];
    sh_('Receipts').deleteRow(rr._row);
    return { id: id };
  } finally { lock.releaseLock(); }
}
// Admin: a credit bill or cheque from before this system (or one that was missed). No items needed. Not counted in sales.
function addOldBill_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const cid = str_(p.customerId, 40, true, 'Customer');
    const cu = readAll_('Customers').filter(function (c) { return c.id === cid; })[0];
    if (!cu) throw UErr('Customer not found.');
    const type = str_(p.type, 10, true, 'Type');
    if (PAY_TYPES.indexOf(type) < 0) throw UErr('Choose Credit bill or Cheque.');
    const amount = num_(p.amount, 'Amount'); if (amount <= 0) throw UErr('Amount must be greater than zero.');
    const billDate = checkDate_(p.billDate); if (billDate > today_()) throw UErr('The bill date cannot be in the future.');
    const date = checkDate_(p.date);
    let ref = str_(p.invoiceNo, 60);
    if (ref) {
      if (readAll_('Payments').some(function (x) { return x.invoiceId === ref && x.customerId === cid && x.type === type; })) throw UErr('That bill is already entered for this customer.');
    } else {
      const pre = 'OLD-' + billDate.replace(/-/g, '') + '-'; let seq = 0;
      readAll_('Payments').forEach(function (x) { if (String(x.invoiceId).indexOf(pre) === 0) seq = Math.max(seq, Number(String(x.invoiceId).slice(pre.length)) || 0); });
      ref = pre + ('000' + (seq + 1)).slice(-3);
    }
    const ts = now_(), rej = type === 'Cheque' && (p.rejected === true || p.rejected === 'true');
    const o = { id: uid_('Y'), type: type, invoiceId: ref, saleId: '', customerId: cid, customerName: cu.name, amount: amount, date: date, chequeNo: str_(p.chequeNo, 40), bank: str_(p.bank, 60), status: 'Unpaid', paidDate: '', createdAt: ts, updatedAt: ts, paidAmount: 0, billDate: billDate, source: 'Old bill', note: str_(p.note, 200), rejectedDate: rej ? today_() : '', rejectNote: rej ? 'Entered as a rejected cheque' : '' };
    appendRow_('Payments', o);
    return payNorm_(o);
  } finally { lock.releaseLock(); }
}
// Admin: delete an old bill that was entered by mistake (only if nothing has been received on it).
function deletePayment_(p) {
  const id = str_(p.id, 40, true, 'Bill');
  const r = readAll_('Payments').filter(function (x) { return x.id === id; })[0];
  if (!r) throw UErr('Bill not found.');
  if (r.source !== 'Old bill') throw UErr('Only old bills added by hand can be deleted here. Sale bills are removed by deleting the sale.');
  if (payPaid_(r) > 0) throw UErr('Money was already received on this bill. Remove those receipts first.');
  sh_('Payments').deleteRow(r._row);
  return { id: id };
}
