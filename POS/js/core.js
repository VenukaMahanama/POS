/* POS · core.js — shared helpers, state (S), the API call, start-up, login, menu */
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bool=v=>v===true||v==='true'||v==='TRUE';
const fd=f=>Object.fromEntries(new FormData(f));
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const plusDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};
const fmtDT=s=>{const d=new Date(s);return isNaN(d)?String(s):d.toLocaleString()};
const S={token:'',user:null,cprices:{},autoDv:false,cartRet:[],saleDate:'',settings:{},products:[],categories:[],customers:[],cart:[],cust:'',dt:'percent',dv:'',pay:'Cash',custName:'',payDate:'',chqs:[],dueCount:0,ord:null,view:'dashboard'};
const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del(k){try{sessionStorage.removeItem(k)}catch(e){}}};
const isAdmin=()=>!!(S.user&&S.user.role==='Admin');
const CASH_NAV=['dashboard','pos','products','lowstock','sales','customers','payments'],CASH_VIEWS=CASH_NAV.concat(['custprofile','dayclose']);
const RCSS='.rc{font:13px/1.4 monospace;max-width:300px;margin:auto;color:#000}.rc h2{text-align:center;margin:4px 0;font-size:16px}.ctr{text-align:center}.rc table{width:100%;border-collapse:collapse}.rc td{white-space:normal;border:0;padding:2px 0}.rc hr{border:0;border-top:1px dashed #000;margin:8px 0}.rc .r{text-align:right}';
const SF=[['businessName','Business name','text'],['businessCategory','Business category','text'],['currency','Currency code (e.g. LKR)','text'],['currencySymbol','Currency symbol (e.g. Rs)','text'],['address','Address','text'],['city','City','text'],['country','Country','text'],['phone','Phone','text'],['email','Email','email'],['website','Website','text'],['logo','Logo URL','text'],['primaryColor','Primary color','color'],['taxEnabled','Tax enabled','bool'],['taxRate','Tax rate (%)','number'],['receiptFooter','Receipt footer','text'],['receiptShowAddress','Receipt: show address','bool'],['receiptShowPhone','Receipt: show phone','bool'],['receiptShowEmail','Receipt: show email','bool'],['receiptShowLogo','Receipt: show logo','bool']];
const NAV=[['dashboard','Dashboard','🏠'],['pos','POS','🧾'],['orders','Orders','📝'],['invoices','Invoices','📥'],['products','Products','📦'],['lowstock','Low Stock','⚠️'],['categories','Categories','🗂️'],['sales','Sales','📈'],['customers','Customers','👤'],['payments','Cheques & Credits','💳'],['expenses','Expenses','💲'],['reports','Reports','📊'],['assistant','Assistant','🤖'],['settings','Settings','⚙️']];

/* ---- api ---- */
async function api(action,payload={}){
 if(!GOOGLE_SCRIPT_URL||GOOGLE_SCRIPT_URL.indexOf('PASTE_')===0)throw new Error('Set GOOGLE_SCRIPT_URL at the top of index.html to your Web App /exec URL.');
 payload=Object.assign({},payload,{token:S.token||''});
 let r;
 try{const res=await fetch(GOOGLE_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload})});r=await res.json()}
 catch(e){if(action.indexOf('get')!==0)throw new Error('Could not reach the server. Check your internet, then check whether the change was saved before retrying.');r=await jsonp(action,payload)}
 if(r&&r.error==='LOGIN_REQUIRED'){S.token='';ss.del('tok');ss.del('usr');showLogin();throw new Error('Please log in again.')}
 if(!r||!r.success)throw new Error((r&&r.error)||'Request failed.');
 return r.data}
function jsonp(action,payload){return new Promise((ok,no)=>{
 const cb='cb'+Date.now()+Math.floor(Math.random()*1e4),sc=document.createElement('script');
 const done=()=>{clearTimeout(t);delete window[cb];sc.remove()};
 const t=setTimeout(()=>{done();no(new Error('Cannot reach the server. Check the Web App URL and your internet.'))},20000);
 window[cb]=d=>{done();ok(d)};sc.onerror=()=>{done();no(new Error('Cannot reach the server. Check the Web App URL.'))};
 sc.src=GOOGLE_SCRIPT_URL+'?action='+encodeURIComponent(action)+'&payload='+encodeURIComponent(JSON.stringify(payload))+'&callback='+cb;document.head.appendChild(sc)})}
async function run(b,f){if(b)b.disabled=true;try{await f()}catch(e){toast(e.message||'Something went wrong.','err')}finally{if(b)b.disabled=false}}

/* ---- ui helpers ---- */
function toast(m,k=''){const e=document.createElement('div');e.className='t '+k;e.textContent=m;$('#toast').appendChild(e);setTimeout(()=>e.remove(),3500)}
function modal(h){closeModal();const m=document.createElement('div');m.className='modal';m.id='modal';m.innerHTML='<div class="mbox" role="dialog">'+h+'</div>';m.addEventListener('click',e=>{if(e.target===m)closeModal()});document.body.appendChild(m)}
function closeModal(){const m=$('#modal');if(m)m.remove()}
function btns(){return '<div class="row" style="margin-top:12px"><button class="btn" type="submit">Save</button><button class="btn alt" type="button" onclick="closeModal()">Cancel</button></div>'}
function table(h,rows){return '<div class="tw"><table><thead><tr>'+h.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function money(n){n=Number(n)||0;const s=S.settings,cur=s.currency||'',sym=s.currencySymbol||cur;const z=['LKR','JPY','KRW','VND','IDR'].indexOf(cur)>-1;const d=(z&&Number.isInteger(n))?0:2;return sym+(sym.length>1?' ':'')+n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:2})}
function catOpts(sel){return S.categories.map(c=>'<option value="'+esc(c.id)+'"'+(sel===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')}
const stat=(l,v)=>'<div class="card stat"><b>'+v+'</b><span>'+l+'</span></div>';

/* ---- startup ---- */
async function init(){
 document.head.insertAdjacentHTML('beforeend','<style>'+RCSS+'</style>');
 S.token=ss.get('tok')||'';try{S.user=JSON.parse(ss.get('usr')||'null')}catch(e){S.user=null}
 if(!S.token||!S.user){showLogin();return}
 await start()}
async function showLogin(){
 const el=$('#login');el.style.display='flex';el.innerHTML='<div class="lbox"><h2>Loading…</h2></div>';
 let has=true;
 try{has=(await api('authStatus')).hasUsers}catch(e){el.innerHTML='<div class="lbox"><h3>Cannot connect to the backend</h3><p>'+esc(e.message)+'</p></div>';return}
 el.innerHTML='<div class="lbox"><h2>'+(has?'Log in':'Create the Admin account')+'</h2>'+(has?'':'<p style="color:var(--m);font-size:13px">First-time setup. This account can manage everything. You can add cashiers later in Settings.</p>')+'<form onsubmit="doLogin(event,'+(has?0:1)+')"><label>Username</label><input name="u" autocomplete="username" required><label>Password</label><input name="p" type="password" autocomplete="'+(has?'current-password':'new-password')+'" required'+(has?'':' minlength="6"')+'>'+(has?'':'<label>Repeat password</label><input name="p2" type="password" required>')+'<button class="btn" type="submit" style="width:100%;margin-top:14px">'+(has?'Log in':'Create account')+'</button></form></div>'}
function doLogin(e,setup){e.preventDefault();const f=e.target;run(f.querySelector('button'),async()=>{
 if(setup&&f.p.value!==f.p2.value)throw new Error('The two passwords do not match.');
 const r=await api(setup?'setupAdmin':'login',{username:f.u.value,password:f.p.value});
 S.token=r.token;S.user=r.user;ss.set('tok',r.token);ss.set('usr',JSON.stringify(r.user));$('#login').style.display='none';await start()})}
async function logout(){try{await api('logout')}catch(e){}ss.del('tok');ss.del('usr');location.reload()}
function renderUsr(){const e=$('#usr');if(e&&S.user)e.innerHTML='👤 '+esc(S.user.username)+' · '+esc(S.user.role)}
function acctForm(){if(!S.user)return;modal('<h3>My account</h3><p>'+esc(S.user.username)+' · '+esc(S.user.role)+'</p><form onsubmit="chgPw(event)"><label>Current password</label><input name="o" type="password" required><label>New password (6+ characters)</label><input name="n" type="password" required minlength="6"><div class="row" style="margin-top:12px"><button class="btn" type="submit">Change password</button><button class="btn red" type="button" onclick="logout()">Log out</button><button class="btn alt" type="button" onclick="closeModal()">Close</button></div></form>')}
function chgPw(e){e.preventDefault();run(e.submitter,async()=>{await api('changePassword',{oldPassword:e.target.o.value,newPassword:e.target.n.value});closeModal();toast('Password changed','ok')})}
async function start(){
 S.view='dashboard';renderNav();renderUsr();
 try{S.settings=await api('getSettings')}catch(e){if(e.message!=='Please log in again.')$('#app').innerHTML='<div class="card"><h3>Cannot connect to the backend</h3><p>'+esc(e.message)+'</p></div>';return}
 applyBrand();
 if(!S.settings.businessName&&isAdmin()){S.view='settings';render();toast('Welcome! Enter your business details and save to begin.');return}
 try{await loadAll()}catch(e){toast(e.message,'err')}
 updDue();if(isAdmin())updInv();render()}
async function loadAll(){const r=await Promise.all([api('getProducts'),api('getCategories'),api('getCustomers')]);S.products=r[0];S.categories=r[1];S.customers=r[2];S.phist={};lowBadge();await loadPSales();await loadCSales()}
function applyBrand(){
 const s=S.settings,col=/^#[0-9a-fA-F]{6}$/.test(s.primaryColor||'')?s.primaryColor:'#71a5d6',h=col.slice(1),R=document.documentElement.style;
 R.setProperty('--p',col);R.setProperty('--pt',(parseInt(h.slice(0,2),16)*.299+parseInt(h.slice(2,4),16)*.587+parseInt(h.slice(4,6),16)*.114)>150?'#10202e':'#fff');
 $('#bn').textContent=(s.businessName||'My Business')+' POS';$('#bc').textContent=s.businessCategory?s.businessCategory+' Store':'';document.title=(s.businessName||'')+' POS';
 const l=$('#logo');if(s.logo){l.src=s.logo;l.style.display=''}else l.style.display='none'}
function renderNav(){$('nav').innerHTML=NAV.filter(n=>isAdmin()||CASH_NAV.indexOf(n[0])>-1).map(n=>'<button data-v="'+n[0]+'" onclick="go(\''+n[0]+'\')"><span class="ic">'+n[2]+'</span><span class="lb">'+n[1]+'</span><span class="nb" id="nb-'+n[0]+'" style="display:none"></span>'+(n[0]==='dashboard'?'':'<span class="ch">›</span>')+'</button>').join('')}
const PARENT={ordernew:'orders',invnew:'invoices',stocktake:'products',profit:'reports',dayclose:'sales',custprofile:'customers',saleedit:'sales'},TITLES={ordernew:'New Order',invnew:'New Invoice',stocktake:'Stock count / adjust',profit:'Profit by product / customer',dayclose:'End-of-day closing',custprofile:'Customer profile',saleedit:'Edit sale'};
function render(){const pv=PARENT[S.view]||S.view;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===pv));const nv=NAV.find(n=>n[0]===S.view);$('#pt').textContent=S.view==='dashboard'?'Dashboard Overview':(nv?nv[1]:(TITLES[S.view]||''));$('#app').innerHTML='<div class="empty">Loading…</div>';Promise.resolve(V[S.view]()).catch(e=>{$('#app').innerHTML='<div class="card">'+esc(e.message)+'</div>'})}
function go(v){if(!isAdmin()&&CASH_VIEWS.indexOf(v)<0)return;S.view=v;render()}
