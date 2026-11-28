# Ceylon Volt Distributor POS — Complete Build Specification

> **Purpose of this document.** Give this file (and, ideally, the two reference files `index.html` and `Code.gs` that come with it) to another AI or developer. Following it should produce a system that behaves **exactly** like the original. Everything here was built and tested: the reference backend passes 153 automated checks and the front end passes about 150 browser checks.
>
> **If the two reference files are available, treat them as the source of truth** and use this document as the explanation of what they do and why. If they are not available, rebuild from this document alone; every rule, formula, validation message and screen behaviour that matters is written down below.

---

## Revision 10 (29 Nov 2026) — what changed since revision 9 (supplier invoice page only; no backend change)

This revision **replaces the Cash/discount rule of revision 9 (points 3 and 4)**:
1. **Cash invoice:** every item that is already in Products keeps showing its **code, name, unit, selling price and discount with the same values as before, but none of them can be changed** (grey, dashed, read-only 🔒; the ✎ button opens the product in Products). The **discount box of every row is read-only on Cash** and keeps its value — it is **no longer reset to 0 and still counts in the totals and in the saved invoice**. Quantity stays editable. An item that is *not* in Products can still have its code, name, unit and selling price typed (its discount box is locked on Cash).
2. **Credit invoice:** code, name and unit of items already in Products stay locked (change them in Products); their **selling price and discount become editable**.
3. **Nothing vanishes:** switching Cash ⇄ Credit only changes which boxes are locked; rows and all their values stay. The invoice being typed is also stored as a **draft in the browser** (`localStorage` key `invDraft`) after every change; it is restored when the page is opened again (after visiting Products with ✎, after a reload, after a log-out/in on the same browser) and removed by **Save invoice**, **Cancel** (which asks "Discard this invoice draft?" when there are items) and **+ Add manual invoice** (which starts a new one).
4. The note under the item table says: "🔒 Items already in Products: the code, name and unit cannot be changed here (press ✎ …). On a Cash invoice their selling price and discount are locked too (they stay as they are). Choose Credit to change them. Your invoice is saved as a draft while you type." (On Credit the second sentence is "On a Credit invoice you can change their selling price and discount.")
Code: Appendix O (`js/suppliers.js`).

## Revision 9 (28 Nov 2026) — what changed since revision 8

1. **Role and Logout on every page, top right** (7.1): the white top bar now shows, on the right, a **🌐 Business site** button (Admin only), the user's name (hidden on phones), a **role badge** (purple **Admin** / teal **Cashier**) and a red **⎋ Logout** button. Logout asks "The cart still has items. Log out anyway?" when the POS cart is not empty. (The small user chip at the bottom of the sidebar still opens *My account*.)
2. **Business site link**: the button opens `http://kclsfa.acl.lk:8796/Reports/ReportPrint.aspx` in a **new tab** (`target="_blank" rel="noopener noreferrer"`). The address is the new setting **`businessSiteUrl`** (Settings page: "Business site link (opens in a new tab)"; default above; must start with `http://` or `https://`, otherwise stored empty and the button is hidden). It is an address on the company's own network, so it opens only where that network/VPN is reachable; it cannot be shown inside the POS page.
3. **Supplier invoices — item details of products that already exist are locked** (5.11, 7.15): on the manual invoice page a row for a product that is already in Products (picked from the search, or whose typed code matches a product's SKU) shows **Code, Description and Unit read-only** (grey, dashed, 🔒) with a ✎ button that opens that product in Products. The row always follows the product (rename it in Products and the invoice row changes). Typing a code that exists converts the row (details loaded, price/discount prefilled from the last invoice line) with a message. **Qty, Selling price and Amount stay editable.** The server enforces the name too: `saveSupplierInvoice` replaces the description of any line whose code matches an active product by the product's name (keeping a trailing "(FREE)").
4. **Supplier invoices — "Payment terms" became "Payment type"**: a drop-down **Cash** (default) / **Credit**; saved in `payMethod` as `Cash` or `Credit`. **The item discount (Disc %) can be changed only when the type is Credit** (revision 10: on Cash the box is read-only but keeps its value and the value still counts; picking a product prefills the discount of its last invoice line). Imported (PDF) invoices keep what the supplier invoice says.
5. **Add a new customer from the POS** (7.3): when the name typed in the POS customer box matches nobody (or only partly), the list ends with **➕ Add “name” as a new customer**. It opens a form (**Name\*** prefilled, Phone, Address, Route [with the existing routes], Email) → `saveCustomer` (allowed for Cashiers) → the customer is added to the list and **selected for the sale at once** ("✓ Customer selected", special prices loaded). Enter in the box picks the first row, so with no match Enter opens this form. An exact name match shows no add row.
6. `SCHEMA_VER` is now `'r7'` (so the new setting row is seeded automatically); script links end with `?v=10`.

## Revision 8 (26 Nov 2026) — what changed since revision 7

1. **The project is now a folder of many files** (section 13) instead of one `index.html` and one `Code.gs`: `index.html` + `css/` + `js/` for the website and `apps-script/*.gs` for the backend, with a `README.md` that explains how to run it in VS Code (Live Server), create the backend, use `clasp`, and push to GitHub. The behaviour of every screen and action is unchanged except for points 2–4.
2. **POS product tiles show the selling price clearly:** each tile says **"Selling price"** above the price (the price is the product's *Selling price* field, or the customer's special price, shown as **"Special price"** with the normal price struck through). The cost price is never shown in the POS. The cart line says "Selling price Rs X each".
3. **Credit: the due date defaults to 30 days from today.** When the payment method is **Credit** and no date has been typed yet, the **Due date** box is filled with today + 30 days (`plusDays(30)`); the cashier can change it. A date typed by the cashier is kept. The same default is used when an edited sale is switched to Credit. The default is applied again for the next sale (the date is cleared after checkout).
4. **Colourful POS** (`css/pos-theme.css`, Appendix M): category **chips** under the search box (All + one chip per category, each category has its own colour; clicking filters the grid); product tiles with a colour stripe, tinted background and a coloured price (colour = a hue calculated from the category name, `hue()`); stock badges (green in stock, amber low, red out); a rainbow gradient cart header; the payment method is three coloured buttons (Cash green, Credit orange, Cheque blue) instead of a drop-down (`setPay(m)`); the total row is highlighted; **✅ Checkout** is a big green button; the cart bar / floating cart button uses the same gradient.
5. Backend: `ACTIONS` became the function `actions_()` (built on first use) so the `.gs` files can be in any order; there are **72 actions** in total. `appsscript.json` is included (time zone `Asia/Colombo`, web app: execute as the deploying user, access Anyone).

## Revision 7 (25 Nov 2026) — what changed since revision 6

1. **Deleting a sale needs a reason** (5.4, 7.10): the Delete button opens a window with a required **Reason** (Wrong entry (typing mistake), Customer cancelled, Duplicate bill, Wrong customer or wrong items, Test sale, Other) and a **Note** (required when the reason is Other). `deleteSale{id, reason}` refuses an empty reason ("Enter the reason for deleting this sale."). The stock that is put back is logged in **StockAdjustments** with `type = Sale deleted` and `reason = "INV-…: <reason>"`, so it shows in **Stock count → recent adjustments** and in the product history as **Adjustment (Sale deleted)** with the reason. A full record is kept in the new sheet **DeletedSales** and listed by the **🗑 Deleted sales** button on the Sales page (Admin). In the product history the deleted sale still shows as **Sold (sale deleted later)** on its original date, and the put-back shows on the deletion date, so the running balance stays right.
2. **Reports page → PDF printing** (5.18, 7.12): two collapsible cards, **🖨 Print stock & balances report (PDF)** and **🖨 Print customer price list (PDF)**. Each has tick boxes; **only ticked parts are printed**. Browser print window ("Save as PDF"), A4, a running header and footer on every page, page numbers where the browser supports them. **The suggested file name starts with the business name** (see 5.18).
3. **Stock & balances report** (new action `getStockReport`, Admin): balances are **as at the To date**; sales / collections / expenses cover From..To. Parts: Summary, Remaining stock, Cheques not yet banked, Rejected cheques owed, Credit balances (ticked by default); Sales summary for the period, Collections received, Expenses, Stock value at cost price, Items with zero stock (more details). Company-facing: selling price only; cost price only when "Stock value at cost price" is ticked.
4. **Customer price list PDF** (7.12): valid-from date; **For** = all customers (normal prices) or one customer (that customer's special prices replace the normal price, others stay normal); ticks: SKU, Group by category, Availability (in stock / out of stock, never quantities), Leave out items with no stock, Business address and phone, Note at the bottom (editable text).
5. **Low-stock card removed from Reports** and replaced by **Remaining stock on the To date** (items grouped by category with subtotals and a total, loaded after the page opens). The Products page keeps its low-stock tag; the Low Stock page is unchanged.
6. Reports filter row has **This month** / **Last month** buttons. New sheet `DeletedSales`; `SCHEMA_VER` now `'r6'` (the sheet is created automatically). Two actions were added (`getDeletedSales`, `getStockReport`).

## Revision 6 (24 Nov 2026) — what changed since revision 5

1. **Receiving a payment by cheque** (credit payment mode, customer profile, Cheques & Credits → Receive payment): choosing **Paid by = Cheque** shows a required **Cheque banking date** (default today, **any date including the future**; the separate "Date" box that records the day the cheque was received is still today or earlier, and only the Admin can change it). The credit bill is reduced at once (a receipt with method Cheque) **and the cheque itself is added to Cheques & Credits** as a cheque to bank (type Cheque, banking date as chosen, `source = Collection`, badge "paid-by-cheque", bill no. `CHQ-<credit bill no.>` and a note "Cheque received for INV-…"). One cheque row is created per payment, even when it pays several bills. If that cheque later bounces, it is rejected like any other cheque and the customer owes it again. Deleting the receipt removes the cheque (or reduces it when it covered several receipts), unless it was already banked or rejected. New Payments column `receiptId`.
2. **Cheques and Credits are two tabs** on the Cheques & Credits page: **Cheques (N)** and **Credits (N)** (N = how many are not fully paid). A tab shows only its own type; the Type filter is gone. Rejected cheques appear in the Cheques tab.
3. **POS cart: Clear and Close** (7.3): **Clear** returns the sale to its starting state: items, returns, customer (and their special prices), discount (empty, **Percent**), payment method Cash, due/banking dates, cheque rows and the sale date. **Close ✕** hides the cart (phone: back to the products, the bottom "🛒" bar remains; desktop: the cart column collapses and a round **🛒 items · total** button appears bottom-right). Tapping that bar/button opens the cart again; the cart contents are kept while it is closed.
4. **Stock that comes in is placed at the START of its date** (5.14, 5.17): in the product history ledger, `Received` (supplier invoice, dated by the chosen received date), `Free from supplier` and positive `Adjustment` rows sort **before** every other event of the same date (sales, returns, decreases), so the running balance reads "stock arrives in the morning, then it sells". The Stock count page has a **Date** box (default today, not in the future) and `adjustStock` accepts `date`.
5. Discount type list order is now **Percent, Amount**. `SCHEMA_VER` is now `'r5'`.

## Revision 5 (23 Nov 2026) — what changed since revision 4

1. **No cheque number and no bank** anywhere on screen (POS cheque cards, edit-sale cheques, Receive payment windows, missed-bill form, Cheques & Credits details, customer profile, receipts lists). The columns `chequeNo` and `bank` stay in the sheets so old data keeps its shape; they are no longer asked for or shown.
2. **Rejected (bounced) cheques** (5.8b, 7.3, 7.5, Appendix J): a cheque can be marked **rejected** from Cheques & Credits (button **🚫 Cheque rejected** inside the cheque card) or from a new POS mode **Rejected cheque**. It then shows in **red** (red card with a red left edge, red **REJECTED** badge, red pill "🚫 Rejected · date", red remaining amount) at the **top** of Cheques & Credits under the heading "🚫 Rejected cheques", counts as money the customer owes again, and is collected with **Receive payment** (cash, bank transfer or a new cheque). Once fully paid it moves to the Paid group with the badge "was rejected". The Admin can **Undo rejection** (only while nothing was received on it). A cheque that was ticked as banked and then bounces goes back to "not received". New action `rejectCheque`; two new Payments columns `rejectedDate`, `rejectNote`.
3. **Paid cheques and credit bills are shown last** (7.5): order is Rejected → still to collect (earliest banking/due date first) → Paid (most recently paid first), with group headings. The server sorts `getPayments` the same way.
4. **Supplier invoices: invoice date and received date** (5.11, 7.15): the manual page says "Invoice date\*" (default today) and has a tick box "The stock has already arrived: receive it into my stock when I save" with a **Received date** (default today). The **Receive stock** window has a **Received date** (default today). Every invoice has a **📅 Edit dates** button (invoice date; and, once the stock is received, the received date). New action `setInvoiceDates`; `receiveSupplierInvoice` accepts `receivedDate`.
5. **Default discount type is Percentage** (7.3). It goes back to Percentage after every sale.
6. **POS quantity focus** (7.3): tapping a product puts the cursor in that item's quantity box in the cart and highlights it (yellow, text selected). Typing replaces the quantity; typing nothing keeps **1**; Enter returns to the search box.
7. **Automatic database upgrade**: `ensureDb_()` now also runs `setupDatabase()` once whenever `SCHEMA_VER` (a text in the code, now `'r4'`) differs from the value stored in Script Properties, so new columns are added without anyone running `setupDatabase` by hand. Change the text whenever a column is added.
8. Actions are now **69**.

## Revision 4 (19 Nov 2026) — what changed since revision 3

1. **No default discount.** The customer "default discount %" is gone from the customer form, list, profile and POS (nothing is filled in automatically). The `discountPercent` column stays in the Customers sheet only so existing data keeps its shape; it is never read or written by the screens.
2. **Discount on chosen items only** (5.1, 5.3, 7.3, 7.10, Appendix I): every cart line has a tick box **"gets discount"** (ticked by default) and the discount line has links **all items / no items**. The discount (percent or amount) is calculated on, and shared between, the **ticked items only**. The same tick box exists on the Edit-sale page. `createSale` / `updateSale` accept `noDiscount: true` on an item row.
3. **Customer pays one bill with several cheques** (5.8, 7.3, 7.10, Appendix I): choosing **Cheque** shows one row per cheque (amount, banking date, cheque no., bank) and **+ Add another cheque**. The amounts must add up to the bill total. **Each cheque becomes its own record** in Cheques & Credits (note "Cheque 1 of 3") with its own banking date, so each can be ticked as banked separately. `savePayment` accepts `cheques[]`; `updateSale` accepts `cheques[]`.
4. **Product history → "Sold to customers" can be sorted** (5.17b, 7.6, Appendix I): Most / Least quantity, Highest amount, Most times bought, Last bought (newest / oldest first), Customer name A–Z.
5. **Sales page** (7.10): always **newest date first** (sorted again in the browser), shortcut buttons **Today** and **Yesterday**, a **Pick one day** box, and From/To for any range; a line shows the number of sales and their total.
6. No new sheets, columns or actions (still 67 actions).

## Revision 3 (19 Nov 2026) — what changed since revision 2

1. **Dashboard by date** (sections 3.2, 5.16, 6, 7.2, Appendix H): the dashboard now has **Today** and **Yesterday** shortcut buttons and a date picker. For the chosen date it shows total sales, orders, **cash sales, credit sales, cheque sales**, (Admin) expenses and **profit**, plus a **Collections received** block (money received on credit bills that day: total, cash, cheque, bank transfer, and a list of each receipt) and the sales list of that day. `getDashboardData` now accepts `{date}`.
2. **Reports** (sections 5.16, 7.12, Appendix H): the Reports page now shows cash / credit / cheque sales and collections received for the chosen range, and the period table has columns **Cash, Credit, Cheque, Collected, Cost, Expenses, Profit**. `getReports` returns the extra fields.
3. Nothing else changed: no new sheets or columns, no new actions (67 actions still).

## Revision 2 (19 Nov 2026) — what changed since the first version

1. **Supplier-invoice paste import fixed** (section 8, Appendix E): text with no `N of M` page marker is now split by itself; a label whose value sits on the next line is joined to it; header values that run on into the next label are cut.
2. **Manual supplier-invoice entry redesigned** (section 7.15, Appendix F): search a product, everything else fills in, the cursor jumps to Quantity.
3. **Product history** (sections 5.17b, 6, 7.6, Appendix G): click a product row to see who bought it, every stock movement with a running balance, and supplier invoices that brought it in. New action `getProductHistory`.

---

## 1. What the system is

A **point-of-sale and back-office system for a distribution agency** (electrical cables, bulbs and accessories bought from a supplier, Kelani Cables, and sold to shops and dealers on delivery routes). The business is in Matara, Sri Lanka; currency is **LKR, symbol "Rs"**.

It covers: selling (day sales, credit, cheques), customer returns, collecting money on credit bills, supplier invoices (stock coming in), purchase orders, stock control, expenses, profit reports, end-of-day cash closing, users with two roles, and backups.

**Design principles that shaped every decision**

1. **No server to run.** The "database" is a Google Sheet; the "server" is Google Apps Script deployed as a Web App; the front end is **one static HTML file** opened in a browser (it can even be opened from the computer's disk).
2. **Plain, fast, mobile-friendly UI.** Vanilla JavaScript, no framework, no build step, no libraries (one optional library, pdf.js, is loaded on demand only for importing PDF invoices).
3. **The owner (Admin) sees everything; the cashier sees only what is needed to sell and collect money, and never sees costs or profit.** This is enforced **on the server**, not only by hiding screens.
4. **Stock must always balance.** Every action that changes stock (sale, edit sale, delete sale, return, replacement, supplier invoice received/deleted, stock count, company giving items back) changes it by exactly the right difference, and logs it where appropriate.
5. **Nothing is silently lost.** Deleting a sale or invoice reverses its effects; deleting a product is a soft delete; money received is kept as receipts that can be undone by Admin only.

---

## 2. Architecture

### 2.1 Files and technology

| Part | Technology | Notes |
|---|---|---|
| Front end | One file `index.html` (HTML + CSS + vanilla JS, about 900 lines) | Constant `GOOGLE_SCRIPT_URL` at the very top is the Web App `/exec` URL. No framework, no bundler. |
| Back end | One Apps Script file `Code.gs` (about 1,450 lines) | V8 runtime. Uses `SpreadsheetApp`, `LockService`, `CacheService`, `PropertiesService`, `Utilities`, `DriveApp`, `ScriptApp`, `ContentService`. |
| Database | The Google Sheet the script is bound to | One sheet (tab) per entity. Header row = column names. Sheets are created automatically. |
| Optional | pdf.js 3.11.174 from cdnjs, loaded only when the user uploads a PDF invoice | Worker is fetched as text and started from a Blob URL (needed when the page is opened from `file://`). |

### 2.2 Request/response protocol

* Front end → back end: `POST` to `GOOGLE_SCRIPT_URL` with header `Content-Type: text/plain;charset=utf-8` (avoids CORS pre-flight) and body `JSON.stringify({ action, payload })`. The front end always adds `payload.token`.
* Response (JSON): `{ "success": true, "data": ... }` or `{ "success": false, "error": "message" }`.
* If `error === "LOGIN_REQUIRED"` the front end clears the session and shows the login screen.
* `GET` is only a connection check (`{success:true,data:"POS backend is running."}`) and a **JSONP fallback for read-only actions whose name starts with `get`** (`?action=getX&payload=<json>&callback=fn`). Any non-`get` action over GET returns "Changes must be sent with POST."
* Error handling on the server: errors thrown with the helper `UErr(message)` are shown to the user as-is; any other exception is logged and the user sees "Something went wrong. Please try again."
* Front-end helper `run(button, fn)` disables the button, runs the async function, and shows any thrown error as a red toast.

### 2.3 Server helpers (behaviour must be reproduced)

| Helper | Behaviour |
|---|---|
| `str_(v, max, required, label)` | trim, cut to `max` characters; **remove leading `= + - @` characters** (stops spreadsheet formula injection); if required and empty → error "`label` is required." |
| `num_(v, label, min=0, max)` | must be a finite number (empty is invalid) → "`label` must be a number."; below min → "`label` cannot be negative."; result rounded to 2 decimals |
| `r2_(n)` | round to 2 decimals |
| `checkDate_(d)` | must match `YYYY-MM-DD` and be a real date → "Enter a valid date." |
| `uid_(prefix)` | prefix + first 12 hex characters of a UUID (no dashes) |
| `now_()` / `today_()` | script time zone, `yyyy-MM-dd'T'HH:mm:ss` and `yyyy-MM-dd` |
| `readAll_(sheet)` | reads every row into objects keyed by the schema columns plus `_row` (sheet row number). `Date` cells are converted to text (`yyyy-MM-dd` for date columns, ISO timestamp otherwise). |
| `setRow_`, `appendRow_` | write a full row from an object in schema order (missing keys become empty) |
| `pub_(o)` | copy without `_row` |
| `isAct_(x)` | `active` is `true` or the text `TRUE` |

**Text columns:** these columns are formatted as plain text so Sheets never converts them (phone numbers, SKUs, ids, dates): `id, key, value, sku, barcode, phone, date, invoiceId, saleId, productId, customerId, categoryId, createdAt, updatedAt, paidDate, receivedDate, chequeNo, orderNo, invoiceNo, sentDate, creditedDate, billDate, paymentId, salt, hash, username, orderId`.

**Locking:** every action that writes uses `LockService.getScriptLock().tryLock(20000)`; if it cannot get the lock → "The system is busy. Please try again."

**Schema upgrades:** `ensureDb_()` runs on every request and calls `setupDatabase()` if any sheet is missing. `setupDatabase()` creates missing sheets, writes bold header rows, freezes row 1, widens sheets if needed, formats text columns, deletes an empty default `Sheet1`, and seeds the Settings sheet with defaults for missing keys. **New columns are always appended at the END of a schema** so existing data never shifts. Running `setupDatabase()` again labels new columns on existing sheets. **Revision 5:** `ensureDb_()` also calls `setupDatabase()` once automatically when the text constant `SCHEMA_VER` (now `'r7'`; see revision 9) differs from the Script Property `schemaVer` (then stores it); `rejectedDate` is a text column and is formatted as `yyyy-MM-dd` when read.

### 2.4 ID prefixes

Product `P`, Category `C`, Customer `U`, Sale `S`, Sale item `I`, Expense `E`, User `N`, Payment (cheque/credit bill) `Y`, Receipt (money received) `M`, Order `O`, Supplier invoice `V`, Supplier payment `Q`, Stock adjustment `A`, Day close `D`, Customer price `X`, Return `R`, salt `s`.

### 2.5 Invoice numbers

* **Sales:** `INV-YYYYMMDD-NNNN` where `YYYYMMDD` is the **sale date** (not necessarily today) and `NNNN` = highest existing sequence for that date **+ 1** (4 digits). It is the maximum, not a count, so deleting a sale never causes a duplicate.
* **Orders:** `PO-NNNN` (count of orders + 1).
* **Old (missed) bills:** `OLD-YYYYMMDD-NNN` (bill date, max sequence + 1) unless the user typed a reference.

---

## 3. Users, login and roles

### 3.1 Login flow

* First visit with no users: the page shows **"Create the Admin account"** (username, password, repeat password). `authStatus` (open) returns `{hasUsers}`; `setupAdmin` (open) works only while no users exist and logs the new Admin in.
* Otherwise: **Log in** (username, password).
* Username: lower-cased, 3–30 characters from `a–z 0–9 . _ -` → "Username must be 3-30 letters or numbers (no spaces)."
* Password: at least 6 characters → "Password must be at least 6 characters."
* Stored as random salt + hash: `h = salt + ':' + password; repeat 50 times: h = hex(SHA-256(salt + h))`.
* Wrong login: "Wrong username or password." After **5 wrong attempts** for a username: "Too many wrong attempts. Please wait 5 minutes." (cache key `f_<username>`, 300 s).
* Session token = two UUIDs without dashes, stored in `CacheService` as `t_<token>` → `{id}` for **21,600 s (6 h)**. Every request re-reads the Users sheet to confirm the user is still active.
* The front end keeps `tok` and `usr` in `sessionStorage` (so a refresh stays logged in, closing the tab logs out).
* `logout` deletes the cache key. A user can change their own password (`changePassword`, needs the old password).

### 3.2 Roles

* **Admin** – every action.
* **Cashier** – only these actions: `getSettings, getProducts, getCategories, getCustomers, saveCustomer, getSales, createSale, getDashboardData, getPayments, getReturns, saveReturn, getCustomerPrices, receiveCollection, getReceipts, getProductSales, getProductHistory, getCustomerSales, getDayClose, saveDayClose, getDayCloses, changePassword, logout`. Anything else → "You do not have permission to do that."
* **Data stripping for cashiers (server side):** `cost` removed from products; `unitCost` removed from sale items and returns; dashboard returns only `date, todaySales, todayOrders, totalProducts, lowStockCount, totalCustomers, day` where `day` has **no** `expenses`, `grossProfit` or `profit` (cashiers see sales, cash/credit/cheque split and collections, never profit); product-sales map has no `profit`; `discountPercent` is not used by anyone (there is no default discount); a cashier cannot choose a sale date (always today) or a receipt date (always today).
* **Admin-only things** (summary): products create/edit/delete, categories, expenses, reports and profit report, orders, supplier invoices and payments, returns **to the company** (send / credit), stock count/adjust, editing and deleting sales, receipts undo, old (missed) bills, special prices and default discounts, users, settings, backups, back-dated sales/returns/receipts.
* Rules for users: at least one active Admin must always exist ("There must be at least one active Admin."); you cannot switch off your own account.

### 3.3 Front-end role handling

* Sidebar shows only allowed items. Cashier sidebar = **Dashboard, POS, Products, Low Stock, Sales, Customers, Cheques & Credits**. `go(view)` ignores views the role may not open (cashier extra allowed views: customer profile, end-of-day closing).
* Cashier product table has no cost column and no add/edit/delete buttons; Low Stock has no cost or order buttons.

---
## 4. Data model (what each sheet means)

The exact column lists (in order) are in **Appendix A**. This section explains the meaning and the rules attached to each entity.

### 4.1 Settings (`key`, `value`, `updatedAt`)
One row per key; all values are text. Seeded defaults (Appendix C). Boolean keys (`taxEnabled`, `receiptShowAddress`, `receiptShowPhone`, `receiptShowEmail`, `receiptShowLogo`) are stored as `'true'/'false'`. Validation on save: `taxRate` 0–100; `primaryColor` must look like `#71a5d6`; `logo`, `website` and `businessSiteUrl` must start with `http(s)://` (otherwise stored empty); `businessName` is required.

### 4.2 Products
`sku, name, categoryId, categoryName (copy of the category name, updated when the category is renamed), price (selling), cost, stock, lowStockLimit (default 5), imageUrl, active`.
* Soft delete: `active=false`. Deleted products disappear from lists but old sales keep their names/costs.
* SKU is unique (case-insensitive) among active products → "Another product already uses that SKU."
* `barcode` column still exists in the sheet for compatibility but **is not used anywhere in the UI** (barcode scanning was deliberately removed).
* A product is **low on stock when `stock < lowStockLimit`** (strictly below; equal is NOT low).

### 4.3 Categories
`name, description, active`. Name must be unique among active categories (case-insensitive) → "That category already exists." Delete = `active=false`.

### 4.4 Customers
`name, phone (digits + - space parentheses only, max 25), email (validated), address, route, discountPercent (kept only so old data keeps its shape; always 0 for new customers; not used)`. "Route" is free text with suggestions from routes already used (e.g. Matara, Galle, Hambantota). **There is no default discount**: the POS never fills in a discount by itself.

### 4.5 CustomerPrices
Special selling price per (customer, product): `customerId, productId, productName, price`. One row per pair (upsert). Used by the POS and by `createSale` on the server.

### 4.6 Sales and SaleItems
`Sales`: `invoiceId, customerId, customerName, subtotal, discount, tax, total (amount the customer pays), paymentMethod, itemCount, date (sale date, may be in the past), createdAt, returnDeduction, refund, editedAt, editedBy`.
`SaleItems`: one row per sold line: `saleId, invoiceId, productId, productName, sku, quantity, unitPrice, unitCost (cost at the time of sale), discount (share of the bill discount), lineTotal, kind`. `kind` is `Sale` (normal) or **`Replacement`** (an item given free to a customer because of a return; price 0, cost recorded). Old rows with empty `kind` are treated as `Sale`.
Payment methods allowed: `Cash, Card, Cheque, Credit, Bank Transfer, Other` (the POS offers **Cash, Credit, Cheque**). Anything unknown becomes `Cash`.

### 4.7 Expenses
`category, amount (> 0), date, description`. Categories suggested: Rent, Fuel, Wages, Utilities, Other (free text allowed).

### 4.8 Payments = customer cheque / credit bills (receivables)
One row per **credit bill or customer cheque** that is waiting to be collected.
`type` = `Credit` or `Cheque`; `invoiceId` = the sale's invoice number (or an old-bill reference); `saleId` (empty for old bills); `customerId, customerName`; `amount` (bill amount); `date` = **due date for Credit, banking date for Cheque**; `chequeNo, bank` (no longer used; always empty for new rows); `paidAmount` (money received so far); `status`; `paidDate` (date it became fully paid); `billDate` (date of the sale / old bill); `source` = `Sale` or `Old bill`; `note` (`source` is `Sale`, `Old bill` or, from revision 6, `Collection` = a cheque received as a payment on a credit bill); **`rejectedDate`** (empty = not rejected; the date the bank sent the cheque back) and **`rejectNote`** (reason). Derived status (`payNorm_`): `Paid` (remaining ≤ 0.004), `Partly paid`, `Unpaid`, and **`Rejected`** (rejectedDate set and money still owed); the reply also has `rejected` (true even after it was paid later), `rejectedDate`, `rejectNote`.
**Derived status** (always recomputed when read): `remaining = amount − paidAmount`; `Paid` if remaining ≤ 0.004; `Partly paid` if paidAmount > 0; else `Unpaid`. Legacy rows with an empty `paidAmount` and status `Paid` count as fully paid.

### 4.9 Receipts = money received on credit bills
`paymentId, invoiceId, customerId, customerName, date, amount, method (Cash | Cheque | Bank Transfer), chequeNo, bank, note, createdBy`. A credit bill can have many receipts (part payments). Admin can delete a receipt; the bill then owes that amount again.

### 4.10 Returns (customer returns)
`date, customerId, customerName, productId, sku, productName, quantity, unitCost, reason, replaced (true when a replacement was given), status, sentDate, claimRef, creditType, creditAmount, creditInvoiceNo, creditNote, creditedDate, saleInvoice (the sale in which the return was processed), resolution, condition, value`.
* `resolution` = `Replacement given` or `Cash deducted`; `condition` = `Faulty` or `Good`; `value` = money deducted per unit (only for Cash deducted).
* `status` flow: **Faulty** items: `With us` → `Sent` (sent to the company) → `Credited` (company gave items back or a credit note). **Good** items: `Restocked` immediately (put back in stock).
* Old-style returns created by `saveReturn` (no sale) have an empty `resolution`.

### 4.11 Orders (purchase / restock orders)
`orderNo, date, supplier, status (Ordered | Received (legacy) | Cancelled | Closed), itemsJson, totalCost, expectedRevenue, notes, receivedDate, missingNotes (JSON map)`. `itemsJson` = list of `{productId, productName, quantity, realCost, actualPrice, sellingPrice}`. Orders **never add stock** — stock only comes in through supplier invoices.

### 4.12 SupplierInvoices (invoices received from the supplier)
`invoiceNo, date, supplier, customerName (who the invoice is shipped to), payMethod (supplier terms text such as CASHMBDC-4654 or CREDIT), subtotal, discount, total, itemsJson, status (Pending | Received), receivedDate, notes, returnCredit, paidAmount, orderId, orderNo, taxInvoiceNo, soNo, poNo, postingTime, place, vatAmount, salesperson`.
`itemsJson` = list of `{code (= product SKU), description, quantity, uom, unitPrice (= the SELLING price), discPct, amount, netUnitCost, free}`.
Derived when read: `netDue = total − returnCredit`, `balance = max(0, netDue − paidAmount)`, `payStatus` = `Paid` / `Partly paid` / `Unpaid`.

### 4.13 SupplierPayments
`invoiceId, invoiceNo, date, method (Cheque | Bank Transfer), amount, note, createdBy` — money WE pay the supplier against an invoice.

### 4.14 StockAdjustments
Log of manual stock changes and of automatic corrections: `date, productId, sku, productName, oldStock, newStock, change, type (Stocktake | Damaged | Lost | Found | Other), reason, createdBy`.

### 4.15 DayClose
One row per date (upsert): `openingFloat, cashSales, cashFromSettlements, cashExpenses, expectedCash, countedCash, difference, note, closedBy, cashRefunds`.

### 4.16 Users
`username, salt, hash, role (Admin | Cashier), active`.

---

## 5. Business rules and formulas (the heart of the system)

### 5.1 Creating a sale (`createSale`)
Input: `items[{productId, quantity, noDiscount?}]`, optional `returns[...]` (see 5.2), `customerId`, `discountType` (`amount` | `percent`), `discountValue`, `paymentMethod`, optional `date` (Admin only).

1. Cart must contain items or returns → "Cart is empty." Maximum 200 items / 100 returns.
2. Lines for the same product are merged; every product must exist and be active ("A product in your cart is no longer available."); quantity > 0 (decimals allowed, e.g. 2.5).
3. **Price per line** = the customer's special price (CustomerPrices) if one exists, otherwise the product price. Line total = `r2(qty × price)`. `subtotal = r2(Σ line totals)`.
4. **Discount (on chosen items only, revision 4):** each item row may carry `noDiscount: true`; a product gets the discount unless every row of it is marked `noDiscount`. `eligibleSubtotal` = Σ line totals of the items that get the discount. `percent` → `r2(eligibleSubtotal × value / 100)` (value ≤ 100 → "Discount cannot exceed 100%."); `amount` → `r2(value)`. The discount may not exceed `eligibleSubtotal` → "Discount cannot exceed the total of the items that get the discount." (or, when every item gets it, "Discount cannot exceed the subtotal."). Per line, the stored `discount` = `r2(discount × lineTotal / eligibleSubtotal)` for items that get it and **0** for the others. `subtotal` is still the total of all items.
5. **Tax:** only if Settings `taxEnabled='true'`: `tax = Math.round((subtotal − discount) × taxRate) / 100`.
6. `returnDeduction` = Σ (qty × value) of returns resolved as "Cash deducted" (5.2).
7. `net = r2(subtotal − discount + tax − returnDeduction)`; **`total = max(0, net)`**; **`refund = net < 0 ? −net : 0`** (cash given back to the customer).
8. `paymentMethod` must be one of the allowed list, else `Cash`; **if `total = 0` it is forced to `Cash`**.
9. Customer (if given) must exist → "Customer not found." The POS itself **requires a customer**.
10. **Sale date:** today. Only an Admin may pass a past `date`; a future date → "The sale date cannot be in the future." A cashier's `date` is ignored.
11. **Stock check:** per product, `stock + net change ≥ 0` where net change = −(sold qty) − (replacement qty) + (good returns qty) → "Not enough stock for NAME (available: X)."
12. Writes: one `Sales` row; one `SaleItems` row per priced line (`kind='Sale'`, `unitCost` = product cost now, bill discount shared across lines in proportion to line totals); one `Replacement` line per replacement (price 0, cost recorded); one `Returns` row per return; stock updated once per product. **If anything fails, everything written is rolled back** (stock restored, rows deleted).
13. Result returned to the screen: the sale plus `items[]` and `returns[]` (used to print the receipt). After a credit/cheque sale the front end calls `savePayment` (5.8).

### 5.2 Returns inside a sale (customer returns)
Each return line: `productId, quantity, resolution, condition, value, reason`.
* **Anyone can return, even if they never bought the item from us** (no link to an old sale is required).
* `resolution = "Replacement given"` → a free `Replacement` line is added to the same sale and stock goes **down** by the quantity (stock must be available).
* `resolution = "Cash deducted"` → `value` (per unit, > 0) × quantity is **deducted from the bill** (`returnDeduction`). If the deduction exceeds what the customer owes for the other items, the extra is paid back in cash (`refund`).
* `condition = "Good"` → the item goes back to sellable stock (status `Restocked`). `condition = "Faulty"` → stock does not change; the item is tracked as `With us` to be sent to the company (5.12).
* A sale may contain only returns (no items).
* Replacement items are **not counted as units sold** for best-seller ranking; their cost is counted in profit (a cost with no income until the company credits us).

### 5.3 Editing a sale (Admin only, `updateSale`)
* Keeps the same invoice number. Replaces the priced lines with the submitted ones (`productId, quantity, price`); replacement lines and returns on the sale stay unchanged and the sale's existing `returnDeduction` stays in the total.
* Can change customer, date (not future), payment method, discount, items, quantities and per-line prices. Historical `unitCost` of lines that already existed is kept; new lines use the current product cost; a price for a new line defaults to the customer's special price or the product price.
* Stock changes by the difference between old and new priced quantities per product; if stock would go below zero → "Not enough stock for NAME (available: X)." (available = stock + the quantity this sale already had). Each stock change is logged in StockAdjustments with reason `Sale INV-… edited`.
* Cheque/credit record follows the sale: new total updates its amount; switching to Cash (or total 0) removes it; switching to Credit/Cheque creates it (a due/banking date is required → "Enter the due date." / "Enter the banking date."). **If money was already received on that bill and the payment method or total would change** → "Money was already received on this sale's cheque/credit. Remove that first (Cheques & Credits), then edit the sale."
* Sets `editedAt`, `editedBy`; the Sales list shows an "edited" badge.

### 5.4 Deleting a sale (Admin only, `deleteSale`)
* **A reason is required** (`reason`, max 200 characters; "Enter the reason for deleting this sale."). The screen sends the chosen reason plus the note ("Duplicate bill · note"), or only the note when the reason is Other.
* Puts stock back: sold quantities and replacement quantities return to stock; good items that had been taken back go out again (stock never below 0; shortages reported). Each product gets a `StockAdjustments` row dated today with `type = Sale deleted`, `reason = "<invoice>: <reason>"`, old/new stock and change.
* **Keeps a record** in `DeletedSales`: `id (X…), saleId, invoiceId, date (sale date), customerId, customerName, total, paymentMethod, reason, deletedBy, deletedAt, deletedDate, itemsJson [{productId,name,qty,kind}]`. `getDeletedSales{from?,to?}` (Admin) returns them newest first (by deletion), max 300, filtered by `deletedDate`, with `items` as text "3 × Cable, 1 × Switch".
* Product history uses `DeletedSales.itemsJson` to show **Sold (sale deleted later)** (outQ) on the sale's date.
* Removes the sale, its items, its returns that are still `With us` or `Restocked`, and its unpaid cheque/credit record.
* **Blocked** if a return of that sale was already `Sent` or `Credited` ("A return on this sale was already sent to the company…") or if money was received on its cheque/credit bill.

### 5.5 Special prices and the discount in the POS
**No discount is ever filled in automatically.** The cashier types the discount (amount or percent) and, if it should not apply to every item, un-ticks "gets discount" on those cart lines (or uses "no items" and ticks only the items that get it). Choosing a customer loads their special prices; the product grid and cart immediately show those prices.

### 5.6 Low stock
`stock < lowStockLimit`. Used by the Low Stock page, its red sidebar badge, the dashboard counter and the reports.

### 5.7 Best-selling and "most selling first" ordering
* `getProductSales(from,to)` → map `productId → {qty, revenue, profit(Admin only)}` over `SaleItems` of sales in the range, **ignoring `Replacement` lines**. `getCustomerSales(from,to)` → map `customerId → {orders, total}`.
* `getProductHistory(productId)` → see 5.17b (who bought a product, all stock movements, supplier invoices). Cashier + Admin; cost, profit and supplier prices are returned to Admin only.
* Periods offered: last 30 days, last 90 days (default), last 12 months, all time.
* **Everywhere lists are ordered most-selling first and least-selling last:** Products (default sort "Best selling"), POS product grid, Low Stock page, Customers list (by purchase amount), POS/collection customer pickers. Ties are broken by name A–Z.

### 5.8 Customer cheques and credit bills (receivables)
* A POS sale paid by **Credit** (needs a **due date**) or **Cheque** (needs a **banking date**; no cheque number or bank is asked) creates a `Payments` row via `savePayment` (only when total > 0). Duplicate protection: same `invoiceId` + `type` returns the existing row(s). `billDate` = the sale's date.
* **Several cheques for one bill (revision 4):** `savePayment{type:'Cheque', cheques:[{amount,date}…]}` writes **one `Payments` row per cheque** (all with the same `invoiceId`, `billDate`, `source='Sale'`, `note` = "Cheque i of n" when n > 1). Each amount must be > 0, each needs a banking date ("Enter the banking date for cheque 2."), at most 20 cheques, and the amounts must add up to the sale total within 0.01 → "The cheque amounts (X) must add up to the bill total (Y)." Every cheque is ticked/banked (`markPayment`) on its own. A single cheque is just a list of one (a blank amount on the screen means the full bill). In `updateSale`, `cheques[]` replaces all cheque rows of the sale (refused if money was already received on any of them); if a sale has several cheques, its total/method may not change without sending a new `cheques[]` list, and if nothing changes the existing cheque rows are only given the new customer name.
* **Cheques** are single instruments: tick = "banked/paid" (`markPayment`, Admin) sets `paidAmount = amount`; untick sets 0.
* **Credit bills** can be paid in parts: `receiveCollection` (5.9). `markPayment` on a credit bill (Admin) = "everything still owed was received in cash" (adds one Cash receipt for the remaining amount); untick deletes all receipts of that bill.
* Dashboard/sidebar alert count = bills that are not fully paid and whose date ≤ today.

### 5.8b Rejected cheques (revision 5)
* `rejectCheque{id, date?, note?}` (Admin **and** Cashier): only `type = Cheque`; refused when already rejected ("This cheque is already marked as rejected."). Sets `rejectedDate` (today; Admin may give an earlier date, not future), `rejectNote`, and resets the cheque to **not received** (`paidAmount 0`, `status Unpaid`, `paidDate ''`) even if it had been ticked as banked.
* `rejectCheque{id, reject:false}` (**Admin only**, "Only the Admin can undo a rejection."): clears the rejection; refused while any receipt exists on the cheque ("Money was already received on this rejected cheque. Remove those payments first, then undo the rejection."). It returns to Unpaid.
* A rejected cheque cannot be ticked as banked (`markPayment` → "This cheque was rejected. Receive the money from the customer instead (or undo the rejection)."). Its sale cannot be edited or deleted while a cheque of it is rejected or has money received (`payLocked_`).
* It is **owed again**: `receiveCollection` accepts it exactly like a credit bill (receipts, part payments, any method). When `remaining` reaches 0 its status becomes `Paid` and `rejected` stays true (badge "was rejected"). Receipts appear in the dashboard and report collections like any other.
* `getPayments` returns rejected cheques **even outside the From/To dates** (a bounced cheque must never disappear), and sorts by `payRank_` (Rejected 0, still owed 1, Paid 2): rejected and owed by banking/due date ascending, paid by `paidDate` descending.
* `addOldBill{…, rejected:true}` (Admin, type Cheque) enters a cheque that is not in the system as already rejected (`rejectedDate` = today, `rejectNote` "Entered as a rejected cheque").
* The Cheques-due counter/banner counts every rejected cheque (even if its banking date is in the future) and shows "· N rejected cheque(s) to collect" in red.

### 5.9 Receiving money on credit bills (`receiveCollection`)
Input: `amount (>0)`, `method` (Cash | Cheque | Bank Transfer, otherwise "Choose Cash, Cheque or Bank Transfer."), optional `date` (Admin only; not future), `note`, and EITHER `paymentId` (pay that bill or **rejected cheque**) OR `customerId` (pay the oldest first, **rejected cheques before credit bills**). **Paying by Cheque (revision 6):** `chequeDate` (any date; "Enter the cheque banking date." when missing) is required; the receipts are written as usual with method `Cheque` and a note "Cheque, banking YYYY-MM-DD" (after the cashier's note), and **one new `Payments` row** is created: `type Cheque`, `invoiceId` = `CHQ-` + the first bill's reference (+ " +n" when it pays n+1 bills), `saleId ''`, same customer, `amount` = the whole payment, `date` = `chequeDate`, `billDate` = the receipt date, `source Collection`, `note` "Cheque received for INV-a, INV-b", `receiptId` = the receipt ids. It is an ordinary cheque afterwards (tick = banked, can be rejected). `deleteReceipt` of a Cheque receipt removes that cheque (or subtracts the receipt's amount and id from it) and is refused once the cheque is banked or rejected. Cash received does not include it (`dayFigures_` counts only Cash receipts). Targets are credit bills and rejected cheques ("Credit bill or rejected cheque not found."; "This customer has no unpaid credit bills or rejected cheques.").
* With `paymentId`: the bill must be a Credit bill with remaining > 0; amount ≤ remaining → "The amount is more than the balance of this bill (X)."
* With `customerId`: open credit bills sorted by `billDate` then `date` ascending; total owed = Σ remaining; amount ≤ total owed → "The amount is more than the total owed (X)."; amount is allocated oldest first; one Receipt row per bill touched.
* Updates each bill's `paidAmount`, status, and `paidDate` (when it reaches zero). Returns `{total, date, method, customerId, customerName, applied[{paymentId, invoiceId, billDate, amount, remaining}]}` which the screen turns into a printable **PAYMENT RECEIPT**.
* `deleteReceipt` (Admin) subtracts that receipt from the bill and deletes it.

### 5.10 Old / missed bills (`addOldBill`, Admin only)
For credit bills or cheques from before the system started (or missed): no items, **not counted in sales**. Fields: customer, type (Credit | Cheque), `billDate` (≤ today), `date` (due/banking date), `amount` (> 0, **enter only what is still owed**), optional reference (else `OLD-YYYYMMDD-NNN`), note, and for a cheque the tick box **"This cheque was already rejected (bounced)"**. The same reference + customer + type cannot be entered twice. They appear in Cheques & Credits (tagged "old bill"), in overdue alerts, and can be collected like any credit bill. `deletePayment` removes an old bill only if nothing was received on it; bills that came from a sale can only be removed by deleting the sale.

### 5.11 Supplier invoices (stock coming in)
1. **Import / add** (`saveSupplierInvoice`): invoice number, date (valid), items (`code, description, qty > 0, uom, unitPrice, disc % 0–100, amount, free`). Server computes per line `netUnitCost = r2(amount × (1 − disc/100) / qty)` (free lines have amount 0 → cost 0). `subtotal/discount/total` use the supplied figures when > 0, otherwise `Σamount`, `Σamount×disc%`, `subtotal − discount`.
   * **Duplicate rule:** the same invoice number may legitimately appear on several invoices (the October format prints one Tax Invoice No. on every page), so an invoice is a duplicate if (same SO no. **and** same posting time) or (same invoice no. and compatible SO no./time). Error: "Invoice X (SO …, time) is already saved."
   * **Every item whose code is not yet a product SKU is created as a product immediately** (stock 0, `price = unitPrice`, `cost = netUnitCost`, lowStockLimit 5, name = description without a trailing "(FREE)"), so the Products list always contains every invoice item.
2. **Receive stock** (`receiveSupplierInvoice`): lines are grouped by code (case-insensitive); quantity summed; cost = Σ(amount×(1−disc%)) / Σ qty. Existing products (matched by SKU) get `stock += qty` and `cost = new cost`; their selling price changes **only if** the user ticked "also set the selling price… to the invoice price" (`updatePrices`). Unknown codes are created (price from `prices[code]` or the invoice unit price). Status → `Received`, `receivedDate` = the `receivedDate` sent by the screen (default today; not in the future → "The received date cannot be in the future."). Receiving twice is refused.
   * **Dates (revision 5):** `date` = invoice date, `receivedDate` = the day the stock came in. `setInvoiceDates{id,date,receivedDate?}` (Admin) changes them later without touching stock or money (invoice date must be ≤ today; the received date is changed only when the invoice is Received). Product history uses `receivedDate` (falling back to the invoice date) for "Received from supplier".
3. **Unit price on supplier invoices is the SELLING price**; our cost is that price after the trade discount.
4. **Delete invoice** (`deleteSupplierInvoice`, Admin): never deletes products. If it was Received, its quantities are deducted from stock (clamped at 0, logged `Invoice X deleted`). Blocked if payments exist ("Undo the payments first.") or a return credit was applied.
5. **Paying the supplier** (`paySupplierInvoice`): method Cheque or Bank Transfer (no cheque number needed), amount ≤ balance, date optional (default today); several payments allowed; `deleteSupplierPayment` undoes one. Invoice shows Unpaid / Partly paid / Paid and a "We owe the company" total.
6. **Return credit** from the company (5.12) reduces `netDue` (`returnCredit`, may not exceed the invoice total).

### 5.12 Returns to the company
Faulty returns (`With us`) are ticked and marked **Sent** (`markReturnsSent`, optional claim reference). When the company responds (`creditReturns`, selected returns must be `Sent`):
* **Credit note (type `Deduction`)**: an amount (> 0) is allocated across the selected returns in proportion to `qty × unitCost`; optionally linked to a supplier invoice (by invoice **id**), whose `returnCredit` increases (may not exceed its total).
* **Company gave the items back (type `Free items`)**: a list of `{productId, quantity}`; stock of those products increases; cost unchanged. The screen pre-fills the list from the returned items.
* Status becomes `Credited`; `creditNote` stores the credit-note number/note or a "Free: name xN" summary.

### 5.13 Purchase orders
Builder: search a product and add it; each line shows real cost (current cost), **actual price** (editable price for this order), quantity, selling price, margin per unit, line total; totals: order total, expected sales value, expected profit. Saving creates `PO-NNNN` with status `Ordered`.
**Matching to invoices:** an invoice is linked to an order (`linkInvoiceToOrder` by invoice id and order id; blank order id unlinks). `getOrderCheck` compares ordered vs invoiced per SKU (extra invoice items appear as "extra") and reports `missing`, `extra`, and a saved **note per missing item**. Derived order status: `Ordered` (no invoice linked), `Missing items`, `Complete`, or the stored `Closed`/`Cancelled`/`Received`. "Accept shortage and close order" sets `Closed`; it can be reopened.

### 5.18 PDF reports (Reports page, Admin)
**How printing works:** the screen builds an HTML page, writes it into a hidden iframe and opens the browser print window (user chooses "Save as PDF"). Page: A4, margins 14/12/16 mm; an outer table whose `thead` repeats a small running header "Business name · report name" and whose `tfoot` repeats "Business name · phone ··· Printed DD Mon YYYY" on every page; data tables repeat their column headings and never split a row; `@page` bottom-right margin box shows "Page X of Y" (browsers that support it). Before printing, `document.title` is set to the file name and restored afterwards, so the browser suggests it.
**File names (always start with the business name):** `<Business name> - Summary - <From> to <To>` e.g. `ABC Hardware - Summary - 01 Nov 2026 to 30 Nov 2026`; `<Business name> - Price list - <valid-from date>` or, for one customer, `<Business name> - Price list - <Customer> - <valid-from date>`. Dates are written `DD Mon YYYY`.
**Stock & balances report** (`getStockReport{from,to,parts,includeZero}`; `from` default the 1st of `to`'s month, `to` default today; `parts` any of `summary, stock, cheques, rejected, credit, sales, collections, expenses, cost, zero`; nothing is printed if no box is ticked: "Tick at least one part to print."):
* Header: business name, "STOCK AND BALANCES REPORT", "From D to D". Sections appear in this order, only if ticked: Summary; Sales in the period; Collections received in the period; Expenses in the period; **1. Remaining stock on <To>**; Items with zero stock; **2. Cheques not yet banked**; Rejected cheques still owed; **3. Credit balances** (the numbers 1–3 are given to the stock / cheques / credit sections in the order printed, so if only credit is ticked it is "1.").
* **Summary** lines: Stock value (selling price); Stock value (cost price) only when "Stock value at cost price" is ticked; Cheques not yet banked (count); Rejected cheques owed (count); Credit owed by customers (count). The summary always uses the real totals even when the lists are not ticked.
* **Remaining stock:** columns SKU, Item, Qty, Sell price, Value; with "cost" ticked also Cost price and Value at cost. Grouped by category (subtotal each, grand total); items with qty ≤ 0 are left out (they are in "zero stock"). Values use the **current** selling and cost price (no price history is kept).
* **Stock on a date** = current stock − the net movement of everything dated **after** that date (`stockMovesAfter_`): sold items (and replacements) − qty; deleted sales − qty on the sale date and + qty through their `Sale deleted` adjustment on the deletion date; received supplier invoices + qty on `receivedDate || date`; customer returns (Restocked or Good + resolved) + qty; replacements given − qty (when not already a sale item); free items from supplier credit notes + qty on `creditedDate || date`; stock adjustments ± change.
* **Cheques not yet banked on <To>:** cheque rows whose bill date (`billDate`, else the creation date) is on/before `to`, that were not rejected on/before `to`, and not banked by then (ticked paid with `paidDate` ≤ `to`). Columns Customer, Bill, Banking date, Amount; total.
* **Rejected cheques still owed:** rejected on/before `to`; amount = cheque amount − receipts dated ≤ `to`; only if > 0. Columns Customer, Bill, Rejected on, Amount owed.
* **Credit balances:** credit bills with bill date ≤ `to`; received = receipts dated ≤ `to` (old bills without receipts: `paidAmount` if `paidDate` ≤ `to`); balance = amount − received, only if > 0. Columns Customer (shown on the first row of each customer), Bill, Bill date, Due, Bill amount, Received to date, Balance; customer subtotal when a customer has 2+ bills; total.
* Sales / Collections / Expenses use `from`..`to` (cash / credit / cheque / other totals and bill count; cash / cheque / bank transfer collections and receipt count; expenses by category).
**Customer price list:** header business name, "PRICE LIST", "Prices valid from <date>" and, for a customer, "Prepared for <name>". Table columns SKU (tick), Item, Availability (tick: "In stock" / "Out of stock"), Price ("Your price" for a customer) with the currency symbol in the heading; group rows by category (tick, default on) sorted by category then name; "Leave out items with no stock" hides items with stock ≤ 0; footer lines: business address · Tel · email (tick) and the note text (tick; default "Prices are in Rs and may change without notice."). Customer prices come from `getCustomerPrices{customerId}`; products without a special price keep the normal price.

### 5.14 Stock count / adjustment (Admin)
`adjustStock{type, reason, date?, items[{productId,newStock}]}` — `date` (default today, never in the future) is the date written on every change; only products whose counted quantity differs are changed; each change is logged with old/new/change, type and reason; types Stocktake, Damaged, Lost, Found, Other.

### 5.15 End-of-day closing
For a date: `cashSales` = Σ `total` of sales on that date with method Cash; `creditSales`, `chequeSales` shown for information; `cashFromSettlements` = Σ **Cash** receipts dated that day (legacy credit bills ticked paid on that day with no receipts also count); `expenses` = Σ expenses of the day (default for "cash expenses"); `refunds` = Σ `refund` of that day's sales.
**Expected cash = opening float + cash sales + cash received on credit − cash expenses − cash refunds.** The user types the counted cash; `difference = counted − expected` (negative = short). Saving again for the same date replaces the row. A list of the last 30 closings is shown.

### 5.16 Dashboard and report formulas
* **Dashboard for a date `D`** (default today; `getDashboardData{date}`; Admin and Cashier may view any past date): `sales` = Σ `total` of sales dated D; `orders` = count; `cashSales`, `creditSales`, `chequeSales` = Σ `total` by payment method; `otherSales` = Card / Bank Transfer / Other; `refunds` = Σ `refund`; **collections for D** = every Receipt dated D (plus old credit bills ticked paid on D that have no receipts and an empty `paidAmount`, counted as Cash), split into `cash`, `cheque` (method Cheque), `bank` (Bank Transfer), with `total`, `count` and the list `items[{date, customerName, invoiceId, amount, method, chequeNo}]`; `cashIn = cashSales + collections.cash − refunds`; **profit (Admin only)** = `Σ(total − tax)` of D's sales − `Σ(qty × unitCost)` of D's sale items (replacements included) − D's expenses; `grossProfit` is the same before expenses. Credit and cheque sales count as sales (and profit) on the day the bill is made; collections are **not** added to sales or profit (they are only shown separately, so nothing is counted twice). The old fields `todaySales`, `todayOrders`, `todayExpenses`, `estimatedProfit` still exist and now refer to the chosen date.
* Reports (range + group by day/week(Monday)/month): revenue = Σ(total − tax); cost; expenses; `grossProfit = revenue − cost`; `estimatedProfit = revenue − cost − expenses`; orders; series per period; payment-method totals; best sellers by quantity; expenses by category; low-stock list.
* **Profit by product / customer** (`getProfitReport`): per product and per customer `revenue = Σ(lineTotal − discount)`, `cost = Σ(qty × unitCost)`, `profit`, `margin %`; **cash-deducted returns reduce revenue**; products with negative profit are flagged "below cost".

### 5.17 Backups
Admin can "Back up now" or switch on a daily trigger (about 02:00, function `dailyBackup`). A copy of the whole spreadsheet is made into a Drive folder named **POS Backups**; only the newest 30 copies are kept; the last backup time is shown. A one-time `authorizeAll()` run in the editor grants Drive and trigger permission.

---
### 5.17b Product history (`getProductHistory`)
Input `productId`. The product is found with `findProduct_`; `sku` is compared case-insensitively. Output: `{productId,name,sku,stock,sold,revenue,received,pending,lastSale,lastReceived,customers[],ledger[],earlier,received_rows[],profit(Admin only)}`.
* **Customers:** every `SaleItems` line of this product whose sale exists (kind `Sale` or `Replacement`). Grouped by `customerId` (blank → "Walk-in customer"): `orders` (distinct sales), `qty`, `revenue` (= lineTotal − discount), `lastDate`, and `lines[]` (date, invoiceId, qty, price, total, kind; newest first, max 40). Sorted by qty descending. `sold` and `revenue` are totals over all lines; `profit` (Admin only) = Σ(revenue − qty × unitCost).
* **Stock movements (ledger events):** `Sold` (out) and `Replacement` (out) from sale lines; (**Start-of-day rule, revision 6:** `Received`, `Free from supplier` and positive `Adjustment` events use the sort key `date + ' '` so they come before every other event of that date; all other events use `date + ' ' + createdAt`.) `Received` (in) for every **Received** supplier invoice that has a line whose `code` equals the SKU (quantities summed per invoice, dated by `receivedDate`); `Customer return` (in) for `Returns` rows with status `Restocked` or condition `Good` with a resolution; `Replacement` (out) for a `Returns` row with `replaced=true` only when no Replacement sale line exists for the same sale invoice (avoids double counting); `Free from supplier` (in) parsed from a credited `Returns` row with creditType `Free items` whose note starts `Free: ` using the pattern `<product name> x<qty>`; `Adjustment (<type>)` from `StockAdjustments` (in if change > 0, out if < 0).
* **Running balance:** events are sorted newest first (by date then creation time, except that stock coming in sits at the start of its date). Starting from the current product stock, each row's `balance` is the stock right **after** that event, then the event is undone to get the previous balance. What is left at the end is `earlier` (opening stock or changes made before records existed). `ledger` is capped at 400 rows.
* **Received rows:** one row per supplier invoice containing the product: date (receivedDate if received, else invoice date), invoiceNo, supplier, qty, status (`Received` / `Not received yet`), `free` flag; Admin also gets `unitPrice`, `discPct`, `netCost` (= Σ amount × (1 − disc%) ÷ qty). Invoices not yet received add to `pending`, not to the ledger.

## 6. Backend API reference

All actions are called as `{action, payload}`. Role column: **O** = open (no login), **C** = Cashier and Admin, **A** = Admin only. The complete list with function names is in Appendix B; the important behaviours are described in section 5. Parameters (payload fields) per action:

| Action | Role | Payload → result |
|---|---|---|
| `authStatus` | O | → `{hasUsers}` |
| `setupAdmin` | O | `{username,password}` (only if no users) → `{token,user}` |
| `login` | O | `{username,password}` → `{token,user:{id,username,role,active}}` |
| `logout`, `changePassword{oldPassword,newPassword}` | C | |
| `getUsers`, `saveUser{id?,username,password,role,active}` | A | create (password required) or edit (password optional = keep) |
| `getSettings` | C | → key/value object. `saveSettings{settings:{…}}` is A and returns the full settings |
| `getProducts` | C | active products (no `cost` for cashier). `saveProduct`, `updateProduct{id,…}`, `deleteProduct{id}` are A. Fields: `name*, sku, categoryId, price*, cost*, stock*, lowStockLimit (default 5), imageUrl` |
| `getCategories` C, `saveCategory{id?,name*,description,active}` A | | rename updates `categoryName` on its products |
| `getCustomers` C, `saveCustomer{id?,name*,phone,email,address,route}` C | | `discountPercent` is ignored (no default discount) |
| `getCustomerPrices{customerId}` C; `saveCustomerPrice{customerId,productId,price}` A; `deleteCustomerPrice{id}` A | | |
| `getSales{from,to,customerId}` C | | newest first (sale date desc, then created time), max 500, each with `items[]` and `returns[]`, numbers `returnDeduction`, `refund` |
| `createSale` C | see 5.1 | → the sale with `items`, `returns` |
| `updateSale{id,customerId,date,paymentMethod,discountType,discountValue,items[{productId,quantity,price,noDiscount?}],payDate,cheques?[{amount,date}]}` A | see 5.3 | |
| `deleteSale{id,reason*}` A | see 5.4 | → `{restored, short[]}` |
| `getDeletedSales{from?,to?}` | A | see 5.4 |
| `getStockReport{from?,to?,parts[],includeZero?}` | A | see 5.18 |
| `getExpenses{from,to}`, `saveExpense`, `updateExpense`, `deleteExpense` | A | `category*, amount>0, date*, description` (getExpenses newest first) |
| `getDashboardData{date?}` | C | see 5.16 (`date` default today, must be `YYYY-MM-DD`); cashier gets the reduced object |
| `getReports{from,to,group}` | A | see 5.16 and 7.12: adds `billed, cashSales, creditSales, chequeSales, otherSales, collections{total,cash,cheque,bank,count}`; every `series` row is `{period, orders, sales, cash, credit, cheque, other, collected, cost, expenses, profit}` (periods that only have expenses or collections also appear; `profit = sales − cost − expenses`) |
| `getProfitReport{from,to}` | A | `{products[], customers[]}` sorted by profit |
| `getProductSales{from,to}`, `getCustomerSales{from,to}` | C | see 5.7 |
| `getProductHistory{productId}` | C | see 5.17b |
| `getPayments{from,to,type,status,customerId}` | C | normalised bills (adds `remaining`, derived `status`, `billDate`, `source`); `status` filter accepts `Unpaid`, `Partly paid`, `Paid` or the pseudo-value **`Outstanding`** (= not fully paid); sorted by `date` ascending |
| `savePayment{type,invoiceId,saleId,customerId,customerName,amount,date,chequeNo,bank}` or, for several cheques, `{type:'Cheque',invoiceId,saleId,customerId,customerName,cheques[{amount,date}]}` | C | see 5.8 |
| `markPayment{id,paid}` | A | see 5.8 |
| `receiveCollection{paymentId? customerId?,amount,method,chequeDate?,date?,note}` | C | see 5.9 (works on credit bills and rejected cheques; `chequeDate` required when method is Cheque; reply also has `chequeDate`) |
| `rejectCheque{id,date?,note?,reject?}` | C (undo: Admin) | see 5.8b |
| `setInvoiceDates{id,date,receivedDate?}` | A | invoice date (≤ today); received date only when the invoice is `Received` |
| `getReceipts{paymentId,customerId,from,to}` | C | newest first |
| `deleteReceipt{id}`, `addOldBill{…}`, `deletePayment{id}` | A | see 5.9, 5.10 |
| `getReturns` (C, cost hidden for cashier), `saveReturn{productId,quantity,customerId,reason,replaced,saleInvoice}` (C), `markReturnsSent{ids,claimRef}` (A), `creditReturns{ids,type,amount,invoiceId|invoiceNo,note,freeItems[]}` (A) | | `saveReturn` is a stand-alone return without a bill (with `replaced=true` stock goes down; if `saleInvoice` is given the quantity may not exceed what that invoice sold minus earlier returns) |
| `getOrders`, `saveOrder{supplier,notes,items[{productId,productName,quantity,realCost,actualPrice,sellingPrice}]}`, `updateOrderStatus{id,status}`, `getOrderCheck{id}`, `saveOrderNote{id,key,note}`, `closeOrder{id,reopen}`, `linkInvoiceToOrder{invoiceId,orderId}` | A | see 5.13 |
| `getSupplierInvoices`, `saveSupplierInvoice`, `receiveSupplierInvoice{id,prices,updatePrices}`, `deleteSupplierInvoice{id}`, `paySupplierInvoice{id,method,amount,date,note}`, `getSupplierPayments{invoiceId}`, `deleteSupplierPayment{id}` | A | see 5.11 |
| `adjustStock{type,reason,date?,items}`, `getStockAdjustments{from,to}` | A | see 5.14 (`date` default today, not in the future; history: newest first, max 300) |
| `getDayClose{date}`, `saveDayClose{date,openingFloat,cashExpenses,countedCash,note}`, `getDayCloses` | C | see 5.15 (`saveDayClose` computes the expected cash on the server) |
| `backupNow`, `getBackupInfo`, `setBackupTrigger{enable}` | A | see 5.17 |

---

## 7. Front end specification

### 7.1 Global look and behaviour

* **Layout:** a dark navy sidebar (250 px, sticky, full height, gradient `#0b1d45 → #07122b`) and a content area with a white top bar (page title, 26 px, and on the right the **Business site** button [Admin], user name, role badge and **Logout** button) and the page body (`#app`, padding 20×24, max width 1400). Below 900 px wide the sidebar becomes a sticky top bar with a horizontally scrolling menu, the user chip is hidden, and the POS cart becomes a slide-up panel with a bottom bar.
* **Sidebar (admin), in this exact order, with icons:** 🏠 Dashboard · 🧾 POS · 📝 Orders · 📥 Invoices · 📦 Products · ⚠️ Low Stock · 🗂️ Categories · 📈 Sales · 👤 Customers · 💳 Cheques & Credits · 💲 Expenses · 📊 Reports · 🤖 Assistant · ⚙️ Settings. Each (except Dashboard) shows a "›" chevron. Active item = rounded pill with a lighter gradient. Brand block at the top: logo (white rounded square), business name in small uppercase cyan (`#8fe3ff`), business category beneath. At the bottom a user chip "👤 username · Role" opens *My account* (change password, log out).
* **Red count badges** on sidebar items: Low Stock (number of low-stock products), Invoices (invoices not yet received), Cheques & Credits (bills due today or overdue).
* **Hidden views reached from buttons** (they highlight their parent menu item and have their own page title): New Order (parent Orders), New Invoice (Invoices), Stock count / adjust (Products), Profit by product / customer (Reports), End-of-day closing (Sales), Customer profile (Customers), Edit sale (Sales).
* **Components:** `card`, KPI cards (`.kpi` with gradient classes g0–g6, big value, label, faint emoji icon), `pill` (payment-type colours: Cash pink, Card blue, Cheque purple, Credit/Bank orange, Other green; red "Overdue", amber "Due today"/"Banking today"), `badge` (`warn` amber, `bad` red), tables inside a horizontally scrollable `.tw` wrapper with non-wrapping cells, `modal` (centered box, click outside closes), `toast` (auto-dismiss 3.5 s; red for errors, green for success), `combo` (text box with a scrollable suggestion list that closes when clicking elsewhere), accordion cards with ▸/▾ arrows.
* **Money format:** `symbol + (space if the symbol is longer than 1 character) + number` using `en-US` separators; **2 decimals**, except whole numbers show **0 decimals** for LKR/JPY/KRW/VND/IDR. Example `Rs 43,875`, `Rs 1,234.50`, negative `Rs -13,125`.
* **Dates** are `YYYY-MM-DD` strings; `<input type="date">` everywhere; times of day only on supplier invoices.
* **Brand:** `applyBrand()` sets the page title, the sidebar logo, the sidebar title as **`<business name> POS`** (e.g. "CEYLON VOLT DISTRIBUTOR POS"), the subtitle as **`<business category> Store`** (e.g. "Distribution Agency Store"), and the CSS variable `--p` (primary colour from Settings, default `#71a5d6`) plus `--pt` (text colour on primary: dark `#10202e` if the colour is light, otherwise white).
* **First-run:** if Settings has no business name and the user is Admin, the app opens Settings with "Welcome! Enter your business details and save to begin."
* Every list is filterable by typing; every destructive action asks `confirm()`.
* Printing: receipts are printed through a hidden print window using the monospace receipt style (Appendix D, `RCSS`), 300 px wide.

### 7.2 Dashboard
**Date bar (top card):** buttons **Today** and **Yesterday** (the active one is filled, the other is the grey `alt` style), a **Pick a date** box (`<input type="date">`, `max` = today) and the text "Showing: YYYY-MM-DD". Choosing a button or a date reloads the whole dashboard for that date (`S.dashDate`, kept while the page is open; empty = today). If bills are due/overdue an amber banner "🔔 N cheque/credit payment(s) due today or overdue. Tap to review." opens Cheques & Credits (banner is about today, not the chosen date).
**KPI cards (labels start with "Today's " for today, "Yesterday's " for yesterday, and are plain, e.g. "Sales", for any other date):** sales (total of all bills) · orders · cash sales · credit sales · cheque sales · (only when > 0) card / bank / other · collections (total received on credit bills) · and **Admin only**: expenses · profit. A second row shows Products and Customers. (Low stock is **not** on the dashboard.)
**"Collections received today / yesterday / on DATE" card:** when something was received: four KPI cards (Total collected with count, Cash, Cheque, Bank transfer) and a table Customer, Bill, Method (+ cheque no.), Amount; otherwise "No collections received …". Under it one line: "Cash received … = cash sales X + cash collected Y [− cash refunds Z] = **T**".
**Sales summary card** ("Today Sales Summary" / "Yesterday Sales Summary" / "Sales Summary · DATE"): table Invoice, Customer, Sales Amount, Type (payment pill); empty message "No sales yet today." / "No sales on this day."
Admin footnote: "Profit = sales that day (excluding tax) − cost of items sold − expenses that day. Credit and cheque sales count as sales when the bill is made; money collected later is shown separately and is not added to sales or profit." Button "🧮 End-of-day closing" (opens today's closing). Cashiers see the same screen without expenses, profit and the footnote.

### 7.3 POS — the mode dropdown
At the top of POS a select **Day sale (default) / Return / Credit payment / Rejected cheque**. The choice is kept while switching screens.

#### Rejected cheque mode (revision 5)
Top row: mode select, a grey hint "A customer's cheque was rejected (bounced) by the bank.", and (Admin) **＋ Cheque that is not in the system** (opens the missed-bill form). **Customer\*** picker (same search as credit mode). Then: (1) a red heading "🚫 Rejected cheques still owed by NAME (N)" with their red cards (expand → Receive payment / Undo rejection); (2) heading "Which cheque was rejected?" and a table of the customer's cheques that are not rejected (newest banking date first, 30 shown): Bill, Banking date, Amount, Status (Banked / Not banked yet), button **🚫 Rejected**. The button opens a window: customer, bill, amount, a note that the customer will owe the amount again (and, if it was banked, that it goes back to "not received"), (Admin) **Date it was rejected** (default today), **Reason (optional)**, buttons **Mark as rejected** (red) / Cancel. Success toast: "Cheque marked as rejected. NAME owes Rs X again."

#### Day sale (thin, fast screen)
* **Quantity focus (revision 5):** tapping a product (or pressing Enter on an exact SKU) adds it and moves the cursor to that cart line's quantity box, selected and highlighted yellow (`.cq:focus`). Typing replaces the quantity (capped at stock); leaving it alone keeps 1 (an invalid/empty entry becomes 1 when you leave the box); **Enter** returns the cursor to the search box. If the cart panel is hidden (phone), nothing is focused.
* **Clear / Close (revision 6):** **Clear** = `cartReset()` (items, returns, customer and special prices, discount value, discount type back to Percent, payment Cash, payDate, cheque rows, sale date) and redraws the products. **Close ✕** = `cartClose()`: on a phone the cart pane closes and the bottom bar stays; on desktop (width ≥ 900 px) the pane and resize bar are hidden (`.pos.nocart`) and the bar becomes a round floating button bottom-right showing items and total (`.cartbar.show`). The bar/button calls `cartOpen()`. State `S.cartHide`.
* Top row: mode select, search box ("Search name or SKU (Enter adds exact SKU)"), category filter. Nothing else.
* **Product grid** of tap cards (name, effective price, stock badge), **sorted most-selling first, least-selling last**. Tapping adds 1 to the cart; out-of-stock items cannot be added; adding more than the stock is refused with the toast "Not enough stock for NAME".
* **Cart panel** (right on desktop, 390 px default):
  * Header "Cart (n)" (or "n + k return(s)"), buttons **↩ Return** (opens the return form, see Return fields), **↔** (desktop: steps width 390 → 560 → 720 → 390) and **Clear**.
  * **Rows (no horizontal scrolling):** item name (wraps) with "Rs price each" under it · **quantity typed in a number box** (decimals allowed, capped at stock) · line total · ✕. Typing updates totals live.
  * Returned items appear below as rows (item, condition/reason, quantity, what we give).
  * **Sale date** (Admin only): defaults to today, cannot be in the future; an earlier date shows "⏪ Back-dated sale: it will be recorded on DATE". Resets to today after each sale.
  * **Customer\*** (required): type to search by name, phone or route; list is sorted best customer first and shows the route; Enter picks the first match; a "✓ Customer selected" hint appears. If the typed name matches nobody exactly, the last line is **➕ Add “name” as a new customer** (form with Name\*, Phone, Address, Route, Email; saved with `saveCustomer`, then selected for the sale).
  * **Payment method:** Cash / Credit / Cheque. Credit asks for a required **Due date**. **Cheque shows one card per cheque** (Amount, Banking date*; ✕ removes a card when there are 2 or more; no cheque number or bank) and a button **+ Add another cheque** (the new card is pre-filled with the amount still missing and the previous date). With one cheque the amount may stay empty (= the full bill). With 2 or more a line shows "✓ The cheques add up to X" (green) or "Cheques total X of Y · still to add Z / too much by Z" (red); it updates live as the cart changes.
  * **Discount:** type (**Percentage by default**, also after every sale; or Amount) and value, **never filled automatically**. Each cart line has a small tick box **"gets discount"** under the item name (ticked = gets it). Under the discount box: "Discount applies to: all items · no items (then tick only the items that get it)". The Totals show "Discount (on Rs X of items)" when only some items get it.
  * **Totals:** Subtotal, Discount, Tax (if enabled), Returns deducted, **Total to pay**, and a red "Give back in cash" line when the returns exceed the bill. A note says replacement items are free and recorded in today's sales.
  * **Checkout button.** Validations in order: cart not empty; customer selected ("Please select a customer: type a name and pick it from the list."); due date for Credit, and for Cheque every cheque needs its banking date and the amounts must add up to the total (checked before the sale is saved), when the total > 0. Then `createSale`, then `savePayment` for credit/cheque (if that second call fails the user is told the sale was saved but the record failed). Afterwards: cart cleared, products reloaded, success toast "Sale INV-… completed", a toast telling how much cash to give back (if any), and the **receipt** modal (Print / Close).
  * **Resizable cart (desktop ≥ 900 px):** a thin drag bar between the grid and the cart (columns `minmax(0,1fr) 8px var(--cw)`), width 300–760 px, remembered in `localStorage.cartW`; clicking the bar twice quickly resets to 390. On phones the bar and ↔ button are hidden; a bottom bar shows "🛒 n item(s) · k return(s)" and the total and opens the cart.
* **Receipt** (monospace, 300 px): logo (if enabled), business name, category, address/phone/email (each toggled in Settings), invoice id, date/time, customer, item lines (`name` then `qty × price … line total`; replacement lines show "(replacement)" and FREE), a "Returned items" block, Subtotal / Discount / Tax / Returns deducted / **Total** / Cash given back, payment method, footer text.

#### Return mode (its own screen)
Mode select, then cards: **Customer\*** (same picker; Admin may pick a past date) → **Item returned** (inline form) → **Returns in this bill** (list, totals "Replacement items to give" and "Cash to give back", buttons **Complete return** and Clear) → **Recent returns** (last 15 with status and what was given).
Return form fields: **Item returned\*** (search), **Quantity\***, **Condition\*** (Faulty/damaged – send to company | Good – put back in stock), **Reason / note**, **What do we give the customer?\*** (Give our good item in place = replacement | Deduct the value from the bill = cash deducted), and for cash deducted **Value per item** (defaults to the selling price). Replacement is refused if stock is short. "Complete return" calls `createSale` with no items; it refuses if the Day-sale cart still has items.

#### Credit payment mode (collections)
Mode select (+ Admin button **＋ Add missed credit bill / cheque**), **Customer\*** picker, then for the chosen customer: KPIs (Owed: credit bills + rejected cheques (count), Overdue, Cheques not yet banked); **rejected cheques are listed with the credit bills they owe (first, red) and can be chosen in "Pay which bill?"**, a **Receive payment** card (dropdown "Pay which bill?" = *Oldest bills first (automatic)* or one bill with its balance; Amount (defaults to that bill's balance / total owed); Paid by Cash/Cheque/Bank Transfer; Date (Admin); Note; button **Receive payment**), then expandable bill cards (oldest first), "Cheques not yet banked", and the latest 10 paid bills. A printable **PAYMENT RECEIPT** modal follows each receipt (bills paid, amount, method, remaining on each bill, total still owed). At the bottom: **Received today** table with totals per method.

### 7.4 Expandable bill cards (Cheques & Credits, credit mode, profile)
Collapsed: ▸, customer (bold), bill number, type badge (+ "old bill"), "Due/Banking DATE" with a coloured pill (**Overdue Nd** red, **Due today / Banking today** amber, **In N days** blue, **Paid · date** green), right side remaining amount "of total". Overdue cards have a light red background, due-today light amber. Expanded: table (bill no., bill date, due/banking date, bill total, received so far, **remaining**, fully paid on, cheque details, note), **Payments received** (date, amount, method/cheque no., note; Admin has Undo) for credit bills, and buttons: **Receive payment** (credit bills with a balance), **Customer** (opens profile), Admin **Delete this old bill** (old bill with nothing received). Cheque cards have a tick box (Admin) = banked (hidden once a cheque is rejected). **Rejected cheque card (revision 5):** light red background with a red left edge, red **REJECTED** badge (or grey "was rejected" once paid), pill "🚫 Rejected · date", remaining amount in red; expanded it also shows "Cheque rejected on", "Reason", **Payments received**, **Receive payment**, Admin **Undo rejection**. Every cheque that is not rejected has a red button **🚫 Cheque rejected** in its expanded card (opens the same window as in POS). Cheque number and bank are no longer shown.

### 7.5 Cheques & Credits page
**Two tab buttons at the top: "Cheques (N)" (default) and "Credits (N)"** (the filled one is active; N = not fully paid); everything below shows only that type (`S.payTab`). Filters: From/To (banking/due date; defaults −30 / +60 days; rejected cheques ignore the dates), Status (All, Not fully paid, Unpaid, Partly paid, **Rejected**, Paid), Search (customer or bill no.), Show. KPIs: Still to collect (Σ remaining, count), Received so far, Overdue, Due today, **🚫 Rejected cheques (Σ remaining, count)**. Then the bill cards in **three groups with headings**: "🚫 Rejected cheques (N)" (red), "⏳ To collect (N)" (earliest banking/due date first), "✅ Paid (N)" (green; most recently paid first) — **paid items are always last**. Rejected cheques are not counted in Overdue / Due today.

### 7.6 Products
Controls: search, category, **Sort by** (Best selling [default], Least selling, By category (best selling first), Name A–Z, Name Z–A, Price high→low, low→high, Stock low→high, high→low, Newest added), **Sales period** (30 days, 90 days default, 12 months, all time), and (Admin) **+ Add product**, **📋 Stock count / adjust**. Note line "Sold = units sold in the last 90 days." Columns (Admin): Name, SKU, Category, Price, Cost, Stock (badge: red 0, amber below limit), Sold, Edit/Delete. Cashier: Name, SKU, Category, Price, Stock, Sold. **By category** mode shows one card per category (name, "· N product(s)", the category **description**, then its products best-selling first) and a final "No category" card.
**Product form:** Name\*, SKU, Category, **Selling price\***, then **"Cost price = selling price minus a discount of\*"** with a select (Percentage % / Amount Rs) and a number box; the **Cost price is calculated and displayed live** (`price × (1 − v/100)` or `price − v`, 2 decimals; flagged red if the discount exceeds the price or the cost would be negative); switching between % and Rs converts the value so the cost stays the same; new products default to Percentage and require the discount (type 0 for none); editing a product shows the existing discount as an **Amount**. Then Stock\*, "Low-stock alert when stock goes below" (default 5), Image URL. There is **no barcode and no profit** anywhere on this page. Delete asks for confirmation and keeps old sales intact.
**Expandable history (revision 2):** every product row is clickable (cursor pointer, ▸/▾ arrow in a first narrow column; Edit/Delete buttons do not toggle it; the note line starts "Tip: click any product to see who bought it and its stock history."). Opening a row loads `getProductHistory` once (cached in `S.phist`, cleared by `loadAll`, "↻ Refresh" button) and shows a card under the row with **summary chips** (In stock now; Total sold + last sale date; Bought by N customer(s); Received from supplier + last date; Coming (invoice not received) when > 0; Sales value; Profit for Admin) and three tab buttons: **👥 Sold to customers (N)** — a **Sort by** select (shown when 2+ customers; Most quantity first [default], Least quantity first, Highest amount first, Most times bought, Last bought newest first, Last bought oldest first, Customer name A–Z; kept per product in `S.phS`), table Customer, Times bought, Qty, Amount, a share bar (qty ÷ highest qty), Last bought; clicking a customer toggles a nested table of their invoices (date, invoice [replacement badge], qty, price, total); **📦 Stock movement** — filter select (Everything / Sold only / Received only / Customer returns / Stock adjustments), table Date, What happened (coloured badge), Reference / who, In (green +), Out (red −), Stock after; 40 lines then "Show all N lines"; a grey last row "Before the records above (opening stock, or changes made before this history existed)" with the `earlier` balance when it is not 0; **🚚 Received from supplier (N)** — Date, Supplier invoice [free badge], Supplier, Qty, Status badge (amber when not received) and, for Admin only, Unit price, Disc %, Net cost each. Reference code: Appendix G.

### 7.7 Low Stock
Count line "N product(s) below their low-stock limit"; Admin button "Order all low stock". Table sorted most selling first: Product, Category, Stock (badge), Limit, **Sold**, (Admin: Cost,) Price, (Admin) "Add to order". Suggested order quantity = `ceil(limit × 2 − stock)` (min 1), cost = current cost.

### 7.8 Categories
Simple list with add/edit/delete (name, description).

### 7.9 Customers
Controls: search (name, phone, email, route, address), **Route** dropdown (All routes [default], each route in use, No route), **Sort** (Most selling first [default], Least selling first, Name A–Z, Newest added), **Period**, **+ Add customer**. Summary line "N customer(s) · route X · Rs … purchases, N order(s) (last 90 days)". Columns: Name (link), Route, Phone, Address, Purchases (amount), Orders, Profile/Edit.
**Customer form:** Name\*, Phone, Email, **Route** (with suggestions), Address. (No discount field.)
**Customer profile:** header (name, route, phone, email, address; Edit, Admin **＋ Missed bill**, Back); KPIs: Total purchases (orders), Outstanding (Σ remaining), Overdue (Σ remaining of overdue), Next due/banking date, Paid so far; **Cheques and credits to collect** table (type, bill, bill date, banking/due date, status pill, amount, **remaining**, details, **Receive** button for credit bills); Settled list; **Purchase history** (date, invoice, first 3 items, total, payment method, **Receipt** button; replacement items marked); Returns; **Special prices** (list + Admin add/remove with a product search).

### 7.10 Sales
**Shortcut buttons: Today, Yesterday** (the active one is filled), a **Pick one day** date box (sets From and To to that day), and **From / To** for any range (default: the last 30 days up to today) + Show + **🧮 End-of-day closing**. A line above the table: "N sale(s) · Rs total · newest first". **The list is always newest date first** (then newest created first); the server sorts that way and the browser sorts again. Table: date, invoice (badges "edited", "↩ N return(s)"), customer, total, payment, **Receipt** button, and (Admin) **Edit** and **Delete**. Delete asks "Delete sale INV-… (Rs …)? Its items (N units) will be put back in stock…".
**Edit sale page (Admin):** note "Editing INV-… It keeps the same invoice number, and stock is adjusted automatically by the difference." Customer picker, Date (max today), Payment (Credit: due date; **Cheque: the same one-card-per-cheque editor as the POS**, loaded from the sale's existing cheque records; if any of those cheques already had money received they are shown read-only with an explanation and cannot be changed here); Items table (item, **typed quantity**, **editable price**, **Discount tick box** [ticked = this item gets the discount; on opening, an item counts as "no discount" when the sale had a discount and the item's stored discount is 0], total, ✕) + "Add an item" search; Discount type/value; live totals (Subtotal, Discount ["on Rs X of items" when only some items get it], Tax, Returns deducted, **New total**, "Was", Cash given back); a read-only card lists returns/replacements on the sale; Save changes / Cancel.

### 7.11 Expenses
List (date, category, amount, description, Edit/Delete) and an add/edit form: Category\* (suggestions Rent, Fuel, Wages, Utilities, Other), Amount\* (> 0), Date\* (default today), Description.

### 7.12 Reports
From/To (default this month) + Group by Day/Week/Month + Show + **This month / Last month** buttons + "Profit by product / customer". Under that row two collapsible cards (`<details>`): **🖨 Print stock & balances report (PDF)** and **🖨 Print customer price list (PDF)** (5.18). Cards: Revenue, Orders, Cost of goods sold, Expenses, Estimated profit; a second row of cards: **Cash sales, Credit sales, Cheque sales, (Card / bank / other when > 0), Collections received**; Sales table with columns **Period, Orders, Sales, Cash, Credit, Cheque, Collected, Cost, Expenses, Profit** (profit green/red) and a bar per period; a **Collections received** card (Cash, Cheque, Bank transfer, Total with receipt count); Best-selling products (top 10); Payment methods; Expenses by category; **Remaining stock on the To date** (a table of items grouped by category: Item, Qty, Sell price, Value, a subtotal row per category and a Total stock value row; filled by `getStockReport{to, parts:['stock']}` after the page appears — the old Low-stock card is gone); footnote "Profit = sales (excluding tax) − cost of items sold (cost saved at the time of sale) − expenses. Cash / Credit / Cheque columns are the bill totals by payment type. Collected = money received on credit bills in that period (not added to sales or profit)."
**Profit page:** From/To (default this month); KPIs Total profit and "Products sold below cost"; By-product table (qty, sales, cost, profit coloured green/red, margin %, "below cost" badge) and By-customer table.

### 7.13 Assistant
Five buttons that answer from the sheet data (no external AI): Sales today, Best sellers (last 90 days), Low stock, Not selling (no sales in 90 days), Sales summary (90 days).

### 7.14 Orders
List: order no., date, supplier, items, order total, linked invoices, **Missing units** (red), status badge (Ordered / Missing items / Complete / Closed / Cancelled), **View** and **Check invoices**. **+ New order** opens the builder (see 5.13) with supplier, notes, product search, editable actual price and quantity, live margin and totals, **Save order**, **Print list**, Cancel. **Check invoices** modal: invoices linked, status, missing/extra units, table (Product, Ordered, On invoices, Missing, Extra, Note — a note box appears for missing items and saves on change), buttons "Accept shortage and close order" / "Reopen order".

### 7.15 Invoices (supplier invoices)
Two tabs: **Invoices | Returns**.
**Invoices tab:** buttons **⬆ Import invoices (PDF / paste)** and **+ Add manually**; filter card: Invoice date from/to, Search (invoice no., tax invoice no., SO no., PO no., customer, supplier, order, terms, place, item code or name), Payment filter, Stock filter, quick buttons Today / Last 7 days / This month / All dates; KPIs (Invoices found, Total value, We owe the company, Waiting to receive stock); **expandable cards** newest first (50 at a time, "Show more"). Collapsed card: ▸, **invoice number**, date · time, supplier, "shipped to **customer**", item count, reference line (Tax invoice, SO, PO, terms, place, order), total, badges (Paid / Partly paid / Unpaid and Stock received / Not received). Expanded: items table (Code, Description [FREE badge], Qty+unit, **Selling price**, Disc %, **Net cost**, Amount, Stock list Existing/New), totals box (Subtotal, Trade discount, VAT, Total, Return credit, Paid, **Balance**), "Stock received on DATE", **Payments to the company** list (Undo), and buttons **Pay**, **Receive stock**, **Link to order / Change order**, **Delete invoice**.
**Import window:** "Our name on invoices" (default `Nethmina`, remembered), Supplier (default `Kelani Cables`, remembered), PDF file chooser, or paste text → **Read invoices**. The result lists every invoice found with a checkbox (ticked only if the ship-to name contains our name, it is not a duplicate, and it has items), date/time/SO, customer, item count, free-item note, total, and warnings ("Already saved", "Not ours", "Items add up to X but the invoice says Y. Check it.", "No item lines could be read"). **Save ticked invoices** saves them as Pending and adds missing products.
**Receive window:** explains how many lines match existing products, lists any new products with selling-price boxes pre-filled from the invoice, and (when some existing products have a different selling price) a tick box "Also set the selling price of N existing product(s) to the invoice price".
**Pay window:** balance, Paid by (Cheque / Bank Transfer), amount (default balance), date, note.
**Manual entry page (revision 2):** header card (invoice no.\*, invoice date\*, supplier [remembered], **Payment type** [Cash default / Credit]). Under it an **Add item** search box ("Search products…") with a drop-down of up to 40 matching products (match on name or SKU; exact SKU / name-starts-with first, then A–Z; shows name, SKU, stock and "already on this invoice"); arrow keys move, **Enter picks**, Esc closes; the last drop-down line is "Add “text” as a new item". Picking a product adds a row **auto-filled**: code = SKU, description = name, unit / selling price / disc % from the **most recent supplier-invoice line with that code** (else the product's selling price, 0 %, unit `Numbers`), **quantity empty**; the cursor jumps to that row's Qty box (selected). **Enter in Qty returns to the search box** for the next item. Picking a product already on the invoice just focuses its Qty. Rows show Code, Description, **Qty\*** (highlighted box), Unit, Selling price, Disc %, Amount, ✕ remove — **Code, Description and Unit are read-only when the product already exists in Products** (🔒, ✎ opens it in Products); Qty, Selling price and Amount stay editable; **Disc % is editable only when the Payment type is Credit**; on Cash it is read-only and keeps its value (revision 10 also locks the selling price of products that already exist on Cash). A custom item button ("+ Item not in Products") adds a blank row (code gets the focus); such items are created in Products when the invoice is saved. Live totals box: items / units, Subtotal, Trade discount, Total. Save checks: invoice no., date, at least one item, a code on every row, quantity > 0 on every row. Reference code: Appendix F.
**Delete invoice** confirmation says how many units come out of stock and that product details are not deleted.
**Returns tab:** KPIs (units with us + value, sent waiting for credit, credit received); buttons **+ New customer return** (stand-alone return), **Mark ticked as sent to company**, **Record company credit for ticked**; table (tick box for With us/Sent, date, customer, product, qty, cost value, "What we gave" + condition, status badge + claim ref, company credit). **Credit window:** "Credit note: cost deducted from our invoice" (amount defaulting to the cost value, invoice drop-down, "Credit note no. / note") or "Company gave the items back (replacement)" (item list pre-filled).

### 7.16 Stock count / adjust (Admin)
Reason (Stocktake, Damaged, Lost, Found, Other), Note, product search; table (Product, SKU, System stock, **Counted** box, Difference coloured); **Save adjustments** (confirms the number of products); "Recent adjustments" table below.

### 7.17 End-of-day closing
Date + Load. KPI cards: Cash sales, Credit sales (not cash), Cheque sales (not cash), Credit payments received (cash), Cash refunds paid out. Form: Opening cash (float), Cash expenses paid today (defaults to the day's expenses), **Counted cash\***, Note; live "Expected cash = opening + cash sales + credit payments received − cash expenses − cash refunds = X" and "Difference: +/−X (matches / short / extra)". **Save closing**. "Previous closings" table (date, opening, cash sales, expected, counted, difference coloured, by).

### 7.18 Settings (Admin)
Form fields in this order: Business name\*, Business category, Currency code, Currency symbol, Address, City, Country, Phone, Email, Website, Logo URL, Primary colour (colour picker), Tax enabled (checkbox), Tax rate (%), Receipt footer, and four checkboxes: show address / phone / email / logo on receipts. Below: **Users** (table, Edit, + Add user; role help text) and **Backups** (last backup time, daily-backup ON/OFF, "Back up now", "Turn on/off daily backup").

---

## 8. Supplier-invoice reading (import) — algorithm summary

The importer turns text from a supplier PDF into invoice objects. Two printed formats exist and both must work; the same function handles both. **The complete reference code is in Appendix E** (`invParse`, `words2num`, `pdfText`). Key ideas:

0. **Pre-clean (revision 2).** Remove `\r`; turn non-breaking spaces into spaces; when a known label is followed by a line break and the value is on the next line, join them (labels: Tax Invoice No, Date of Invoice, Supplier's Name, Purchaser's Name, Place of Supply, Sales person, SO No, CUS PO No, Posting Time/Date, Sub Total, VAT Amount, Total Amount/consideration Including VAT, Total LKR, Trade Discount Amount, Total Value of Supply). This is what makes text **pasted** from a PDF viewer (values on separate lines) readable.
1. **Page splitting.** If the text contains form-feed characters (`\f`), each form-feed-separated chunk is one page (the PDF reader inserts them). Otherwise: if an invoice number/“Tax Invoice No” label appears **before** the first item-table header, the text is in *visual order* and pages start at each "`N of M`"/"`Page N of M`" marker; otherwise it is in *stream order* and a page starts at each item-table header row. **Fallback (revision 2):** if no `N of M` markers are found in visual order (typical for pasted text) the text is cut where each invoice's own labels (`Tax Invoice No`, `INVOICE NO.:`, `KSI-nnnnnnn`) start between one item-table header and the next, so one pasted invoice or several pasted together both work (`No. Location Description QTY UOM Unit Price Disc% Amount`).
2. **Items.** The text between the header row and the first of `****`, `Shiping Details`, `Subtotal`/`Sub Total`, `Total Value of Supply` is flattened to one line and scanned with the item expression `code location 4-digit-salesperson-code description qty uom unitPrice [disc%] amount`. The disc % is optional (a line with none is a candidate **free item**). Wrapped descriptions are re-attached; `Numbe rs` → `Numbers`.
3. **Header fields.** Old format: invoice no. `KSI-nnnnnnn`, ship-to from `Shiping Details:`, date `Mon DD, YYYY` from "Posting Date", totals from `Total LKR`, `Subtotal`, `Trade Discount Amount`, terms token after the `O…` PO code. New "Tax Invoice" format: `Tax Invoice No`, `Date of Invoice MM/DD/YYYY`, `Supplier's Name`, purchaser name, place of supply, salesperson, `SO No Knnnnnn`, `CUS PO No`, terms (`CASH…`/`CREDIT`/`CHEQUE…`), posting time `h:mm AM/PM` (ignoring the print time that follows a date), VAT block (`Total Value of Supply`, `VAT Amount`, `Total Amount/consideration Including VAT`, `Sub Total`), and the total **in words** (`**** ONE HUNDRED … AND46/100`) converted by `words2num`.
4. **Merging pages.** A page numbered `n of m` with n > 1 whose SO number (and time) match the previous page is merged into it; every page numbered 1 starts a new invoice. Missing header fields are filled from the other page.
4b. **Run-on values (revision 2).** The customer (purchaser), supplier and place-of-supply values are cut at the first of: Address, Telephone, Tel, Place of Supply, Sales person, SO No, CUS PO, L/C, Posting, Date of Invoice, Supplier's, Purchaser's, Tax Invoice, Page.
5. **Invoice number.** `KSI-…` if present, else the Tax Invoice No (which the supplier prints identically on every page of one print run — so duplicates are told apart by SO no. + time), else `SO · time`.
6. **Totals.** subtotal = printed Sub Total or Σ item amounts; discount = printed or Σ(amount × disc%); total = printed total incl. VAT, else the total in words, else subtotal − discount. If the printed total is lower than the items imply and exactly the no-discount line(s) explain the gap, those lines are marked **free** (`free=true`, amount 0, description + " (FREE)").
7. **Checks.** `ok` = items found and Σ amounts equals the printed subtotal (± 0.05); the import window warns when not ok. When nothing is found the message is: "No invoices were found. Copy the whole invoice, including the table heading row (No. Location Description QTY UOM Unit Price Disc% Amount), or upload the PDF."
8. **PDF upload** (pdf.js): each page's text items are grouped into rows by their vertical position (tolerance 3), sorted left to right, joined with three spaces, rows joined with newlines, pages joined with `\f`.

---
## 9. Setup and deployment (the exact steps)

1. Create a Google Sheet. **Extensions → Apps Script**. Delete the sample code and paste `Code.gs`. Save.
2. Run **`setupDatabase`** once (accept the permission prompt). This creates every sheet and the default settings.
3. Run **`authorizeAll`** once (grants Drive and trigger permission used by backups).
4. **Deploy → New deployment → Web app**: Execute as **Me**, access **Anyone**. Copy the `/exec` URL. For later code changes use **Deploy → Manage deployments → pencil → Version: New version → Deploy** (the URL stays the same).
5. Put the URL in `GOOGLE_SCRIPT_URL` at the top of `index.html`. Open `index.html` in a browser (a local file works; for the phone, host the file on any static host).
6. First visit → **Create the Admin account**. Then Settings → fill the business details. Settings → Users → add cashiers. Settings → Backups → turn on the daily backup.
7. Optional: import the supplier's invoice PDFs (Invoices → Import) so products and stock are created.

## 10. Acceptance checklist (what a correct rebuild must do)

**Login and roles**
* First run shows "Create the Admin account"; after that, login. Wrong password five times locks that username for 5 minutes. A deactivated user cannot log in. The last active Admin cannot be demoted or switched off.
* A cashier calling an Admin-only action gets "You do not have permission to do that." A cashier never receives product `cost`, sale-item `unitCost`, dashboard profit/expenses, or profit in product sales.

**Selling**
* Sale total = subtotal − discount + tax − cash-deducted returns, never below 0; any excess is a cash refund; method forced to Cash when the total is 0.
* A customer special price is used by the server even if the screen shows another price; there is **no** default discount.
* Typing a quantity in the cart works (decimals, capped at stock). The cart never scrolls sideways; its width can be changed and is remembered.
* Admin can pick an earlier sale date; invoice numbers use that date and never repeat after deletions; cashiers cannot back-date.
* A failed sale leaves no rows and no stock change.

**Returns**
* A return needs no earlier purchase. Replacement given → free line in the same sale, stock down. Cash deducted → bill reduced / cash refund. Good → back in stock (`Restocked`). Faulty → `With us` → `Sent` → `Credited` (items back: stock up, or credit note: invoice `returnCredit` up).

**Credit and cheques**
* Credit bill creates a Payments row with the due date; cheque with the banking date. Part payments create receipts, change the status Unpaid → Partly paid → Paid, store the date, and can be listed per bill. Oldest-first allocation works across bills. A cashier can receive but cannot undo, back-date, add old bills or delete anything.
* Old bills can be added without items, are not sales, appear in overdue alerts and can be collected; unused ones can be deleted.
* Deleting or changing a sale whose bill has received money is refused.

**Stock**
* Sale edit/delete, replacement, good return, supplier invoice receive/delete, stock count and company give-back all change stock by exactly the right difference; delete/edit/invoice-delete/stock-count changes are logged in StockAdjustments.
* Low stock = strictly below the limit.
* Saving a supplier invoice creates every missing product (stock 0, price = invoice unit price, cost = net after discount). Receiving adds stock and sets cost; deleting a received invoice removes only the stock and keeps the product.

**Supplier invoices and orders**
* Both PDF formats import correctly: all invoices found, only the ones addressed to "our name" ticked, multi-page invoices merged, totals read from the numbers or from the words, free lines detected, duplicates refused, the same invoice number allowed when SO no./time differ.
* Payments to the supplier (Cheque/Bank Transfer, partial allowed) change Unpaid/Partly/Paid; undo works. Linking an invoice to an order shows ordered vs invoiced, missing and extra units, per-item notes, and can be closed or reopened.

**Reporting**
* Dashboard, reports and profit-by-product/customer use the formulas in 5.15–5.16; End-of-day expected cash subtracts cash refunds and counts only cash receipts.
* Products can be sorted best/least selling, by category with descriptions, and the same most-selling-first order applies to the POS grid, Low Stock, Customers and the customer pickers; customers can be filtered by route.

**Revision 2**
* Pasting a supplier invoice (single or several, with or without page markers, values on the same or the next line) is read; the error message above is shown only when no item-table heading exists.
* Manual supplier invoice: search → pick → only quantity typed → Enter → next item; fields auto-fill from the last invoice price/discount/unit; saving rejects missing quantities.
* Products: clicking a row opens the history card; the ledger's "Stock after" of the newest line equals the current stock; cashiers never see cost, profit or supplier prices.

**Revision 3**
* Dashboard: Today and Yesterday buttons and a date picker reload everything for that date; labels say Today's / Yesterday's / plain. Sales = cash + credit + cheque (+ other). Collections block lists each receipt of that date with totals by Cash / Cheque / Bank transfer. Profit (Admin) = that day's sales excl. tax − cost − that day's expenses; collections never change sales or profit. Cashier never receives `expenses`, `grossProfit` or `profit`.
* Reports: cash / credit / cheque / collected / cost / expenses / profit columns per period; the column totals match the cards above them (profit per period adds up to the Estimated profit card).

**Revision 5**
* No screen asks for or shows a cheque number or bank. A bounced cheque is marked rejected (Cheques & Credits button or POS mode), turns red and goes to the top, the customer owes it again, and paying it (cash / bank / new cheque) clears it; Admin can undo while nothing was received. Paid cheques/credits are listed last. Rejected cheques show even outside the date filter.
* Supplier invoices: invoice date and received date (both default today) can be set when adding/receiving and edited later with Edit dates. Discount type defaults to Percentage. After tapping a product the quantity box of that line is focused and highlighted; empty = 1.

**Revision 4**
* No customer has an automatic discount. A 10 % discount on a cart of A (Rs 200, gets it) + B (Rs 300, un-ticked) is Rs 20, total Rs 480; the stored line discount of B is 0 and of A is 20. An amount discount larger than the ticked items' total is refused.
* A bill of Rs 1,000 paid with cheques of 600 (1 Dec) and 400 (15 Dec) creates two Payments rows (amounts 600 and 400, notes "Cheque 1 of 2", "Cheque 2 of 2"); amounts that do not add up are refused before the sale is saved; each cheque can be banked on its own; editing such a sale without changing the total keeps both cheques.
* Product history → Sold to customers can be sorted by quantity, amount, times bought, last bought and name.
* Sales: opens newest first; Today / Yesterday / Pick one day / From–To all work.

**Interface**
* Sidebar order, role-filtered menus, red badges, mobile layout, expandable cards, receipts (sale and payment) printable, toast messages, and confirmation dialogs as described in section 7.

## 11. Decisions made on purpose (do not "fix" these)

* **No barcode** (removed by request); **no profit column** on the Products page; **no low-stock card** on the dashboard.
* **Low stock is strictly "below" the limit.**
* **Orders do not add stock**; only received supplier invoices do (prevents double counting).
* **Cashier cannot back-date** anything and cannot see costs or profit.
* **Deleting an invoice or a product never deletes product details**; only stock is reversed. Products are only removed by Admin with the Delete button on the Products page.
* **Supplier invoice "unit price" is the selling price**; cost is that price after the trade discount (VAT-inclusive prices are used as printed).
* **Returns are handled inside the bill** (replacement is a free line in the same sale), not as a separate refund system.
* **The assistant is a set of local summaries**, not an external AI.
* **Product history never changes stock**; the running balance is worked backwards from the current stock, and anything it cannot explain is shown as one "before the records" line instead of being guessed.
* No barcode scanning, no WhatsApp/SMS, no Sinhala/Tamil receipts (declined features).

* **A bounced cheque is a debt, never deleted:** it stays visible (red, top of the list, even outside the date filter) until paid or the Admin undoes the rejection.
* **No default discount, ever.** Discounts are typed per bill and can be limited to chosen items.
* **Dashboard and report profit never include money collected later.** A credit or cheque sale is profit on the day the bill is made; collections are shown on their own line. (Do not add collections to sales or profit.)

## 12. Suggested instruction for another AI

> Build the system described in this document. Deliver two files: `Code.gs` (Google Apps Script backend) and `index.html` (single-file front end, vanilla JavaScript, no framework). Reproduce the sheet schemas in Appendix A exactly, implement every action in Appendix B with the rules in sections 3 and 5, and the screens in section 7. Use the styles in Appendix D and the invoice reader in Appendix E unchanged. After building, verify against the checklist in section 10 using a simulated spreadsheet for the backend (stub `SpreadsheetApp`, `LockService`, `CacheService`, `Utilities`) and a headless browser for the screens.

**Suggested build order:** (1) helpers, schemas, `setupDatabase`, dispatcher, auth and roles; (2) settings, categories, products, customers; (3) `createSale` with returns, special prices, back-dating; POS day-sale screen with receipt; (4) payments, receipts, old bills, collections and the Cheques & Credits/credit-payment screens; (5) sale edit/delete; (6) supplier invoices, importer, payments, orders and matching; (7) returns to the company; (8) stock count, expenses, reports, profit report, end-of-day, dashboard; (9) sorting and route filters, cart resizing, backups, polish.

## 13. Glossary

* **Day sale** – an ordinary POS sale. **Credit bill** – a sale paid later by the customer. **Collection / receipt** – money received on a credit bill. **Old (missed) bill** – a credit bill or cheque entered without items. **Replacement** – a good item given free to a customer for a faulty return. **Cash deducted** – returned item value taken off the bill. **With us / Sent / Credited / Restocked** – the life of a returned item. **Credit note** – the supplier reducing what we owe for returned goods. **SO No / PO No / Tax Invoice No** – supplier document references. **Net cost** – supplier selling price after trade discount. **Route** – a customer's delivery route (area).

---
## Appendix A — Exact sheet schemas (column order matters)

Every sheet's first row holds these column names. Add new columns only at the end.

**Settings** (3 columns): `key, value, updatedAt`

**Products** (14 columns): `id, sku, barcode, name, categoryId, categoryName, price, cost, stock, lowStockLimit, imageUrl, active, createdAt, updatedAt`

**Categories** (6 columns): `id, name, description, active, createdAt, updatedAt`

**Sales** (16 columns): `id, invoiceId, customerId, customerName, subtotal, discount, tax, total, paymentMethod, itemCount, date, createdAt, returnDeduction, refund, editedAt, editedBy`

**SaleItems** (13 columns): `id, saleId, invoiceId, productId, productName, sku, quantity, unitPrice, unitCost, discount, lineTotal, createdAt, kind`

**Customers** (9 columns): `id, name, phone, email, address, createdAt, updatedAt, discountPercent, route` (`discountPercent` is a left-over column: never used, always 0)

**Expenses** (7 columns): `id, category, amount, date, description, createdAt, updatedAt`

**Payments** (21 columns): `id, type, invoiceId, saleId, customerId, customerName, amount, date, chequeNo, bank, status, paidDate, createdAt, updatedAt, paidAmount, billDate, source, note, rejectedDate, rejectNote, receiptId` (`receiptId` = comma-separated Receipt ids that this cheque was received for; empty for other rows)

**Receipts** (13 columns): `id, paymentId, invoiceId, customerId, customerName, date, amount, method, chequeNo, bank, note, createdBy, createdAt`

**Orders** (13 columns): `id, orderNo, date, supplier, status, itemsJson, totalCost, expectedRevenue, notes, receivedDate, createdAt, updatedAt, missingNotes`

**SupplierInvoices** (26 columns): `id, invoiceNo, date, supplier, customerName, payMethod, subtotal, discount, total, itemsJson, status, receivedDate, notes, createdAt, updatedAt, returnCredit, paidAmount, orderId, orderNo, taxInvoiceNo, soNo, poNo, postingTime, place, vatAmount, salesperson`

**Returns** (25 columns): `id, date, customerId, customerName, productId, sku, productName, quantity, unitCost, reason, replaced, status, sentDate, claimRef, creditType, creditAmount, creditInvoiceNo, creditNote, creditedDate, createdAt, updatedAt, saleInvoice, resolution, condition, value`

**Users** (8 columns): `id, username, salt, hash, role, active, createdAt, updatedAt`

**SupplierPayments** (9 columns): `id, invoiceId, invoiceNo, date, method, amount, note, createdBy, createdAt`

**DeletedSales** (13 columns): `id, saleId, invoiceId, date, customerId, customerName, total, paymentMethod, reason, deletedBy, deletedAt, deletedDate, itemsJson` (new in revision 7; `date`, `deletedDate`, `deletedAt`, `itemsJson` are text columns)

**StockAdjustments** (12 columns, `type` is free text: Stocktake, Damaged, Lost, Found, Other, **Sale deleted**): `id, date, productId, sku, productName, oldStock, newStock, change, type, reason, createdBy, createdAt`

**DayClose** (14 columns): `id, date, openingFloat, cashSales, cashFromSettlements, cashExpenses, expectedCash, countedCash, difference, note, closedBy, createdAt, updatedAt, cashRefunds`

**CustomerPrices** (6 columns): `id, customerId, productId, productName, price, updatedAt`

## Appendix B — All backend actions and who may call them

| Action | Server function | Role |
|---|---|---|
| `getSettings` | `getSettings_` | Cashier + Admin |
| `saveSettings` | `saveSettings_` | Admin only |
| `getProducts` | `getProducts_` | Cashier + Admin |
| `saveProduct` | `saveProduct_` | Admin only |
| `updateProduct` | `updateProduct_` | Admin only |
| `deleteProduct` | `deleteProduct_` | Admin only |
| `getCategories` | `getCategories_` | Cashier + Admin |
| `saveCategory` | `saveCategory_` | Admin only |
| `getCustomers` | `getCustomers_` | Cashier + Admin |
| `saveCustomer` | `saveCustomer_` | Cashier + Admin |
| `getSales` | `getSales_` | Cashier + Admin |
| `createSale` | `createSale_` | Cashier + Admin |
| `getExpenses` | `getExpenses_` | Admin only |
| `saveExpense` | `saveExpense_` | Admin only |
| `updateExpense` | `updateExpense_` | Admin only |
| `deleteExpense` | `deleteExpense_` | Admin only |
| `getDashboardData` | `dashboard_` | Cashier + Admin |
| `getReports` | `reports_` | Admin only |
| `getPayments` | `getPayments_` | Cashier + Admin |
| `savePayment` | `savePayment_` | Admin only |
| `markPayment` | `markPayment_` | Admin only |
| `getOrders` | `getOrders_` | Admin only |
| `saveOrder` | `saveOrder_` | Admin only |
| `updateOrderStatus` | `updateOrderStatus_` | Admin only |
| `getSupplierInvoices` | `getSupplierInvoices_` | Admin only |
| `saveSupplierInvoice` | `saveSupplierInvoice_` | Admin only |
| `receiveSupplierInvoice` | `receiveSupplierInvoice_` | Admin only |
| `deleteSupplierInvoice` | `deleteSupplierInvoice_` | Admin only |
| `deleteSale` | `deleteSale_` | Admin only |
| `updateSale` | `updateSale_` | Admin only |
| `receiveCollection` | `receiveCollection_` | Cashier + Admin |
| `getReceipts` | `getReceipts_` | Cashier + Admin |
| `deleteReceipt` | `deleteReceipt_` | Admin only |
| `addOldBill` | `addOldBill_` | Admin only |
| `deletePayment` | `deletePayment_` | Admin only |
| `getReturns` | `getReturns_` | Cashier + Admin |
| `saveReturn` | `saveReturn_` | Cashier + Admin |
| `markReturnsSent` | `markReturnsSent_` | Admin only |
| `creditReturns` | `creditReturns_` | Admin only |
| `authStatus` | `authStatus_` | Open |
| `login` | `login_` | Open |
| `setupAdmin` | `setupAdmin_` | Open |
| `logout` | `logout_` | Cashier + Admin |
| `changePassword` | `changePassword_` | Cashier + Admin |
| `getUsers` | `getUsers_` | Admin only |
| `saveUser` | `saveUser_` | Admin only |
| `paySupplierInvoice` | `paySupplierInvoice_` | Admin only |
| `getSupplierPayments` | `getSupplierPayments_` | Admin only |
| `deleteSupplierPayment` | `deleteSupplierPayment_` | Admin only |
| `getOrderCheck` | `getOrderCheck_` | Admin only |
| `saveOrderNote` | `saveOrderNote_` | Admin only |
| `closeOrder` | `closeOrder_` | Admin only |
| `linkInvoiceToOrder` | `linkInvoiceToOrder_` | Admin only |
| `adjustStock` | `adjustStock_` | Admin only |
| `getStockAdjustments` | `getStockAdjustments_` | Admin only |
| `getDayClose` | `getDayClose_` | Cashier + Admin |
| `saveDayClose` | `saveDayClose_` | Cashier + Admin |
| `getDayCloses` | `getDayCloses_` | Cashier + Admin |
| `getProfitReport` | `getProfitReport_` | Admin only |
| `getProductSales` | `getProductSales_` | Cashier + Admin |
| `getProductHistory` | `getProductHistory_` | Cashier + Admin (prices/cost/profit fields Admin only) |
| `getCustomerSales` | `getCustomerSales_` | Cashier + Admin |
| `getCustomerPrices` | `getCustomerPrices_` | Cashier + Admin |
| `saveCustomerPrice` | `saveCustomerPrice_` | Admin only |
| `deleteCustomerPrice` | `deleteCustomerPrice_` | Admin only |
| `backupNow` | `backupNow_` | Admin only |
| `getBackupInfo` | `getBackupInfo_` | Admin only |
| `setBackupTrigger` | `setBackupTrigger_` | Admin only |

Total: 72 actions (counted from `actions_()`; revision 5 added `rejectCheque` and `setInvoiceDates`; revision 7 added `getDeletedSales` and `getStockReport`). Dispatcher: `handle_(action,payload)` — unknown action → "Unknown action."; `ensureDb_()`; open actions skip auth; otherwise token → user (else `LOGIN_REQUIRED`); cashier outside its list → "You do not have permission to do that."

## Appendix C — Defaults and constants

**Default Settings (seeded once):**
```js
const DEFAULTS = {
  businessName: 'CEYLON VOLT DISTRIBUTOR', businessCategory: 'Distribution Agency', currency: 'LKR', currencySymbol: 'Rs',
  address: '96/A Janaraja Rd,Waharaja Watte,Matara,Sri Lanka', city: 'Matara', country: 'Sri Lanka', phone: '0715958068',
  email: 'ceylonvoltdistributor@gmail.com', website: '', businessSiteUrl: 'http://kclsfa.acl.lk:8796/Reports/ReportPrint.aspx', logo: 'https://i.ibb.co/yBgr6Jts/Ceylon-Volt-Distributor-Logo-1.png',
  primaryColor: '#71a5d6', taxEnabled: 'false', taxRate: '0', receiptFooter: 'Thank You !',
  receiptShowAddress: 'true', receiptShowPhone: 'true', receiptShowEmail: 'false', receiptShowLogo: 'true'
};
```
* `PAY = ['Cash', 'Card', 'Cheque', 'Credit', 'Bank Transfer', 'Other']`
* `PAY_TYPES = ['Cheque', 'Credit']`
* `ORDER_STATUS = ['Ordered', 'Received', 'Cancelled', 'Closed']`
* `RET_TYPES = ['Deduction', 'Free items']`
* `SUP_METHODS = ['Cheque', 'Bank Transfer']`
* `ADJ_TYPES = ['Stocktake', 'Damaged', 'Lost', 'Found', 'Other']`
* `COLLECT_METHODS = ['Cash', 'Cheque', 'Bank Transfer']`
* `BOOL_KEYS = ['taxEnabled', 'receiptShowAddress', 'receiptShowPhone', 'receiptShowEmail', 'receiptShowLogo']`

**Settings form fields (order, key, label, input type):**
```js
const SF=[['businessName','Business name','text'],['businessCategory','Business category','text'],['currency','Currency code (e.g. LKR)','text'],['currencySymbol','Currency symbol (e.g. Rs)','text'],['address','Address','text'],['city','City','text'],['country','Country','text'],['phone','Phone','text'],['email','Email','email'],['website','Website','text'],['logo','Logo URL','text'],['primaryColor','Primary color','color'],['taxEnabled','Tax enabled','bool'],['taxRate','Tax rate (%)','number'],['receiptFooter','Receipt footer','text'],['receiptShowAddress','Receipt: show address','bool'],['receiptShowPhone','Receipt: show phone','bool'],['receiptShowEmail','Receipt: show email','bool'],['receiptShowLogo','Receipt: show logo','bool']];
```
## Appendix D — Styles

**Main stylesheet (verbatim from the reference `index.html`):**
```css
:root{--p:#71a5d6;--pt:#10202e;--bg:#f3f5f8;--t:#1d2733;--m:#66727f;--b:#dfe4ea}
*{box-sizing:border-box}
body{margin:0;font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--t)}
.shell{display:flex;min-height:100vh}
.side{width:250px;flex:none;background:linear-gradient(180deg,#0b1d45,#07122b);color:#fff;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;z-index:20}
.brand{display:flex;align-items:center;gap:10px;padding:16px 14px 10px}
.brand img{height:34px;width:34px;object-fit:contain;border-radius:6px;background:#fff;padding:2px}
.brand h1{font-size:13px;margin:0;color:#8fe3ff;letter-spacing:.3px;text-transform:uppercase}
.brand small{display:block;font-size:12px;color:#9fb3d6}
nav{display:flex;flex-direction:column;gap:4px;padding:14px 12px}
nav button{display:flex;align-items:center;gap:12px;border:0;background:none;padding:12px 14px;font:inherit;font-size:16px;color:#c9d6ee;border-radius:24px;cursor:pointer;text-align:left}
nav button .ic{width:24px;text-align:center;font-size:18px}
nav button .ch{opacity:.55;font-size:13px}
nav button:hover{background:#ffffff12}
nav button.on{background:linear-gradient(90deg,#3b4f7a,#26365c);color:#fff;font-weight:600}
.content{flex:1;min-width:0}
.top{background:#fff;padding:18px 24px;border-bottom:1px solid var(--b)}
.top h2{margin:0;font-size:26px;font-weight:500}
main{padding:20px 24px;max-width:1400px;margin:auto}
.kpis{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.kpi{position:relative;border-radius:14px;padding:14px 14px 12px;box-shadow:0 4px 10px #0000001a;color:#1d2733;overflow:hidden;min-height:76px}
.kpi b{display:block;font-size:22px;font-weight:600}.kpi span{font-size:13px;opacity:.85}
.kpi i{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-style:normal;font-size:26px;opacity:.45}
.g0{background:linear-gradient(135deg,#f6a3b4,#f9c1b0)}.g1{background:linear-gradient(135deg,#b9a3f2,#d9c8f7)}
.g2{background:linear-gradient(135deg,#8fd3f4,#b6e8f5)}.g3{background:linear-gradient(135deg,#f8b98b,#fbd9a0)}
.g4{background:linear-gradient(135deg,#8ee0c4,#b8efd9)}.g5{background:linear-gradient(135deg,#f7a1a1,#f9c2b3)}
.g6{background:linear-gradient(135deg,#b4c4ee,#d3dbf5)}
.nb{background:#e5484d;color:#fff;border-radius:99px;font-size:11px;padding:1px 7px;margin-left:4px}
.combo{position:relative}
.login{position:fixed;inset:0;background:linear-gradient(135deg,#0b1d45,#07122b);z-index:200;display:none;align-items:center;justify-content:center;padding:16px}
.lbox{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:360px}.lbox h2{margin:0 0 6px}
.usr{margin-top:auto;padding:14px;border-top:1px solid #ffffff22;font-size:13px;color:#c9d6ee;cursor:pointer}.usr:hover{background:#ffffff12}
.cl{position:absolute;left:0;right:0;top:100%;max-height:220px;overflow-y:auto;background:#fff;border:1px solid var(--b);border-radius:8px;z-index:60;box-shadow:0 6px 16px #0003}
.cl div{padding:9px 10px;cursor:pointer;border-bottom:1px solid #f0f2f5}.cl div:hover{background:#eef3f9}
tr.rowov{background:#ffe9e9}tr.rowdn{background:#fff3d6}
.pill.ov{background:#ffb3b3}.pill.dueN{background:#ffd88a}
.pill{display:inline-block;padding:6px 14px;border-radius:12px;font-size:15px;box-shadow:0 2px 5px #0000001a}
.pm-Cash{background:linear-gradient(135deg,#f6a3b4,#f9c1c8)}.pm-Card{background:linear-gradient(135deg,#9fd0f5,#c3e3f8)}
.pm-Cheque{background:linear-gradient(135deg,#c3a7f3,#dccaf7)}.pm-Bank{background:linear-gradient(135deg,#f8c08f,#fbdca8)}
.pm-Other{background:linear-gradient(135deg,#9fe3c8,#c0f0dc)}
.sumcard{border-radius:14px;padding:18px 16px;margin-top:20px;box-shadow:0 2px 8px #0000000f}
.sumcard h3{font-size:20px;font-weight:500;margin-bottom:22px}
.sumcard th{font-size:16px;color:var(--t);font-weight:600;padding:14px 12px}.sumcard td{padding:16px 12px;font-size:16px}
h3{margin:0 0 8px}
.card{background:#fff;border:1px solid var(--b);border-radius:8px;padding:12px;margin-bottom:12px}
.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.stat b{display:block;font-size:20px}.stat span{color:var(--m);font-size:12px}
.btn{background:var(--p);color:var(--pt);border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:600;cursor:pointer;min-height:40px}
.btn.alt{background:#e8edf2;color:var(--t)}.btn.red{background:#d64545;color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}
.btn:focus-visible,input:focus-visible,select:focus-visible,.prod:focus-visible{outline:3px solid #2a6fb0;outline-offset:1px}
input,select{width:100%;padding:10px;border:1px solid var(--b);border-radius:8px;font:inherit;background:#fff;color:var(--t)}
input[type=checkbox]{width:auto;margin-right:6px}
label{display:block;font-size:12px;color:var(--m);margin:8px 0 3px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.row>*{flex:1;min-width:110px}
.tw{overflow-x:auto}table{width:100%;border-collapse:collapse}
th,td{padding:8px;border-bottom:1px solid var(--b);text-align:left;white-space:nowrap}th{font-size:12px;color:var(--m)}.r{text-align:right}
.pos{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
.pgrid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
.prod{background:#fff;border:1px solid var(--b);border-radius:8px;padding:8px;text-align:left;cursor:pointer;font:inherit;color:var(--t)}
.prod img{width:100%;height:60px;object-fit:cover;border-radius:6px}.prod.out{opacity:.45}
.badge{font-size:11px;padding:2px 7px;border-radius:99px;background:#e8edf2}.badge.warn{background:#ffe3b3}.badge.bad{background:#ffd0d0}
.cartbar{display:none}
.rsz,.desk{display:none}
@media(min-width:900px){.pos{grid-template-columns:minmax(0,1fr) 8px var(--cw,390px);column-gap:4px}
 .rsz{display:block;cursor:col-resize;border-radius:4px;position:relative;touch-action:none}.rsz:hover,.rsz.on{background:#9db4cf}
 .rsz::after{content:'';position:absolute;left:3px;top:50%;height:36px;width:2px;background:#9aa7b5;transform:translateY(-50%);border-radius:2px}
 .desk{display:inline-block}}
.cartpane{min-width:0;overflow-x:hidden}.cartpane td,.cartpane th{white-space:normal}.cartpane .tw{overflow-x:visible}
.cl2{margin-top:8px}
.ci{display:grid;grid-template-columns:minmax(0,1fr) 78px minmax(70px,auto) 30px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--b)}
.ci.hd{font-size:12px;color:var(--m);padding:2px 0;border-bottom:0}
.ci .cn{min-width:0;line-height:1.25}.ci .cn b{display:block;font-weight:600;word-break:break-word}.ci .cn small{display:block;color:var(--m);font-size:12px}
.ci .cq{width:100%;min-width:0;padding:6px;box-sizing:border-box}.ci .cq2{text-align:center}.ci .ct{text-align:right;font-weight:600;word-break:break-word}
.ci .cx{padding:4px 0;width:30px;min-width:0}
nav button .lb{flex:1}
@media(max-width:899px){
 .usr{display:none}
 .shell{flex-direction:column}
 .side{width:100%;height:auto;position:sticky;top:0;flex-direction:row;align-items:center;overflow:visible}
 .brand{padding:8px 10px}.brand small{display:none}
 nav{flex-direction:row;overflow-x:auto;padding:6px;flex:1}
 nav button{padding:8px 12px;font-size:14px;white-space:nowrap}nav button .ch{display:none}
 .top{padding:12px 14px}.top h2{font-size:20px}main{padding:12px}}
@media(max-width:899px){
 .cartbar{display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--p);color:var(--pt);padding:14px 16px;justify-content:space-between;z-index:30;cursor:pointer;font-weight:600}
 main{padding-bottom:76px}.cartpane{display:none}
 .cartpane.open{display:block;position:fixed;inset:0;z-index:40;background:var(--bg);overflow:auto;padding:12px;border-radius:0}}
.modal{position:fixed;inset:0;background:#0007;z-index:50;display:flex;align-items:flex-end;justify-content:center}
.mbox{background:#fff;border-radius:14px 14px 0 0;width:100%;max-width:560px;max-height:92vh;overflow:auto;padding:16px}
@media(min-width:600px){.modal{align-items:center}.mbox{border-radius:14px}}
#toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99;display:flex;flex-direction:column;gap:6px;width:max-content;max-width:92vw}
.t{background:#222;color:#fff;padding:10px 14px;border-radius:8px}.t.err{background:#b83232}.t.ok{background:#1e7d4f}
.bar{height:8px;background:var(--p);border-radius:4px}
.empty{text-align:center;color:var(--m);padding:22px}
```

**Receipt/print style:**
```js
const RCSS='.rc{font:13px/1.4 monospace;max-width:300px;margin:auto;color:#000}.rc h2{text-align:center;margin:4px 0;font-size:16px}.ctr{text-align:center}.rc table{width:100%;border-collapse:collapse}.rc td{white-space:normal;border:0;padding:2px 0}.rc hr{border:0;border-top:1px dashed #000;margin:8px 0}.rc .r{text-align:right}';
```

## Appendix E — Supplier invoice reader (reference code, verbatim; revision 2)

```js
const INV_H=/No\.\s+Location\s+Description\s+QTY\s+UOM\s+Unit Price\s+Disc%\s+Amount/;
const W1={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5,SIX:6,SEVEN:7,EIGHT:8,NINE:9,TEN:10,ELEVEN:11,TWELVE:12,THIRTEEN:13,FOURTEEN:14,FIFTEEN:15,SIXTEEN:16,SEVENTEEN:17,EIGHTEEN:18,NINETEEN:19,TWENTY:20,THIRTY:30,FORTY:40,FIFTY:50,SIXTY:60,SEVENTY:70,EIGHTY:80,NINETY:90};
function words2num(w){let tot=0,cur=0;const toks=String(w||'').toUpperCase().replace(/[^A-Z ]/g,' ').split(/\s+/).filter(Boolean);
 for(const t of toks){if(W1[t]!==undefined)cur+=W1[t];else if(t==='HUNDRED')cur*=100;else if(t==='THOUSAND'){tot+=cur*1000;cur=0}else if(t==='MILLION'){tot+=cur*1e6;cur=0}else if(t!=='ZERO')return NaN}
 return tot+cur}
function invParse(text){
 text=String(text||'').replace(/\r/g,'').replace(/[\u00a0\u2007\u202f]/g,' ');
 // pasted text often puts a label's value on the next line: join them
 text=text.replace(/(Tax Invoice No:?|Date of Invoice:?|Supplier's Name|Purchaser's Name|Place of Supply|Sales ?person|SO No|CUS PO No\.?|Posting Time|Posting Date|Sub ?Total|VAT Amount|Total Amount\/consideration Including VAT|Total LKR|Trade Discount Amount|Total Value of Supply)[ \t]*\n+[ \t]*(?=\S)/gi,'$1 ');
 const HG=new RegExp(INV_H.source,'g'),hs=[...text.matchAll(HG)].map(m=>m.index);
 if(!hs.length)return[];
 const PG=/(?:Page\s+)?\b\d{1,3}\s+of\s+\d{1,3}\b/g;
 let segs;
 if(text.indexOf('\f')>-1)segs=text.split('\f').filter(p=>INV_H.test(p));
 else{
  const k0=text.search(/KSI-\d+|INVOICE NO\.?:|Tax Invoice No/);
  if(k0>-1&&k0<hs[0]){
   const ps=[...text.matchAll(PG)].map(m=>m.index);
   segs=ps.map((s,i)=>text.slice(s,ps[i+1]===undefined?text.length:ps[i+1])).filter(p=>INV_H.test(p));
   if(!segs.length){ // no page markers (common when pasted): cut where each invoice's own labels start
    const cuts=[0];for(let i=1;i<hs.length;i++){const gap=text.slice(hs[i-1],hs[i]);let at=-1,m2;const LB=/Tax Invoice No|INVOICE NO\.?:|KSI-\d+/g;while((m2=LB.exec(gap)))if(at<0)at=m2.index;cuts.push(at>-1?hs[i-1]+at:hs[i])}
    segs=cuts.map((c,i)=>text.slice(c,i+1<cuts.length?cuts[i+1]:text.length))}
  }else segs=hs.map((h,i)=>text.slice(h,i+1<hs.length?hs[i+1]:text.length));
 }
 const num=x=>Number(String(x).replace(/,/g,'')),r2=x=>Math.round(x*100)/100;
 const MON={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12},p2=n=>String(n).padStart(2,'0');
 const cutv=s=>String(s||'').replace(/\s+(Address|Telephone|Tel|Place of Supply|Sales ?person|SO No|CUS PO|L\/C|Posting|Date of Invoice|Supplier's|Purchaser's|Tax Invoice|Page)\b.*$/i,'').trim();
 const parts=segs.map(seg=>{
  const hm=INV_H.exec(seg),after=seg.slice(hm.index+hm[0].length);
  const ends=[after.search(/\*{4}/),after.search(/Shiping Details/),after.search(/Sub ?total/i),after.search(/Total Value of Supply/)].filter(i=>i>-1);
  const region=(ends.length?after.slice(0,Math.min.apply(null,ends)):after).replace(/\s+/g,' ').replace(/Numbe rs/g,'Numbers').trim();
  const items=[],R=/(\S+) (\S+) (\d{4}) (.+?) (\d[\d,]*(?:\.\d+)?) ([A-Za-z]+) ([\d,]+\.\d\d)(?: (\d{1,2}(?:\.\d)?))? ([\d,]+\.\d\d)(?= |$)/g;let m,last=0;
  while((m=R.exec(region))){
   if(items.length){const gap=region.slice(last,m.index).trim();if(gap&&gap.length<80)items[items.length-1].description+=' '+gap}
   items.push({code:m[1],description:m[4].trim(),qty:num(m[5]),uom:m[6]==='Numbe'?'Numbers':m[6],unitPrice:num(m[7]),disc:m[8]?num(m[8]):0,amount:num(m[9])});last=R.lastIndex}
  const g=(re,i)=>{const x=re.exec(seg);return x?String(x[i||1]).trim():''};
  const lab=/(?:Page\s+)?\b(\d{1,3})\s+of\s+(\d{1,3})\b/.exec(seg);
  let d='';const d1=/Date of Invoice:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(seg),d2=/([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})/.exec(seg);
  if(d1)d=d1[3]+'-'+p2(d1[1])+'-'+p2(d1[2]);else if(d2&&MON[d2[1]])d=d2[3]+'-'+p2(MON[d2[1]])+'-'+p2(d2[2]);
  const tm=[...seg.matchAll(/(?<![\d:])(\d{1,2}:\d{2} [AP]M)\b/g)].filter(x=>!/\d{4} $/.test(seg.slice(Math.max(0,x.index-5),x.index)));
  const time=g(/Posting Time[ \t]+(\d{1,2}:\d{2} [AP]M)/)||(tm[0]?tm[0][1]:'');
  const wm=/\*{4}\s*([A-Z ]+?)\s*AND\s*(\d{1,2})\s*\/\s*100/.exec(seg);
  let wt=NaN;if(wm){const w=words2num(wm[1]);if(!isNaN(w))wt=r2(w+Number(wm[2])/100)}
  let pn=g(/Purchaser's Name[ \t]+(\S[^\n]*?)(?:[ \t]{2,}|\n|$)/);if(/^(Address|Telephone|Place|Sales|L\/C)/.test(pn))pn='';
  let sp=g(/Sales person[ \t]+(.+?)[ \t]+(?:SO No|CUS PO)/);if(/^(SO No|CUS)/.test(sp))sp='';
  return{n:lab?+lab[1]:1,so:g(/SO No[ \t]+(K\w+)/)||g(/\b(K\d{6})\b/),time:time,items:items,
   invoiceNo:g(/(KSI-\d+)/)||g(/INVOICE NO\.?:?\s*([A-Z]{2,5}-\d+)/),taxNo:g(/Tax Invoice No:?\s*(\S+)/),date:d,
   ship:(g(/Shiping Details:[ \t]*(\S[^\n]*)/)||g(/\n[ \t]*([^\n]+)\n[ \t]*Shiping Details:[ \t]*(?:\n|$)/)).replace(/\s+/g,' '),buyer:cutv(pn.replace(/\s+/g,' ')),
   supplier:cutv(g(/Supplier's Name[ \t]+([^\n]+?)(?:[ \t]{2,}|\n|$)/)),place:cutv(g(/Place of Supply[ \t]+(\S[^\n]*?)(?:[ \t]{2,}|\n|$)/)),salesperson:sp,
   po:g(/CUS PO No\.?[ \t]*(O\w+)/)||g(/\b(O\d[A-Z0-9]{9,})\b/),
   pay:g(/\b(CASH[A-Z0-9\-]*|CREDIT|CHEQUE[A-Z0-9\-]*)\b/)||g(/\bO\d[A-Z0-9]{8,}\s+([A-Z][A-Z0-9\-]*)/),
   exSub:num(g(/Sub ?total\s+([\d,]+\.\d\d)/i)||0),exDisc:num(g(/Trade Discount Amount\s+([\d,]+\.\d\d)/)||0),
   exTotal:num(g(/(?:Total Amount\/consideration Including VAT|Total LKR)\s+([\d,]+\.\d\d)/)||0),vat:num(g(/VAT Amount[^\d\n]*([\d,]+\.\d\d)/)||0),wordsTotal:wt}});
 // merge continuation pages ("2 of N") into the invoice they belong to
 const out=[];
 parts.forEach(q=>{const c=out[out.length-1];
  if(q.n>1&&c&&q.so&&c.so===q.so&&(!q.time||q.time===c.time)){c.items=c.items.concat(q.items);['invoiceNo','taxNo','date','ship','buyer','supplier','place','salesperson','po','pay'].forEach(k=>{if(!c[k]&&q[k])c[k]=q[k]});
   ['exSub','exDisc','exTotal','vat'].forEach(k=>{if(!c[k]&&q[k])c[k]=q[k]});if(isNaN(c.wordsTotal)&&!isNaN(q.wordsTotal))c.wordsTotal=q.wordsTotal}
  else out.push(q)});
 return out.map(q=>{
  const sum=r2(q.items.reduce((a,i)=>a+i.amount,0)),dis=r2(q.items.reduce((a,i)=>a+i.amount*i.disc/100,0));
  const subtotal=q.exSub||sum,discount=q.exDisc||dis;let calc=r2(subtotal-discount);
  // a line with no discount that the printed total does not include is a free item
  if(!q.exTotal&&!isNaN(q.wordsTotal)&&Math.abs(calc-q.wordsTotal)>1.5){
   const nd=q.items.filter(i=>i.disc===0&&i.amount>0),tries=nd.map(i=>[i]);if(nd.length>1)tries.push(nd);
   for(const t of tries){const rest=r2(sum-t.reduce((a,i)=>a+i.amount,0)),rd=r2(q.items.reduce((a,i)=>a+(t.indexOf(i)>-1?0:i.amount*i.disc/100),0));
    if(Math.abs(rest-rd-q.wordsTotal)<=1.5){t.forEach(i=>{i.free=true;i.freeValue=i.amount;i.amount=0;i.description+=' (FREE)'});calc=r2(rest-rd);break}}}
  const sumNow=r2(q.items.reduce((a,i)=>a+i.amount,0)),subNow=q.exSub||sumNow;
  const total=q.exTotal||(!isNaN(q.wordsTotal)?q.wordsTotal:calc);
  const newFmt=!q.invoiceNo&&!!q.taxNo;
  const invoiceNo=q.invoiceNo||q.taxNo||(q.so?q.so+(q.time?' · '+q.time:''):'');
  const ok=q.items.length>0&&Math.abs(sumNow-subNow)<0.05&&(isNaN(q.wordsTotal)||Math.abs((q.exTotal?q.exTotal-q.vat:total)-calc)<1.5||!!q.exTotal);
  return{invoiceNo:invoiceNo,taxInvoiceNo:q.taxNo,soNo:q.so,poNo:q.po,postingTime:q.time,place:q.place,salesperson:q.salesperson,supplier:q.supplier,date:q.date,
   customer:q.ship||q.buyer,payMethod:q.pay,subtotal:subNow,discount:discount,vat:q.vat,total:total,items:q.items,itemsSum:sumNow,ok:ok,calcTotal:calc,wordsTotal:q.wordsTotal}})}
```

## Appendix F — Manual supplier-invoice entry (reference code, verbatim; revision 2)

Route `invnew` calls `vInvNew()`. Uses helpers `$`, `esc`, `money`, `norm`, `ymd`, `ls`, `run`, `api`, `go`, `toast`, `loadAll`, `updInv` and the CSS classes `.combo`, `.cl`, `.tw`, `.card`, `.row`, `.btn`, `.empty`.

```js
/* manual entry: search a product, everything fills in, you only type the quantity */
const blankRow=()=>({code:'',description:'',qty:'',uom:'Numbers',unitPrice:0,disc:0,pid:''});
function invLast(code){ // most recent supplier-invoice line for this code (price, discount, unit)
 const k=String(code||'').toLowerCase();let best=null,bd='';
 (S.invs||[]).forEach(v=>(v.items||[]).forEach(it=>{if(!it.free&&String(it.code||'').toLowerCase()===k&&(!best||String(v.date)>=bd)){best=it;bd=String(v.date)}}));
 return best}
function vInvNew(){
 S.invd=S.invd||{invoiceNo:'',date:ymd(new Date()),supplier:ls.get('invSup','Kelani Cables'),payMethod:'',items:[]};
 drawInvNew();
 if(!S.invs)run(null,async()=>{S.invs=await api('getSupplierInvoices',{})})}
function drawInvNew(){const d=S.invd;
 $('#app').innerHTML='<div class="card"><div class="row"><div><label>Invoice no.*</label><input value="'+esc(d.invoiceNo)+'" oninput="S.invd.invoiceNo=this.value"></div><div><label>Date*</label><input type="date" value="'+esc(d.date)+'" oninput="S.invd.date=this.value"></div><div><label>Supplier</label><input value="'+esc(d.supplier)+'" oninput="S.invd.supplier=this.value"></div><div><label>Payment terms</label><input value="'+esc(d.payMethod)+'" oninput="S.invd.payMethod=this.value" placeholder="e.g. CREDIT"></div></div></div>'+
 '<div class="card" style="margin-top:10px"><label>Add item: type the product name or code</label><div class="combo"><input id="ivs" autocomplete="off" placeholder="Search products…" oninput="invSearch(this.value)" onfocus="invSearch(this.value)" onkeydown="invSKey(event)"><div class="cl" id="ivd" style="display:none"></div></div>'+
 '<div id="ivrows" style="margin-top:12px"></div><div id="it" style="margin-top:12px"></div>'+
 '<div class="row" style="margin-top:12px"><button class="btn alt" onclick="invAddCustom(\'\')">+ Item not in Products</button><button class="btn" onclick="saveInvNew(this)">Save invoice</button><button class="btn alt" onclick="S.invd=null;go(\'invoices\')">Cancel</button></div></div>';
 drawInvRows()}
function invSearch(q){const k=norm(q),el=$('#ivd');if(!el)return;
 const have={};S.invd.items.forEach(it=>{have[String(it.code).toLowerCase()]=1});
 let L=S.products.filter(p=>!k||norm(p.name+' '+p.sku).indexOf(k)>-1);
 L.sort((a,b)=>{const ax=norm(a.sku)===k||norm(a.name).indexOf(k)===0?0:1,bx=norm(b.sku)===k||norm(b.name).indexOf(k)===0?0:1;return ax-bx||String(a.name).localeCompare(String(b.name))});
 S.ivRes=L.slice(0,40);S.ivHi=0;
 el.innerHTML=S.ivRes.map((p,i)=>'<div data-i="'+i+'" onclick="invPick('+i+')"><b>'+esc(p.name)+'</b> <small style="color:var(--m)">'+esc(p.sku)+' · stock '+esc(p.stock)+(have[String(p.sku).toLowerCase()]?' · already on this invoice':'')+'</small></div>').join('')+
  '<div style="color:var(--m)" onclick="invAddCustom(document.getElementById(\'ivs\').value)">'+(L.length?'Not here? ':'No products found. ')+'<b>Add “'+esc(q||'new item')+'” as a new item</b></div>';
 el.style.display='block';invHi()}
function invHi(){const el=$('#ivd');if(!el)return;[...el.children].forEach((c,i)=>{c.style.background=i===S.ivHi&&S.ivRes[i]?'#eef3f9':''})}
function invSKey(e){const n=(S.ivRes||[]).length;
 if(e.key==='ArrowDown'){e.preventDefault();S.ivHi=Math.min(n-1,(S.ivHi||0)+1);invHi();const c=$('#ivd').children[S.ivHi];if(c)c.scrollIntoView({block:'nearest'})}
 else if(e.key==='ArrowUp'){e.preventDefault();S.ivHi=Math.max(0,(S.ivHi||0)-1);invHi();const c=$('#ivd').children[S.ivHi];if(c)c.scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter'){e.preventDefault();if(n)invPick(S.ivHi||0);else invAddCustom(e.target.value)}
 else if(e.key==='Escape'){$('#ivd').style.display='none'}}
function invPick(i){const p=S.ivRes[i];if(!p)return;
 const k=String(p.sku).toLowerCase(),ex=S.invd.items.findIndex(it=>String(it.code).toLowerCase()===k);
 let at=ex;
 if(ex<0){const l=invLast(p.sku);
  S.invd.items.push({code:p.sku,description:p.name,qty:'',uom:(l&&l.uom)||'Numbers',unitPrice:Number(l?l.unitPrice:p.price)||0,disc:Number(l&&l.discPct)||0,pid:p.id});at=S.invd.items.length-1}
 $('#ivd').style.display='none';$('#ivs').value='';drawInvRows();invFocusQty(at)}
function invAddCustom(txt){S.invd.items.push(Object.assign(blankRow(),{description:String(txt||'').trim()}));$('#ivd').style.display='none';$('#ivs').value='';drawInvRows();
 const i=S.invd.items.length-1,e=$('#icd'+i);if(e)e.focus()}
function invFocusQty(i){const e=$('#iq'+i);if(e){e.focus();e.select();e.scrollIntoView({block:'center',behavior:'smooth'})}}
function invQKey(e){if(e.key==='Enter'){e.preventDefault();const s=$('#ivs');s.focus();s.select()}}
function drawInvRows(){const d=S.invd,w=(n,t,v,ex)=>'<input '+(t||'')+' style="width:'+n+'px" '+ex+'>';
 $('#ivrows').innerHTML=d.items.length?'<div class="tw"><table><thead><tr><th>Code</th><th>Description</th><th>Qty*</th><th>Unit</th><th>Selling price</th><th>Disc %</th><th class="r">Amount</th><th></th></tr></thead><tbody>'+
 d.items.map((it,i)=>'<tr><td><input id="icd'+i+'" style="width:120px" value="'+esc(it.code)+'" oninput="invU('+i+',\'code\',this.value)"></td><td><input style="width:230px" value="'+esc(it.description)+'" oninput="invU('+i+',\'description\',this.value)"></td>'+
  '<td><input id="iq'+i+'" type="number" inputmode="decimal" min="0" step="any" style="width:80px;border:2px solid var(--p,#4a90d9)" value="'+esc(it.qty)+'" placeholder="Qty" oninput="invU('+i+',\'qty\',this.value)" onkeydown="invQKey(event)"></td>'+
  '<td><input style="width:85px" value="'+esc(it.uom)+'" oninput="invU('+i+',\'uom\',this.value)"></td><td><input type="number" min="0" step="any" style="width:105px" value="'+it.unitPrice+'" oninput="invU('+i+',\'unitPrice\',this.value)"></td>'+
  '<td><input type="number" min="0" max="100" step="any" style="width:70px" value="'+it.disc+'" oninput="invU('+i+',\'disc\',this.value)"></td><td class="r" id="ia'+i+'"></td><td><button class="btn red" onclick="invRm('+i+')" aria-label="Remove">✕</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No items yet. Search above, pick a product, then type the quantity.</div>';
 invTot()}
function invU(i,f,v){S.invd.items[i][f]=['qty','unitPrice','disc'].indexOf(f)>-1?(f==='qty'&&v===''?'':(Number(v)||0)):v;invTot()}
function invRm(i){S.invd.items.splice(i,1);drawInvRows()}
function invTot(){let sub=0,dis=0,u=0;S.invd.items.forEach((it,i)=>{const q=Number(it.qty)||0,a=Math.round(q*it.unitPrice*100)/100;sub+=a;dis+=a*it.disc/100;u+=q;const e=$('#ia'+i);if(e)e.textContent=money(a)});
 const t=$('#it');if(t)t.innerHTML=S.invd.items.length?'<table style="max-width:340px;margin-left:auto"><tr><td>Items / units</td><td class="r">'+S.invd.items.length+' / '+u+'</td></tr><tr><td>Subtotal</td><td class="r">'+money(sub)+'</td></tr><tr><td>Trade discount</td><td class="r">-'+money(dis)+'</td></tr><tr><td><b>Total</b></td><td class="r"><b>'+money(sub-dis)+'</b></td></tr></table>':''}
function saveInvNew(b){run(b,async()=>{const d=S.invd;
 if(!d.invoiceNo.trim())throw new Error('Enter the invoice number.');if(!d.date)throw new Error('Enter the invoice date.');
 const L=d.items;if(!L.length)throw new Error('Add at least one item.');
 L.forEach((i,n)=>{if(!String(i.code).trim())throw new Error('Row '+(n+1)+' needs a code (SKU).');if(!(Number(i.qty)>0))throw new Error('Enter the quantity for '+(i.description||i.code)+'.')});
 const rs=await api('saveSupplierInvoice',{invoiceNo:d.invoiceNo,date:d.date,supplier:d.supplier,payMethod:d.payMethod,customerName:'',items:L.map(i=>({code:i.code,description:i.description,qty:Number(i.qty),uom:i.uom,unitPrice:i.unitPrice,disc:i.disc,amount:Math.round(Number(i.qty)*i.unitPrice*100)/100}))});
 ls.set('invSup',d.supplier);S.invd=null;await loadAll();await updInv();toast('Invoice saved'+(rs.created?' and '+rs.created+' new product(s) added to Products':''),'ok');go('invoices')})}
```

## Appendix G — Product history (reference code, verbatim; revision 2)

**Front end** — product rows are built by this `tbl` function inside `drawProducts` (the Edit/Delete buttons call `event.stopPropagation()` first so they do not toggle the row; `loadAll` resets `S.phist={}`):

```js
const tbl=a=>'<div class="tw"><table><thead><tr><th style="width:22px"></th>'+cols.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+a.slice().sort(by[mode]||by.best).map(p=>'<tr class="prow" id="pr_'+esc(p.id)+'" style="cursor:pointer" title="Click to see who bought it and every stock movement" onclick="prodTog(\''+esc(p.id)+'\')"><td><span class="chev">▸</span></td>'+row(p).map(c=>'<td>'+c+'</td>').join('')+'</tr><tr id="ph_'+esc(p.id)+'" style="display:none"><td colspan="'+(cols.length+1)+'" id="phc_'+esc(p.id)+'"></td></tr>').join('')+'</tbody></table></div>',
```

```js
/* ---- product history panel: opens under a product row ---- */
function prodTog(id){S.phist=S.phist||{};const row=$('#ph_'+id);if(!row)return;
 const open=row.style.display==='none';row.style.display=open?'':'none';
 const ch=document.querySelector('#pr_'+id+' .chev');if(ch)ch.textContent=open?'▾':'▸';
 if(!open)return;
 if(S.phist[id]){drawPH(id);return}
 $('#phc_'+id).innerHTML='<div class="empty">Loading history…</div>';
 api('getProductHistory',{productId:id}).then(h=>{S.phist[id]=h;drawPH(id)}).catch(e=>{$('#phc_'+id).innerHTML='<div class="empty">Could not load: '+esc(e.message||e)+'</div>'})}
function phTab(id,t){S.phTab=S.phTab||{};S.phTab[id]=t;drawPH(id)}
function phFilt(id,v){S.phF=S.phF||{};S.phF[id]=v;S.phAll=S.phAll||{};S.phAll[id]=false;drawPH(id)}
function phCust(id,i){const e=$('#pcl_'+id+'_'+i);if(e)e.style.display=e.style.display==='none'?'':'none'}
const PH_COL={Sold:'#fde2e2',Replacement:'#ffe9c7','Received':'#d9f2dd','Customer return':'#dbeafe','Free from supplier':'#d9f2dd'};
function drawPH(id){const h=S.phist[id],ad=isAdmin(),tab=(S.phTab||{})[id]||'cust',el=$('#phc_'+id);if(!h||!el)return;
 const chip=(l,v,x)=>'<div style="background:#f3f6fa;border-radius:10px;padding:8px 12px;min-width:110px"><div style="font-size:11.5px;color:var(--m)">'+l+'</div><div style="font-weight:700;font-size:16px">'+v+'</div>'+(x?'<div style="font-size:11.5px;color:var(--m)">'+x+'</div>':'')+'</div>';
 let s='<div class="row" style="gap:8px;margin:4px 0 10px">'+chip('In stock now',h.stock)+chip('Total sold',h.sold,h.lastSale?'last: '+esc(h.lastSale):'never sold')+chip('Bought by',h.customers.length+' customer(s)')+chip('Received from supplier',h.received,h.lastReceived?'last: '+esc(h.lastReceived):'')+(h.pending?chip('Coming (invoice not received)','+'+h.pending):'')+chip('Sales value',money(h.revenue))+(ad&&h.profit!=null?chip('Profit',money(h.profit)):'')+'</div>';
 const tb=(k,l)=>'<button class="btn '+(tab===k?'':'alt')+'" onclick="event.stopPropagation();phTab(\''+id+'\',\''+k+'\')">'+l+'</button>';
 s+='<div class="row" style="gap:6px;margin-bottom:10px">'+tb('cust','👥 Sold to customers ('+h.customers.length+')')+tb('move','📦 Stock movement')+tb('recv','🚚 Received from supplier ('+h.received_rows.length+')')+'</div>';
 if(tab==='cust'){
  const mx=Math.max(1,...h.customers.map(c=>c.qty));
  s+=h.customers.length?'<div class="tw"><table><thead><tr><th>Customer</th><th class="r">Times bought</th><th class="r">Qty</th><th class="r">Amount</th><th style="min-width:120px">Share</th><th>Last bought</th></tr></thead><tbody>'+h.customers.map((c,i)=>'<tr style="cursor:pointer" onclick="event.stopPropagation();phCust(\''+id+'\','+i+')"><td><b>'+esc(c.name)+'</b> <small style="color:var(--m)">▾ details</small></td><td class="r">'+c.orders+'</td><td class="r"><b>'+c.qty+'</b></td><td class="r">'+money(c.revenue)+'</td><td><div style="background:#e8edf2;border-radius:99px;height:8px"><div style="background:var(--p,#71a5d6);height:8px;border-radius:99px;width:'+Math.round(c.qty/mx*100)+'%"></div></div></td><td>'+esc(c.lastDate)+'</td></tr>'+
   '<tr id="pcl_'+id+'_'+i+'" style="display:none"><td colspan="6" style="background:#fafbfd"><table style="width:100%"><thead><tr><th>Date</th><th>Invoice</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>'+c.lines.map(l=>'<tr><td>'+esc(l.date)+'</td><td>'+esc(l.invoiceId)+(l.kind==='Replacement'?' <span class="badge warn">replacement</span>':'')+'</td><td class="r">'+l.qty+'</td><td class="r">'+money(l.price)+'</td><td class="r">'+money(l.total)+'</td></tr>').join('')+'</tbody></table></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">This product has not been sold yet.</div>'}
 if(tab==='move'){
  const f=(S.phF||{})[id]||'all',all=(S.phAll||{})[id];
  const grp={all:null,sold:['Sold','Replacement'],in:['Received','Free from supplier'],ret:['Customer return'],adj:['Adjust']};
  let L=h.ledger.filter(e=>f==='all'||(f==='adj'?e.type.indexOf('Adjust')===0:grp[f].indexOf(e.type)>-1));
  const tot=L.length;if(!all)L=L.slice(0,40);
  s+='<div class="row" style="margin-bottom:8px"><select onchange="event.stopPropagation();phFilt(\''+id+'\',this.value)" onclick="event.stopPropagation()"><option value="all"'+(f==='all'?' selected':'')+'>Everything</option><option value="sold"'+(f==='sold'?' selected':'')+'>Sold only</option><option value="in"'+(f==='in'?' selected':'')+'>Received only</option><option value="ret"'+(f==='ret'?' selected':'')+'>Customer returns</option><option value="adj"'+(f==='adj'?' selected':'')+'>Stock adjustments</option></select><span style="color:var(--m);font-size:12.5px;align-self:center">Newest first. “Stock after” is what was in stock right after that line.</span></div>';
  s+=L.length?'<div class="tw"><table><thead><tr><th>Date</th><th>What happened</th><th>Reference / who</th><th class="r">In</th><th class="r">Out</th><th class="r">Stock after</th></tr></thead><tbody>'+L.map(e=>'<tr><td>'+esc(e.date)+'</td><td><span class="badge" style="background:'+(PH_COL[e.type]||'#eee')+'">'+esc(e.type)+'</span></td><td>'+esc(e.ref)+(e.party?' <small style="color:var(--m)">· '+esc(e.party)+'</small>':'')+'</td><td class="r" style="color:#1b7a34">'+(e.inQ?'+'+e.inQ:'')+'</td><td class="r" style="color:#b3261e">'+(e.outQ?'−'+e.outQ:'')+'</td><td class="r"><b>'+e.balance+'</b></td></tr>').join('')+(f==='all'&&h.earlier&&tot<=L.length?'<tr style="color:var(--m)"><td colspan="5">Before the records above (opening stock, or changes made before this history existed)</td><td class="r">'+h.earlier+'</td></tr>':'')+'</tbody></table></div>'+(tot>L.length?'<div style="margin-top:8px"><button class="btn alt" onclick="event.stopPropagation();S.phAll=S.phAll||{};S.phAll[\''+id+'\']=true;drawPH(\''+id+'\')">Show all '+tot+' lines</button></div>':''):'<div class="empty">No movements found.</div>'}
 if(tab==='recv'){
  s+=h.received_rows.length?'<div class="tw"><table><thead><tr><th>Date</th><th>Supplier invoice</th><th>Supplier</th><th class="r">Qty</th><th>Status</th>'+(ad?'<th class="r">Unit price</th><th class="r">Disc %</th><th class="r">Net cost each</th>':'')+'</tr></thead><tbody>'+h.received_rows.map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.invoiceNo)+(r.free?' <span class="badge">free item</span>':'')+'</td><td>'+esc(r.supplier)+'</td><td class="r"><b>'+r.qty+'</b></td><td><span class="badge '+(r.status==='Received'?'':'warn')+'">'+esc(r.status)+'</span></td>'+(ad?'<td class="r">'+money(r.unitPrice)+'</td><td class="r">'+(r.discPct||0)+'</td><td class="r">'+money(r.netCost)+'</td>':'')+'</tr>').join('')+'</tbody></table></div>':'<div class="empty">No supplier invoice has this product yet.</div>'}
 s+='<div style="margin-top:8px"><button class="btn alt" onclick="event.stopPropagation();delete S.phist[\''+id+'\'];prodTog(\''+id+'\');prodTog(\''+id+'\')">↻ Refresh</button></div>';
 el.innerHTML='<div class="card" style="margin:6px 0;box-shadow:none;border:1px solid #e3e8ee" onclick="event.stopPropagation()"><b>'+esc(h.name)+'</b> <small style="color:var(--m)">'+esc(h.sku)+'</small>'+s+'</div>'}
```

**Backend** (`Code.gs`, registered as action `getProductHistory` in `ACTIONS`, allowed for Cashier and Admin):

```js
/* ---------- product history: who bought it, and every stock movement (NEW) ---------- */
function getProductHistory_(p) {
  const pr = findProduct_(str_(p.productId, 40, true, 'Product')), admin = isAdmin_();
  const sku = String(pr.sku || '').toLowerCase(), cur = Number(pr.stock) || 0;
  const sales = {}; readAll_('Sales').forEach(function (s) { sales[s.id] = s; });
  const ev = [], cust = {}; let sold = 0, rev = 0, profit = 0, lastSale = '', lastRecv = '', received = 0;
  const replInv = {};
  readAll_('SaleItems').forEach(function (i) {
    if (i.productId !== pr.id) return;
    const s = sales[i.saleId]; if (!s) return;
    const q = Number(i.quantity) || 0, repl = i.kind === 'Replacement', amt = r2_(Number(i.lineTotal) - Number(i.discount));
    if (repl) replInv[i.invoiceId] = 1;
    const key = s.customerId || 'walkin', c = cust[key] = cust[key] || { key: key, name: s.customerName || 'Walk-in customer', orders: {}, qty: 0, revenue: 0, lastDate: '', lines: [] };
    c.orders[s.id] = 1; c.qty += q; c.revenue += amt; if (String(s.date) > c.lastDate) c.lastDate = s.date;
    c.lines.push({ date: s.date, invoiceId: s.invoiceId, qty: q, price: Number(i.unitPrice) || 0, total: amt, kind: repl ? 'Replacement' : 'Sale' });
    sold += q; rev += amt; if (admin) profit += amt - q * Number(i.unitCost);
    if (String(s.date) > lastSale) lastSale = s.date;
    ev.push({ date: s.date, at: s.date + ' ' + (i.createdAt || ''), type: repl ? 'Replacement' : 'Sold', ref: s.invoiceId, party: s.customerName || 'Walk-in customer', inQ: 0, outQ: q });
  });
  const recvRows = []; let pending = 0;
  readAll_('SupplierInvoices').forEach(function (v) {
    let items = []; try { items = JSON.parse(v.itemsJson || '[]'); } catch (e) { items = []; }
    let q = 0, net = 0, up = 0, dp = 0, free = false, any = false;
    items.forEach(function (i) {
      if (String(i.code).toLowerCase() !== sku || !sku) return;
      any = true; q += Number(i.quantity) || 0; up = Number(i.unitPrice) || up; dp = Number(i.discPct) || 0; free = free || !!i.free;
      net += (Number(i.amount) || 0) * (1 - (Number(i.discPct) || 0) / 100);
    });
    if (!any) return;
    q = r2_(q); const got = v.status === 'Received';
    recvRows.push({ date: got ? (v.receivedDate || v.date) : v.date, invoiceNo: v.invoiceNo, supplier: v.supplier, qty: q, status: got ? 'Received' : 'Not received yet',
      unitPrice: admin ? up : undefined, discPct: admin ? dp : undefined, netCost: admin ? (q ? r2_(net / q) : 0) : undefined, free: free });
    if (got) { received += q; const d = v.receivedDate || v.date; if (String(d) > lastRecv) lastRecv = d; ev.push({ date: d, at: d + ' ' + (v.updatedAt || ''), type: 'Received', ref: v.invoiceNo, party: v.supplier || 'Supplier', inQ: q, outQ: 0 }); }
    else pending += q;
  });
  readAll_('Returns').forEach(function (r) {
    if (r.productId === pr.id) {
      const q = Number(r.quantity) || 0;
      if (r.status === 'Restocked' || (r.condition === 'Good' && r.resolution)) ev.push({ date: r.date, at: r.date + ' ' + (r.createdAt || ''), type: 'Customer return', ref: r.saleInvoice || '', party: r.customerName || '', inQ: q, outQ: 0 });
      if (r.replaced && !replInv[r.saleInvoice]) ev.push({ date: r.date, at: r.date + ' ' + (r.createdAt || ''), type: 'Replacement', ref: r.saleInvoice || '', party: r.customerName || '', inQ: 0, outQ: q });
    }
    if (r.creditType === 'Free items' && String(r.creditNote).indexOf('Free: ') === 0) {
      const m = new RegExp(String(pr.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' x([0-9.]+)').exec(r.creditNote);
      if (m) ev.push({ date: r.creditedDate || r.date, at: (r.creditedDate || r.date) + ' ' + (r.updatedAt || ''), type: 'Free from supplier', ref: r.claimRef || r.creditInvoiceNo || '', party: 'Supplier credit', inQ: Number(m[1]), outQ: 0 });
    }
  });
  readAll_('StockAdjustments').forEach(function (a) {
    if (a.productId !== pr.id) return; const ch = Number(a.change) || 0;
    ev.push({ date: a.date, at: a.date + ' ' + (a.createdAt || ''), type: 'Adjustment (' + (a.type || 'Other') + ')', ref: a.reason || '', party: a.createdBy || '', inQ: ch > 0 ? ch : 0, outQ: ch < 0 ? -ch : 0 });
  });
  ev.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  let bal = cur;
  const ledger = ev.map(function (e) { const row = { date: e.date, type: e.type, ref: e.ref, party: e.party, inQ: r2_(e.inQ), outQ: r2_(e.outQ), balance: r2_(bal) }; bal -= (e.inQ - e.outQ); return row; });
  const customers = Object.keys(cust).map(function (k) {
    const c = cust[k]; c.lines.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return { key: k, name: c.name, orders: Object.keys(c.orders).length, qty: r2_(c.qty), revenue: r2_(c.revenue), lastDate: c.lastDate, lines: c.lines.slice(0, 40) };
  }).sort(function (a, b) { return b.qty - a.qty; });
  recvRows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  const out = { productId: pr.id, name: pr.name, sku: pr.sku, stock: cur, sold: r2_(sold), revenue: r2_(rev), received: r2_(received), pending: r2_(pending), lastSale: lastSale, lastReceived: lastRecv,
    customers: customers, ledger: ledger.slice(0, 400), earlier: r2_(bal), received_rows: recvRows };
  if (admin) out.profit = r2_(profit);
  return out;
}
```

## Appendix H — Dashboard by date and report totals (reference code, verbatim; revision 3)

**Backend** (`Code.gs`; replaces the old `dashboardFull_`, `dashboard_`, `reports_`; `key_` is unchanged; `getDashboardData: dashboard_` and `getReports: reports_` stay in `ACTIONS`):

```js
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
```

**Front end** (`index.html`; replaces `vDash` and `loadRep`; uses helpers `$`, `esc`, `money`, `kpi`, `table`, `stat`, `pmCls`, `ymd`, `api`, `run`, `go`, `render`, `isAdmin`):

```js
function dashSet(v){if(!v)return;S.dashDate=v;render()}
async function vDash(){
 const ad=isAdmin(),t=ymd(new Date()),yy=new Date();yy.setDate(yy.getDate()-1);const yd=ymd(yy),dt=S.dashDate||t;
 const [d,list]=await Promise.all([api('getDashboardData',{date:dt}),api('getSales',{from:dt,to:dt}).catch(()=>[])]);
 const x=d.day,c=x.collections,dn=S.dueCount||0,p=dt===t?"Today's ":dt===yd?"Yesterday's ":'',L=w=>p?p+w:w.charAt(0).toUpperCase()+w.slice(1),when=dt===t?'today':dt===yd?'yesterday':'on '+dt;
 $('#app').innerHTML=(dn?'<div class="card" style="background:#fff3d6;border-color:#f3c77a;cursor:pointer" onclick="go(\'payments\')">🔔 <b>'+dn+'</b> cheque/credit payment(s) due today or overdue. Tap to review.</div>':'')+
 '<div class="card"><div class="row" style="align-items:end"><button class="btn'+(dt===t?'':' alt')+'" style="flex:none" onclick="dashSet(\''+t+'\')">Today</button><button class="btn'+(dt===yd?'':' alt')+'" style="flex:none" onclick="dashSet(\''+yd+'\')">Yesterday</button><div style="max-width:210px"><label>Pick a date</label><input type="date" id="dd" max="'+t+'" value="'+esc(dt)+'" onchange="dashSet(this.value)"></div><span style="flex:none;color:var(--m)">Showing: <b>'+esc(dt)+'</b></span></div></div>'+
 '<div class="kpis">'+kpi('g0','📈',money(x.sales),L('sales'))+kpi('g1','🛒',x.orders,L('orders'))+kpi('g4','💵',money(x.cashSales),L('cash sales'))+kpi('g3','📒',money(x.creditSales),L('credit sales'))+kpi('g6','🧾',money(x.chequeSales),L('cheque sales'))+(x.otherSales>0?kpi('g2','🏦',money(x.otherSales),L('card / bank / other')):'')+kpi('g4','📥',money(c.total),L('collections'))+(ad?kpi('g5','👛',money(x.expenses),L('expenses'))+kpi('g2','💰',money(x.profit),L('profit')):'')+'</div>'+
 '<div class="kpis" style="margin-top:14px">'+kpi('g2','📦',d.totalProducts,'Products')+kpi('g4','👤',d.totalCustomers,'Customers')+'</div>'+
 '<div class="card sumcard"><h3>Collections received '+when+'</h3>'+(c.count?'<div class="kpis" style="margin-bottom:14px">'+kpi('g4','📥',money(c.total),'Total collected ('+c.count+')')+kpi('g0','💵',money(c.cash),'Cash')+kpi('g1','🧾',money(c.cheque),'Cheque')+kpi('g2','🏦',money(c.bank),'Bank transfer')+'</div>'+table(['Customer','Bill','Method','Amount'],c.items.map(r=>[esc(r.customerName||'-'),esc(r.invoiceId||'-'),esc(r.method)+(r.chequeNo?' · '+esc(r.chequeNo):''),money(r.amount)])):'<div class="empty">No collections received '+when+'.</div>')+
 '<p style="color:var(--m);font-size:13px;margin:12px 0 0">Cash received '+when+' = cash sales '+money(x.cashSales)+' + cash collected '+money(c.cash)+(x.refunds?' − cash refunds '+money(x.refunds):'')+' = <b>'+money(x.cashIn)+'</b></p></div>'+
 '<div class="card sumcard"><h3>'+(dt===t?'Today Sales Summary':dt===yd?'Yesterday Sales Summary':'Sales Summary · '+esc(dt))+'</h3>'+(list.length?table(['Invoice','Customer','Sales Amount','Type'],list.map(r=>[esc(r.invoiceId),esc(r.customerName||'Walk-in'),money(r.total),'<span class="pill '+pmCls(r.paymentMethod)+'">'+esc(r.paymentMethod)+'</span>'])):'<div class="empty">No sales '+(dt===t?'yet today':'on this day')+'.</div>')+'</div>'+
 (ad?'<p style="color:var(--m);font-size:13px">Profit = sales that day (excluding tax) − cost of items sold − expenses that day. Credit and cheque sales count as sales when the bill is made; money collected later is shown separately and is not added to sales or profit.</p>':'')+
 '<div class="row" style="margin-top:12px"><button class="btn alt" onclick="go(\'dayclose\')">🧮 End-of-day closing</button></div>'}

function loadRep(){run(null,async()=>{
 const r=await api('getReports',{from:$('#f').value,to:$('#t').value,group:$('#g').value}),mx=Math.max(1,...r.series.map(x=>x.sales)),c=r.collections,pc=v=>'<b style="color:'+(v<0?'#b83232':'#1e7d4f')+'">'+money(v)+'</b>';
 $('#rp').innerHTML='<div class="grid">'+stat('Revenue',money(r.revenue))+stat('Orders',r.orders)+stat('Cost of goods sold',money(r.cost))+stat('Expenses',money(r.expenses))+stat('Estimated profit',money(r.estimatedProfit))+'</div>'+
 '<div class="grid">'+stat('Cash sales',money(r.cashSales))+stat('Credit sales',money(r.creditSales))+stat('Cheque sales',money(r.chequeSales))+(r.otherSales>0?stat('Card / bank / other',money(r.otherSales)):'')+stat('Collections received',money(c.total))+'</div>'+
 '<div class="card"><h3>Sales</h3>'+(r.series.length?table(['Period','Orders','Sales','Cash','Credit','Cheque','Collected','Cost','Expenses','Profit',''],r.series.map(x=>[esc(x.period),x.orders,money(x.sales),money(x.cash),money(x.credit),money(x.cheque),money(x.collected),money(x.cost),money(x.expenses),pc(x.profit),'<div class="bar" style="width:'+Math.max(4,x.sales/mx*120)+'px"></div>'])):'<div class="empty">No sales in this period.</div>')+'</div>'+
 '<div class="card"><h3>Collections received (money received on credit bills)</h3>'+(c.count?table(['Method','Amount'],[['Cash',money(c.cash)],['Cheque',money(c.cheque)],['Bank transfer',money(c.bank)],['<b>Total ('+c.count+' receipt'+(c.count>1?'s':'')+')</b>','<b>'+money(c.total)+'</b>']]):'<div class="empty">No collections in this period.</div>')+'</div>'+
 '<div class="card"><h3>Best-selling products</h3>'+(r.bestSellers.length?table(['Product','Qty sold','Revenue'],r.bestSellers.slice(0,10).map(x=>[esc(x.name),x.quantity,money(x.revenue)])):'<div class="empty">No data yet.</div>')+'</div>'+
 '<div class="card"><h3>Payment methods</h3>'+(Object.keys(r.payments).length?table(['Method','Total'],Object.keys(r.payments).map(k=>[esc(k),money(r.payments[k])])):'<div class="empty">No data yet.</div>')+'</div>'+
 '<div class="card"><h3>Expenses by category</h3>'+(Object.keys(r.expensesByCategory).length?table(['Category','Total'],Object.keys(r.expensesByCategory).map(k=>[esc(k),money(r.expensesByCategory[k])])):'<div class="empty">No expenses in this period.</div>')+'</div>'+
 '<div class="card"><h3>Low-stock products</h3>'+(r.lowStock.length?table(['Product','Stock','Limit'],r.lowStock.map(p=>[esc(p.name),p.stock,p.lowStockLimit])):'<div class="empty">Nothing is low on stock.</div>')+'</div>'+
 '<p style="color:var(--m);font-size:13px">Profit = sales (excluding tax) − cost of items sold (cost saved at the time of sale) − expenses. Cash / Credit / Cheque columns are the bill totals by payment type. Collected = money received on credit bills in that period (not added to sales or profit).</p>'})}
```

## Appendix I — Revision 4 reference code (verbatim from the reference files)

These replace the functions of the same name in the earlier appendices and sections. `chequeList_` and `chequeRow_` are new.

**Backend (`Code.gs`)**

```js
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
    if (changed && eps.some(function (x) { return payPaid_(x) > 0; })) throw UErr('Money was already received on this sale\'s cheque/credit. Remove that first (Cheques & Credits), then edit the sale.');
    const newType = total > 0 && (pay === 'Credit' || pay === 'Cheque') ? pay : '';
    const same = newType ? eps.filter(function (x) { return x.type === newType; })[0] : null;
    // split cheques: the bill is paid with several cheques, each one is its own record
    const chqList = chequeList_(newType === 'Cheque' && Array.isArray(p.cheques) && p.cheques.length ? p.cheques : null, total), chq = chqList.length > 0;
    if (chq && eps.some(function (x) { return payPaid_(x) > 0; })) throw UErr('Money was already received on this sale\'s cheque/credit. Remove that first (Cheques & Credits), then edit the sale.');
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
```

**Front end (`index.html`)** — `calc`, `drawCart`, `updTotals`, the cheque editor (`newChq` … `chqCollect`, `payExtra`), `checkout`, `loadCP` (no default discount), the edit-sale page (`saleEdit` … `seSave`), the Sales page (`salesRange`, `vSales`, `loadSales`) and `phSort` + `drawPH` (replaces `drawPH` of Appendix G; its "Sold to customers" tab has the sort box):

```js
function calc(){
 const line=i=>{const p=S.products.find(x=>x.id===i.id);return p?i.qty*effPrice(p):0},sub=S.cart.reduce((a,i)=>a+line(i),0),es=S.cart.reduce((a,i)=>a+(i.nod?0:line(i)),0),dv=Math.max(0,Number(S.dv)||0);
 let disc=S.dt==='percent'?es*Math.min(dv,100)/100:Math.min(dv,es);disc=Math.round(disc*100)/100;
 const tax=bool(S.settings.taxEnabled)?Math.round((sub-disc)*(Number(S.settings.taxRate)||0))/100:0;
 const ded=Math.round((S.cartRet||[]).reduce((a,r)=>a+(r.res==='Cash deducted'?r.qty*r.value:0),0)*100)/100,net=Math.round((sub-disc+tax-ded)*100)/100;
 return{sub,es,disc,tax,ded,total:Math.max(0,net),refund:net<0?Math.round(-net*100)/100:0}}
function nodTog(id,on){const i=S.cart.find(x=>x.id===id);if(i){i.nod=!on;updTotals()}}
function nodAll(none){S.cart.forEach(i=>{i.nod=!!none});drawCart()}

function drawCart(){
 const el=$('#cp');if(!el)return;const n=S.cart.reduce((a,i)=>a+i.qty,0);
 el.innerHTML='<div class="row"><h3 style="margin:0;flex:2">Cart ('+n+(S.cartRet.length?' + '+S.cartRet.length+' return(s)':'')+')</h3><button class="btn alt" onclick="retAddForm()">↩ Return</button><button class="btn alt desk" onclick="cartWider()" title="Make the cart wider or narrower (you can also drag the bar beside it)">↔</button><button class="btn alt" onclick="S.cart=[];S.cartRet=[];drawCart()">Clear</button><button class="btn alt" onclick="$(\'#cp\').classList.remove(\'open\')">Close</button></div>'+
 (S.cart.length?'<div class="cl2"><div class="ci hd"><div>Item</div><div>Qty</div><div class="ct">Total</div><div></div></div>'+S.cart.map(i=>{const p=S.products.find(x=>x.id===i.id)||{};return '<div class="ci"><div class="cn"><b>'+esc(p.name)+'</b><small>'+money(effPrice(p))+' each</small><small><label style="display:inline-flex;align-items:center;margin:0;font-size:12px"><input type="checkbox"'+(i.nod?'':' checked')+' onchange="nodTog(\''+i.id+'\',this.checked)">gets discount</label></small></div><input class="cq" type="number" min="0" step="any" value="'+i.qty+'" oninput="qtyIn(\''+i.id+'\',this)" onchange="qtyDone(\''+i.id+'\',this)" aria-label="Quantity"><div class="ct" id="lt'+i.id+'">'+money(i.qty*effPrice(p))+'</div><button class="btn red cx" onclick="qty(\''+i.id+'\',-999999)" aria-label="Remove">✕</button></div>'}).join('')+'</div>':(S.cartRet.length?'':'<div class="empty">Cart is empty. Tap a product to add it.</div>'))+retCartHTML()+
 (isAdmin()?'<label>Sale date <small style="color:var(--m)">(pick an earlier day to add a missed sale)</small></label><input type="date" id="sdt" max="'+ymd(new Date())+'" value="'+esc(S.saleDate||ymd(new Date()))+'" oninput="S.saleDate=this.value" onchange="drawCart()">'+((S.saleDate&&S.saleDate<ymd(new Date()))?'<div style="color:#b36b00;font-size:12.5px;margin-top:3px">⏪ Back-dated sale: it will be recorded on '+esc(S.saleDate)+'</div>':''):'')+'<label>Customer*</label><div class="combo"><input id="cin" autocomplete="off" placeholder="Type to search customer…" value="'+esc(S.custName||'')+'" oninput="custSearch(this.value)" onfocus="custSearch(this.value,1)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();pickFirst()}"><div class="cl" id="cdd" style="display:none"></div></div><div id="cok" style="font-size:12px;color:#1e7d4f;margin-top:3px">'+(S.cust?'✓ Customer selected':'')+'</div>'+
 '<div class="row"><div><label>Discount</label><input type="number" min="0" step="any" value="'+esc(S.dv)+'" oninput="S.dv=this.value;S.autoDv=false;updTotals()"></div><div><label>Type</label><select onchange="S.dt=this.value;updTotals()"><option value="amount"'+(S.dt!=='percent'?' selected':'')+'>Amount</option><option value="percent"'+(S.dt==='percent'?' selected':'')+'>Percent</option></select></div></div>'+(S.cart.length?'<div style="font-size:12.5px;color:var(--m);margin-top:4px">Discount applies to: <a href="#" onclick="nodAll(0);return false">all items</a> · <a href="#" onclick="nodAll(1);return false">no items</a> (then tick only the items that get it)</div>':'')+
 '<label>Payment method</label><select onchange="S.pay=this.value;payExtra()">'+['Cash','Credit','Cheque'].map(m=>'<option'+(S.pay===m?' selected':'')+'>'+m+'</option>').join('')+'</select><div id="pe"></div><div id="tot"></div><button class="btn" style="width:100%;margin-top:10px" onclick="checkout(this)"'+(S.cart.length||S.cartRet.length?'':' disabled')+'>Checkout</button>';
 updTotals();payExtra()}

function updTotals(){
 const c=calc(),e=$('#tot');
 if(e)e.innerHTML='<table><tr><td>Subtotal</td><td class="r">'+money(c.sub)+'</td></tr><tr><td>Discount'+(c.es<c.sub&&c.disc>0?' <small style="color:var(--m)">(on '+money(c.es)+' of items)</small>':'')+'</td><td class="r">-'+money(c.disc)+'</td></tr>'+(bool(S.settings.taxEnabled)?'<tr><td>Tax ('+esc(S.settings.taxRate)+'%)</td><td class="r">'+money(c.tax)+'</td></tr>':'')+(c.ded>0?'<tr><td>Returns deducted</td><td class="r">-'+money(c.ded)+'</td></tr>':'')+'<tr><td><b>Total to pay</b></td><td class="r"><b>'+money(c.total)+'</b></td></tr>'+(c.refund>0?'<tr><td><b>Give back in cash</b></td><td class="r"><b style="color:#b83232">'+money(c.refund)+'</b></td></tr>':'')+'</table>'+(S.cartRet.some(r=>r.res==='Replacement given')?'<div style="font-size:12px;color:var(--m);margin-top:4px">Replacement items are given at no charge and recorded in today\'s sales.</div>':'');
 chqStat('pos');const b=$('#cb');if(b)b.innerHTML='<span>🛒 '+S.cart.reduce((a,i)=>a+i.qty,0)+' item(s)'+(S.cartRet.length?' · '+S.cartRet.length+' return(s)':'')+'</span><span>'+money(c.total)+'</span>'}

/* cheque rows: one row per cheque, so a bill can be paid with several cheques. k = 'pos' (checkout) or 'se' (edit sale) */
const newChq=()=>({amount:'',date:'',no:'',bank:''}),chqArr=k=>k==='se'?S.se.chqs:S.chqs,chqTotal=k=>k==='se'?seCalc().total:calc().total;
function chqEd(k){const C=chqArr(k);if(k==='se'&&S.se.chqLock)return'<div style="color:#b36b00;font-size:13px;margin:6px 0">Some cheques of this bill were already received, so they cannot be changed here. (Untick them in Cheques &amp; Credits first.)</div>'+table(['Amount','Banking date','Cheque no.','Bank'],C.map(c=>[money(c.amount),esc(c.date),esc(c.no||'-'),esc(c.bank||'-')]));
 if(!C.length)C.push(newChq());
 return '<label>Cheque'+(C.length>1?'s':'')+' <small style="color:var(--m)">(if the customer splits the bill, add one row per cheque)</small></label>'+C.map((c,i)=>'<div class="card" style="padding:8px;margin:6px 0"><div class="row"><div><label>Amount'+(C.length>1?'*':'')+'</label><input type="number" min="0" step="any" placeholder="'+(C.length>1?'Amount':'Full bill')+'" value="'+esc(c.amount)+'" oninput="chqSet(\''+k+'\','+i+',\'amount\',this.value)"></div><div><label>Banking date*</label><input type="date" value="'+esc(c.date)+'" oninput="chqSet(\''+k+'\','+i+',\'date\',this.value)"></div></div><div class="row"><div><label>Cheque no.</label><input value="'+esc(c.no)+'" oninput="chqSet(\''+k+'\','+i+',\'no\',this.value)"></div><div><label>Bank</label><input value="'+esc(c.bank)+'" oninput="chqSet(\''+k+'\','+i+',\'bank\',this.value)"></div>'+(C.length>1?'<button class="btn red" style="flex:none;align-self:end" onclick="chqRm(\''+k+'\','+i+')" aria-label="Remove cheque">✕</button>':'')+'</div></div>').join('')+'<div id="cqs_'+k+'" style="font-size:13px;margin:4px 0"></div><button class="btn alt" onclick="chqAdd(\''+k+'\')">+ Add another cheque</button>'}
function drawChq(k){const e=$('#cq_'+k);if(e){e.innerHTML=chqEd(k);chqStat(k)}}
function chqSet(k,i,f,v){chqArr(k)[i][f]=v;if(f==='amount')chqStat(k)}
function chqRm(k,i){chqArr(k).splice(i,1);drawChq(k)}
function chqAdd(k){const C=chqArr(k),n=newChq();if(C.length&&C.every(c=>c.amount!==''&&Number(c.amount)>0)){const left=Math.round((chqTotal(k)-C.reduce((a,c)=>a+Number(c.amount),0))*100)/100;if(left>0)n.amount=String(left)}if(C.length&&C[C.length-1].date)n.date=C[C.length-1].date;C.push(n);drawChq(k)}
function chqStat(k){const e=$('#cqs_'+k);if(!e)return;const C=chqArr(k);if(C.length<2){e.innerHTML='';return}const t=chqTotal(k),sm=Math.round(C.reduce((a,c)=>a+(Number(c.amount)||0),0)*100)/100,d=Math.round((t-sm)*100)/100;
 e.innerHTML=Math.abs(d)<=0.01?'<span style="color:#1e7d4f">✓ The cheques add up to '+money(t)+'</span>':'<span style="color:#b83232">Cheques total '+money(sm)+' of '+money(t)+' · '+(d>0?'still to add '+money(d):'too much by '+money(-d))+'</span>'}
function chqCollect(k,total){const C=chqArr(k);if(!C.length)throw new Error('Enter the cheque details.');let sm=0;
 const out=C.map((c,i)=>{const a=(c.amount===''&&C.length===1)?total:Number(c.amount);if(!(a>0))throw new Error('Enter the amount for cheque '+(i+1)+'.');if(!c.date)throw new Error(C.length>1?'Enter the banking date for cheque '+(i+1)+'.':'Enter the banking date for the cheque.');sm+=a;return{amount:Math.round(a*100)/100,date:c.date,chequeNo:c.no,bank:c.bank}});
 if(Math.abs(sm-total)>0.01)throw new Error('The cheque amounts ('+money(sm)+') must add up to the bill total ('+money(total)+').');return out}
function payExtra(){const e=$('#pe');if(!e)return;
 if(S.pay==='Cheque'){e.innerHTML='<div id="cq_pos">'+chqEd('pos')+'</div>';chqStat('pos')}
 else if(S.pay==='Credit')e.innerHTML='<label>Due date*</label><input type="date" value="'+esc(S.payDate)+'" oninput="S.payDate=this.value">';
 else e.innerHTML=''}

function checkout(btn){run(btn,async()=>{
 if(!S.cart.length&&!S.cartRet.length)throw new Error('Cart is empty.');
 if(!S.cust)throw new Error('Please select a customer: type a name and pick it from the list.');
 const c0=calc(),cr=(S.pay==='Cheque'||S.pay==='Credit')&&c0.total>0,pay=S.pay,pd=S.payDate;
 let chqs=null;if(cr&&pay==='Cheque')chqs=chqCollect('pos',c0.total);else if(cr&&!pd)throw new Error('Enter the due date for the credit.');
 const cu=S.customers.find(c=>c.id===S.cust);
 const sale=await api('createSale',{date:isAdmin()&&S.saleDate?S.saleDate:'',items:S.cart.map(i=>({productId:i.id,quantity:i.qty,noDiscount:!!i.nod})),returns:S.cartRet.map(r=>({productId:r.id,quantity:r.qty,resolution:r.res,condition:r.cond,value:r.res==='Cash deducted'?r.value:0,reason:r.reason})),customerId:S.cust,discountType:S.dt,discountValue:Number(S.dv)||0,paymentMethod:pay});
 let pe='';
 if(cr){try{await api('savePayment',{type:pay,invoiceId:sale.invoiceId,saleId:sale.id||'',customerId:S.cust,customerName:cu?cu.name:S.custName,amount:sale.total,date:pay==='Cheque'?chqs[0].date:pd,cheques:pay==='Cheque'?(chqs.length===1?[Object.assign({},chqs[0],{amount:sale.total})]:chqs):undefined});updDue()}catch(e){pe=e.message}}
 S.saleDate='';S.pcache=null;S.ccache=null;S.cprices={};S.autoDv=false;S.cartRet=[];S.cart=[];S.dv='';S.cust='';S.custName='';S.payDate='';S.chqs=[];S.pay='Cash';await loadAll();toast('Sale '+sale.invoiceId+' completed','ok');
 if(sale.refund>0)toast('Give the customer '+money(sale.refund)+' back in cash','ok');
 if(pe)toast('Sale saved, but the '+pay.toLowerCase()+' record failed: '+pe,'err');
 vPos();showReceipt(sale)})}

function loadCP(c){
 S.cprices={};
 run(null,async()=>{const L=await api('getCustomerPrices',{customerId:c.id});L.forEach(x=>{S.cprices[x.productId]=Number(x.price)});if(S.cust===c.id){if($('#pg'))drawGrid();if($('#cp'))drawCart()}})}

function saleEdit(i){const s=S.sales[i];
 S.se={id:s.id,invoiceId:s.invoiceId,customerId:s.customerId||'',custName:s.customerName||'',date:s.date,pm:s.paymentMethod,dt:'amount',dv:Number(s.discount)||0,total0:Number(s.total)||0,
  items:s.items.filter(q=>q.kind!=='Replacement').map(q=>({id:q.productId,name:q.productName,qty:Number(q.quantity),price:Number(q.unitPrice),nod:Number(s.discount)>0&&!(Number(q.discount)>0)})),
  repl:s.items.filter(q=>q.kind==='Replacement'),rets:s.returns||[],ded:Number(s.returnDeduction)||0,payDate:'',chq:'',bank:'',chqs:[],chqLock:false};go('saleedit')}
async function vSaleEdit(){const x=S.se;if(!x){go('sales');return}
 if(x.pm==='Credit'||x.pm==='Cheque'){try{const P=await api('getPayments',{customerId:x.customerId||''}),m=P.filter(z=>z.invoiceId===x.invoiceId&&z.type===x.pm),q=m[0];if(q){x.payDate=q.date;x.chq=q.chequeNo||'';x.bank=q.bank||''}
  if(x.pm==='Cheque'){x.chqs=m.map(z=>({amount:z.amount,date:z.date,no:z.chequeNo||'',bank:z.bank||'',paid:Number(z.paidAmount)>0}));x.chqLock=m.some(z=>z.paid||Number(z.paidAmount)>0)}}catch(e){}}
 const pms=['Cash','Credit','Cheque'];if(pms.indexOf(x.pm)<0)pms.push(x.pm);
 $('#app').innerHTML='<div class="card"><div style="color:var(--m);font-size:13px">Editing <b style="color:var(--t)">'+esc(x.invoiceId)+'</b>. It keeps the same invoice number, and stock is adjusted automatically by the difference.</div><div class="row" style="margin-top:8px"><div style="flex:2"><label>Customer</label><div class="combo"><input id="sec" autocomplete="off" placeholder="Type to search customer…" value="'+esc(x.custName)+'" oninput="seCust(this.value)" onfocus="seCust(this.value,1)"><div class="cl" id="sed" style="display:none"></div></div></div><div><label>Date</label><input type="date" max="'+ymd(new Date())+'" value="'+esc(x.date)+'" oninput="S.se.date=this.value"></div><div><label>Payment</label><select id="sepm" onchange="S.se.pm=this.value;sePay()">'+pms.map(m=>'<option>'+esc(m)+'</option>').join('')+'</select></div></div><div id="sepx"></div></div>'+
 '<div class="card" style="margin-top:10px"><h3 style="margin:0 0 8px">Items</h3><div id="sei"></div><label>Add an item</label><div class="combo"><input id="sepi" autocomplete="off" placeholder="Search product…" oninput="prodCombo(this.value,\'sepd\',\'seAdd\')" onfocus="prodCombo(this.value,\'sepd\',\'seAdd\')"><div class="cl" id="sepd" style="display:none"></div></div><div class="row" style="margin-top:8px"><div><label>Discount type</label><select id="sedt2" onchange="S.se.dt=this.value;seTot()"><option value="amount">Amount (Rs)</option><option value="percent">Percentage (%)</option></select></div><div><label>Discount</label><input id="sedv" type="number" min="0" step="any" value="'+x.dv+'" oninput="S.se.dv=this.value;seTot()"></div></div><div id="set" style="margin-top:12px"></div></div>'+
 ((x.repl.length||x.rets.length)?'<div class="card" style="margin-top:10px"><h3 style="margin:0 0 6px">Returns on this sale</h3>'+x.repl.map(r=>'<div>'+esc(r.productName)+' × '+r.quantity+' <span class="badge">replacement given</span></div>').join('')+x.rets.map(r=>'<div>'+esc(r.productName)+' × '+r.quantity+' · '+(r.resolution==='Cash deducted'?'cash deducted '+money(r.quantity*r.value):'replacement given')+'</div>').join('')+'<div style="color:var(--m);font-size:12.5px;margin-top:6px">These stay as they are. To undo a return, delete the sale and enter it again.</div></div>':'')+
 '<div class="row" style="margin-top:12px"><button class="btn" onclick="seSave(this)">Save changes</button><button class="btn alt" onclick="S.se=null;go(\'sales\')">Cancel</button></div>';
 $('#sepm').value=x.pm;$('#sedt2').value=x.dt;sePay();drawSeItems()}
function seCust(q,keep){const x=S.se,el=$('#sed');if(!keep){x.customerId='';x.custName=q}
 const k=String(q||'').toLowerCase(),L=S.customers.filter(c=>!k||[c.name,c.phone,c.route].some(v=>String(v||'').toLowerCase().indexOf(k)>-1)).sort((a,b)=>custTotal(b.id)-custTotal(a.id)||String(a.name).localeCompare(String(b.name))).slice(0,80);
 el.innerHTML='<div onclick="sePick(\'\')" style="color:var(--m)">(no customer)</div>'+L.map(c=>'<div onclick="sePick(\''+esc(c.id)+'\')">'+esc(c.name)+(c.route?' <small style="color:#1e7d4f">'+esc(c.route)+'</small>':'')+'</div>').join('');el.style.display='block'}
function sePick(id){const c=S.customers.find(z=>z.id===id);S.se.customerId=id;S.se.custName=c?c.name:'';$('#sec').value=S.se.custName;$('#sed').style.display='none'}
function sePay(){const x=S.se,e=$('#sepx');
 e.innerHTML=x.pm==='Cheque'?'<div id="cq_se">'+chqEd('se')+'</div>':(x.pm==='Credit'?'<div class="row"><div><label>Due date*</label><input type="date" value="'+esc(x.payDate)+'" oninput="S.se.payDate=this.value"></div></div>':'')}
function drawSeItems(){const x=S.se;
 $('#sei').innerHTML=x.items.length?table(['Item','Qty','Price','Discount','Total',''],x.items.map((r,i)=>[esc(r.name),'<input type="number" min="0" step="any" style="width:90px" value="'+r.qty+'" oninput="seQ('+i+',this.value)" aria-label="Quantity">','<input type="number" min="0" step="any" style="width:110px" value="'+r.price+'" oninput="seP('+i+',this.value)" aria-label="Price">','<input type="checkbox"'+(r.nod?'':' checked')+' onchange="seNod('+i+',this.checked)" title="Tick = this item gets the discount" aria-label="Gets discount">','<span id="sl'+i+'">'+money(r.qty*r.price)+'</span>','<button class="btn red" onclick="seRm('+i+')" aria-label="Remove">✕</button>'])):'<div class="empty">No items. Add one below.</div>';seTot()}
function seNod(i,on){S.se.items[i].nod=!on;seTot()}
function seQ(i,v){S.se.items[i].qty=Number(v)||0;seLine(i)}
function seP(i,v){S.se.items[i].price=Number(v)||0;seLine(i)}
function seLine(i){const r=S.se.items[i],e=$('#sl'+i);if(e)e.textContent=money(r.qty*r.price);seTot()}
function seRm(i){S.se.items.splice(i,1);drawSeItems()}
function seAdd(id){const p=S.products.find(z=>z.id===id);if(!p)return;const ex=S.se.items.find(r=>r.id===id);if(ex)ex.qty+=1;else S.se.items.push({id,name:p.name,qty:1,price:Number(p.price),nod:false});$('#sepd').style.display='none';$('#sepi').value='';drawSeItems()}
function seCalc(){const x=S.se,r2=n=>Math.round(n*100)/100;let sub=0,es=0;x.items.forEach(r=>{const l=r2(r.qty*r.price);sub+=l;if(!r.nod)es+=l});sub=r2(sub);es=r2(es);
 const dv=Number(x.dv)||0,disc=Math.min(es,r2(x.dt==='percent'?es*dv/100:dv)),rate=bool(S.settings.taxEnabled)?(Number(S.settings.taxRate)||0):0,tax=Math.round((sub-disc)*rate)/100,net=r2(sub-disc+tax-x.ded);
 return{sub,es,disc,tax,net,total:Math.max(0,net),refund:net<0?-net:0}}
function seTot(){const x=S.se,c=seCalc();
 $('#set').innerHTML='<table style="max-width:340px;margin-left:auto"><tr><td>Subtotal</td><td class="r">'+money(c.sub)+'</td></tr>'+(c.disc?'<tr><td>Discount'+(c.es<c.sub?' <small style="color:var(--m)">(on '+money(c.es)+' of items)</small>':'')+'</td><td class="r">-'+money(c.disc)+'</td></tr>':'')+(c.tax?'<tr><td>Tax</td><td class="r">'+money(c.tax)+'</td></tr>':'')+(x.ded?'<tr><td>Returns deducted</td><td class="r">-'+money(x.ded)+'</td></tr>':'')+'<tr><td><b>New total</b></td><td class="r"><b>'+money(c.total)+'</b></td></tr><tr><td style="color:var(--m)">Was</td><td class="r" style="color:var(--m)">'+money(x.total0)+'</td></tr>'+(c.refund?'<tr><td>Cash given back</td><td class="r">'+money(c.refund)+'</td></tr>':'')+'</table>';chqStat('se')}
function seSave(b){run(b,async()=>{const x=S.se,c=seCalc();
 if(x.custName&&!x.customerId)throw new Error('Pick the customer from the list.');
 if(!x.items.length&&!x.repl.length&&!x.rets.length)throw new Error('Add at least one item.');
 if(x.items.some(r=>!(r.qty>0)))throw new Error('Every item needs a quantity above 0.');
 const cr=(x.pm==='Credit'||x.pm==='Cheque')&&c.total>0;let chqs=null;
 if(cr&&x.pm==='Cheque'&&!x.chqLock)chqs=chqCollect('se',c.total);else if(cr&&!x.payDate)throw new Error('Enter the '+(x.pm==='Cheque'?'banking':'due')+' date.');
 await api('updateSale',{id:x.id,customerId:x.customerId,date:x.date,paymentMethod:x.pm,discountType:x.dt,discountValue:Number(x.dv)||0,items:x.items.map(r=>({productId:r.id,quantity:r.qty,price:r.price,noDiscount:!!r.nod})),payDate:chqs?chqs[0].date:x.payDate,chequeNo:x.chq,bank:x.bank,cheques:chqs||undefined});
 S.se=null;S.pcache=null;S.ccache=null;await loadAll();toast('Sale updated. Stock adjusted.','ok');go('sales')})}

function salesRange(a,b){if(!a||!b)return;$('#f').value=a;$('#t').value=b;loadSales()}
function vSales(){
 const t=ymd(new Date()),yy=new Date();yy.setDate(yy.getDate()-1);const yd=ymd(yy),f=ymd(new Date(Date.now()-29*864e5));
 $('#app').innerHTML='<div class="row" style="margin-bottom:6px"><button class="btn alt" id="sb1" style="flex:none" onclick="salesRange(\''+t+'\',\''+t+'\')">Today</button><button class="btn alt" id="sb2" style="flex:none" onclick="salesRange(\''+yd+'\',\''+yd+'\')">Yesterday</button><div style="max-width:190px"><label>Pick one day</label><input type="date" id="sd1" max="'+t+'" onchange="salesRange(this.value,this.value)"></div></div>'+
 '<div class="row"><div><label>From</label><input type="date" id="f" value="'+f+'"></div><div><label>To</label><input type="date" id="t" value="'+t+'"></div><button class="btn" style="flex:none;align-self:end" onclick="loadSales()">Show</button><button class="btn alt" style="flex:none;align-self:end" onclick="go(\'dayclose\')">🧮 End-of-day closing</button></div><div class="card" style="margin-top:10px" id="sl"></div>';loadSales()}
function loadSales(){run(null,async()=>{const L=await api('getSales',{from:$('#f').value,to:$('#t').value});L.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt).localeCompare(String(a.createdAt)));S.sales=L;
 const t=ymd(new Date()),yy=new Date();yy.setDate(yy.getDate()-1),f=$('#f').value,to=$('#t').value;$('#sb1').className='btn'+(f===t&&to===t?'':' alt');$('#sb2').className='btn'+(f===ymd(yy)&&to===ymd(yy)?'':' alt');
 $('#sl').innerHTML=(L.length?'<div style="color:var(--m);font-size:13px;margin-bottom:6px">'+L.length+' sale(s) · '+money(L.reduce((a,x)=>a+Number(x.total),0))+' · newest first</div>':'')+(L.length?table(['Date','Invoice','Customer','Total','Payment',''],L.map((s,i)=>[esc(s.date),esc(s.invoiceId)+(s.editedAt?'<br><span class="badge">edited</span>':'')+((s.returns||[]).length?'<br><span class="badge warn">↩ '+s.returns.length+' return(s)</span>':''),esc(s.customerName||'Walk-in'),money(s.total),esc(s.paymentMethod),'<button class="btn alt" onclick="showReceipt(S.sales['+i+'])">Receipt</button>'+(isAdmin()?' <button class="btn alt" onclick="saleEdit('+i+')">Edit</button> <button class="btn red" onclick="delSale('+i+')">Delete</button>':'')])):'<div class="empty">No sales in this period.</div>')})}

function drawPH(id){const h=S.phist[id],ad=isAdmin(),tab=(S.phTab||{})[id]||'cust',el=$('#phc_'+id);if(!h||!el)return;
 const chip=(l,v,x)=>'<div style="background:#f3f6fa;border-radius:10px;padding:8px 12px;min-width:110px"><div style="font-size:11.5px;color:var(--m)">'+l+'</div><div style="font-weight:700;font-size:16px">'+v+'</div>'+(x?'<div style="font-size:11.5px;color:var(--m)">'+x+'</div>':'')+'</div>';
 let s='<div class="row" style="gap:8px;margin:4px 0 10px">'+chip('In stock now',h.stock)+chip('Total sold',h.sold,h.lastSale?'last: '+esc(h.lastSale):'never sold')+chip('Bought by',h.customers.length+' customer(s)')+chip('Received from supplier',h.received,h.lastReceived?'last: '+esc(h.lastReceived):'')+(h.pending?chip('Coming (invoice not received)','+'+h.pending):'')+chip('Sales value',money(h.revenue))+(ad&&h.profit!=null?chip('Profit',money(h.profit)):'')+'</div>';
 const tb=(k,l)=>'<button class="btn '+(tab===k?'':'alt')+'" onclick="event.stopPropagation();phTab(\''+id+'\',\''+k+'\')">'+l+'</button>';
 s+='<div class="row" style="gap:6px;margin-bottom:10px">'+tb('cust','👥 Sold to customers ('+h.customers.length+')')+tb('move','📦 Stock movement')+tb('recv','🚚 Received from supplier ('+h.received_rows.length+')')+'</div>';
 if(tab==='cust'){
  const mx=Math.max(1,...h.customers.map(c=>c.qty)),so=(S.phS||{})[id]||'qty',
   CMP={qty:(a,b)=>b.qty-a.qty,qtyl:(a,b)=>a.qty-b.qty,amt:(a,b)=>b.revenue-a.revenue,times:(a,b)=>b.orders-a.orders||b.qty-a.qty,last:(a,b)=>String(b.lastDate).localeCompare(String(a.lastDate)),lastold:(a,b)=>String(a.lastDate).localeCompare(String(b.lastDate)),name:(a,b)=>String(a.name).localeCompare(String(b.name))},
   CS=h.customers.slice().sort(CMP[so]||CMP.qty),SO=[['qty','Most quantity first'],['qtyl','Least quantity first'],['amt','Highest amount first'],['times','Most times bought'],['last','Last bought (newest first)'],['lastold','Last bought (oldest first)'],['name','Customer name A–Z']];
  if(h.customers.length>1)s+='<div class="row" style="margin-bottom:8px"><label style="flex:none;align-self:center;margin:0">Sort by</label><select style="max-width:260px" onclick="event.stopPropagation()" onchange="event.stopPropagation();phSort(\''+id+'\',this.value)">'+SO.map(o=>'<option value="'+o[0]+'"'+(so===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></div>';
  s+=h.customers.length?'<div class="tw"><table><thead><tr><th>Customer</th><th class="r">Times bought</th><th class="r">Qty</th><th class="r">Amount</th><th style="min-width:120px">Share</th><th>Last bought</th></tr></thead><tbody>'+CS.map((c,i)=>'<tr style="cursor:pointer" onclick="event.stopPropagation();phCust(\''+id+'\','+i+')"><td><b>'+esc(c.name)+'</b> <small style="color:var(--m)">▾ details</small></td><td class="r">'+c.orders+'</td><td class="r"><b>'+c.qty+'</b></td><td class="r">'+money(c.revenue)+'</td><td><div style="background:#e8edf2;border-radius:99px;height:8px"><div style="background:var(--p,#71a5d6);height:8px;border-radius:99px;width:'+Math.round(c.qty/mx*100)+'%"></div></div></td><td>'+esc(c.lastDate)+'</td></tr>'+
   '<tr id="pcl_'+id+'_'+i+'" style="display:none"><td colspan="6" style="background:#fafbfd"><table style="width:100%"><thead><tr><th>Date</th><th>Invoice</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>'+c.lines.map(l=>'<tr><td>'+esc(l.date)+'</td><td>'+esc(l.invoiceId)+(l.kind==='Replacement'?' <span class="badge warn">replacement</span>':'')+'</td><td class="r">'+l.qty+'</td><td class="r">'+money(l.price)+'</td><td class="r">'+money(l.total)+'</td></tr>').join('')+'</tbody></table></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">This product has not been sold yet.</div>'}
 if(tab==='move'){
  const f=(S.phF||{})[id]||'all',all=(S.phAll||{})[id];
  const grp={all:null,sold:['Sold','Replacement'],in:['Received','Free from supplier'],ret:['Customer return'],adj:['Adjust']};
  let L=h.ledger.filter(e=>f==='all'||(f==='adj'?e.type.indexOf('Adjust')===0:grp[f].indexOf(e.type)>-1));
  const tot=L.length;if(!all)L=L.slice(0,40);
  s+='<div class="row" style="margin-bottom:8px"><select onchange="event.stopPropagation();phFilt(\''+id+'\',this.value)" onclick="event.stopPropagation()"><option value="all"'+(f==='all'?' selected':'')+'>Everything</option><option value="sold"'+(f==='sold'?' selected':'')+'>Sold only</option><option value="in"'+(f==='in'?' selected':'')+'>Received only</option><option value="ret"'+(f==='ret'?' selected':'')+'>Customer returns</option><option value="adj"'+(f==='adj'?' selected':'')+'>Stock adjustments</option></select><span style="color:var(--m);font-size:12.5px;align-self:center">Newest first. “Stock after” is what was in stock right after that line.</span></div>';
  s+=L.length?'<div class="tw"><table><thead><tr><th>Date</th><th>What happened</th><th>Reference / who</th><th class="r">In</th><th class="r">Out</th><th class="r">Stock after</th></tr></thead><tbody>'+L.map(e=>'<tr><td>'+esc(e.date)+'</td><td><span class="badge" style="background:'+(PH_COL[e.type]||'#eee')+'">'+esc(e.type)+'</span></td><td>'+esc(e.ref)+(e.party?' <small style="color:var(--m)">· '+esc(e.party)+'</small>':'')+'</td><td class="r" style="color:#1b7a34">'+(e.inQ?'+'+e.inQ:'')+'</td><td class="r" style="color:#b3261e">'+(e.outQ?'−'+e.outQ:'')+'</td><td class="r"><b>'+e.balance+'</b></td></tr>').join('')+(f==='all'&&h.earlier&&tot<=L.length?'<tr style="color:var(--m)"><td colspan="5">Before the records above (opening stock, or changes made before this history existed)</td><td class="r">'+h.earlier+'</td></tr>':'')+'</tbody></table></div>'+(tot>L.length?'<div style="margin-top:8px"><button class="btn alt" onclick="event.stopPropagation();S.phAll=S.phAll||{};S.phAll[\''+id+'\']=true;drawPH(\''+id+'\')">Show all '+tot+' lines</button></div>':''):'<div class="empty">No movements found.</div>'}
 if(tab==='recv'){
  s+=h.received_rows.length?'<div class="tw"><table><thead><tr><th>Date</th><th>Supplier invoice</th><th>Supplier</th><th class="r">Qty</th><th>Status</th>'+(ad?'<th class="r">Unit price</th><th class="r">Disc %</th><th class="r">Net cost each</th>':'')+'</tr></thead><tbody>'+h.received_rows.map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.invoiceNo)+(r.free?' <span class="badge">free item</span>':'')+'</td><td>'+esc(r.supplier)+'</td><td class="r"><b>'+r.qty+'</b></td><td><span class="badge '+(r.status==='Received'?'':'warn')+'">'+esc(r.status)+'</span></td>'+(ad?'<td class="r">'+money(r.unitPrice)+'</td><td class="r">'+(r.discPct||0)+'</td><td class="r">'+money(r.netCost)+'</td>':'')+'</tr>').join('')+'</tbody></table></div>':'<div class="empty">No supplier invoice has this product yet.</div>'}
 s+='<div style="margin-top:8px"><button class="btn alt" onclick="event.stopPropagation();delete S.phist[\''+id+'\'];prodTog(\''+id+'\');prodTog(\''+id+'\')">↻ Refresh</button></div>';
 el.innerHTML='<div class="card" style="margin:6px 0;box-shadow:none;border:1px solid #e3e8ee" onclick="event.stopPropagation()"><b>'+esc(h.name)+'</b> <small style="color:var(--m)">'+esc(h.sku)+'</small>'+s+'</div>'}
function phSort(id,v){S.phS=S.phS||{};S.phS[id]=v;drawPH(id)}
```

## Appendix J — Revision 5 reference code (verbatim from the reference files)

These replace the functions of the same name in the earlier appendices and sections. Everything here is also in the delivered `Code.gs` / `index.html`.

**Backend (`Code.gs`)** — also add `rejectCheque: rejectCheque_` and `setInvoiceDates: setInvoiceDates_` to `ACTIONS` and `'rejectCheque'` to `CASHIER_ACTIONS`; in `getPayments_` the filter line is `(!cu || x.customerId === cu) && (x.status === 'Rejected' || ((!from || x.date >= from) && (!to || x.date <= to))) && (!ty || x.type === ty) && (!st || (st === 'Outstanding' ? x.status !== 'Paid' : x.status === st))`; `deleteSale_` and `updateSale_` use `payLocked_` instead of `payPaid_(x) > 0` for their "money was received" checks; `chequeList_` / `chequeRow_` (Appendix I) now keep `chequeNo`/`bank` as empty strings.

```js
const SCHEMA_VER = 'r4'; // change this text whenever columns are added, so every sheet is upgraded once, automatically
function ensureDb_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), pr = PropertiesService.getScriptProperties();
  if (Object.keys(SCHEMAS).some(function (n) { return !ss.getSheetByName(n); }) || pr.getProperty('schemaVer') !== SCHEMA_VER) { setupDatabase(); pr.setProperty('schemaVer', SCHEMA_VER); }
}

function payNorm_(x) {
  const o = pub_(x), amt = Number(x.amount) || 0, paid = Math.min(amt, payPaid_(x));
  o.amount = amt; o.paidAmount = r2_(paid); o.remaining = Math.max(0, r2_(amt - paid));
  o.status = o.remaining <= 0.004 ? 'Paid' : (paid > 0 ? 'Partly paid' : 'Unpaid');
  o.rejected = !!x.rejectedDate; o.rejectedDate = x.rejectedDate || ''; o.rejectNote = x.rejectNote || '';
  if (o.rejected && o.remaining > 0.004) o.status = 'Rejected'; // a bounced cheque is owed again until the customer pays
  o.billDate = x.billDate || String(x.createdAt || '').slice(0, 10); o.source = x.source || 'Sale'; o.note = x.note || '';
  return o;
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
    const ts = now_(), applied = [];
    targets.forEach(function (t) {
      const n = payNorm_(t.row), paid = r2_(n.paidAmount + t.amt);
      appendRow_('Receipts', { id: uid_('M'), paymentId: t.row.id, invoiceId: t.row.invoiceId, customerId: t.row.customerId, customerName: t.row.customerName, date: date, amount: t.amt, method: method, chequeNo: str_(p.chequeNo, 40), bank: str_(p.bank, 60), note: str_(p.note, 200), createdBy: who_(), createdAt: ts });
      setPaid_(t.row, paid, date);
      applied.push({ paymentId: t.row.id, invoiceId: t.row.invoiceId, billDate: n.billDate, amount: t.amt, remaining: r2_(n.amount - paid) });
    });
    return { total: r2_(amount), date: date, method: method, customerId: targets[0].row.customerId, customerName: targets[0].row.customerName, applied: applied };
  } finally { lock.releaseLock(); }
}

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
```

**Front end (`index.html`)** — CSS addition: `.ci .cq:focus{background:#fff3b0;box-shadow:0 0 0 2px #f0b429;outline:none}`; state defaults `dt:'percent'` and, after every sale, `S.dt='percent'`; `newChq=()=>({amount:'',date:''})`; `chqCollect` returns `{amount,date}`; `payFind`, `payRk`, `payCmp`, `payTog`, `payRecv`, `rejModal`, `rejSave`, `rejUndo` replace the old `payTog`/`payRecv`; the customer profile uses `.sort(payCmp)` and shows **Receive** for credit bills and rejected cheques.

```js
function addCart(id){
 const p=S.products.find(x=>x.id===id);if(!p)return;const i=S.cart.find(x=>x.id===id),n=(i?i.qty:0)+1;
 if(n>p.stock){toast('Not enough stock for '+p.name,'err');return}
 if(i)i.qty=n;else S.cart.push({id,qty:1});drawCart();focusQty(id)}
function focusQty(id){const e=document.querySelector('#cp .cq[data-id="'+id+'"]');if(e&&e.offsetParent!==null){e.focus();e.select()}}
function qtyKey(ev){if(ev.key==='Enter'){ev.preventDefault();ev.target.blur();const q=$('#ps');if(q){q.focus();q.select()}}}

function chqEd(k){const C=chqArr(k);if(k==='se'&&S.se.chqLock)return'<div style="color:#b36b00;font-size:13px;margin:6px 0">Some cheques of this bill were already received (or rejected), so they cannot be changed here. (Undo that in Cheques &amp; Credits first.)</div>'+table(['Amount','Banking date'],C.map(c=>[money(c.amount),esc(c.date)]));
 if(!C.length)C.push(newChq());
 return '<label>Cheque'+(C.length>1?'s':'')+' <small style="color:var(--m)">(if the customer splits the bill, add one row per cheque)</small></label>'+C.map((c,i)=>'<div class="card" style="padding:8px;margin:6px 0"><div class="row"><div><label>Amount'+(C.length>1?'*':'')+'</label><input type="number" min="0" step="any" placeholder="'+(C.length>1?'Amount':'Full bill')+'" value="'+esc(c.amount)+'" oninput="chqSet(\''+k+'\','+i+',\'amount\',this.value)"></div><div><label>Banking date*</label><input type="date" value="'+esc(c.date)+'" oninput="chqSet(\''+k+'\','+i+',\'date\',this.value)"></div>'+(C.length>1?'<button class="btn red" style="flex:none;align-self:end" onclick="chqRm(\''+k+'\','+i+')" aria-label="Remove cheque">✕</button>':'')+'</div></div>').join('')+'<div id="cqs_'+k+'" style="font-size:13px;margin:4px 0"></div><button class="btn alt" onclick="chqAdd(\''+k+'\')">+ Add another cheque</button>'}

const payPill=(x,t)=>{if(x.status==='Rejected')return'<span class="pill ov">🚫 Rejected · '+esc(x.rejectedDate)+'</span>';if(x.status==='Paid')return'<span class="pill pm-Other">Paid'+(x.paidDate?' · '+esc(x.paidDate):'')+'</span>';const d=String(x.date),n=Math.round((new Date(d)-new Date(t))/864e5);return d<t?'<span class="pill ov">Overdue '+(-n)+'d</span>':d===t?'<span class="pill dueN">'+(x.type==='Cheque'?'Banking today':'Due today')+'</span>':'<span class="pill pm-Card">In '+n+' day(s)</span>'};

function payCard(x){const t=ymd(new Date()),open=!!S.payOpen[x.id],d=String(x.date),paid=x.status==='Paid',rj=x.status==='Rejected',bg=rj?'background:#fdecea;border-left:4px solid #b83232;':paid?'':d<t?'background:#fff2f2;':d===t?'background:#fff8e6;':'';
 return '<div class="card" style="margin-top:8px;padding:0;'+bg+'" id="pc'+x.id+'"><div style="display:flex;gap:10px;align-items:center;padding:10px 12px;cursor:pointer" onclick="payTog(\''+x.id+'\')"><span style="width:16px;color:var(--m)">'+(open?'▾':'▸')+'</span>'+(x.type==='Cheque'&&isAdmin()&&!x.rejected?'<input type="checkbox" '+(paid?'checked ':'')+'onclick="event.stopPropagation()" onchange="markPaid(\''+x.id+'\',this.checked,this)" aria-label="Mark banked">':'')+'<div style="flex:1;min-width:0"><b>'+esc(x.customerName||'-')+'</b> <small style="color:var(--m)">'+esc(x.invoiceId)+'</small> <span class="badge '+(x.type==='Cheque'?'warn':'')+'">'+esc(x.type)+'</span>'+(rj?' <span class="badge bad">REJECTED</span>':x.rejected?' <span class="badge">was rejected</span>':'')+(x.source==='Old bill'?' <span class="badge">old bill</span>':'')+'<div style="font-size:12.5px;color:var(--m)">'+(x.type==='Cheque'?'Banking ':'Due ')+esc(d)+' '+payPill(x,t)+'</div></div><div style="text-align:right"><b'+(rj?' style="color:#b83232"':'')+'>'+money(x.remaining)+'</b><div style="font-size:12px;color:var(--m)">of '+money(x.amount)+(x.status==='Partly paid'?' · part paid':'')+'</div></div></div>'+(open?payBody(x):'')+'</div>'}
function payBody(x){const row=(a,b)=>'<tr><td>'+a+'</td><td class="r">'+b+'</td></tr>',ch=x.type==='Cheque',owed=!ch||x.rejected;
 return '<div style="border-top:1px solid var(--b);padding:10px 12px"><table style="max-width:380px">'+row('Bill no.',esc(x.invoiceId))+row('Bill date',esc(x.billDate))+row(ch?'Banking date':'Due date',esc(x.date))+row('Bill total',money(x.amount))+(x.rejected?row('<b style="color:#b83232">Cheque rejected on</b>',esc(x.rejectedDate)):'')+(x.rejectNote?row('Reason',esc(x.rejectNote)):'')+row('Received so far',money(x.paidAmount))+row('<b>Remaining</b>','<b>'+money(x.remaining)+'</b>')+(x.paidDate&&x.status==='Paid'?row(ch&&!x.rejected?'Banked on':'Fully paid on',esc(x.paidDate)):'')+(x.note?row('Note',esc(x.note)):'')+'</table>'+
 (owed?'<h4 style="margin:12px 0 4px">Payments received</h4><div id="pr'+x.id+'">Loading…</div>':'')+
 '<div class="row" style="margin-top:10px">'+(owed&&x.remaining>0?'<button class="btn" style="flex:none" onclick="payRecv(\''+x.id+'\')">Receive payment</button>':'')+(ch&&!x.rejected?'<button class="btn red" style="flex:none" onclick="rejModal(\''+x.id+'\')">🚫 Cheque rejected</button>':'')+(x.rejected&&isAdmin()?'<button class="btn alt" style="flex:none" onclick="rejUndo(\''+x.id+'\')">Undo rejection</button>':'')+'<button class="btn alt" style="flex:none" onclick="custProf(\''+esc(x.customerId)+'\')">Customer</button>'+(isAdmin()&&x.source==='Old bill'&&!x.paidAmount?'<button class="btn red" style="flex:none" onclick="oldBillDel(\''+x.id+'\')">Delete this old bill</button>':'')+'</div></div>'}
function payFind(id){return (S.pays||[]).find(z=>z.id===id)||((S.cc&&S.cc.bills)||[]).find(z=>z.id===id)||(S.cpUn||[]).find(z=>z.id===id)||((S.rj&&S.rj.cheques)||[]).find(z=>z.id===id)}
const payRk=x=>x.status==='Rejected'?0:x.status==='Paid'?2:1,payCmp=(a,b)=>payRk(a)-payRk(b)||(a.status==='Paid'?String(b.paidDate).localeCompare(String(a.paidDate)):String(a.date).localeCompare(String(b.date)));
function payTog(id){const x=payFind(id);if(!x)return;S.payOpen[id]=!S.payOpen[id];$('#pc'+id).outerHTML=payCard(x);if(S.payOpen[id]&&(x.type==='Credit'||x.rejected))loadRcpts(id,'pr')}
function payRecv(id){const x=payFind(id);if(x)recvModal(x)}
/* cheque rejected: it is owed again and shows red until the customer pays */
function rejModal(id){const x=payFind(id);if(!x)return;S.rjx=x;
 modal('<h3>🚫 Cheque rejected</h3><p><b>'+esc(x.customerName)+'</b> · '+esc(x.invoiceId)+'<br>Cheque amount: <b>'+money(x.amount)+'</b>'+(x.status==='Paid'?'<br><span style="color:#b36b00">It was ticked as banked. It will go back to "not received".</span>':'')+'</p><p style="color:var(--m);font-size:13px;margin:0">The customer will owe '+money(x.amount)+' again. It shows in red in Cheques &amp; Credits until they pay it (cash, bank transfer or a new cheque).</p>'+(isAdmin()?'<label>Date it was rejected</label><input id="rjd" type="date" max="'+ymd(new Date())+'" value="'+ymd(new Date())+'">':'')+'<label>Reason (optional)</label><input id="rjn" placeholder="e.g. insufficient funds, signature does not match"><div class="row" style="margin-top:12px"><button class="btn red" onclick="rejSave(this)">Mark as rejected</button><button class="btn alt" onclick="closeModal()">Cancel</button></div>')}
function rejSave(b){run(b,async()=>{const x=S.rjx;await api('rejectCheque',{id:x.id,date:$('#rjd')?$('#rjd').value:'',note:$('#rjn').value});closeModal();toast('Cheque marked as rejected. '+x.customerName+' owes '+money(x.amount)+' again.','ok');updDue();refreshCollections()})}
function rejUndo(id){if(!confirm('Undo the rejection? The cheque goes back to "not banked yet".'))return;run(null,async()=>{await api('rejectCheque',{id,reject:false});toast('Rejection removed','ok');updDue();refreshCollections()})}

function vPay(){const d=Date.now();S.payOpen=S.payOpen||{};
 $('#app').innerHTML='<div class="row"><div><label>From (banking / due date)</label><input type="date" id="pyf" value="'+ymd(new Date(d-30*864e5))+'"></div><div><label>To</label><input type="date" id="pyt" value="'+ymd(new Date(d+60*864e5))+'"></div><div><label>Type</label><select id="pyy"><option value="">Cheques and credits</option><option>Cheque</option><option>Credit</option></select></div><div><label>Status</label><select id="pys"><option value="">All</option><option value="Outstanding">Not fully paid</option><option>Unpaid</option><option>Partly paid</option><option>Rejected</option><option>Paid</option></select></div><div style="flex:2"><label>Search</label><input id="pyq" placeholder="Customer name or bill no."></div><button class="btn" style="flex:none;align-self:end" onclick="loadPay()">Show</button></div><div id="pyr" style="margin-top:10px"></div>';
 $('#pyq').oninput=drawPay;$('#pyy').onchange=drawPay;$('#pys').onchange=drawPay;loadPay()}

function drawPay(){const ty=$('#pyy').value,st=$('#pys').value,k=norm($('#pyq').value),t=ymd(new Date());
 const L=(S.paysAll||[]).filter(x=>(!ty||x.type===ty)&&(!st||(st==='Outstanding'?x.status!=='Paid':x.status===st))&&(!k||norm(x.customerName+' '+x.invoiceId).indexOf(k)>-1)).sort(payCmp);S.pays=L;
 const un=L.filter(x=>x.status!=='Paid'),rj=L.filter(x=>x.status==='Rejected'),nr=un.filter(x=>x.status!=='Rejected'),pd=L.filter(x=>x.status==='Paid'),sum=(a,f)=>a.reduce((q,x)=>q+(Number(x[f])||0),0),ov=nr.filter(x=>String(x.date)<t).length,dt=nr.filter(x=>String(x.date)===t).length,hd=(c,h)=>'<h4 style="margin:16px 0 0;color:'+c+'">'+h+'</h4>';
 $('#pyr').innerHTML='<div class="kpis">'+kpi('g3','⏳',money(sum(un,'remaining')),'Still to collect ('+un.length+')')+kpi('g4','✅',money(sum(L,'paidAmount')),'Received so far')+kpi('g5','🚨',ov,'Overdue')+kpi('g1','🔔',dt,'Due today')+kpi('g5','🚫',money(sum(rj,'remaining')),'Rejected cheques ('+rj.length+')')+'</div>'+(L.length?(rj.length?hd('#b83232','🚫 Rejected cheques ('+rj.length+')')+rj.map(payCard).join(''):'')+(nr.length?hd('var(--t)','⏳ To collect ('+nr.length+')')+nr.map(payCard).join(''):'')+(pd.length?hd('#1e7d4f','✅ Paid ('+pd.length+')')+pd.map(payCard).join(''):''):'<div class="card empty" style="margin-top:10px">No cheques or credits in this range.</div>');
 L.forEach(x=>{if(S.payOpen[x.id]&&(x.type==='Credit'||x.rejected))loadRcpts(x.id,'pr')})}

function refreshCollections(){if(S.view==='payments')loadPay();else if(S.view==='custprofile')render();else if(S.view==='pos'&&S.pmode==='credit'){loadCC();loadToday()}else if(S.view==='pos'&&S.pmode==='reject')loadRJ()}

function rvMeth(){}
function recvSave(b){run(b,async()=>{const x=S.rv,a=Number($('#rva').value);if(!(a>0))throw new Error('Enter the amount.');
 const r=await api('receiveCollection',{paymentId:x.id,amount:a,method:$('#rvm').value,date:$('#rvd')?$('#rvd').value:'',note:$('#rvn').value});
 closeModal();updDue();refreshCollections();payReceipt(r,Math.round((x.remaining-a)*100)/100,'Balance of this bill')})}

async function updDue(){try{const t=ymd(new Date()),L=await api('getPayments',{status:'Outstanding'});S.rejCount=L.filter(x=>x.status==='Rejected').length;S.dueCount=L.filter(x=>x.status!=='Paid'&&(x.status==='Rejected'||String(x.date)<=t)).length}catch(e){S.dueCount=0;S.rejCount=0}setBadge('payments',S.dueCount)}

function drawCC(){const c=S.cc,t=ymd(new Date()),all=c.bills||[],out=all.filter(x=>x.status!=='Paid').sort((a,b)=>String(a.billDate).localeCompare(String(b.billDate))||String(a.date).localeCompare(String(b.date)));
 const cred=out.filter(x=>x.type==='Credit'||x.status==='Rejected').sort((a,b)=>(a.status==='Rejected'?0:1)-(b.status==='Rejected'?0:1)),chq=out.filter(x=>x.type==='Cheque'&&x.status!=='Rejected'),sum=a=>Math.round(a.reduce((q,x)=>q+x.remaining,0)*100)/100,owed=sum(cred),over=sum(cred.filter(x=>x.date<t)),paid=all.filter(x=>x.status==='Paid').sort((a,b)=>String(b.paidDate).localeCompare(String(a.paidDate))).slice(0,10);
 if(c.sel&&!cred.find(x=>x.id===c.sel))c.sel='';S.payOpen=S.payOpen||{};
 if(!$('#ccb'))return;
 $('#ccb').innerHTML='<div class="kpis">'+kpi('g3','📒',money(owed),'Owed: credit bills + rejected cheques ('+cred.length+')')+kpi('g5','🚨',money(over),'Overdue')+kpi('g1','🧾',money(sum(chq)),'Cheques not yet banked ('+chq.length+')')+'</div>'+
 (cred.length?'<div class="card" style="margin-top:10px"><h3 style="margin:0 0 6px">Receive payment</h3><label>Pay which bill?</label><select id="ccs" onchange="ccSel(this.value)"><option value="">Oldest bills first (automatic)</option>'+cred.map(x=>'<option value="'+esc(x.id)+'"'+(c.sel===x.id?' selected':'')+'>'+(x.status==='Rejected'?'🚫 REJECTED CHEQUE · ':'')+esc(x.invoiceId)+' · bill '+esc(x.billDate)+' · owes '+money(x.remaining)+'</option>').join('')+'</select><div class="row"><div><label>Amount*</label><input id="cca" type="number" min="0" step="any" value="'+(c.sel?cred.find(x=>x.id===c.sel).remaining:owed)+'"></div><div><label>Paid by</label><select id="ccm" onchange="ccMeth()"><option>Cash</option><option>Cheque</option><option>Bank Transfer</option></select></div>'+(isAdmin()?'<div><label>Date</label><input id="ccd" type="date" max="'+t+'" value="'+t+'"></div>':'')+'</div><div id="ccx"></div><label>Note</label><input id="ccn" placeholder="optional"><div class="row" style="margin-top:12px"><button class="btn" onclick="ccReceive(this)">Receive payment</button></div></div>':'<div class="card empty" style="margin-top:10px">This customer owes nothing on credit bills.</div>')+
 (cred.length?'<h4 style="margin:14px 0 0">Still owed (rejected cheques first, then credit bills oldest first)</h4>'+cred.map(payCard).join(''):'')+(chq.length?'<h4 style="margin:14px 0 0">Cheques not yet banked</h4>'+chq.map(payCard).join(''):'')+(paid.length?'<h4 style="margin:14px 0 0">Paid bills</h4>'+paid.map(payCard).join(''):'');
 cred.concat(chq,paid).forEach(x=>{if(S.payOpen[x.id])loadRcpts(x.id,'pr')})}
function ccSel(id){S.cc.sel=id;const c=S.cc,cred=c.bills.filter(x=>x.status!=='Paid'&&(x.type==='Credit'||x.status==='Rejected')),b=cred.find(x=>x.id===id),a=b?b.remaining:Math.round(cred.reduce((q,x)=>q+x.remaining,0)*100)/100;if($('#cca'))$('#cca').value=a}
function ccMeth(){}
function ccReceive(b){run(b,async()=>{const c=S.cc,a=Number($('#cca').value);if(!(a>0))throw new Error('Enter the amount.');
 const owed=Math.round(c.bills.filter(x=>x.status!=='Paid'&&(x.type==='Credit'||x.status==='Rejected')).reduce((q,x)=>q+x.remaining,0)*100)/100;
 const r=await api('receiveCollection',{paymentId:c.sel,customerId:c.cid,amount:a,method:$('#ccm').value,date:$('#ccd')?$('#ccd').value:'',note:$('#ccn').value});
 c.sel='';updDue();await loadCC();loadToday();payReceipt(r,Math.round((owed-a)*100)/100,'Total still owed by this customer')})}

/* Rejected cheque mode: pick the customer, pick the cheque the bank sent back, and it is owed again (red in Cheques & Credits) */
async function vPosReject(){S.rj=S.rj||{cid:'',name:'',cheques:[]};
 $('#app').innerHTML='<div class="row" style="align-items:end">'+posModeSel()+'<div style="flex:1;color:var(--m);font-size:13px;padding-bottom:8px">A customer\'s cheque was rejected (bounced) by the bank.</div>'+(isAdmin()?'<button class="btn alt" style="flex:none" onclick="oldBillForm(S.rj.cid)">＋ Cheque that is not in the system</button>':'')+'</div><div class="card" style="margin-top:8px"><label>Customer*</label><div class="combo"><input id="rjin" autocomplete="off" placeholder="Type customer name or route…" value="'+esc(S.rj.name)+'" oninput="rjSearch(this.value)" onfocus="rjSearch(this.value,1)"><div class="cl" id="rjdd" style="display:none"></div></div></div><div id="rjb" style="margin-top:10px"></div>';
 $('#pmode').value='reject';
 if(S.rj.cid)await loadRJ();else $('#rjb').innerHTML='<div class="card empty">Pick the customer to see their cheques.</div>'}
function rjSearch(q,keep){const c=S.rj,el=$('#rjdd');if(!keep){c.cid='';c.name=q;c.cheques=[]}
 const k=String(q||'').toLowerCase(),L=S.customers.filter(x=>!k||[x.name,x.phone,x.route].some(v=>String(v||'').toLowerCase().indexOf(k)>-1)).sort((a,b)=>custTotal(b.id)-custTotal(a.id)||String(a.name).localeCompare(String(b.name))).slice(0,80);
 el.innerHTML=L.length?L.map(x=>'<div onclick="rjPick(\''+esc(x.id)+'\')">'+esc(x.name)+(x.route?' <small style="color:#1e7d4f">'+esc(x.route)+'</small>':'')+'</div>').join(''):'<div style="color:var(--m);cursor:default">No match.</div>';el.style.display='block'}
function rjPick(id){const x=S.customers.find(z=>z.id===id);if(!x)return;S.rj.cid=id;S.rj.name=x.name;$('#rjin').value=x.name;$('#rjdd').style.display='none';loadRJ()}
async function loadRJ(){try{S.rj.cheques=(await api('getPayments',{customerId:S.rj.cid})).filter(x=>x.type==='Cheque');drawRJ()}catch(e){toast(e.message,'err')}}
function drawRJ(){const c=S.rj,L=c.cheques||[],ok=L.filter(x=>!x.rejected).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,30),rj=L.filter(x=>x.status==='Rejected');S.payOpen=S.payOpen||{};
 if(!$('#rjb'))return;
 $('#rjb').innerHTML=(rj.length?'<h4 style="margin:6px 0;color:#b83232">🚫 Rejected cheques still owed by '+esc(c.name)+' ('+rj.length+')</h4>'+rj.map(payCard).join(''):'')+'<h4 style="margin:14px 0 6px">Which cheque was rejected?</h4>'+(ok.length?'<div class="card">'+table(['Bill','Banking date','Amount','Status',''],ok.map(x=>[esc(x.invoiceId)+(x.note?' <small style="color:var(--m)">'+esc(x.note)+'</small>':''),esc(x.date),'<b>'+money(x.amount)+'</b>',x.status==='Paid'?'<span class="badge">Banked</span>':'<span class="badge warn">Not banked yet</span>','<button class="btn red" onclick="rejModal(\''+esc(x.id)+'\')">🚫 Rejected</button>']))+'</div>':'<div class="card empty">'+esc(c.name)+' has no cheques that can be marked as rejected.</div>');
 rj.forEach(x=>{if(S.payOpen[x.id])loadRcpts(x.id,'pr')})}

function posModeSel(){return '<select id="pmode" style="flex:none;width:auto;font-weight:600" aria-label="POS mode" onchange="posMode(this.value)"><option value="sale">Day sale</option><option value="return">Return</option><option value="credit">Credit payment</option><option value="reject">Rejected cheque</option></select>'}
function posMode(m){S.pmode=m;vPos()}
function vPos(){S.pmode=S.pmode||'sale';return S.pmode==='return'?vPosReturn():S.pmode==='credit'?vPosCredit():S.pmode==='reject'?vPosReject():vPosSale()}


function oldBillForm(cid){const c=S.customers.find(x=>x.id===cid);S.ob={cid:cid||'',name:c?c.name:''};
 modal('<h3>Add a missed credit bill or cheque</h3><p style="color:var(--m);font-size:13px;margin:0">For bills from before this system, or ones that were missed. No items are needed and it is not counted in sales. Enter only the amount that is still owed.</p><label>Customer*</label><div class="combo"><input id="obi" autocomplete="off" placeholder="Type customer name…" value="'+esc(S.ob.name)+'" oninput="obCust(this.value)" onfocus="obCust(this.value,1)"><div class="cl" id="obdd" style="display:none"></div></div><label>What is it?*</label><select id="obt" onchange="obToggle()"><option value="Credit">Credit bill</option><option value="Cheque">Cheque</option></select><div class="row"><div><label>Bill date*</label><input type="date" id="obb" max="'+ymd(new Date())+'"></div><div><label id="obl">Due date*</label><input type="date" id="obd"></div></div><label>Amount still owed*</label><input id="oba" type="number" min="0" step="any"><div id="obc" style="display:none"><label style="display:flex;gap:8px;align-items:center;color:var(--t);font-size:14px"><input type="checkbox" id="obr" style="width:auto"> This cheque was already rejected (bounced)</label></div><label>Bill / invoice no. (optional)</label><input id="obn" placeholder="from the old book; made automatically if empty"><label>Note</label><input id="obo"><div class="row" style="margin-top:12px"><button class="btn" onclick="obSave(this,0)">Save</button><button class="btn alt" onclick="obSave(this,1)">Save and add another</button><button class="btn alt" onclick="closeModal()">Cancel</button></div>')}
function obToggle(){const c=$('#obt').value==='Cheque';$('#obl').textContent=c?'Banking date*':'Due date*';$('#obc').style.display=c?'':'none'}

function obSave(b,again){run(b,async()=>{if(!S.ob.cid)throw new Error('Pick the customer from the list.');const a=Number($('#oba').value);if(!(a>0))throw new Error('Enter the amount that is still owed.');if(!$('#obb').value)throw new Error('Enter the bill date.');if(!$('#obd').value)throw new Error('Enter the '+($('#obt').value==='Cheque'?'banking':'due')+' date.');
 await api('addOldBill',{customerId:S.ob.cid,type:$('#obt').value,amount:a,billDate:$('#obb').value,date:$('#obd').value,invoiceNo:$('#obn').value,rejected:$('#obt').value==='Cheque'&&$('#obr').checked,note:$('#obo').value});
 toast('Old bill added for '+S.ob.name,'ok');updDue();
 if(again){['oba','obn','obo'].forEach(i=>{$('#'+i).value=''});$('#obr').checked=false}else closeModal();refreshCollections()})}

function invDates(i){const x=S.invs[i],t=ymd(new Date());S.idx=i;
 modal('<h3>Dates · '+esc(x.invoiceNo)+'</h3><label>Invoice date*</label><input id="idd" type="date" max="'+t+'" value="'+esc(x.date)+'">'+(x.status==='Received'?'<label>Received date* <small style="color:var(--m)">(the day the stock came in)</small></label><input id="idr" type="date" max="'+t+'" value="'+esc(x.receivedDate||x.date)+'">':'<div style="color:var(--m);font-size:13px;margin-top:8px">The received date is set when you receive the stock.</div>')+'<div class="row" style="margin-top:12px"><button class="btn" onclick="invDatesSave(this)">Save</button><button class="btn alt" onclick="closeModal()">Cancel</button></div>')}
function invDatesSave(b){run(b,async()=>{const x=S.invs[S.idx];if(!$('#idd').value)throw new Error('Enter the invoice date.');if($('#idr')&&!$('#idr').value)throw new Error('Enter the received date.');await api('setInvoiceDates',{id:x.id,date:$('#idd').value,receivedDate:$('#idr')?$('#idr').value:''});closeModal();await loadAll();await updInv();toast('Dates saved','ok');vInv()})}

function invDoReceive(id,b){run(b,async()=>{const pr={};document.querySelectorAll('#rcv input[data-c]').forEach(e=>{if(e.value!=='')pr[e.dataset.c]=Number(e.value)});
 const r=await api('receiveSupplierInvoice',{id,prices:pr,receivedDate:$('#rcd')?$('#rcd').value:'',updatePrices:!!($('#upd')&&$('#upd').checked)});closeModal();await loadAll();await updInv();toast('Stock updated: '+r.updated+' existing, '+r.created+' new product(s)','ok');vInv()})}

function invReceive(i){const x=S.invs[i],seen={},neu=[];
 let diff=0;x.items.forEach(it=>{const k=String(it.code).toLowerCase(),pr=findSku(it.code);if(!pr&&!seen[k]){seen[k]=1;neu.push(it)}if(pr&&Number(pr.price)!==Number(it.unitPrice))diff++});
 modal('<h3>Receive '+esc(x.invoiceNo)+'</h3><p>'+(x.items.length-neu.length)+' line(s) match products you already have. Their stock goes up and their cost is set to the invoice net cost (after discount).</p>'+(neu.length?'<p><b>'+neu.length+' new product(s)</b> will be created. The selling price is the invoice price (change it here if needed):</p><div id="rcv">'+neu.map(it=>'<label>'+esc(it.code)+' · '+esc(it.description)+' (cost '+money(it.netUnitCost)+')</label><input type="number" min="0" step="any" data-c="'+esc(it.code)+'" value="'+it.unitPrice+'" placeholder="Selling price">').join('')+'</div>':'')+(diff?'<label style="color:var(--t);font-size:14px"><input type="checkbox" id="upd">Also set the selling price of '+diff+' existing product(s) to the invoice price</label>':'')+'<label>Received date <small style="color:var(--m)">(the day the stock came in)</small></label><input id="rcd" type="date" max="'+ymd(new Date())+'" value="'+ymd(new Date())+'"><div class="row" style="margin-top:12px"><button class="btn" onclick="invDoReceive(\''+esc(x.id)+'\',this)">Receive into stock</button><button class="btn alt" onclick="closeModal()">Cancel</button></div>')}

function vInvNew(){
 S.invd=S.invd||{invoiceNo:'',date:ymd(new Date()),supplier:ls.get('invSup','Kelani Cables'),payMethod:'',items:[],recvNow:false,recvDate:ymd(new Date())};
 drawInvNew();
 if(!S.invs)run(null,async()=>{S.invs=await api('getSupplierInvoices',{})})}
function drawInvNew(){const d=S.invd;
 $('#app').innerHTML='<div class="card"><div class="row"><div><label>Invoice no.*</label><input value="'+esc(d.invoiceNo)+'" oninput="S.invd.invoiceNo=this.value"></div><div><label>Invoice date*</label><input type="date" max="'+ymd(new Date())+'" value="'+esc(d.date)+'" oninput="S.invd.date=this.value"></div><div><label>Supplier</label><input value="'+esc(d.supplier)+'" oninput="S.invd.supplier=this.value"></div><div><label>Payment terms</label><input value="'+esc(d.payMethod)+'" oninput="S.invd.payMethod=this.value" placeholder="e.g. CREDIT"></div></div><label style="display:flex;gap:8px;align-items:center;margin-top:10px;color:var(--t);font-size:14px"><input type="checkbox" style="width:auto" '+(d.recvNow?'checked ':'')+'onchange="S.invd.recvNow=this.checked;$(\'#ivrd\').style.display=this.checked?\'\':\'none\'"> The stock has already arrived: receive it into my stock when I save</label><div id="ivrd" style="max-width:220px;'+(d.recvNow?'':'display:none')+'"><label>Received date</label><input type="date" max="'+ymd(new Date())+'" value="'+esc(d.recvDate||ymd(new Date()))+'" oninput="S.invd.recvDate=this.value"></div></div>'+
 '<div class="card" style="margin-top:10px"><label>Add item: type the product name or code</label><div class="combo"><input id="ivs" autocomplete="off" placeholder="Search products…" oninput="invSearch(this.value)" onfocus="invSearch(this.value)" onkeydown="invSKey(event)"><div class="cl" id="ivd" style="display:none"></div></div>'+
 '<div id="ivrows" style="margin-top:12px"></div><div id="it" style="margin-top:12px"></div>'+
 '<div class="row" style="margin-top:12px"><button class="btn alt" onclick="invAddCustom(\'\')">+ Item not in Products</button><button class="btn" onclick="saveInvNew(this)">Save invoice</button><button class="btn alt" onclick="S.invd=null;go(\'invoices\')">Cancel</button></div></div>';
 drawInvRows()}

function saveInvNew(b){run(b,async()=>{const d=S.invd;
 if(!d.invoiceNo.trim())throw new Error('Enter the invoice number.');if(!d.date)throw new Error('Enter the invoice date.');
 const L=d.items;if(!L.length)throw new Error('Add at least one item.');
 L.forEach((i,n)=>{if(!String(i.code).trim())throw new Error('Row '+(n+1)+' needs a code (SKU).');if(!(Number(i.qty)>0))throw new Error('Enter the quantity for '+(i.description||i.code)+'.')});
 const rs=await api('saveSupplierInvoice',{invoiceNo:d.invoiceNo,date:d.date,supplier:d.supplier,payMethod:d.payMethod,customerName:'',items:L.map(i=>({code:i.code,description:i.description,qty:Number(i.qty),uom:i.uom,unitPrice:i.unitPrice,disc:i.disc,amount:Math.round(Number(i.qty)*i.unitPrice*100)/100}))});
 let rcv='';if(d.recvNow){try{await api('receiveSupplierInvoice',{id:rs.id,receivedDate:d.recvDate||ymd(new Date())});rcv=' and stock received'}catch(e){toast('Saved, but receiving the stock failed: '+e.message,'err')}}
 ls.set('invSup',d.supplier);S.invd=null;await loadAll();await updInv();toast('Invoice saved'+rcv+(rs.created?' and '+rs.created+' new product(s) added to Products':''),'ok');go('invoices')})}
```

## Appendix K — Revision 6 reference code (verbatim from the reference files)

These replace the functions of the same name. Other edits: CSS additions `.pos.nocart{grid-template-columns:minmax(0,1fr)}.pos.nocart .rsz,.pos.nocart .cartpane{display:none}` and `.cartbar.show{display:flex;position:fixed;right:20px;bottom:20px;background:var(--p);color:var(--pt);padding:12px 18px;border-radius:999px;gap:14px;z-index:30;cursor:pointer;font-weight:600;box-shadow:0 4px 14px #0004}`; in `vPosSale` the cart bar is `<div class="cartbar" id="cb" onclick="cartOpen()"></div>` followed by `cartApply();`; the cart header buttons are `Clear` → `cartReset()` and `Close ✕` → `cartClose()`; in `payReceipt` a row "Cheque banking date X" is shown when `r.chequeDate` is set; in `payCard` the badge `paid-by-cheque` is shown when `x.source==='Collection'`; in `getProductHistory_` the sort keys are `at: d + ' '` for Received, `at: (creditedDate||date) + ' '` for Free from supplier and `at: a.date + ' ' + (ch > 0 ? '' : (a.createdAt || ''))` for adjustments.

**Backend (`Code.gs`)**

```js
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

function adjustStock_(p) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw UErr('The system is busy. Please try again.');
  try {
    const type = str_(p.type, 20, true, 'Type');
    if (ADJ_TYPES.indexOf(type) < 0) throw UErr('Choose a valid reason type.');
    if (!Array.isArray(p.items) || !p.items.length) throw UErr('Nothing to adjust.');
    if (p.items.length > 500) throw UErr('Too many products in one go.');
    const prods = {}; readAll_('Products').forEach(function (x) { if (isAct_(x)) prods[x.id] = x; });
    const plan = [];
    p.items.forEach(function (i) {
      const pr = prods[str_(i.productId, 40, true, 'Product')];
      if (!pr) throw UErr('A product was not found.');
      const ns = num_(i.newStock, 'Counted stock');
      if (ns !== Number(pr.stock)) plan.push({ pr: pr, ns: ns });
    });
    let adjDate = today_();
    if (p.date) { adjDate = checkDate_(p.date); if (adjDate > today_()) throw UErr('The date cannot be in the future.'); }
    const ts = now_(), reason = str_(p.reason, 200);
    plan.forEach(function (x) {
      appendRow_('StockAdjustments', { id: uid_('A'), date: adjDate, productId: x.pr.id, sku: x.pr.sku, productName: x.pr.name, oldStock: Number(x.pr.stock), newStock: x.ns, change: r2_(x.ns - Number(x.pr.stock)), type: type, reason: reason, createdBy: who_(), createdAt: ts });
      setRow_('Products', x.pr._row, Object.assign({}, x.pr, { stock: x.ns, updatedAt: ts }));
    });
    return { count: plan.length };
  } finally { lock.releaseLock(); }
}
```

**Front end (`index.html`)**

```js
const chqDateBox=id=>'<label>Cheque banking date* <small style="color:var(--m)">(can be a future date)</small></label><input id="'+id+'" type="date" value="'+ymd(new Date())+'"><div style="font-size:12.5px;color:var(--m);margin-top:3px">This cheque will also show in Cheques &amp; Credits until it is banked.</div>';

function rvMeth(){$('#rvx').innerHTML=$('#rvm').value==='Cheque'?chqDateBox('rvb'):''}

function ccMeth(){$('#ccx').innerHTML=$('#ccm').value==='Cheque'?chqDateBox('ccb'):''}

function vPay(){const d=Date.now();S.payOpen=S.payOpen||{};
 $('#app').innerHTML='<div class="row" style="margin-bottom:10px"><button class="btn" id="ptC" style="flex:none" onclick="payTab(\'Cheque\')">Cheques</button><button class="btn alt" id="ptR" style="flex:none" onclick="payTab(\'Credit\')">Credits</button></div><div class="row"><div><label>From (banking / due date)</label><input type="date" id="pyf" value="'+ymd(new Date(d-30*864e5))+'"></div><div><label>To</label><input type="date" id="pyt" value="'+ymd(new Date(d+60*864e5))+'"></div><div><label>Status</label><select id="pys"><option value="">All</option><option value="Outstanding">Not fully paid</option><option>Unpaid</option><option>Partly paid</option><option>Rejected</option><option>Paid</option></select></div><div style="flex:2"><label>Search</label><input id="pyq" placeholder="Customer name or bill no."></div><button class="btn" style="flex:none;align-self:end" onclick="loadPay()">Show</button></div><div id="pyr" style="margin-top:10px"></div>';
 $('#pyq').oninput=drawPay;$('#pys').onchange=drawPay;loadPay()}
function payTab(t){S.payTab=t;drawPay()}

function drawPay(){const ty=S.payTab||'Cheque',st=$('#pys').value,k=norm($('#pyq').value),t=ymd(new Date());
 const L=(S.paysAll||[]).filter(x=>(!ty||x.type===ty)&&(!st||(st==='Outstanding'?x.status!=='Paid':x.status===st))&&(!k||norm(x.customerName+' '+x.invoiceId).indexOf(k)>-1)).sort(payCmp);S.pays=L;
 const cnt=t=>(S.paysAll||[]).filter(x=>x.type===t&&x.status!=='Paid').length;$('#ptC').className='btn'+(ty==='Cheque'?'':' alt');$('#ptR').className='btn'+(ty==='Credit'?'':' alt');$('#ptC').textContent='Cheques ('+cnt('Cheque')+')';$('#ptR').textContent='Credits ('+cnt('Credit')+')';
 const un=L.filter(x=>x.status!=='Paid'),rj=L.filter(x=>x.status==='Rejected'),nr=un.filter(x=>x.status!=='Rejected'),pd=L.filter(x=>x.status==='Paid'),sum=(a,f)=>a.reduce((q,x)=>q+(Number(x[f])||0),0),ov=nr.filter(x=>String(x.date)<t).length,dt=nr.filter(x=>String(x.date)===t).length,hd=(c,h)=>'<h4 style="margin:16px 0 0;color:'+c+'">'+h+'</h4>';
 $('#pyr').innerHTML='<div class="kpis">'+kpi('g3','⏳',money(sum(un,'remaining')),'Still to collect ('+un.length+')')+kpi('g4','✅',money(sum(L,'paidAmount')),'Received so far')+kpi('g5','🚨',ov,'Overdue')+kpi('g1','🔔',dt,'Due today')+(ty==='Cheque'?kpi('g5','🚫',money(sum(rj,'remaining')),'Rejected cheques ('+rj.length+')'):'')+'</div>'+(L.length?(rj.length?hd('#b83232','🚫 Rejected cheques ('+rj.length+')')+rj.map(payCard).join(''):'')+(nr.length?hd('var(--t)','⏳ To collect ('+nr.length+')')+nr.map(payCard).join(''):'')+(pd.length?hd('#1e7d4f','✅ Paid ('+pd.length+')')+pd.map(payCard).join(''):''):'<div class="card empty" style="margin-top:10px">No '+(ty==='Cheque'?'cheques':'credit bills')+' in this range.</div>');
 L.forEach(x=>{if(S.payOpen[x.id]&&(x.type==='Credit'||x.rejected))loadRcpts(x.id,'pr')})}

/* Clear = back to a fresh sale (items, returns, customer, discount, payment, sale date). Close hides the cart; a round "🛒 Cart" button brings it back. */
function cartReset(){S.cart=[];S.cartRet=[];S.cust='';S.custName='';S.cprices={};S.dv='';S.dt='percent';S.autoDv=false;S.pay='Cash';S.payDate='';S.chqs=[];S.saleDate='';drawCart();if($('#pg'))drawGrid()}
const wideScr=()=>window.matchMedia('(min-width:900px)').matches;
function cartApply(){const p=$('#pos'),b=$('#cb');if(!p)return;const h=!!S.cartHide&&wideScr();p.classList.toggle('nocart',h);if(b)b.classList.toggle('show',h)}
function cartClose(){if(wideScr()){S.cartHide=true;cartApply()}else{const c=$('#cp');if(c)c.classList.remove('open')}}
function cartOpen(){S.cartHide=false;cartApply();if(!wideScr()){const c=$('#cp');if(c)c.classList.add('open')}}

function vStock(){S.counts={};
 $('#app').innerHTML='<div class="card"><div class="row"><div><label>Reason</label><select id="sty"><option>Stocktake</option><option>Damaged</option><option>Lost</option><option>Found</option><option>Other</option></select></div><div><label>Date</label><input id="std" type="date" max="'+ymd(new Date())+'" value="'+ymd(new Date())+'"></div><div style="flex:2"><label>Note</label><input id="str" placeholder="e.g. monthly count, water damage"></div><div><label>Find product</label><input id="stq" placeholder="Search…"></div></div><p style="color:var(--m);font-size:13px">Type the real quantity in "Counted". Only products you change are updated, and every change is logged below.</p><div id="stl"></div><div class="row" style="margin-top:12px"><button class="btn" onclick="stSave(this)">Save adjustments</button><button class="btn alt" onclick="go(\'products\')">Back to products</button></div></div><div class="card" style="margin-top:12px"><h3>Recent adjustments</h3><div id="sth"></div></div>';
 $('#stq').oninput=drawStock;drawStock();
 run(null,async()=>{const L=await api('getStockAdjustments',{});$('#sth').innerHTML=L.length?table(['Date','Product','Old','New','Change','Reason','Note','By'],L.slice(0,60).map(a=>[esc(a.date),esc(a.productName),a.oldStock,a.newStock,'<b style="color:'+(a.change<0?'#b83232':'#1e7d4f')+'">'+(a.change>0?'+':'')+a.change+'</b>',esc(a.type),esc(a.reason),esc(a.createdBy)])):'<div class="empty">No adjustments yet.</div>'})}

function stSave(b){run(b,async()=>{const items=S.products.filter(p=>S.counts[p.id]!==undefined&&S.counts[p.id]!==Number(p.stock)).map(p=>({productId:p.id,newStock:S.counts[p.id]}));
 if(!items.length)throw new Error('Nothing changed yet. Type a counted quantity that differs from the system stock.');
 if(!confirm('Update stock for '+items.length+' product(s)?'))return;
 const r=await api('adjustStock',{type:$('#sty').value,date:$('#std').value,reason:$('#str').value,items});await loadAll();toast(r.count+' product(s) adjusted','ok');vStock()})}
```

## Appendix L — Revision 7 reference code (verbatim from the reference files)

Other edits: `DeletedSales` is added to `SCHEMAS` (columns in section 5.4's schema line), `'deletedDate', 'deletedAt'` to `TEXT_COLS`, `k === 'deletedDate'` to the date-format test in `readAll_`, `SCHEMA_VER = 'r6'`; `getDeletedSales: getDeletedSales_, getStockReport: getStockReport_` to `ACTIONS`; CSS `.pk{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:2px 14px;margin:6px 0}.pk label{display:flex;gap:8px;align-items:center;margin:3px 0;font-size:14px;cursor:pointer;color:var(--t)}.pk input{width:auto}details.card>summary{cursor:pointer;font-weight:600}`; in `vSales` the Admin-only button `<button class="btn alt" style="flex:none;align-self:end" onclick="showDeleted()">🗑 Deleted sales</button>` follows the End-of-day closing button; in `vRep` the buttons `This month` (`repMonth(0)`) and `Last month` (`repMonth(1)`) are added before the Profit button and `prtCards()` is placed between the filter row and `<div id="rp">`; in `loadRep` the Low-stock card is replaced by `<div class="card"><h3>Remaining stock on <To date></h3><div id="rs">Loading…</div></div>` and `loadRS()` is called at the end. In `getProductHistory_` (before the StockAdjustments loop) add:

```js
  readAll_('DeletedSales').forEach(function (d) {
    let its = []; try { its = JSON.parse(d.itemsJson || '[]'); } catch (e) { its = []; }
    its.forEach(function (i) { if (i.productId === pr.id) ev.push({ date: d.date, at: d.date + ' ' + (d.deletedAt || ''), type: 'Sold (sale deleted later)', ref: d.invoiceId, party: d.customerName || 'Walk-in customer', inQ: 0, outQ: Number(i.qty) || 0 }); });
  });
```

**Backend (`Code.gs`)**

```js
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

function getDeletedSales_(p) {
  const from = str_(p.from, 10) || '0000-00-00', to = str_(p.to, 10) || '9999-99-99';
  return readAll_('DeletedSales').filter(function (x) { return x.deletedDate >= from && x.deletedDate <= to; })
    .sort(function (a, b) { return String(b.deletedAt).localeCompare(String(a.deletedAt)); }).slice(0, 300).map(function (x) {
      const o = pub_(x); let its = []; try { its = JSON.parse(x.itemsJson || '[]'); } catch (e) { its = []; }
      o.items = its.map(function (i) { return i.qty + ' × ' + i.name; }).join(', '); delete o.itemsJson; return o;
    });
}

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
```

**Front end (`index.html`)**

```js
function delSale(i){const x=S.sales[i],u=x.items.reduce((t,it)=>t+Number(it.quantity),0);S.dsi=i;
 modal('<h3>Delete sale '+esc(x.invoiceId)+'</h3><p style="margin:0 0 6px"><b>'+money(x.total)+'</b> · '+esc(x.customerName||'Walk-in customer')+' · '+esc(x.date)+'</p><p style="color:var(--m);font-size:13px;margin:0">Its items ('+u+' units) are put back in stock'+((x.returns||[]).length?', and its returns are reversed':'')+'. Any unpaid cheque/credit record for it is removed too. The reason is saved in Stock count → recent adjustments, in the product history and in Deleted sales.</p><label>Reason*</label><select id="dsr"><option value="">Choose a reason…</option><option>Wrong entry (typing mistake)</option><option>Customer cancelled</option><option>Duplicate bill</option><option>Wrong customer or wrong items</option><option>Test sale</option><option>Other</option></select><label>Note <small style="color:var(--m)">(required when the reason is Other)</small></label><input id="dsn" maxlength="150" placeholder="Add more detail"><div class="row" style="margin-top:12px"><button class="btn red" onclick="delSaleGo(this)">Delete sale</button><button class="btn alt" onclick="closeModal()">Cancel</button></div>')}
function delSaleGo(b){const x=S.sales[S.dsi];run(b,async()=>{const r=$('#dsr').value,n=$('#dsn').value.trim();if(!r)throw new Error('Choose the reason for deleting this sale.');if(r==='Other'&&!n)throw new Error('Write the reason in the note box.');
 const rs=await api('deleteSale',{id:x.id,reason:r==='Other'?n:r+(n?' · '+n:'')});closeModal();await loadAll();toast('Sale deleted. Stock put back for '+rs.restored+' product(s).','ok');if(rs.short&&rs.short.length)toast('Stock for '+rs.short.join(', ')+' was already lower than expected, so it was set to 0.','err');loadSales()})}
function showDeleted(){run(null,async()=>{const L=await api('getDeletedSales',{});modal('<h3>🗑 Deleted sales</h3>'+(L.length?table(['Deleted on','Invoice','Customer','Total','Reason','By'],L.map(x=>[esc(x.deletedDate),'<b>'+esc(x.invoiceId)+'</b><br><small style="color:var(--m)">sale of '+esc(x.date)+'<br>'+esc(x.items)+'</small>',esc(x.customerName||'Walk-in'),money(x.total),esc(x.reason),esc(x.deletedBy)])):'<div class="empty">No sale has been deleted yet.</div>')+'<div class="row" style="margin-top:12px"><button class="btn alt" onclick="closeModal()">Close</button></div>')})}

/* ---------- PDF printing (browser print window; the file name starts with the business name) ---------- */
const nf=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2}),fdl=d=>{const x=new Date(d+'T00:00:00');return isNaN(x)?String(d):x.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
const PCSS='@page{size:A4;margin:14mm 12mm 16mm;@bottom-right{content:"Page " counter(page) " of " counter(pages);font:10px Arial,sans-serif;color:#555}}body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#111;margin:0}table.pg{width:100%;border-collapse:collapse}table.pg>thead>tr>td,table.pg>tfoot>tr>td{padding:0}.run{font-size:10px;color:#555;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:6px}.ft{font-size:10px;color:#555;border-top:1px solid #ccc;padding-top:3px;margin-top:8px;display:flex;justify-content:space-between}.hd{text-align:center;margin:0 0 6px}.hd h1{font-size:20px;margin:0}.hd h2{font-size:14px;letter-spacing:.6px;margin:2px 0}.hd div{font-size:11px;color:#444}h3{font-size:12px;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid #444;margin:16px 0 4px;padding-bottom:2px}table.d{width:100%;border-collapse:collapse}table.d th{text-align:left;background:#eee;padding:3px 6px;border-bottom:1px solid #888}table.d td{padding:3px 6px;border-bottom:1px solid #ddd}table.d thead{display:table-header-group}table.d tr{page-break-inside:avoid}.r{text-align:right}.cat td{font-weight:bold;background:#f5f5f5}.t td{font-weight:bold;border-top:1px solid #888}.sm{font-size:11px;color:#555}';
function printDoc(title,body,runTitle){const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0';document.body.appendChild(f);const c=S.settings,d=f.contentWindow.document;
 d.open();d.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+PCSS+'</style></head><body><table class="pg"><thead><tr><td><div class="run">'+esc(c.businessName)+' · '+esc(runTitle)+'</div></td></tr></thead><tfoot><tr><td><div class="ft"><span>'+esc(c.businessName)+(c.phone?' · '+esc(c.phone):'')+'</span><span>Printed '+esc(fdl(ymd(new Date())))+'</span></div></td></tr></tfoot><tbody><tr><td>'+body+'</td></tr></tbody></table></body></html>');d.close();
 const old=document.title;setTimeout(()=>{document.title=title;f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>{document.title=old;f.remove()},2500)},500)}
const docHead=(t,sub)=>'<div class="hd"><h1>'+esc(S.settings.businessName)+'</h1><h2>'+esc(t)+'</h2><div>'+sub+'</div></div>';
function repMonth(last){const d=new Date(),a=last?new Date(d.getFullYear(),d.getMonth()-1,1):new Date(d.getFullYear(),d.getMonth(),1),b=last?new Date(d.getFullYear(),d.getMonth(),0):d;$('#f').value=ymd(a);$('#t').value=ymd(b);loadRep()}
const PR_MAIN=[['summary','Summary'],['stock','Remaining stock'],['cheques','Cheques not yet banked'],['rejected','Rejected cheques owed'],['credit','Credit balances']],PR_MORE=[['sales','Sales summary for the period'],['collections','Collections received'],['expenses','Expenses'],['cost','Stock value at cost price'],['zero','Items with zero stock']];
function prtCards(){const ck=(p,a,on)=>'<label><input type="checkbox" id="'+p+a[0]+'"'+(on?' checked':'')+'> '+a[1]+'</label>';
 return '<details class="card"><summary>🖨 Print stock &amp; balances report (PDF)</summary><p style="color:var(--m);font-size:13px;margin:8px 0 0">The period is the From / To above. Stock, cheques and credit are worked out <b>as at the To date</b>. Only the parts you tick are printed. The file is named “'+esc(S.settings.businessName)+' - Summary - dates”.</p><div class="pk">'+PR_MAIN.map(a=>ck('pr_',a,1)).join('')+'</div><div style="color:var(--m);font-size:13px">More details</div><div class="pk">'+PR_MORE.map(a=>ck('pr_',a,0)).join('')+'</div><button class="btn" onclick="printSummary(this)">Print / save as PDF</button></details>'+
 '<details class="card"><summary>🖨 Print customer price list (PDF)</summary><div class="row"><div><label>Prices valid from</label><input type="date" id="pl_d" value="'+ymd(new Date())+'"></div><div><label>For</label><select id="pl_c"><option value="">All customers (normal prices)</option>'+S.customers.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+' (their special prices)</option>').join('')+'</select></div></div><div class="pk"><label><input type="checkbox" id="pl_sku" checked> SKU / item code</label><label><input type="checkbox" id="pl_cat" checked> Group by category</label><label><input type="checkbox" id="pl_av"> Availability (in stock / out of stock)</label><label><input type="checkbox" id="pl_hide"> Leave out items with no stock</label><label><input type="checkbox" id="pl_con" checked> Business address and phone</label><label><input type="checkbox" id="pl_nt" checked> Note at the bottom</label></div><label>Note</label><input id="pl_n" value="Prices are in '+esc(S.settings.currencySymbol||S.settings.currency||'Rs')+' and may change without notice."><button class="btn" style="margin-top:10px" onclick="printPriceList(this)">Print / save as PDF</button></details>'}
function printSummary(b){run(b,async()=>{const parts=[...PR_MAIN,...PR_MORE].map(a=>a[0]).filter(k=>$('#pr_'+k).checked);if(!parts.length)throw new Error('Tick at least one part to print.');
 const from=$('#f').value,to=$('#t').value;if(!from||!to)throw new Error('Choose the From and To dates.');if(from>to)throw new Error('The From date is after the To date.');
 const r=await api('getStockReport',{from,to,parts}),has=k=>parts.indexOf(k)>-1,E=fdl(r.to);let n=0,h=docHead('STOCK AND BALANCES REPORT','From '+esc(fdl(r.from))+' to '+esc(E)),sy=S.settings.currencySymbol||'Rs';const R=v=>sy+' '+nf(v);
 if(has('summary')){const m=r.summary;h+='<h3>Summary</h3><table class="d"><tbody><tr><td>Stock value (selling price)</td><td class="r">'+R(m.stockSell)+'</td></tr>'+(has('cost')?'<tr><td>Stock value (cost price)</td><td class="r">'+R(m.stockCost)+'</td></tr>':'')+'<tr><td>Cheques not yet banked <span class="sm">('+m.chequesCount+' cheque'+(m.chequesCount==1?'':'s')+')</span></td><td class="r">'+R(m.chequesTotal)+'</td></tr><tr><td>Rejected cheques owed <span class="sm">('+m.rejectedCount+' cheque'+(m.rejectedCount==1?'':'s')+')</span></td><td class="r">'+R(m.rejectedTotal)+'</td></tr><tr><td>Credit owed by customers <span class="sm">('+m.creditCount+' bill'+(m.creditCount==1?'':'s')+')</span></td><td class="r">'+R(m.creditTotal)+'</td></tr></tbody></table>'}
 if(has('sales')){const o=r.sales;h+='<h3>Sales in the period</h3><table class="d"><tbody><tr><td>Cash sales</td><td class="r">'+R(o.cash)+'</td></tr><tr><td>Credit sales</td><td class="r">'+R(o.credit)+'</td></tr><tr><td>Cheque sales</td><td class="r">'+R(o.cheque)+'</td></tr>'+(o.other>0?'<tr><td>Card / bank / other</td><td class="r">'+R(o.other)+'</td></tr>':'')+'<tr class="t"><td>Total sales ('+o.orders+' bills)</td><td class="r">'+R(o.total)+'</td></tr></tbody></table>'}
 if(has('collections')){const o=r.collections;h+='<h3>Collections received in the period</h3><table class="d"><tbody><tr><td>Cash</td><td class="r">'+R(o.cash)+'</td></tr><tr><td>Cheque</td><td class="r">'+R(o.cheque)+'</td></tr><tr><td>Bank transfer</td><td class="r">'+R(o.bank)+'</td></tr><tr class="t"><td>Total ('+o.count+' receipt'+(o.count==1?'':'s')+')</td><td class="r">'+R(o.total)+'</td></tr></tbody></table>'}
 if(has('expenses')){const o=r.expenses;h+='<h3>Expenses in the period</h3>'+(o.byCategory.length?'<table class="d"><tbody>'+o.byCategory.map(x=>'<tr><td>'+esc(x.category)+'</td><td class="r">'+R(x.amount)+'</td></tr>').join('')+'<tr class="t"><td>Total</td><td class="r">'+R(o.total)+'</td></tr></tbody></table>':'<p class="sm">No expenses in this period.</p>')}
 if(has('stock')){n++;const cost=has('cost'),cats={};r.stock.forEach(x=>{(cats[x.category]=cats[x.category]||[]).push(x)});let gt=0,gc=0,cols=cost?7:5;
  h+='<h3>'+n+'. Remaining stock on '+esc(E)+'</h3>'+(r.stock.length?'<table class="d"><thead><tr><th>SKU</th><th>Item</th><th class="r">Qty</th><th class="r">Sell price</th><th class="r">Value</th>'+(cost?'<th class="r">Cost price</th><th class="r">Value at cost</th>':'')+'</tr></thead><tbody>'+Object.keys(cats).map(k=>{const L=cats[k],v=L.reduce((a,x)=>a+x.valueSell,0),vc=L.reduce((a,x)=>a+x.valueCost,0);gt+=v;gc+=vc;return '<tr class="cat"><td colspan="'+cols+'">'+esc(k)+'</td></tr>'+L.map(x=>'<tr><td>'+esc(x.sku)+'</td><td>'+esc(x.name)+'</td><td class="r">'+nf(x.qty)+'</td><td class="r">'+nf(x.price)+'</td><td class="r">'+nf(x.valueSell)+'</td>'+(cost?'<td class="r">'+nf(x.cost)+'</td><td class="r">'+nf(x.valueCost)+'</td>':'')+'</tr>').join('')+'<tr class="t"><td colspan="4">'+esc(k)+' subtotal</td><td class="r">'+nf(v)+'</td>'+(cost?'<td></td><td class="r">'+nf(vc)+'</td>':'')+'</tr>'}).join('')+'<tr class="t"><td colspan="4">Total stock value</td><td class="r">'+R(gt)+'</td>'+(cost?'<td></td><td class="r">'+R(gc)+'</td>':'')+'</tr></tbody></table>':'<p class="sm">No stock on this date.</p>')}
 if(has('zero'))h+='<h3>Items with zero stock on '+esc(E)+'</h3>'+(r.zero.length?'<table class="d"><thead><tr><th>SKU</th><th>Item</th><th>Category</th></tr></thead><tbody>'+r.zero.map(x=>'<tr><td>'+esc(x.sku)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.category)+'</td></tr>').join('')+'</tbody></table>':'<p class="sm">Every item had stock.</p>');
 if(has('cheques')){n++;h+='<h3>'+n+'. Cheques not yet banked on '+esc(E)+'</h3>'+(r.cheques.length?'<table class="d"><thead><tr><th>Customer</th><th>Bill</th><th>Banking date</th><th class="r">Amount</th></tr></thead><tbody>'+r.cheques.map(x=>'<tr><td>'+esc(x.customerName)+'</td><td>'+esc(x.invoiceId)+'</td><td>'+esc(fdl(x.date))+'</td><td class="r">'+nf(x.amount)+'</td></tr>').join('')+'<tr class="t"><td colspan="3">Total</td><td class="r">'+R(r.cheques.reduce((a,x)=>a+x.amount,0))+'</td></tr></tbody></table>':'<p class="sm">No cheques waiting to be banked.</p>')}
 if(has('rejected'))h+='<h3>Rejected cheques still owed on '+esc(E)+'</h3>'+(r.rejected.length?'<table class="d"><thead><tr><th>Customer</th><th>Bill</th><th>Rejected on</th><th class="r">Amount owed</th></tr></thead><tbody>'+r.rejected.map(x=>'<tr><td>'+esc(x.customerName)+'</td><td>'+esc(x.invoiceId)+'</td><td>'+esc(fdl(x.rejectedDate))+'</td><td class="r">'+nf(x.amount)+'</td></tr>').join('')+'<tr class="t"><td colspan="3">Total</td><td class="r">'+R(r.rejected.reduce((a,x)=>a+x.amount,0))+'</td></tr></tbody></table>':'<p class="sm">No rejected cheques are owed.</p>');
 if(has('credit')){n++;const by={};r.credit.forEach(x=>{(by[x.customerName]=by[x.customerName]||[]).push(x)});
  h+='<h3>'+n+'. Credit balances on '+esc(E)+'</h3>'+(r.credit.length?'<table class="d"><thead><tr><th>Customer</th><th>Bill</th><th>Bill date</th><th>Due</th><th class="r">Bill amount</th><th class="r">Received to date</th><th class="r">Balance</th></tr></thead><tbody>'+Object.keys(by).map(k=>{const L=by[k];return L.map((x,i)=>'<tr><td>'+(i?'':esc(k))+'</td><td>'+esc(x.invoiceId)+'</td><td>'+esc(fdl(x.billDate))+'</td><td>'+esc(fdl(x.due))+'</td><td class="r">'+nf(x.amount)+'</td><td class="r">'+nf(x.received)+'</td><td class="r">'+nf(x.balance)+'</td></tr>').join('')+(L.length>1?'<tr class="t"><td colspan="6">'+esc(k)+' subtotal</td><td class="r">'+nf(L.reduce((a,x)=>a+x.balance,0))+'</td></tr>':'')}).join('')+'<tr class="t"><td colspan="6">Total credit owed</td><td class="r">'+R(r.credit.reduce((a,x)=>a+x.balance,0))+'</td></tr></tbody></table>':'<p class="sm">No credit is owed.</p>')}
 printDoc(S.settings.businessName+' - Summary - '+fdl(r.from)+' to '+fdl(r.to),h,'Stock and balances report')})}
function printPriceList(b){run(b,async()=>{const v=$('#pl_d').value,cid=$('#pl_c').value,sku=$('#pl_sku').checked,cat=$('#pl_cat').checked,av=$('#pl_av').checked,hide=$('#pl_hide').checked;if(!v)throw new Error('Choose the date the prices are valid from.');
 const sp={};let cu=null;if(cid){cu=S.customers.find(c=>c.id===cid);(await api('getCustomerPrices',{customerId:cid})).forEach(x=>{sp[x.productId]=Number(x.price)})}
 const P=S.products.filter(p=>!(hide&&Number(p.stock)<=0)).sort((a,b)=>(cat?String(a.categoryName||'Other').localeCompare(String(b.categoryName||'Other')):0)||String(a.name).localeCompare(String(b.name))),cols=(sku?1:0)+2+(av?1:0),cur=S.settings.currencySymbol||S.settings.currency||'Rs';
 if(!P.length)throw new Error('There are no items to print.');let last=null;
 let h=docHead('PRICE LIST','Prices valid from '+esc(fdl(v))+(cu?'<br>Prepared for <b>'+esc(cu.name)+'</b>':''))+'<table class="d" style="margin-top:10px"><thead><tr>'+(sku?'<th>SKU</th>':'')+'<th>Item</th>'+(av?'<th>Availability</th>':'')+'<th class="r">'+(cu?'Your price':'Price')+' ('+esc(cur)+')</th></tr></thead><tbody>'+P.map(p=>{let r='';const k=p.categoryName||'Other';if(cat&&k!==last){r+='<tr class="cat"><td colspan="'+cols+'">'+esc(k)+'</td></tr>';last=k}
  return r+'<tr>'+(sku?'<td>'+esc(p.sku)+'</td>':'')+'<td>'+esc(p.name)+'</td>'+(av?'<td>'+(Number(p.stock)>0?'In stock':'Out of stock')+'</td>':'')+'<td class="r">'+nf(sp[p.id]!==undefined?sp[p.id]:p.price)+'</td></tr>'}).join('')+'</tbody></table>';
 const c=S.settings;if($('#pl_con').checked&&(c.address||c.phone))h+='<p class="sm" style="margin-top:12px">'+esc([c.address,c.phone?'Tel: '+c.phone:'',c.email].filter(Boolean).join(' · '))+'</p>';if($('#pl_nt').checked&&$('#pl_n').value.trim())h+='<p class="sm">'+esc($('#pl_n').value.trim())+'</p>';
 printDoc(c.businessName+' - Price list'+(cu?' - '+cu.name:'')+' - '+fdl(v),h,'Price list')})}
async function loadRS(){const el=$('#rs');if(!el)return;try{const to=$('#t').value,r=await api('getStockReport',{to,parts:['stock']});if($('#t').value!==to||!$('#rs'))return;const cats={};r.stock.forEach(x=>{(cats[x.category]=cats[x.category]||[]).push(x)});let gt=0,rows=[];
 Object.keys(cats).forEach(k=>{const L=cats[k],v=L.reduce((q,x)=>q+x.valueSell,0);gt+=v;rows.push(['<b>'+esc(k)+'</b>','','','<b>'+money(v)+'</b>']);L.forEach(x=>rows.push([esc(x.name),nf(x.qty),money(x.price),money(x.valueSell)]))});rows.push(['<b>Total stock value</b>','','','<b>'+money(gt)+'</b>']);
 el.innerHTML=r.stock.length?table(['Item','Qty','Sell price','Value'],rows):'<div class="empty">No stock on this date.</div>'}catch(e){el.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
```

## 13. Project files (revision 8)

```
POS/
├─ index.html            the page: sidebar, empty <main id="app">, login box, toast; links the CSS and the scripts below
├─ css/style.css         layout, tables, buttons, dashboard cards, cart layout, modal, mobile rules
├─ css/pos-theme.css     the colourful POS screen (Appendix M)
├─ js/config.js          const GOOGLE_SCRIPT_URL = "…/exec";
├─ js/core.js            helpers ($, esc, ymd, plusDays, money …), state S, api(), start-up/login, menu (NAV), settings fields (SF)
├─ js/receipt.js         receipt printing (RCSS)
├─ js/dashboard.js       dashboard (by date), low stock, purchase orders
├─ js/payments.js        Cheques & Credits (tabs), cards, rejected cheques, receive payment
├─ js/pos.js             POS: tiles, chips, cart, discount, payment, cheques, checkout, returns, credit mode, rejected-cheque mode, cart Clear/Close
├─ js/products.js        products, product history, categories, stock count
├─ js/suppliers.js       supplier invoices (+dates), returns to supplier
├─ js/sales.js           sales list, edit sale, delete sale (reason), end-of-day closing
├─ js/customers.js       customers, customer profile
├─ js/reports.js         profit, expenses, reports, PDF printing (summary + price list), assistant
├─ js/settings.js        settings, users, backups
├─ js/main.js            const V = {menu name: screen function}; init();   (must be loaded LAST)
├─ apps-script/
│  ├─ Config.gs          SCHEMAS, TEXT_COLS, BOOL_KEYS, PAY, PAY_TYPES, ORDER_STATUS, DEFAULTS
│  ├─ Core.gs            setupDatabase, ensureDb_/SCHEMA_VER, tz_/now_/today_, uid_, str_/num_/checkDate_, readAll_/appendRow_/setRow_
│  ├─ Auth.gs            login, sessions, users, roles (OPEN_ACTIONS, CASHIER_ACTIONS)
│  ├─ Settings.gs        settings, daily backup
│  ├─ Products.gs        products, categories, stock adjustments, units sold, product history
│  ├─ Customers.gs       customers, purchases per customer, special prices
│  ├─ Sales.gs           createSale, updateSale, deleteSale, getSales, getDeletedSales
│  ├─ Payments.gs        cheques & credits, receipts, rejectCheque, old bills
│  ├─ Orders.gs          purchase orders
│  ├─ SupplierInvoices.gs supplier invoices, receive stock, dates, supplier payments
│  ├─ Returns.gs         returns to the supplier
│  ├─ Expenses.gs        expenses
│  ├─ Reports.gs         dashboard, reports, profit, end-of-day, getStockReport
│  ├─ Api.gs             doGet, doPost, handle_, actions_()
│  └─ appsscript.json
├─ docs/POS_System_Specification.md   (this file)
├─ README.md             how to run in VS Code, create the backend, clasp, GitHub
├─ package.json  .gitignore  .clasp.json.example  .vscode/{settings,extensions,tasks}.json
```
**Rules that keep the split safe:** (a) the scripts are **classic scripts** (no modules), loaded in the order `config, core, receipt, dashboard, payments, pos, products, suppliers, sales, customers, reports, settings, main`; every function and constant is global, and inline `onclick=\"name(...)\"` handlers rely on that; (b) nothing at the top level of a file may *call* a function from a file loaded later; the only such code is in `main.js` (`const V = {...}; init();`), which therefore loads last; (c) the `.gs` files share one global scope and can be in any order (that is why `ACTIONS` became the function `actions_()`); (d) the script tags end with `?v=8` so browsers fetch fresh files after an update — change the number on each release.
**Where the older appendices' code lives now:** functions named in Appendices A–L are unchanged; find them with the table above (for example `drawPay`/`payCard` → `js/payments.js`, `printSummary` → `js/reports.js`, `getStockReport_` → `apps-script/Reports.gs`, `deleteSale_` → `apps-script/Sales.gs`).

## Appendix M — Revision 8 reference code (verbatim from the reference files)

Credit default in `payExtra` and `sePay`, the tiles, chips and cart payment buttons (all in `js/pos.js`; `plusDays` is in `js/core.js`: `const plusDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};`). In `drawCart` the header row is `<div class="row cart-hd"><h3 …>🛒 Cart (n)</h3> …`, the total row is `<tr class="tt">`, and the checkout button is `<button class="btn go" …>✅ Checkout</button>`; in `vPosSale` the category select is `<select id="pc" style="display:none">` followed by `<div class="chips" id="chips"></div>`, and `drawChips();` is called before `drawGrid();`. In `sePay` the first statement is `if(x.pm==='Credit'&&!x.payDate)x.payDate=plusDays(30);`.

```js
const hue=t=>{let h=0;String(t||'').split('').forEach(c=>{h=(h*31+c.charCodeAt(0))%360});return h};
function pickCat(id){$('#pc').value=id;drawChips();drawGrid()}
function drawChips(){const el=$('#chips');if(!el)return;const c=$('#pc').value;el.innerHTML='<button class="chip all'+(c?'':' on')+'" onclick="pickCat(\'\')">All</button>'+S.categories.map(k=>'<button class="chip'+(c===k.id?' on':'')+'" style="--h:'+hue(k.name)+'" onclick="pickCat(\''+esc(k.id)+'\')">'+esc(k.name)+'</button>').join('')}
function drawGrid(){
 const q=($('#ps').value||'').toLowerCase(),c=$('#pc').value;
 const L=S.products.filter(p=>(!c||p.categoryId===c)&&(!q||[p.name,p.sku].some(x=>String(x||'').toLowerCase().indexOf(q)>-1))).sort((a,b)=>soldQty(b.id)-soldQty(a.id)||String(a.name).localeCompare(String(b.name)));
 $('#pg').innerHTML=L.length?L.map(p=>{const sp=S.cprices[p.id]!==undefined&&Number(S.cprices[p.id])!==Number(p.price);return '<button class="prod'+(p.stock<=0?' out':'')+'" style="--h:'+hue(p.categoryName||p.categoryId)+'" onclick="addCart(\''+esc(p.id)+'\')">'+(p.imageUrl?'<img src="'+esc(p.imageUrl)+'" alt="" loading="lazy">':'')+'<div class="pn">'+esc(p.name)+'</div>'+(p.sku?'<div class="psku">'+esc(p.sku)+'</div>':'')+'<div class="ppr"><small>'+(sp?'Special price':'Selling price')+'</small><b>'+money(effPrice(p))+'</b>'+(sp?'<s>'+money(p.price)+'</s>':'')+'</div><span class="badge '+(p.stock<=0?'bad':p.stock<p.lowStockLimit?'warn':'ok')+'">'+(p.stock<=0?'Out of stock':p.stock+' in stock')+'</span></button>'}).join(''):'<div class="empty">No products found.</div>'}

function setPay(m){S.pay=m;document.querySelectorAll('.payseg button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));payExtra()}
function payExtra(){const e=$('#pe');if(!e)return;
 if(S.pay==='Cheque'){e.innerHTML='<div id="cq_pos">'+chqEd('pos')+'</div>';chqStat('pos')}
 else if(S.pay==='Credit'){if(!S.payDate)S.payDate=plusDays(30);e.innerHTML='<label>Due date* <small style="color:var(--m)">(30 days from today, change it if needed)</small></label><input type="date" value="'+esc(S.payDate)+'" oninput="S.payDate=this.value">'}
 else e.innerHTML=''}
```

**css/pos-theme.css**

```css
/* POS · pos-theme.css — the colourful look of the POS screen.
   Every product tile gets a colour from its category (the --h hue is set in js/pos.js).
   Change the colours here without touching any JavaScript. */
:root{--pos-a:#0ea5e9;--pos-b:#6366f1;--pos-c:#ec4899;--pos-ok:#16a34a}

/* ---- top row: mode, search, category chips ---- */
#pos select#pmode{background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-color:#c7d2fe;font-weight:600;color:#3730a3}
#pos #ps{border:2px solid #c7d2fe;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 10px center;padding-left:36px;border-radius:12px}
#pos #ps:focus{border-color:var(--pos-b);box-shadow:0 0 0 3px #6366f133;outline:none}
.chips{display:flex;gap:6px;overflow-x:auto;padding:8px 2px 6px;scrollbar-width:thin}
.chip{flex:none;border:1px solid hsl(var(--h,215) 60% 80%);background:hsl(var(--h,215) 90% 96%);color:hsl(var(--h,215) 60% 26%);padding:6px 14px;border-radius:999px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;transition:transform .08s}
.chip:hover{transform:translateY(-1px)}
.chip.on{background:hsl(var(--h,215) 70% 45%);border-color:hsl(var(--h,215) 70% 38%);color:#fff;box-shadow:0 3px 8px hsl(var(--h,215) 70% 40% / .4)}
.chip.all{--h:225}

/* ---- product tiles ---- */
.pgrid{gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.prod{display:flex;flex-direction:column;gap:3px;padding:10px 10px 10px 12px;border:1px solid hsl(var(--h,215) 55% 86%);border-left:6px solid hsl(var(--h,215) 70% 50%);background:linear-gradient(160deg,hsl(var(--h,215) 100% 96%),#fff 70%);border-radius:12px;box-shadow:0 1px 3px #0001;transition:transform .08s,box-shadow .12s}
.prod:hover{transform:translateY(-2px);box-shadow:0 7px 16px hsl(var(--h,215) 60% 35% / .25)}
.prod:active{transform:scale(.97)}
.prod .pn{font-weight:600;line-height:1.25;word-break:break-word}
.prod .psku{font-size:11.5px;color:#64748b}
.prod .ppr{margin-top:3px;display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.prod .ppr small{display:block;width:100%;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:hsl(var(--h,215) 45% 38%)}
.prod .ppr b{font-size:18px;color:hsl(var(--h,215) 75% 30%)}
.prod .ppr s{font-size:12px;color:#94a3b8}
.prod .badge{align-self:flex-start;margin-top:4px;font-weight:600}
.prod .badge.ok{background:#d1fae5;color:#065f46}.badge.warn{background:#fef3c7;color:#92400e}.badge.bad{background:#fee2e2;color:#991b1b}
.prod.out{opacity:.5;filter:grayscale(.6)}

/* ---- cart ---- */
.cartpane{background:linear-gradient(180deg,#f5f9ff,#fff 180px);border:1px solid #c7d2fe;box-shadow:0 4px 14px #6366f126}
.cart-hd{background:linear-gradient(90deg,var(--pos-a),var(--pos-b) 60%,var(--pos-c));margin:-12px -12px 8px;padding:10px 12px;border-radius:8px 8px 0 0;color:#fff}
.cart-hd h3{color:#fff;text-shadow:0 1px 2px #0003}
.cart-hd .btn.alt{background:#ffffff2e;color:#fff;border:1px solid #ffffff66;min-height:34px;padding:6px 10px}
.cart-hd .btn.alt:hover{background:#ffffff4d}
.ci .cn b{color:#1e293b}
.ci .cn small:first-of-type{color:#4f46e5;font-weight:600}
.ci .cq{border:2px solid #c7d2fe;border-radius:8px;text-align:center;font-weight:600}
.ci .ct{color:#0f766e}
.cartpane label{color:#475569}

/* ---- payment method buttons ---- */
.payseg{display:flex;gap:6px;margin:4px 0 8px}
.payseg button{flex:1;border:0;border-radius:10px;padding:10px 6px;font:inherit;font-weight:700;color:#fff;cursor:pointer;opacity:.5;transition:opacity .1s,transform .1s}
.payseg button[data-m=Cash]{background:linear-gradient(135deg,#16a34a,#4ade80)}
.payseg button[data-m=Credit]{background:linear-gradient(135deg,#ea580c,#fbbf24)}
.payseg button[data-m=Cheque]{background:linear-gradient(135deg,#2563eb,#60a5fa)}
.payseg button.on{opacity:1;transform:translateY(-1px);box-shadow:0 4px 10px #0003,0 0 0 3px #fff,0 0 0 5px #6366f1}

/* ---- totals + checkout ---- */
#tot table{background:#f1f5f9;border-radius:10px;padding:4px 10px;margin-top:6px}
#tot td{border-bottom:1px solid #e2e8f0}
#tot tr.tt td{font-size:20px;color:#0f766e;background:#ccfbf1;border-bottom:0}
#tot tr.tt td:first-child{border-radius:8px 0 0 8px}#tot tr.tt td:last-child{border-radius:0 8px 8px 0}
.btn.go{background:linear-gradient(90deg,#16a34a,#22c55e);font-size:18px;padding:13px;border-radius:12px;box-shadow:0 5px 14px #16a34a66}
.btn.go:hover{filter:brightness(1.06)}
.btn.go:disabled{background:#cbd5e1;box-shadow:none}

/* ---- the bar / button that brings the cart back ---- */
.cartbar{background:linear-gradient(90deg,var(--pos-a),var(--pos-b))!important;color:#fff!important}
.cartbar.show{box-shadow:0 6px 18px #6366f166}
```

## Appendix N — Revision 9 reference code (verbatim from the reference files)

> Revision 10 replaces `invCredit`, `invDisc`, `invSync` and `drawInvRows` below with the versions in Appendix O.

Other edits: `index.html` top bar is `<div class="top"><h2 id="pt">Dashboard Overview</h2><div class="tu" id="tu"></div></div>`; `applyBrand()` ends with `renderUsr()`; the settings form list `SF` gets `['businessSiteUrl','Business site link (opens in a new tab)','text']` after the website field; in `drawInvNew` the header field is `<div><label>Payment type</label><select onchange="S.invd.payMethod=this.value;drawInvRows()"><option…>Cash</option><option…>Credit</option></select></div>` and the default draft has `payMethod:'Cash'`; `saveSupplierInvoice_` builds `prodBySku` (active products by lower-case SKU) before mapping the items and uses `description: invDesc_(i, prodBySku)`; `saveSettings_` treats `businessSiteUrl` like `logo`/`website` (`safeUrl_`).

**CSS (css/style.css)**

```css
input.lk,input.lk:disabled{background:#f1f5f9;color:#475569;border-style:dashed;cursor:not-allowed}
.lknote{font-size:12.5px;color:var(--m);margin:8px 0 0}
.cl .addnew{color:#047857;font-weight:600;border-top:1px solid var(--b)}
.top{...;display:flex;align-items:center;justify-content:space-between;gap:12px}
.tu{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:wrap;justify-content:flex-end}
.role{padding:3px 11px;border-radius:99px;font-size:12.5px;font-weight:700}.role.Admin{background:#ede9fe;color:#5b21b6}.role.Cashier{background:#ccfbf1;color:#0f766e}
```

**js/core.js**

```js
const BIZ_DEFAULT='http://kclsfa.acl.lk:8796/Reports/ReportPrint.aspx';

const bizHref=()=>{const u=String((S.settings&&S.settings.businessSiteUrl)||BIZ_DEFAULT).trim();return /^https?:\/\//i.test(u)?u:''};

function renderUsr(){const e=$('#usr');if(!S.user)return;if(e)e.innerHTML='👤 '+esc(S.user.username)+' · '+esc(S.user.role);
 const t=$('#tu');if(t)t.innerHTML=(isAdmin()&&bizHref()?'<a class="btn alt" href="'+esc(bizHref())+'" target="_blank" rel="noopener noreferrer" title="Open our business site in a new tab">🌐 Business site</a>':'')+'<span class="who" title="Logged in as">👤 '+esc(S.user.username)+'</span><span class="role '+esc(S.user.role)+'" title="Running role">'+esc(S.user.role)+'</span><button class="btn red" onclick="doLogout()">⎋ Logout</button>'}

function doLogout(){if(S.cart&&S.cart.length&&!confirm('The cart still has items. Log out anyway?'))return;logout()}
```

**js/pos.js**

```js
function custSearch(q,keep){const el=$('#cdd');if(!el)return;
 if(!keep){if(S.cust){S.cprices={};if(S.autoDv){S.dv='';S.autoDv=false}}S.cust='';S.custName=q;const o=$('#cok');if(o)o.textContent=''}
 const k=String(q||'').toLowerCase(),L=S.customers.filter(c=>!k||[c.name,c.phone,c.route].some(x=>String(x||'').toLowerCase().indexOf(k)>-1)).sort((a,b)=>custTotal(b.id)-custTotal(a.id)||String(a.name).localeCompare(String(b.name))).slice(0,80);
 const t=String(q||'').trim(),exact=t&&S.customers.some(c=>String(c.name).trim().toLowerCase()===t.toLowerCase());
 el.innerHTML=L.map(c=>'<div onclick="pickCust(\''+esc(c.id)+'\')">'+esc(c.name)+(c.route?' <small style="color:#1e7d4f">'+esc(c.route)+'</small>':'')+(c.phone?' <small style="color:var(--m)">'+esc(c.phone)+'</small>':'')+'</div>').join('')+(t&&!exact?'<div class="addnew" onclick="posAddCust()">➕ Add “'+esc(t)+'” as a new customer</div>':(L.length?'':'<div style="color:var(--m);cursor:default">Type a name to search.</div>'));el.style.display='block'}

function posAddCust(){const nm=String(($('#cin')||{}).value||S.custName||'').trim();$('#cdd').style.display='none';
 modal('<h3>Add new customer</h3><form onsubmit="posSaveCust(event)"><label>Name*</label><input name="name" required value="'+esc(nm)+'"><label>Phone</label><input name="phone" type="tel" placeholder="e.g. 0771234567"><label>Address</label><input name="address"><label>Route</label><input name="route" list="rtl2" placeholder="e.g. Matara, Galle"><datalist id="rtl2">'+routeList().map(r=>'<option value="'+esc(r)+'">').join('')+'</datalist><label>Email</label><input name="email" type="email"><div class="row" style="margin-top:12px"><button class="btn" type="submit">Save and use this customer</button><button class="btn alt" type="button" onclick="closeModal()">Cancel</button></div></form>')}

function posSaveCust(e){e.preventDefault();run(e.submitter,async()=>{const c=await api('saveCustomer',fd(e.target));S.customers.push(c);closeModal();pickCust(c.id);toast('Customer “'+c.name+'” added and selected','ok')})}
```

**js/suppliers.js**

```js
const invCredit=()=>/credit/i.test((S.invd&&S.invd.payMethod)||''),invDisc=it=>invCredit()?(Number(it.disc)||0):0;

function invSync(it){const p=it.pid&&S.products.find(x=>x.id===it.pid);if(p){it.code=p.sku;it.description=p.name}return !!p}

function drawInvRows(){const d=S.invd,cr=invCredit();
 $('#ivrows').innerHTML=d.items.length?'<div class="tw"><table><thead><tr><th>Code</th><th>Description</th><th>Qty*</th><th>Unit</th><th>Selling price</th><th>Disc %</th><th class="r">Amount</th><th></th></tr></thead><tbody>'+
 d.items.map((it,i)=>{const lk=invSync(it),L=lk?' readonly class="lk" title="From Products. To change it, edit the product in Products."':'';
  return '<tr><td><input id="icd'+i+'" style="width:120px" value="'+esc(it.code)+'"'+L+' oninput="invU('+i+',\'code\',this.value)" onchange="invCode('+i+',this.value)"></td><td><input style="width:230px" value="'+esc(it.description)+'"'+L+' oninput="invU('+i+',\'description\',this.value)"></td>'+
  '<td><input id="iq'+i+'" type="number" inputmode="decimal" min="0" step="any" style="width:80px;border:2px solid var(--p,#4a90d9)" value="'+esc(it.qty)+'" placeholder="Qty" oninput="invU('+i+',\'qty\',this.value)" onkeydown="invQKey(event)"></td>'+
  '<td><input style="width:85px" value="'+esc(it.uom)+'"'+L+' oninput="invU('+i+',\'uom\',this.value)"></td><td><input type="number" min="0" step="any" style="width:105px" value="'+it.unitPrice+'" oninput="invU('+i+',\'unitPrice\',this.value)"></td>'+
  '<td><input type="number" min="0" max="100" step="any" style="width:70px" value="'+(cr?it.disc:0)+'"'+(cr?'':' disabled class="lk" title="The discount can be changed only when the payment type is Credit"')+' oninput="invU('+i+',\'disc\',this.value)"></td><td class="r" id="ia'+i+'"></td><td style="white-space:nowrap">'+(lk?'<button class="btn alt" onclick="invEditProd(\''+esc(it.pid)+'\')" title="Edit this product in Products" aria-label="Edit in Products">✎</button> ':'')+'<button class="btn red" onclick="invRm('+i+')" aria-label="Remove">✕</button></td></tr>'}).join('')+
  '</tbody></table></div><p class="lknote">🔒 Items that are already in Products cannot be changed here. To change a code, name or unit, press ✎ (or open Products) and edit the product.'+(cr?'':' The discount can be changed only when the payment type is <b>Credit</b>.')+'</p>':'<div class="empty">No items yet. Search above, pick a product, then type the quantity.</div>';
 invTot()}

function invCode(i,v){const it=S.invd.items[i];if(!it||it.pid)return;const p=findSku(String(v).trim());if(!p)return;const l=invLast(p.sku);
 Object.assign(it,{pid:p.id,code:p.sku,description:p.name,uom:(l&&l.uom)||it.uom||'Numbers',unitPrice:l?Number(l.unitPrice):(Number(it.unitPrice)||Number(p.price)||0),disc:l?Number(l.discPct)||0:it.disc});drawInvRows();toast('“'+p.name+'” is already in Products, so its details were loaded from Products and locked.','ok')}

function invEditProd(id){go('products');setTimeout(()=>{try{prodForm(id)}catch(e){}},500)}

function invTot(){let sub=0,dis=0,u=0;S.invd.items.forEach((it,i)=>{const q=Number(it.qty)||0,a=Math.round(q*it.unitPrice*100)/100;sub+=a;dis+=a*invDisc(it)/100;u+=q;const e=$('#ia'+i);if(e)e.textContent=money(a)});
 const t=$('#it');if(t)t.innerHTML=S.invd.items.length?'<table style="max-width:340px;margin-left:auto"><tr><td>Items / units</td><td class="r">'+S.invd.items.length+' / '+u+'</td></tr><tr><td>Subtotal</td><td class="r">'+money(sub)+'</td></tr><tr><td>Trade discount</td><td class="r">-'+money(dis)+'</td></tr><tr><td><b>Total</b></td><td class="r"><b>'+money(sub-dis)+'</b></td></tr></table>':''}

function saveInvNew(b){run(b,async()=>{const d=S.invd;
 if(!d.invoiceNo.trim())throw new Error('Enter the invoice number.');if(!d.date)throw new Error('Enter the invoice date.');
 const L=d.items;if(!L.length)throw new Error('Add at least one item.');
 L.forEach((i,n)=>{if(!String(i.code).trim())throw new Error('Row '+(n+1)+' needs a code (SKU).');if(!(Number(i.qty)>0))throw new Error('Enter the quantity for '+(i.description||i.code)+'.')});
 const rs=await api('saveSupplierInvoice',{invoiceNo:d.invoiceNo,date:d.date,supplier:d.supplier,payMethod:invCredit()?'Credit':'Cash',customerName:'',items:L.map(i=>({code:i.code,description:i.description,qty:Number(i.qty),uom:i.uom,unitPrice:i.unitPrice,disc:invDisc(i),amount:Math.round(Number(i.qty)*i.unitPrice*100)/100}))});
 let rcv='';if(d.recvNow){try{await api('receiveSupplierInvoice',{id:rs.id,receivedDate:d.recvDate||ymd(new Date())});rcv=' and stock received'}catch(e){toast('Saved, but receiving the stock failed: '+e.message,'err')}}
 ls.set('invSup',d.supplier);S.invd=null;await loadAll();await updInv();toast('Invoice saved'+rcv+(rs.created?' and '+rs.created+' new product(s) added to Products':''),'ok');go('invoices')})}
```

**apps-script/SupplierInvoices.gs**

```js
function invDesc_(i, prodBySku) {
  const d = str_(i.description, 200), pr = prodBySku[String(i.code || '').toLowerCase()];
  if (!pr) return d;
  return str_(pr.name + (/\(FREE\)\s*$/i.test(d) ? ' (FREE)' : ''), 200);
}
```

## Appendix O — Revision 10 reference code (js/suppliers.js, verbatim)

Other edits in the same file: `drawInvNew`/`vInvNew` call `$('#app').oninput=invSaveDraft;` after drawing; `invTot()` begins with `invSaveDraft();`; the buttons **+ Add manual invoice** and **Cancel** call `invClear()` (Cancel first asks "Discard this invoice draft?" when there are items); after a successful save `invClear()` replaces `S.invd=null`.

```js
/* Payment type: Cash (default) or Credit.
   - An item that is already in Products: code, name and unit are always locked (change them in Products).
   - On a CASH invoice the selling price and the discount are locked too, but they stay visible with the same values.
   - On a CREDIT invoice the selling price and the discount of those items can be changed.
   - The discount box of any row is locked on Cash (it keeps its value, nothing is reset or removed).
   The invoice being typed is also kept as a draft in the browser, so rows never vanish when you leave the page. */
const invCredit=()=>/credit/i.test((S.invd&&S.invd.payMethod)||''),invDisc=it=>Number(it.disc)||0;

const invDraftGet=()=>{try{const d=JSON.parse(ls.get('invDraft','')||'null');return d&&Array.isArray(d.items)?d:null}catch(e){return null}};

function invSaveDraft(){if(S.invd&&$('#ivrows'))ls.set('invDraft',JSON.stringify(S.invd))}

function invClear(){S.invd=null;ls.set('invDraft','')}

function invSync(it){const p=it.pid&&S.products.find(x=>x.id===it.pid);if(p){it.code=p.sku;it.description=p.name}return !!p}

function drawInvRows(){const d=S.invd,cr=invCredit();
 $('#ivrows').innerHTML=d.items.length?'<div class="tw"><table><thead><tr><th>Code</th><th>Description</th><th>Qty*</th><th>Unit</th><th>Selling price</th><th>Disc %</th><th class="r">Amount</th><th></th></tr></thead><tbody>'+
 d.items.map((it,i)=>{const lk=invSync(it),L=lk?' readonly class="lk" title="From Products. To change it, edit the product in Products."':'',
  P=lk&&!cr?' readonly class="lk" title="Locked on a Cash invoice. Choose Credit to change it."':'',D=!cr?' readonly class="lk" title="Locked on a Cash invoice. Choose Credit to change it."':'';
  return '<tr><td><input id="icd'+i+'" style="width:120px" value="'+esc(it.code)+'"'+L+' oninput="invU('+i+',\'code\',this.value)" onchange="invCode('+i+',this.value)"></td><td><input style="width:230px" value="'+esc(it.description)+'"'+L+' oninput="invU('+i+',\'description\',this.value)"></td>'+
  '<td><input id="iq'+i+'" type="number" inputmode="decimal" min="0" step="any" style="width:80px;border:2px solid var(--p,#4a90d9)" value="'+esc(it.qty)+'" placeholder="Qty" oninput="invU('+i+',\'qty\',this.value)" onkeydown="invQKey(event)"></td>'+
  '<td><input style="width:85px" value="'+esc(it.uom)+'"'+L+' oninput="invU('+i+',\'uom\',this.value)"></td><td><input type="number" min="0" step="any" style="width:105px" value="'+it.unitPrice+'"'+P+' oninput="invU('+i+',\'unitPrice\',this.value)"></td>'+
  '<td><input type="number" min="0" max="100" step="any" style="width:70px" value="'+(Number(it.disc)||0)+'"'+D+' oninput="invU('+i+',\'disc\',this.value)"></td><td class="r" id="ia'+i+'"></td><td style="white-space:nowrap">'+(lk?'<button class="btn alt" onclick="invEditProd(\''+esc(it.pid)+'\')" title="Edit this product in Products" aria-label="Edit in Products">✎</button> ':'')+'<button class="btn red" onclick="invRm('+i+')" aria-label="Remove">✕</button></td></tr>'}).join('')+
  '</tbody></table></div><p class="lknote">🔒 Items already in Products: the code, name and unit cannot be changed here (press ✎ to edit the product in Products). '+(cr?'On a <b>Credit</b> invoice you can change their selling price and discount.':'On a <b>Cash</b> invoice their selling price and discount are locked too (they stay as they are). Choose <b>Credit</b> to change them.')+' Your invoice is saved as a draft while you type.</p>':'<div class="empty">No items yet. Search above, pick a product, then type the quantity.</div>';
 invTot()}

function vInvNew(){
 S.invd=S.invd||invDraftGet()||{invoiceNo:'',date:ymd(new Date()),supplier:ls.get('invSup','Kelani Cables'),payMethod:'Cash',items:[],recvNow:false,recvDate:ymd(new Date())};
 drawInvNew();$('#app').oninput=invSaveDraft;
 if(!S.invs)run(null,async()=>{S.invs=await api('getSupplierInvoices',{})})}
```
