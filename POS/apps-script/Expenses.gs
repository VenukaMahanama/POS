// POS · Expenses.gs — expenses
/* ---------- expenses ---------- */
function expFrom_(p) {
  const a = num_(p.amount, 'Amount');
  if (a <= 0) throw UErr('Amount must be greater than zero.');
  return { category: str_(p.category, 60, true, 'Category'), amount: a, date: checkDate_(p.date), description: str_(p.description, 300) };
}
function getExpenses_(p) {
  const from = str_(p.from, 10), to = str_(p.to, 10);
  return readAll_('Expenses').filter(function (e) { return (!from || e.date >= from) && (!to || e.date <= to); })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).map(pub_);
}
function saveExpense_(p) {
  const o = Object.assign({ id: uid_('E'), createdAt: now_(), updatedAt: now_() }, expFrom_(p));
  appendRow_('Expenses', o);
  return o;
}
function findExpense_(id) {
  id = str_(id, 40, true, 'Expense');
  const r = readAll_('Expenses').filter(function (x) { return x.id === id; })[0];
  if (!r) throw UErr('Expense not found.');
  return r;
}
function updateExpense_(p) {
  const r = findExpense_(p.id), o = Object.assign({}, r, expFrom_(p), { updatedAt: now_() });
  setRow_('Expenses', r._row, o);
  return pub_(o);
}
function deleteExpense_(p) { const r = findExpense_(p.id); sh_('Expenses').deleteRow(r._row); return { id: r.id }; }
