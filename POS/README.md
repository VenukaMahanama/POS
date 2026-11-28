# POS

A Point of Sale system for a small shop or distributor.

- **Website** (this folder): plain HTML + CSS + JavaScript. No build step.
- **Backend** (`apps-script/`): Google Apps Script. Your data is stored in a Google Sheet.
- **Specification**: `docs/POS_System_Specification.md` describes everything, so another developer (or AI) can rebuild the system.

## 1. What is in the folder

```
POS/
├─ index.html                 the page (menu, empty areas, loads the files below)
├─ css/
│  ├─ style.css               layout, buttons, tables, dashboard cards
│  └─ pos-theme.css           the colourful POS screen (change colours here)
├─ js/                        loaded in this order by index.html
│  ├─ config.js               ★ your Web App URL goes here
│  ├─ core.js                 shared helpers, state, API call, login, menu
│  ├─ receipt.js              receipt printing
│  ├─ dashboard.js            dashboard, low stock, purchase orders
│  ├─ payments.js             cheques & credits, rejected cheques, receiving money
│  ├─ pos.js                  POS screen, cart, checkout, returns, credit mode
│  ├─ products.js             products, product history, categories, stock count
│  ├─ suppliers.js            supplier invoices, returns to supplier
│  ├─ sales.js                sales list, edit/delete sale, end-of-day closing
│  ├─ customers.js            customers and customer profile
│  ├─ reports.js              reports, expenses, PDF printing (summary, price list)
│  ├─ settings.js             settings, users, backups
│  └─ main.js                 loaded last: connects menu names to screens, starts the app
├─ apps-script/               the backend (every file shares one Apps Script project)
│  ├─ Config.gs  Core.gs  Auth.gs  Settings.gs  Products.gs  Customers.gs
│  ├─ Sales.gs  Payments.gs  Orders.gs  SupplierInvoices.gs  Returns.gs
│  ├─ Expenses.gs  Reports.gs  Api.gs
│  └─ appsscript.json         project settings (time zone, web app access)
├─ docs/POS_System_Specification.md
├─ .vscode/                   VS Code settings, recommended extensions, tasks
├─ .clasp.json.example        copy to .clasp.json to use clasp (section 4, option B)
└─ package.json               shortcuts: npm start, npm run push
```

## 2. Run the website in VS Code (5 minutes)

1. Install **VS Code** (code.visualstudio.com).
2. **File > Open Folder...** and choose the `POS` folder.
3. VS Code asks to install the recommended extension: click **Install** (it is **Live Server**). If it does not ask: press `Ctrl+Shift+X`, search **Live Server** (Ritwick Dey) and install it.
4. Open `js/config.js` and paste your Web App URL (section 3 shows how to get one):
   ```js
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
5. Right-click `index.html` > **Open with Live Server**. The POS opens at `http://127.0.0.1:5500`.
6. Edit any file and save: the page reloads by itself.

No Live Server? Open the VS Code terminal (``Ctrl+` ``) and run one of:

```bash
npx --yes serve -l 5500 .          # needs Node.js (nodejs.org)
python -m http.server 5500         # needs Python
```
then open `http://localhost:5500`. (Opening `index.html` by double-click can also work, but a local server is better.)

## 3. Create the backend (first time)

1. Create a new **Google Sheet** (sheets.new). Name it "POS Database".
2. **Extensions > Apps Script**.
3. Create one file per `.gs` in `apps-script/` (the **+** next to *Files* > **Script**), name it without `.gs`, and paste the content. The order does not matter. Delete the empty default `Code.gs` if you do not need it.
   - Optional: *Project Settings* > tick **Show "appsscript.json" manifest file**, then paste `appsscript.json`.
4. Select the function **`setupDatabase`** and click **Run** (accept the permissions). It creates every sheet.
5. **Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone**. Click **Deploy** and copy the **Web app URL** (ends with `/exec`).
6. Paste that URL into `js/config.js` (section 2, step 4).
7. Open the POS. On the first start it asks you to create the **Admin** account.

### Changing the backend later
After you change a `.gs` file: **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**. The URL stays the same. (If you skip this, the website keeps calling the old code.)

## 4. Edit the backend from VS Code (optional, with clasp)

Instead of copy and paste you can push the files from VS Code.

```bash
npm install -g @google/clasp          # once (needs Node.js)
clasp login                           # opens a browser, sign in to Google
```
Turn on **Apps Script API** at script.google.com/home/usersettings (once).

**Option A: you already created the Apps Script project (section 3).**
Open it > *Project Settings* > copy the **Script ID**. Then:
```bash
copy .clasp.json.example .clasp.json      # Mac/Linux: cp .clasp.json.example .clasp.json
# open .clasp.json and paste the Script ID
clasp push                                # uploads all .gs files
```

**Option B: start fresh from VS Code** (creates a new Sheet and its script):
```bash
clasp create --type sheets --title "POS Database" --rootDir apps-script
clasp push
clasp open                                # opens the editor: run setupDatabase, then Deploy
```
(`clasp create` writes `.clasp.json` for you. Keep the `rootDir` and `filePushOrder` lines from `.clasp.json.example` in it.)

After a push you still need **Deploy > Manage deployments > New version** to publish it.
You can also press `Ctrl+Shift+P` > **Tasks: Run Task** > *Push backend to Google*.

## 5. Put it on GitHub

```bash
git init
git add .
git commit -m "POS"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/POS.git
git push -u origin main
```
Later: `git add .` then `git commit -m "what changed"` then `git push`.
`js/config.js` contains your Web App URL, so keep the repository **private**, or remove the URL before pushing to a public repository. `.clasp.json` is already ignored by `.gitignore`.

Free hosting: GitHub > Settings > **Pages** > Branch `main`, folder `/ (root)`.

## 6. Where do I change...?

| I want to change | File |
|---|---|
| The server address | `js/config.js` |
| POS colours, tile style, buttons | `css/pos-theme.css` |
| What a POS product tile shows | `drawGrid()` in `js/pos.js` |
| Cart, discount, payment, checkout | `js/pos.js` |
| Top bar: role, logout, Business site button | `renderUsr()` in `js/core.js` (the address is the *Business site link* in Settings) |
| Cheques, credits, rejected cheques | `js/payments.js` + `apps-script/Payments.gs` |
| Supplier invoice page (payment type, locked items, discount, draft) | `drawInvRows()` in `js/suppliers.js` + `apps-script/SupplierInvoices.gs` |
| Adding a customer from the POS | `posAddCust()` in `js/pos.js` |
| Dashboard figures | `js/dashboard.js` + `apps-script/Reports.gs` |
| PDF reports and price list | `js/reports.js` + `getStockReport_` in `Reports.gs` |
| Stock, product history | `js/products.js` + `apps-script/Products.gs` |
| Sales (create, edit, delete) | `js/sales.js` + `apps-script/Sales.gs` |
| Sheet columns (add a field) | `apps-script/Config.gs` (add the column at the END, then change `SCHEMA_VER` in `Core.gs`) |
| Adding a new backend action | write the function, then add it to `actions_()` in `Api.gs` (and to `CASHIER_ACTIONS` in `Auth.gs` if cashiers may use it) |

## 7. Problems

- **"Set GOOGLE_SCRIPT_URL ..." message:** `js/config.js` still has the placeholder.
- **"Unknown action" or a new feature does nothing:** the backend was not redeployed. Do *Deploy > Manage deployments > New version*.
- **Blank page or red errors:** press `F12` > *Console*. A file that does not load usually means the folder was opened one level too high; open the folder that contains `index.html`.
- **Log-in asks again and again:** the Web App access must be **Anyone**.
- **Wrong dates or times:** set the same time zone in *Project Settings* of Apps Script and in `appsscript.json`.
- **Old page after an update:** hard refresh with `Ctrl+Shift+R` (the script links end with `?v=10`; change the number to force an update).
