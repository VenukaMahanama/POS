// POS · Reports.gs — dashboard by date, reports, profit, end-of-day closing, stock & balances report
/* ---------- end of day closing (NEW) ---------- */
function dayFigures_(date) {
  let cash = 0, credit = 0, cheque = 0, settled = 0, exp = 0, refunds = 0;
  readAll_('Sales').forEach(function (s) {
    if (s.date !== date) return;
    refunds += Number(s.refund) || 0;
    if (s.paymentMethod === 'Cash') cash += Number(s.total); else if (s.paymentMethod === 'Credit') credit += Number(s.total); else if (s.paymentMethod === 'Cheque') cheque += Number(s.total);
  });
  const withRc = {};
  readAll_('Receipts').forEach(function (r) { withRc[r.paymentId] = 1; if (r.date === date && r.method === 'Cash') settled += Number(r.amount) || 0; });
  readAll_('Payments').forEach(function (x) { if (x.status === 'Paid' && x.paidDate === date && x.type === 'Credit' && !withRc[x.id] && (x.paidAmount === '' || x.paidAmount === undefined)) settled += Number(x.amount) || 0; });
  readAll_('Expenses').forEach(function (e) { if (e.date === date) exp += Number(e.amount); });
  return { cashSales: r2_(cash), creditSales: r2_(credit), chequeSales: r2_(cheque), cashFromSettlements: r2_(settled), expenses: r2_(exp), refunds: r2_(refunds) };
}
function getDayClose_(p) {
  const d = checkDate_(p.date || today_()), f = dayFigures_(d);
  f.date = d;
  f.saved = readAll_('DayClose').filter(function (x) { return x.date === d; }).map(pub_)[0] || null;
  return f;
}
function saveDayClose_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const d = checkDate_(p.date || today_()), f = dayFigures_(d);
    const opening = num_(p.openingFloat || 0, 'Opening cash'), exp = num_(p.cashExpenses || 0, 'Cash expenses'), counted = num_(p.countedCash, 'Counted cash');
    const expected = r2_(opening + f.cashSales + f.cashFromSettlements - exp - f.refunds), ts = now_();
    const old = readAll_('DayClose').filter(function (x) { return x.date === d; })[0];
    const o = { id: old ? old.id : uid_('D'), date: d, openingFloat: opening, cashSales: f.cashSales, cashFromSettlements: f.cashFromSettlements, cashExpenses: exp, expectedCash: expected, countedCash: counted, difference: r2_(counted - expected), note: str_(p.note, 300), closedBy: who_(), createdAt: old ? old.createdAt : ts, updatedAt: ts, cashRefunds: f.refunds };
    if (old) setRow_('DayClose', old._row, o); else appendRow_('DayClose', o);
    return o;
  } finally { lock.releaseLock(); }
}
function getDayCloses_() {
  return readAll_('DayClose').map(pub_).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 30);
}

/* ---------- profit by product / customer (NEW) ---------- */
function getProfitReport_(p) {
  const from = str_(p.from, 10) || '0000-00-00', to = str_(p.to, 10) || '9999-99-99';
  const sales = {}; readAll_('Sales').forEach(function (s) { if (s.date >= from && s.date <= to) sales[s.id] = s; });
  const prod = {}, cust = {};
  readAll_('SaleItems').forEach(function (i) {
    const s = sales[i.saleId]; if (!s) return;
    const rev = Number(i.lineTotal) - Number(i.discount), cost = Number(i.quantity) * Number(i.unitCost);
    const a = prod[i.productId] = prod[i.productId] || { productId: i.productId, name: i.productName, sku: i.sku, quantity: 0, revenue: 0, cost: 0 };
    a.quantity += Number(i.quantity); a.revenue += rev; a.cost += cost;
    const ck = s.customerId || 'walkin';
    const b = cust[ck] = cust[ck] || { customerId: s.customerId, name: s.customerName || 'Walk-in', ord: {}, revenue: 0, cost: 0 };
    b.ord[s.id] = 1; b.revenue += rev; b.cost += cost;
  });
  readAll_('Returns').forEach(function (r) {
    if (r.resolution !== 'Cash deducted' || r.date < from || r.date > to) return;
    const v = Number(r.quantity) * Number(r.value);
    const a = prod[r.productId] = prod[r.productId] || { productId: r.productId, name: r.productName, sku: r.sku, quantity: 0, revenue: 0, cost: 0 };
    a.revenue -= v;
    const ck = r.customerId || 'walkin';
    const b = cust[ck] = cust[ck] || { customerId: r.customerId, name: r.customerName || 'Walk-in', ord: {}, revenue: 0, cost: 0 };
    b.revenue -= v;
  });
  function fin(o) { o.revenue = r2_(o.revenue); o.cost = r2_(o.cost); o.profit = r2_(o.revenue - o.cost); o.margin = o.revenue > 0 ? r2_(o.profit * 100 / o.revenue) : 0; return o; }
  const products = Object.keys(prod).map(function (k) { const o = fin(prod[k]); o.belowCost = o.profit < 0; return o; }).sort(function (a, b) { return b.profit - a.profit; });
  const customers = Object.keys(cust).map(function (k) { const o = cust[k]; o.orders = Object.keys(o.ord).length; delete o.ord; return fin(o); }).sort(function (a, b) { return b.profit - a.profit; });
  return { from: from, to: to, products: products, customers: customers };
}

/* ---------- dashboard & reports ---------- */
// Estimated profit = sales excluding tax - cost of items sold (cost saved at time of sale) - expenses.

/* money received on credit bills between two dates (Receipts, plus old credit bills ticked paid before receipts existed) (REV 3) */
function receiptRows_(from, to) {
  const out = [], withRc = {};
  readAll_('Receipts').forEach(function (r) {
    withRc[r.paymentId] = 1;
    if (r.date >= from && r.date <= to) out.push({ date: r.date, customerName: r.customerName || '', invoiceId: r.invoiceId || '', amount: Number(r.amount) || 0, method: r.method || 'Cash', chequeNo: r.chequeNo || '' });
  });
  readAll_('Payments').forEach(function (x) {
    if (x.status === 'Paid' && x.type === 'Credit' && !withRc[x.id] && (x.paidAmount === '' || x.paidAmount === undefined) && x.paidDate && x.paidDate >= from && x.paidDate <= to)
      out.push({ date: x.paidDate, customerName: x.customerName || '', invoiceId: x.invoiceId || '', amount: Number(x.amount) || 0, method: 'Cash', chequeNo: '' });
  });
  return out;
}
function collectSum_(rows) {
  const o = { total: 0, cash: 0, cheque: 0, bank: 0, count: rows.length };
  rows.forEach(function (r) {
    o.total += r.amount;
    if (r.method === 'Cheque') o.cheque += r.amount; else if (r.method === 'Bank Transfer') o.bank += r.amount; else o.cash += r.amount;
  });
  ['total', 'cash', 'cheque', 'bank'].forEach(function (k) { o[k] = r2_(o[k]); });
  return o;
}

/* everything that happened on one date (REV 3). Profit and expenses are added for Admin only. */
function dashboardFull_(d) {
  const sales = readAll_('Sales').filter(function (s) { return s.date === d; }), ids = {};
  let cash = 0, credit = 0, cheque = 0, other = 0, total = 0, refunds = 0, rev = 0, cost = 0;
  sales.forEach(function (s) {
    ids[s.id] = 1; const t = Number(s.total) || 0;
    total += t; rev += t - (Number(s.tax) || 0); refunds += Number(s.refund) || 0;
    if (s.paymentMethod === 'Cash') cash += t; else if (s.paymentMethod === 'Credit') credit += t; else if (s.paymentMethod === 'Cheque') cheque += t; else other += t;
  });
  readAll_('SaleItems').forEach(function (i) { if (ids[i.saleId]) cost += i.quantity * i.unitCost; });
  const exp = readAll_('Expenses').filter(function (e) { return e.date === d; }).reduce(function (a, e) { return a + e.amount; }, 0);
  const rows = receiptRows_(d, d), col = collectSum_(rows);
  col.items = rows;
  const prods = readAll_('Products').filter(isAct_);
  const low = prods.filter(function (p) { return p.stock < p.lowStockLimit; }).map(pub_);
  const day = {
    date: d, orders: sales.length, sales: r2_(total), cashSales: r2_(cash), creditSales: r2_(credit), chequeSales: r2_(cheque), otherSales: r2_(other),
    refunds: r2_(refunds), collections: col, cashIn: r2_(cash + col.cash - refunds),
    expenses: r2_(exp), grossProfit: r2_(rev - cost), profit: r2_(rev - cost - exp)
  };
  return {
    date: d, todaySales: day.sales, todayOrders: sales.length, totalProducts: prods.length,
    lowStockCount: low.length, lowStock: low, totalCustomers: readAll_('Customers').length, todayExpenses: r2_(exp), estimatedProfit: day.profit, day: day
  };
}
function dashboard_(p) {
  const d = p && p.date ? checkDate_(p.date) : today_(), f = dashboardFull_(d);
  if (isAdmin_()) return f;
  const day = Object.assign({}, f.day); delete day.expenses; delete day.grossProfit; delete day.profit;
  return { date: d, todaySales: f.todaySales, todayOrders: f.todayOrders, totalProducts: f.totalProducts, lowStockCount: f.lowStockCount, totalCustomers: f.totalCustomers, day: day };
}
function key_(d, g) {
  if (g === 'day') return d;
  if (g === 'month') return d.slice(0, 7);
  const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return 'Week of ' + t.toISOString().slice(0, 10);
}
function reports_(p) {
  const from = str_(p.from, 10) || '0000-00-00', to = str_(p.to, 10) || '9999-99-99';
  const g = ['day', 'week', 'month'].indexOf(p.group) > -1 ? p.group : 'day';
  const sales = readAll_('Sales').filter(function (s) { return s.date >= from && s.date <= to; }), ids = {};
  const series = {}, pay = {};
  function ser(k) { return series[k] = series[k] || { period: k, orders: 0, sales: 0, cash: 0, credit: 0, cheque: 0, other: 0, collected: 0, cost: 0, expenses: 0, profit: 0 }; }
  let rev = 0, cash = 0, credit = 0, cheque = 0, other = 0, billed = 0;
  sales.forEach(function (s) {
    const k = key_(s.date, g), o = ser(k), t = Number(s.total) || 0, m = s.paymentMethod;
    ids[s.id] = k;
    o.orders++; o.sales = r2_(o.sales + t - s.tax);
    if (m === 'Cash') { o.cash = r2_(o.cash + t); cash += t; } else if (m === 'Credit') { o.credit = r2_(o.credit + t); credit += t; }
    else if (m === 'Cheque') { o.cheque = r2_(o.cheque + t); cheque += t; } else { o.other = r2_(o.other + t); other += t; }
    pay[m] = r2_((pay[m] || 0) + t); rev += t - s.tax; billed += t;
  });
  const best = {}; let cost = 0;
  readAll_('SaleItems').filter(function (i) { return ids[i.saleId]; }).forEach(function (i) {
    cost += i.quantity * i.unitCost; const o = ser(ids[i.saleId]); o.cost = r2_(o.cost + i.quantity * i.unitCost);
    const b = best[i.productId] = best[i.productId] || { productId: i.productId, name: i.productName, quantity: 0, revenue: 0 };
    b.quantity = r2_(b.quantity + i.quantity); b.revenue = r2_(b.revenue + i.lineTotal - i.discount);
  });
  const ex = readAll_('Expenses').filter(function (e) { return e.date >= from && e.date <= to; });
  const expTotal = ex.reduce(function (a, e) { return a + e.amount; }, 0), expBy = {};
  ex.forEach(function (e) { expBy[e.category] = r2_((expBy[e.category] || 0) + e.amount); const o = ser(key_(e.date, g)); o.expenses = r2_(o.expenses + e.amount); });
  const rc = receiptRows_(from, to);
  rc.forEach(function (r) { const o = ser(key_(r.date, g)); o.collected = r2_(o.collected + r.amount); });
  const rows = Object.keys(series).sort().map(function (k) { const o = series[k]; o.profit = r2_(o.sales - o.cost - o.expenses); return o; });
  return {
    from: from, to: to, group: g, revenue: r2_(rev), cost: r2_(cost), expenses: r2_(expTotal), grossProfit: r2_(rev - cost),
    estimatedProfit: r2_(rev - cost - expTotal), orders: sales.length,
    billed: r2_(billed), cashSales: r2_(cash), creditSales: r2_(credit), chequeSales: r2_(cheque), otherSales: r2_(other), collections: collectSum_(rc),
    series: rows, payments: pay,
    bestSellers: Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.quantity - a.quantity; }),
    expensesByCategory: expBy,
    lowStock: readAll_('Products').filter(function (x) { return isAct_(x) && x.stock < x.lowStockLimit; }).map(pub_)
  };
}


/* Deleted sales (Admin): newest first, max 300. Filter by the day it was deleted. */
function getDeletedSales_(p) {
  const from = str_(p.from, 10) || '0000-00-00', to = str_(p.to, 10) || '9999-99-99';
  return readAll_('DeletedSales').filter(function (x) { return x.deletedDate >= from && x.deletedDate <= to; })
    .sort(function (a, b) { return String(b.deletedAt).localeCompare(String(a.deletedAt)); }).slice(0, 300).map(function (x) {
      const o = pub_(x); let its = []; try { its = JSON.parse(x.itemsJson || '[]'); } catch (e) { its = []; }
      o.items = its.map(function (i) { return i.qty + ' × ' + i.name; }).join(', '); delete o.itemsJson; return o;
    });
}

/* net stock change (in − out) of everything dated AFTER `date`, per product; stock on `date` = current stock − this */
function stockMovesAfter_(date) {
  const net = {};
  function add(pid, d, v) { if (pid && String(d) > date) net[pid] = (net[pid] || 0) + v; }
  const prods = readAll_('Products'), bySku = {}, sales = {};
  prods.forEach(function (x) { if (x.sku) bySku[String(x.sku).toLowerCase()] = x.id; });
  readAll_('Sales').forEach(function (x) { sales[x.id] = x; });
  const replInv = {};
  readAll_('SaleItems').forEach(function (i) {
    const sl = sales[i.saleId]; if (!sl) return;
    if (i.kind === 'Replacement') replInv[i.productId + '|' + i.invoiceId] = 1;
    add(i.productId, sl.date, -(Number(i.quantity) || 0));
  });
  readAll_('DeletedSales').forEach(function (d) {
    let its = []; try { its = JSON.parse(d.itemsJson || '[]'); } catch (e) { its = []; }
    its.forEach(function (i) { add(i.productId, d.date, -(Number(i.qty) || 0)); });
  });
  readAll_('SupplierInvoices').forEach(function (v) {
    if (v.status !== 'Received') return;
    let its = []; try { its = JSON.parse(v.itemsJson || '[]'); } catch (e) { its = []; }
    its.forEach(function (i) { const pid = bySku[String(i.code || '').toLowerCase()]; if (pid) add(pid, v.receivedDate || v.date, Number(i.quantity) || 0); });
  });
  readAll_('Returns').forEach(function (r) {
    const q = Number(r.quantity) || 0;
    if (r.status === 'Restocked' || (r.condition === 'Good' && r.resolution)) add(r.productId, r.date, q);
    if (r.replaced && !replInv[r.productId + '|' + r.saleInvoice]) add(r.productId, r.date, -q);
    if (r.creditType === 'Free items' && String(r.creditNote).indexOf('Free: ') === 0) {
      prods.forEach(function (pr) {
        const k = String(r.creditNote).indexOf(pr.name + ' x'); if (k < 0) return;
        const m = /^([0-9.]+)/.exec(String(r.creditNote).slice(k + String(pr.name).length + 2)); if (m) add(pr.id, r.creditedDate || r.date, Number(m[1]));
      });
    }
  });
  readAll_('StockAdjustments').forEach(function (a) { add(a.productId, a.date, Number(a.change) || 0); });
  return net;
}

/* The stock & balances report (Admin). p = {from, to, parts[], includeZero}. Balances are "as at" the `to` date; sales / collections / expenses cover from..to. */
function getStockReport_(p) {
  const to = p.to ? checkDate_(p.to) : today_(), from = p.from ? checkDate_(p.from) : to.slice(0, 8) + '01';
  const parts = Array.isArray(p.parts) ? p.parts : ['summary', 'stock', 'cheques', 'rejected', 'credit'];
  const has = function (k) { return parts.indexOf(k) > -1; };
  const out = { from: from, to: to, parts: parts }, sm = {};
  if (has('summary') || has('stock') || has('zero') || has('cost')) {
    const net = stockMovesAfter_(to), cats = {}; let sell = 0, cost = 0;
    const rows = readAll_('Products').filter(isAct_).map(function (pr) {
      const q = r2_((Number(pr.stock) || 0) - (net[pr.id] || 0)), price = Number(pr.price) || 0, c = Number(pr.cost) || 0;
      if (q > 0) { sell += q * price; cost += q * c; }
      return { id: pr.id, sku: pr.sku || '', name: pr.name, category: pr.categoryName || 'Other', qty: q, price: price, cost: c, valueSell: r2_(Math.max(0, q) * price), valueCost: r2_(Math.max(0, q) * c) };
    }).sort(function (a, b) { return String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name)); });
    sm.stockSell = r2_(sell); sm.stockCost = r2_(cost);
    if (has('stock')) out.stock = rows.filter(function (x) { return p.includeZero || x.qty > 0.004; });
    if (has('zero')) out.zero = rows.filter(function (x) { return x.qty <= 0.004; }).map(function (x) { return { sku: x.sku, name: x.name, category: x.category }; });
  }
  const recBy = {}; readAll_('Receipts').forEach(function (r) { (recBy[r.paymentId] = recBy[r.paymentId] || []).push(r); });
  function recvTo(x) { const L = recBy[x.id] || []; if (L.length) return r2_(L.reduce(function (a, r) { return a + (r.date <= to ? Number(r.amount) || 0 : 0); }, 0)); const pa = payPaid_(x); return (x.type === 'Credit' && pa > 0 && x.paidDate && x.paidDate <= to) ? pa : 0; }
  const pays = readAll_('Payments'), chq = [], rej = [], cre = [];
  pays.forEach(function (x) {
    const bd = x.billDate || String(x.createdAt || '').slice(0, 10); if (!bd || bd > to) return;
    const amt = Number(x.amount) || 0;
    if (x.type === 'Cheque') {
      if (x.rejectedDate && x.rejectedDate <= to) { const owed = r2_(amt - recvTo(x)); if (owed > 0.004) rej.push({ customerName: x.customerName || '-', invoiceId: x.invoiceId, rejectedDate: x.rejectedDate, amount: owed }); }
      else { const banked = !x.rejectedDate && payPaid_(x) > 0 && x.paidDate && x.paidDate <= to; if (!banked) chq.push({ customerName: x.customerName || '-', invoiceId: x.invoiceId, date: x.date, amount: amt }); }
    } else if (x.type === 'Credit') {
      const got = recvTo(x), bal = r2_(amt - got);
      if (bal > 0.004) cre.push({ customerName: x.customerName || '-', invoiceId: x.invoiceId, billDate: bd, due: x.date, amount: amt, received: got, balance: bal });
    }
  });
  const byC = function (a, b) { return String(a.customerName).localeCompare(String(b.customerName)) || String(a.date || a.billDate || a.rejectedDate).localeCompare(String(b.date || b.billDate || b.rejectedDate)); };
  chq.sort(byC); rej.sort(byC); cre.sort(byC);
  const tot = function (a, f) { return r2_(a.reduce(function (q, x) { return q + x[f]; }, 0)); };
  sm.chequesTotal = tot(chq, 'amount'); sm.chequesCount = chq.length; sm.rejectedTotal = tot(rej, 'amount'); sm.rejectedCount = rej.length; sm.creditTotal = tot(cre, 'balance'); sm.creditCount = cre.length;
  if (has('cheques')) out.cheques = chq; if (has('rejected')) out.rejected = rej; if (has('credit')) out.credit = cre;
  if (has('summary')) out.summary = sm;
  if (has('cost')) out.stockCost = sm.stockCost;
  if (has('sales')) {
    const o = { orders: 0, total: 0, cash: 0, credit: 0, cheque: 0, other: 0 };
    readAll_('Sales').forEach(function (x) { if (x.date < from || x.date > to) return; const t = Number(x.total) || 0; o.orders++; o.total += t; if (x.paymentMethod === 'Cash') o.cash += t; else if (x.paymentMethod === 'Credit') o.credit += t; else if (x.paymentMethod === 'Cheque') o.cheque += t; else o.other += t; });
    ['total', 'cash', 'credit', 'cheque', 'other'].forEach(function (k) { o[k] = r2_(o[k]); }); out.sales = o;
  }
  if (has('collections')) out.collections = collectSum_(receiptRows_(from, to));
  if (has('expenses')) {
    const by = {}; let t = 0; readAll_('Expenses').forEach(function (e) { if (e.date < from || e.date > to) return; by[e.category] = r2_((by[e.category] || 0) + e.amount); t += e.amount; });
    out.expenses = { total: r2_(t), byCategory: Object.keys(by).sort().map(function (k) { return { category: k, amount: by[k] }; }) };
  }
  return out;
}
