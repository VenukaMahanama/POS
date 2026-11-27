// POS · Api.gs — the doGet / doPost entry points and the list of actions
/* ---------- API dispatcher ---------- */
let ACTIONS_ = null;
function actions_() { // built on first use, so the order of the .gs files does not matter
  if (ACTIONS_) return ACTIONS_;
  ACTIONS_ = {
  getSettings: getSettings_, saveSettings: saveSettings_,
  getProducts: getProducts_, saveProduct: saveProduct_, updateProduct: updateProduct_, deleteProduct: deleteProduct_,
  getCategories: getCategories_, saveCategory: saveCategory_,
  getCustomers: getCustomers_, saveCustomer: saveCustomer_,
  getSales: getSales_, createSale: createSale_,
  getExpenses: getExpenses_, saveExpense: saveExpense_, updateExpense: updateExpense_, deleteExpense: deleteExpense_,
  getDashboardData: dashboard_, getReports: reports_,
  // NEW
  getPayments: getPayments_, rejectCheque: rejectCheque_, getDeletedSales: getDeletedSales_, getStockReport: getStockReport_, savePayment: savePayment_, markPayment: markPayment_,
  getOrders: getOrders_, saveOrder: saveOrder_, updateOrderStatus: updateOrderStatus_,
  getSupplierInvoices: getSupplierInvoices_, saveSupplierInvoice: saveSupplierInvoice_, receiveSupplierInvoice: receiveSupplierInvoice_, setInvoiceDates: setInvoiceDates_, deleteSupplierInvoice: deleteSupplierInvoice_,
  deleteSale: deleteSale_, updateSale: updateSale_, receiveCollection: receiveCollection_, getReceipts: getReceipts_, deleteReceipt: deleteReceipt_, addOldBill: addOldBill_, deletePayment: deletePayment_, getReturns: getReturns_, saveReturn: saveReturn_, markReturnsSent: markReturnsSent_, creditReturns: creditReturns_,
  authStatus: authStatus_, login: login_, setupAdmin: setupAdmin_, logout: logout_, changePassword: changePassword_, getUsers: getUsers_, saveUser: saveUser_,
  paySupplierInvoice: paySupplierInvoice_, getSupplierPayments: getSupplierPayments_, deleteSupplierPayment: deleteSupplierPayment_,
  getOrderCheck: getOrderCheck_, saveOrderNote: saveOrderNote_, closeOrder: closeOrder_, linkInvoiceToOrder: linkInvoiceToOrder_,
  adjustStock: adjustStock_, getStockAdjustments: getStockAdjustments_,
  getDayClose: getDayClose_, saveDayClose: saveDayClose_, getDayCloses: getDayCloses_,
  getProfitReport: getProfitReport_, getProductSales: getProductSales_, getProductHistory: getProductHistory_, getCustomerSales: getCustomerSales_,
  getCustomerPrices: getCustomerPrices_, saveCustomerPrice: saveCustomerPrice_, deleteCustomerPrice: deleteCustomerPrice_,
  backupNow: backupNow_, getBackupInfo: getBackupInfo_, setBackupTrigger: setBackupTrigger_
  };
  return ACTIONS_;
}
function handle_(action, payload) {
  try {
    if (!Object.prototype.hasOwnProperty.call(actions_(), action)) throw UErr('Unknown action.');
    ensureDb_();
    payload = payload && typeof payload === 'object' ? payload : {};
    CUR_ = null;
    if (OPEN_ACTIONS.indexOf(action) < 0) {
      CUR_ = authUser_(payload.token);
      if (!CUR_) throw UErr('LOGIN_REQUIRED');
      if (CUR_.role !== 'Admin' && CASHIER_ACTIONS.indexOf(action) < 0) throw UErr('You do not have permission to do that.');
    }
    return { success: true, data: actions_()[action](payload) };
  } catch (e) {
    if (e && e.user) return { success: false, error: e.message };
    console.error(e && e.stack || e);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
function out_(o, cb) {
  const t = JSON.stringify(o);
  if (cb && /^[A-Za-z0-9_.]+$/.test(cb)) return ContentService.createTextOutput(cb + '(' + t + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.JSON);
}
// GET: connection check, or JSONP read-only fallback.
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.action) return out_({ success: true, data: 'POS backend is running.' }, p.callback);
  let pl = {};
  try { pl = p.payload ? JSON.parse(p.payload) : {}; } catch (x) { return out_({ success: false, error: 'Bad request.' }, p.callback); }
  if (p.action.indexOf('get') !== 0) return out_({ success: false, error: 'Changes must be sent with POST.' }, p.callback);
  return out_(handle_(p.action, pl), p.callback);
}
// POST: body is JSON text {action, payload}.
function doPost(e) {
  let r;
  try { r = JSON.parse(e.postData.contents); } catch (x) { return out_({ success: false, error: 'Bad request.' }); }
  return out_(handle_(String(r.action || ''), r.payload));
}
