/* POS · settings.js — Settings, users and backups */
/* ---- settings: users and backups ---- */
function drawUsers(){run(null,async()=>{const L=S.users=await api('getUsers',{});
 $('#uc').innerHTML='<h3>Users</h3><p style="color:var(--m);font-size:13px">Admin can do everything. Cashier can sell, add customers, see stock and sales, and close the day, but never sees costs or profit.</p>'+table(['Username','Role','Status',''],L.map((u,i)=>[esc(u.username),esc(u.role),u.active?'Active':'<span class="badge bad">Off</span>','<button class="btn alt" onclick="userForm('+i+')">Edit</button>']))+'<button class="btn" style="margin-top:10px" onclick="userForm(-1)">+ Add user</button>'})}
function userForm(i){const u=i>=0?S.users[i]:{role:'Cashier',active:true};
 modal('<h3>'+(i>=0?'Edit':'Add')+' user</h3><form onsubmit="saveUserF(event,\''+esc(u.id||'')+'\')"><label>Username</label><input name="username" required'+(i>=0?' disabled':'')+' value="'+esc(u.username)+'"><label>'+(i>=0?'New password (leave empty to keep the old one)':'Password (6+ characters)')+'</label><input name="password" type="password" autocomplete="new-password"'+(i>=0?'':' required minlength="6"')+'><label>Role</label><select name="role"><option'+(u.role==='Cashier'?' selected':'')+'>Cashier</option><option'+(u.role==='Admin'?' selected':'')+'>Admin</option></select><label style="color:var(--t);font-size:14px"><input type="checkbox" name="active"'+(u.active?' checked':'')+'>Active (can log in)</label>'+btns()+'</form>')}
function saveUserF(e,id){e.preventDefault();run(e.submitter,async()=>{const f=e.target.elements;await api('saveUser',{id,username:f.username.value,password:f.password.value,role:f.role.value,active:f.active.checked});closeModal();toast('User saved','ok');drawUsers()})}
function drawBackup(){run(null,async()=>{const b=await api('getBackupInfo',{});
 $('#bk').innerHTML='<h3>Backups</h3><p style="color:var(--m);font-size:13px">A full copy of this spreadsheet is saved to a "POS Backups" folder in your Google Drive. The newest 30 copies are kept.</p><p>Last backup: <b>'+(b.last?esc(fmtDT(b.last)):'never')+'</b><br>Daily backup (about 2 AM): <b>'+(b.enabled?'ON':'OFF')+'</b></p><div class="row"><button class="btn" onclick="bkNow(this)">Back up now</button><button class="btn alt" onclick="bkTog('+(b.enabled?0:1)+',this)">'+(b.enabled?'Turn off daily backup':'Turn on daily backup')+'</button></div>'})}
function bkNow(b){run(b,async()=>{await api('backupNow',{});toast('Backup saved to Google Drive','ok');drawBackup()})}
function bkTog(on,b){run(b,async()=>{await api('setBackupTrigger',{enable:!!on});toast(on?'Daily backup is ON':'Daily backup is OFF','ok');drawBackup()})}

/* ---- settings ---- */
function vSet(){
 const s=S.settings;
 $('#app').innerHTML='<div class="card"><h3>Business settings</h3><form onsubmit="saveSet(event)">'+SF.map(f=>f[2]==='bool'?'<label style="color:var(--t);font-size:14px"><input type="checkbox" name="'+f[0]+'"'+(bool(s[f[0]])?' checked':'')+'>'+f[1]+'</label>':'<label>'+f[1]+'</label><input name="'+f[0]+'" type="'+f[2]+'"'+(f[0]==='businessName'?' required':'')+(f[2]==='number'?' min="0" max="100" step="any"':'')+' value="'+esc(s[f[0]]||(f[2]==='color'?'#71a5d6':''))+'">').join('')+'<button class="btn" type="submit" style="margin-top:14px">Save settings</button></form></div><div class="card" style="margin-top:12px" id="uc"></div><div class="card" style="margin-top:12px" id="bk"></div>';drawUsers();drawBackup()}
function saveSet(e){e.preventDefault();run(e.submitter,async()=>{
 const o={};SF.forEach(f=>{const el=e.target.elements[f[0]];o[f[0]]=f[2]==='bool'?el.checked:el.value});
 S.settings=await api('saveSettings',{settings:o});applyBrand();await loadAll();toast('Settings saved','ok');go('dashboard')})}
