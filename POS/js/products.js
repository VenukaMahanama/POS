/* POS · products.js — Products, product history, categories, stock count */
/* ---- products ---- */
const PERIODS=[['30','Last 30 days'],['90','Last 90 days'],['365','Last 12 months'],['all','All time']];
const PSORTS=[['best','Best selling'],['least','Least selling'],['cat','By category (best selling first)'],['name','Name A–Z'],['nameZ','Name Z–A'],['priceH','Price: high to low'],['priceL','Price: low to high'],['stockL','Stock: low to high'],['stockH','Stock: high to low'],['new','Newest added']];
const soldQty=id=>((S.psales||{})[id]||{}).qty||0;
async function loadPSales(per){per=per||S.pper||'90';S.pcache=S.pcache||{};
 if(!S.pcache[per]){const from=per==='all'?'':ymd(new Date(Date.now()-Number(per)*864e5));try{S.pcache[per]=await api('getProductSales',{from})}catch(e){S.pcache[per]={}}}
 S.psales=S.pcache[per]}
async function vProducts(){const ad=isAdmin();S.psort=S.psort||'best';S.pper=S.pper||'90';
 const sorts=PSORTS;
 $('#app').innerHTML='<div class="row"><input id="q" placeholder="Search products…" aria-label="Search"><select id="qc" aria-label="Category"><option value="">All categories</option>'+catOpts()+'</select><select id="qs" aria-label="Sort by">'+sorts.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select><select id="qp" aria-label="Sales period">'+PERIODS.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select>'+(ad?'<button class="btn" onclick="prodForm()">+ Add product</button><button class="btn alt" onclick="go(\'stocktake\')">📋 Stock count / adjust</button>':'')+'</div><div style="color:var(--m);font-size:12.5px;margin:8px 2px 0" id="pnote"></div><div id="pl"></div>';
 $('#qs').value=S.psort;$('#qp').value=S.pper;
 $('#q').oninput=drawProducts;$('#qc').onchange=drawProducts;
 $('#qs').onchange=()=>{S.psort=$('#qs').value;drawProducts()};
 $('#qp').onchange=async()=>{S.pper=$('#qp').value;await loadPSales();drawProducts()};
 await loadPSales();drawProducts()}
function drawProducts(){const ad=isAdmin(),mode=S.psort||'best',sv=id=>(S.psales&&S.psales[id])||{};
 const q=$('#q').value.toLowerCase(),c=$('#qc').value;
 const L=S.products.filter(p=>(!c||p.categoryId===c)&&(!q||[p.name,p.sku].some(x=>String(x||'').toLowerCase().indexOf(q)>-1)));
 const nm=(a,b)=>String(a.name).localeCompare(String(b.name));
 const by={best:(a,b)=>soldQty(b.id)-soldQty(a.id)||nm(a,b),least:(a,b)=>soldQty(a.id)-soldQty(b.id)||nm(a,b),cat:(a,b)=>soldQty(b.id)-soldQty(a.id)||nm(a,b),name:nm,nameZ:(a,b)=>nm(b,a),priceH:(a,b)=>b.price-a.price||nm(a,b),priceL:(a,b)=>a.price-b.price||nm(a,b),stockL:(a,b)=>a.stock-b.stock||nm(a,b),stockH:(a,b)=>b.stock-a.stock||nm(a,b),new:(a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||nm(a,b)};
 const pl=(PERIODS.find(x=>x[0]===S.pper)||PERIODS[1])[1];
 $('#pnote').textContent='Tip: click any product to see who bought it and its stock history. Sold = units sold '+(S.pper==='all'?'(all time)':'in the '+pl.toLowerCase())+'.'+(mode==='cat'?' Each category lists its best sellers first.':'');
 const bd=p=>'<span class="badge '+(p.stock<=0?'bad':p.stock<p.lowStockLimit?'warn':'')+'">'+p.stock+'</span>';
 const cols=ad?['Name','SKU','Category','Price','Cost','Stock','Sold','']:['Name','SKU','Category','Price','Stock','Sold'];
 const row=p=>{const s=sv(p.id),sold=s.qty?s.qty:'-';return ad?[esc(p.name),esc(p.sku),esc(p.categoryName),money(p.price),money(p.cost),bd(p),sold,'<button class="btn alt" onclick="event.stopPropagation();prodForm(\''+esc(p.id)+'\')">Edit</button> <button class="btn red" onclick="event.stopPropagation();delProd(\''+esc(p.id)+'\')">Delete</button>']:[esc(p.name),esc(p.sku),esc(p.categoryName),money(p.price),bd(p),sold]};
 const tbl=a=>'<div class="tw"><table><thead><tr><th style="width:22px"></th>'+cols.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+a.slice().sort(by[mode]||by.best).map(p=>'<tr class="prow" id="pr_'+esc(p.id)+'" style="cursor:pointer" title="Click to see who bought it and every stock movement" onclick="prodTog(\''+esc(p.id)+'\')"><td><span class="chev">▸</span></td>'+row(p).map(c=>'<td>'+c+'</td>').join('')+'</tr><tr id="ph_'+esc(p.id)+'" style="display:none"><td colspan="'+(cols.length+1)+'" id="phc_'+esc(p.id)+'"></td></tr>').join('')+'</tbody></table></div>',empty='<div class="card empty" style="margin-top:10px">No products found.</div>';
 if(mode==='cat'){
  const gs=S.categories.slice().sort(nm).map(k=>({t:k.name,d:k.description,items:L.filter(p=>p.categoryId===k.id)})).filter(x=>x.items.length),none=L.filter(p=>!p.categoryId||!S.categories.some(k=>k.id===p.categoryId));
  if(none.length)gs.push({t:'No category',d:'',items:none});
  $('#pl').innerHTML=gs.length?gs.map(x=>'<div class="card" style="margin-top:10px"><h3 style="margin:0">'+esc(x.t)+' <small style="color:var(--m);font-weight:400">· '+x.items.length+' product(s)</small></h3>'+(x.d?'<div style="color:var(--m);font-size:13px;margin:2px 0 8px">'+esc(x.d)+'</div>':'<div style="margin-bottom:8px"></div>')+tbl(x.items)+'</div>').join(''):empty}
 else $('#pl').innerHTML=L.length?'<div class="card" style="margin-top:10px">'+tbl(L)+'</div>':empty}
/* ---- product history panel: opens under a product row ---- */
function prodTog(id){S.phist=S.phist||{};const row=$('#ph_'+id);if(!row)return;
 const open=row.style.display==='none';row.style.display=open?'':'none';
 const ch=document.querySelector('#pr_'+id+' .chev');if(ch)ch.textContent=open?'▾':'▸';
 if(!open)return;
 if(S.phist[id]){drawPH(id);return}
 $('#phc_'+id).innerHTML='<div class="empty">Loading history…</div>';
 api('getProductHistory',{productId:id}).then(h=>{S.phist[id]=h;drawPH(id)}).catch(e=>{$('#phc_'+id).innerHTML='<div class="empty">Could not load: '+esc(e.message||e)+'</div>'})}
function phSort(id,v){S.phS=S.phS||{};S.phS[id]=v;drawPH(id)}
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

function prodForm(id){
 const p=S.products.find(x=>x.id===id)||{},ed=!!id,pr=Number(p.price)||0,co=Number(p.cost)||0,dv=ed?Math.round((pr-co)*100)/100:'';
 modal('<h3>'+(ed?'Edit':'Add')+' product</h3><form onsubmit="saveProd(event,\''+esc(id||'')+'\')"><label>Name*</label><input name="name" required value="'+esc(p.name)+'"><div class="row"><div><label>SKU</label><input name="sku" value="'+esc(p.sku)+'"></div><div><label>Category</label><select name="categoryId"><option value="">None</option>'+catOpts(p.categoryId)+'</select></div></div>'+
 '<label>Selling price*</label><input name="price" id="pfp" type="number" min="0" step="any" required value="'+esc(p.price)+'" oninput="pfCalc()">'+
 '<label>Cost price = selling price minus a discount of*</label><div class="row"><div style="flex:1"><select id="pft" onchange="pfSwitch()"><option value="percent"'+(ed?'':' selected')+'>Percentage (%)</option><option value="amount"'+(ed?' selected':'')+'>Amount (Rs)</option></select></div><div style="flex:1"><input id="pfv" type="number" step="any" placeholder="e.g. 7" value="'+dv+'"'+(ed?'':' required')+' oninput="pfCalc()"></div></div>'+
 '<div style="margin:8px 0 0;font-size:16px">Cost price: <b id="pfc"></b></div><input type="hidden" name="cost" id="pfh" value="'+esc(p.cost)+'">'+
 '<div class="row"><div><label>Stock*</label><input name="stock" type="number" min="0" step="any" required value="'+esc(p.stock)+'"></div><div><label>Low-stock alert when stock goes below</label><input name="lowStockLimit" type="number" min="0" step="any" value="'+esc(p.lowStockLimit==null?5:p.lowStockLimit)+'"></div></div><label>Image URL</label><input name="imageUrl" value="'+esc(p.imageUrl)+'">'+btns()+'</form>');pfCalc()}
function pfCalc(){const pr=Number($('#pfp').value)||0,t=$('#pft').value,v=Number($('#pfv').value)||0;let c=t==='percent'?pr*(1-v/100):pr-v;c=Math.round(c*100)/100;
 const bad=$('#pfp').value===''||(pr>0&&(c<0||(t==='percent'&&v>100)));
 $('#pfc').innerHTML=$('#pfp').value===''?'<span style="color:var(--m)">enter the selling price</span>':(bad?'<span style="color:#b83232">discount is more than the price</span>':money(c));$('#pfh').value=bad?'':c}
function pfSwitch(){const pr=Number($('#pfp').value)||0,t=$('#pft').value,e=$('#pfv'),v=Number(e.value);if(e.value!==''&&isFinite(v))e.value=t==='amount'?Math.round(pr*v)/100:(pr>0?Math.round(v/pr*1e6)/1e4:0);pfCalc()}
function saveProd(e,id){e.preventDefault();run(e.submitter,async()=>{const d=fd(e.target);if(d.cost===''||d.cost===undefined||isNaN(Number(d.cost))||Number(d.cost)<0)throw new Error('Check the discount: the cost price cannot be negative.');if(id)d.id=id;await api(id?'updateProduct':'saveProduct',d);closeModal();await loadAll();toast('Product saved','ok');vProducts()})}
function delProd(id){if(!confirm('Delete this product? Past sales are kept.'))return;run(null,async()=>{await api('deleteProduct',{id});await loadAll();toast('Product deleted','ok');vProducts()})}

/* ---- categories ---- */
function vCats(){
 $('#app').innerHTML='<div class="row"><button class="btn" onclick="catForm()">+ Add category</button></div><div class="card" style="margin-top:10px">'+(S.categories.length?table(['Name','Description',''],S.categories.map(c=>[esc(c.name),esc(c.description),'<button class="btn alt" onclick="catForm(\''+esc(c.id)+'\')">Edit</button> <button class="btn red" onclick="delCat(\''+esc(c.id)+'\')">Remove</button>'])):'<div class="empty">No categories yet. Add one to group your products.</div>')+'</div>'}
function catForm(id){const c=S.categories.find(x=>x.id===id)||{};modal('<h3>'+(id?'Edit':'Add')+' category</h3><form onsubmit="saveCat(event,\''+esc(id||'')+'\')"><label>Name*</label><input name="name" required value="'+esc(c.name)+'"><label>Description</label><input name="description" value="'+esc(c.description)+'">'+btns()+'</form>')}
function saveCat(e,id){e.preventDefault();run(e.submitter,async()=>{const d=fd(e.target);if(id)d.id=id;await api('saveCategory',d);closeModal();await loadAll();toast('Category saved','ok');vCats()})}
function delCat(id){if(!confirm('Remove this category? Products keep their label.'))return;const c=S.categories.find(x=>x.id===id);run(null,async()=>{await api('saveCategory',{id,name:c.name,description:c.description,active:false});await loadAll();toast('Category removed','ok');vCats()})}

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
/* ---- stock count / adjust ---- */
function vStock(){S.counts={};
 $('#app').innerHTML='<div class="card"><div class="row"><div><label>Reason</label><select id="sty"><option>Stocktake</option><option>Damaged</option><option>Lost</option><option>Found</option><option>Other</option></select></div><div><label>Date</label><input id="std" type="date" max="'+ymd(new Date())+'" value="'+ymd(new Date())+'"></div><div style="flex:2"><label>Note</label><input id="str" placeholder="e.g. monthly count, water damage"></div><div><label>Find product</label><input id="stq" placeholder="Search…"></div></div><p style="color:var(--m);font-size:13px">Type the real quantity in "Counted". Only products you change are updated, and every change is logged below.</p><div id="stl"></div><div class="row" style="margin-top:12px"><button class="btn" onclick="stSave(this)">Save adjustments</button><button class="btn alt" onclick="go(\'products\')">Back to products</button></div></div><div class="card" style="margin-top:12px"><h3>Recent adjustments</h3><div id="sth"></div></div>';
 $('#stq').oninput=drawStock;drawStock();
 run(null,async()=>{const L=await api('getStockAdjustments',{});$('#sth').innerHTML=L.length?table(['Date','Product','Old','New','Change','Reason','Note','By'],L.slice(0,60).map(a=>[esc(a.date),esc(a.productName),a.oldStock,a.newStock,'<b style="color:'+(a.change<0?'#b83232':'#1e7d4f')+'">'+(a.change>0?'+':'')+a.change+'</b>',esc(a.type),esc(a.reason),esc(a.createdBy)])):'<div class="empty">No adjustments yet.</div>'})}
function stDiff(p){const v=S.counts[p.id];if(v===undefined)return'';const d=Math.round((v-Number(p.stock))*100)/100;return d===0?'<span style="color:var(--m)">no change</span>':'<b style="color:'+(d<0?'#b83232':'#1e7d4f')+'">'+(d>0?'+':'')+d+'</b>'}
function drawStock(){const k=$('#stq').value.toLowerCase(),L=S.products.filter(p=>!k||[p.name,p.sku].some(x=>String(x||'').toLowerCase().indexOf(k)>-1));
 $('#stl').innerHTML=table(['Product','SKU','System stock','Counted','Difference'],L.map(p=>[esc(p.name),esc(p.sku),p.stock,'<input type="number" min="0" step="any" style="width:100px" value="'+(S.counts[p.id]===undefined?'':S.counts[p.id])+'" oninput="stSet(\''+esc(p.id)+'\',this.value)">','<span id="sd'+esc(p.id)+'">'+stDiff(p)+'</span>']))}
function stSet(id,v){if(v==='')delete S.counts[id];else S.counts[id]=Number(v)||0;const p=S.products.find(x=>x.id===id),e=$('#sd'+id);if(e&&p)e.innerHTML=stDiff(p)}
function stSave(b){run(b,async()=>{const items=S.products.filter(p=>S.counts[p.id]!==undefined&&S.counts[p.id]!==Number(p.stock)).map(p=>({productId:p.id,newStock:S.counts[p.id]}));
 if(!items.length)throw new Error('Nothing changed yet. Type a counted quantity that differs from the system stock.');
 if(!confirm('Update stock for '+items.length+' product(s)?'))return;
 const r=await api('adjustStock',{type:$('#sty').value,date:$('#std').value,reason:$('#str').value,items});await loadAll();toast(r.count+' product(s) adjusted','ok');vStock()})}
