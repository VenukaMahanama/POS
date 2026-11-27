// POS · Settings.gs — business settings and daily backups
/* ---------- settings ---------- */
function getSettings_() {
  const o = {};
  readAll_('Settings').forEach(function (r) { o[r.key] = String(r.value); });
  return o;
}
function saveSettings_(p) {
  const s = p.settings;
  if (!s || typeof s !== 'object') throw UErr('Invalid settings.');
  const clean = {};
  Object.keys(DEFAULTS).forEach(function (k) {
    if (s[k] === undefined) return;
    let v = s[k];
    if (BOOL_KEYS.indexOf(k) > -1) v = (v === true || v === 'true') ? 'true' : 'false';
    else if (k === 'taxRate') v = String(num_(v, 'Tax rate', 0, 100));
    else if (k === 'primaryColor') { v = String(v).trim(); if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw UErr('Primary color must look like #71a5d6.'); }
    else if (k === 'logo' || k === 'website') v = safeUrl_(v);
    else v = str_(v, 200, k === 'businessName', 'Business name');
    clean[k] = v;
  });
  const rows = readAll_('Settings');
  Object.keys(clean).forEach(function (k) {
    const r = rows.filter(function (x) { return x.key === k; })[0];
    const o = { key: k, value: clean[k], updatedAt: now_() };
    if (r) setRow_('Settings', r._row, o); else appendRow_('Settings', o);
  });
  return getSettings_();
}

/* ---------- backups (NEW) ---------- */
function backupNow_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const it = DriveApp.getFoldersByName('POS Backups'), folder = it.hasNext() ? it.next() : DriveApp.createFolder('POS Backups');
  DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' backup ' + Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm'), folder);
  const files = [], fi = folder.getFiles();
  while (fi.hasNext()) { const f = fi.next(); files.push({ f: f, t: f.getDateCreated().getTime() }); }
  files.sort(function (a, b) { return b.t - a.t; });
  files.slice(30).forEach(function (x) { x.f.setTrashed(true); }); // keep the newest 30
  const last = now_();
  PropertiesService.getScriptProperties().setProperty('lastBackup', last);
  return { last: last };
}
function dailyBackup() { backupNow_(); } // run by the daily trigger
function getBackupInfo_() {
  const on = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyBackup'; });
  return { last: PropertiesService.getScriptProperties().getProperty('lastBackup') || '', enabled: on };
}
function setBackupTrigger_(p) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(t); });
  const on = p.enable === true || p.enable === 'true';
  if (on) ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(2).create();
  return getBackupInfo_();
}
// Run this once from the Apps Script editor so Google asks you to allow Drive and triggers.
function authorizeAll() { DriveApp.getRootFolder(); ScriptApp.getProjectTriggers(); return 'Authorized'; }
