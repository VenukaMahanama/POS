// POS · Core.gs — database setup, helpers (dates, ids, validation, reading and writing rows)
/* ---------- setup ---------- */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMAS).forEach(function (n) {
    const h = SCHEMAS[n];
    let sh = ss.getSheetByName(n);
    if (!sh) sh = ss.insertSheet(n);
    if (sh.getMaxColumns() < h.length) sh.insertColumnsAfter(sh.getMaxColumns(), h.length - sh.getMaxColumns());
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    sh.setFrozenRows(1);
    h.forEach(function (c, i) {
      if (TEXT_COLS.indexOf(c) > -1 && sh.getMaxRows() > 1) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  });
  const d = ss.getSheetByName('Sheet1');
  if (d && d.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(d);
  const have = readAll_('Settings').map(function (r) { return r.key; });
  Object.keys(DEFAULTS).forEach(function (k) {
    if (have.indexOf(k) < 0) appendRow_('Settings', { key: k, value: String(DEFAULTS[k]), updatedAt: now_() });
  });
  return 'Database ready';
}

/* ---------- helpers ---------- */
const SCHEMA_VER = 'r6'; // change this text whenever columns are added, so every sheet is upgraded once, automatically
function ensureDb_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), pr = PropertiesService.getScriptProperties();
  if (Object.keys(SCHEMAS).some(function (n) { return !ss.getSheetByName(n); }) || pr.getProperty('schemaVer') !== SCHEMA_VER) { setupDatabase(); pr.setProperty('schemaVer', SCHEMA_VER); }
}
function sh_(n) { const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); if (!s) throw new Error('Missing sheet ' + n); return s; }
function tz_() { return Session.getScriptTimeZone(); }
function now_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm:ss"); }
function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function uid_(p) { return p + Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function r2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function isAct_(x) { return x.active === true || String(x.active).toUpperCase() === 'TRUE'; }
function pub_(o) { const c = Object.assign({}, o); delete c._row; return c; }
function UErr(m) { const e = new Error(m); e.user = true; return e; }
function readAll_(n) {
  const s = sh_(n), h = SCHEMAS[n], lr = s.getLastRow();
  if (lr < 2) return [];
  return s.getRange(2, 1, lr - 1, h.length).getValues().map(function (r, i) {
    const o = { _row: i + 2 };
    h.forEach(function (k, j) {
      let v = r[j];
      if (v instanceof Date) v = Utilities.formatDate(v, tz_(), (k === 'date' || k === 'paidDate' || k === 'billDate' || k === 'rejectedDate' || k === 'deletedDate' || k === 'receivedDate' || k === 'sentDate' || k === 'creditedDate') ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss");
      o[k] = v;
    });
    return o;
  });
}
function rowVals_(n, o) { return SCHEMAS[n].map(function (k) { return o[k] === undefined ? '' : o[k]; }); }
function appendRow_(n, o) { const s = sh_(n); s.appendRow(rowVals_(n, o)); return s.getLastRow(); }
function setRow_(n, row, o) { sh_(n).getRange(row, 1, 1, SCHEMAS[n].length).setValues([rowVals_(n, o)]); }
function str_(v, max, req, label) {
  let s = String(v == null ? '' : v).trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = s.replace(/^[=+\-@]+/, '').trim(); // block spreadsheet formulas
  if (req && !s) throw UErr(label + ' is required.');
  return s;
}
function num_(v, label, min, max) {
  const n = Number(v);
  if (v === '' || v == null || !isFinite(n)) throw UErr(label + ' must be a number.');
  if (n < (min === undefined ? 0 : min)) throw UErr(label + ' cannot be negative.');
  if (max !== undefined && n > max) throw UErr(label + ' is too large.');
  return r2_(n);
}
function safeUrl_(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u.slice(0, 500) : ''; }
function checkDate_(d) {
  d = str_(d, 10, true, 'Date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(new Date(d + 'T00:00:00Z'))) throw UErr('Enter a valid date.');
  return d;
}
