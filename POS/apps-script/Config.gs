// POS · Config.gs — tables (SCHEMAS), default settings and constants
const SCHEMAS = {
  Settings: ['key', 'value', 'updatedAt'],
  Products: ['id', 'sku', 'barcode', 'name', 'categoryId', 'categoryName', 'price', 'cost', 'stock', 'lowStockLimit', 'imageUrl', 'active', 'createdAt', 'updatedAt'],
  Categories: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
  Sales: ['id', 'invoiceId', 'customerId', 'customerName', 'subtotal', 'discount', 'tax', 'total', 'paymentMethod', 'itemCount', 'date', 'createdAt', 'returnDeduction', 'refund', 'editedAt', 'editedBy'],
  SaleItems: ['id', 'saleId', 'invoiceId', 'productId', 'productName', 'sku', 'quantity', 'unitPrice', 'unitCost', 'discount', 'lineTotal', 'createdAt', 'kind'],
  Customers: ['id', 'name', 'phone', 'email', 'address', 'createdAt', 'updatedAt', 'discountPercent', 'route'],
  Expenses: ['id', 'category', 'amount', 'date', 'description', 'createdAt', 'updatedAt'],
  // NEW: cheques & credits (date = banking date for cheques, due date for credits)
  Payments: ['id', 'type', 'invoiceId', 'saleId', 'customerId', 'customerName', 'amount', 'date', 'chequeNo', 'bank', 'status', 'paidDate', 'createdAt', 'updatedAt', 'paidAmount', 'billDate', 'source', 'note', 'rejectedDate', 'rejectNote', 'receiptId'],
  // NEW: money received from customers against credit bills (collections)
  Receipts: ['id', 'paymentId', 'invoiceId', 'customerId', 'customerName', 'date', 'amount', 'method', 'chequeNo', 'bank', 'note', 'createdBy', 'createdAt'],
  // NEW: purchase / restock orders
  Orders: ['id', 'orderNo', 'date', 'supplier', 'status', 'itemsJson', 'totalCost', 'expectedRevenue', 'notes', 'receivedDate', 'createdAt', 'updatedAt', 'missingNotes'],
  // NEW: invoices received from the supplier (stock comes in when status becomes Received)
  SupplierInvoices: ['id', 'invoiceNo', 'date', 'supplier', 'customerName', 'payMethod', 'subtotal', 'discount', 'total', 'itemsJson', 'status', 'receivedDate', 'notes', 'createdAt', 'updatedAt', 'returnCredit', 'paidAmount', 'orderId', 'orderNo', 'taxInvoiceNo', 'soNo', 'poNo', 'postingTime', 'place', 'vatAmount', 'salesperson'],
  // NEW: customer returns that we send back to the supplier for credit
  Returns: ['id', 'date', 'customerId', 'customerName', 'productId', 'sku', 'productName', 'quantity', 'unitCost', 'reason', 'replaced', 'status', 'sentDate', 'claimRef', 'creditType', 'creditAmount', 'creditInvoiceNo', 'creditNote', 'creditedDate', 'createdAt', 'updatedAt', 'saleInvoice', 'resolution', 'condition', 'value'],
  // NEW (login, supplier payments, stock adjustments, end-of-day, customer special prices)
  Users: ['id', 'username', 'salt', 'hash', 'role', 'active', 'createdAt', 'updatedAt'],
  SupplierPayments: ['id', 'invoiceId', 'invoiceNo', 'date', 'method', 'amount', 'note', 'createdBy', 'createdAt'],
  // NEW (rev 7): the record of every deleted sale, with the reason
  DeletedSales: ['id', 'saleId', 'invoiceId', 'date', 'customerId', 'customerName', 'total', 'paymentMethod', 'reason', 'deletedBy', 'deletedAt', 'deletedDate', 'itemsJson'],
  StockAdjustments: ['id', 'date', 'productId', 'sku', 'productName', 'oldStock', 'newStock', 'change', 'type', 'reason', 'createdBy', 'createdAt'],
  DayClose: ['id', 'date', 'openingFloat', 'cashSales', 'cashFromSettlements', 'cashExpenses', 'expectedCash', 'countedCash', 'difference', 'note', 'closedBy', 'createdAt', 'updatedAt', 'cashRefunds'],
  CustomerPrices: ['id', 'customerId', 'productId', 'productName', 'price', 'updatedAt']
};
// Columns stored as plain text so phone numbers, SKUs and dates are never reformatted by Sheets.
const TEXT_COLS = ['id', 'key', 'value', 'sku', 'barcode', 'phone', 'date', 'invoiceId', 'saleId', 'productId', 'customerId', 'categoryId', 'createdAt', 'updatedAt', 'paidDate', 'receivedDate', 'chequeNo', 'orderNo', 'invoiceNo', 'sentDate', 'creditedDate', 'billDate', 'rejectedDate', 'deletedDate', 'deletedAt', 'paymentId', 'salt', 'hash', 'username', 'orderId'];
const BOOL_KEYS = ['taxEnabled', 'receiptShowAddress', 'receiptShowPhone', 'receiptShowEmail', 'receiptShowLogo'];
const PAY = ['Cash', 'Card', 'Cheque', 'Credit', 'Bank Transfer', 'Other'];
const PAY_TYPES = ['Cheque', 'Credit'];
const ORDER_STATUS = ['Ordered', 'Received', 'Cancelled', 'Closed'];
// Initial business configuration. Seeded into the Settings sheet once; edit later from the POS Settings page.
const DEFAULTS = {
  businessName: 'CEYLON VOLT DISTRIBUTOR', businessCategory: 'Distribution Agency', currency: 'LKR', currencySymbol: 'Rs',
  address: '96/A Janaraja Rd,Waharaja Watte,Matara,Sri Lanka', city: 'Matara', country: 'Sri Lanka', phone: '0715958068',
  email: 'ceylonvoltdistributor@gmail.com', website: '', businessSiteUrl: 'http://kclsfa.acl.lk:8796/Reports/ReportPrint.aspx', logo: 'https://i.ibb.co/yBgr6Jts/Ceylon-Volt-Distributor-Logo-1.png',
  primaryColor: '#71a5d6', taxEnabled: 'false', taxRate: '0', receiptFooter: 'Thank You !',
  receiptShowAddress: 'true', receiptShowPhone: 'true', receiptShowEmail: 'false', receiptShowLogo: 'true'
};
