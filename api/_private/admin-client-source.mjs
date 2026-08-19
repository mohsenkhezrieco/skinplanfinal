export const ADMIN_CLIENT=String.raw`'use strict';
const $=id=>document.getElementById(id);
function setStatus(text,type=''){const el=$('status');el.textContent=text;el.className='status'+(type?' '+type:'')}
async function api(body){const r=await fetch('/api/admin-users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed.');return j}
function fmtDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString()}
function expiryDate(v){return v?String(v).slice(0,10):''}
function statusFor(u){if(!u.active)return ['Disabled','off'];if(u.expiresAt&&new Date(u.expiresAt).getTime()<=Date.now())return ['Expired','expired'];return ['Active','active']}
function button(label,cls,fn){const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',fn);return b}
async function load(){
  try{const r=await fetch('/api/admin-users',{cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Unable to load accounts.');render(j.users||[]);setStatus('Account list is up to date.','ok');}
  catch(e){setStatus(e.message,'err');if(/Authentication|Owner access/.test(e.message))location.replace('/');}
}
function render(users){
  const body=$('usersBody');body.replaceChildren();
  for(const u of users){
    const tr=document.createElement('tr');
    const tdUser=document.createElement('td');const strong=document.createElement('strong');strong.textContent=u.username;tdUser.append(strong);if(u.role==='admin'){const small=document.createElement('div');small.className='muted';small.textContent='Owner / administrator';tdUser.append(small)}
    const tdStatus=document.createElement('td');const [st,cls]=statusFor(u);const badge=document.createElement('span');badge.className='badge '+cls;badge.textContent=st;tdStatus.append(badge);
    const tdNote=document.createElement('td');tdNote.textContent=u.note||'—';
    const tdExpiry=document.createElement('td');tdExpiry.textContent=u.expiresAt?new Date(u.expiresAt).toLocaleDateString():'No expiry';
    const tdLast=document.createElement('td');tdLast.textContent=fmtDate(u.lastLoginAt);
    const tdActions=document.createElement('td');tdActions.className='rowActions';
    tdActions.append(button('Password','',async()=>{const p=prompt('Enter a new password (minimum 10 characters) for '+u.username);if(p===null)return;try{await api({action:'password',username:u.username,password:p});setStatus('Password changed. Existing sessions for this account were revoked.','ok');await load();}catch(e){setStatus(e.message,'err')}}));
    if(u.role!=='admin'){
      tdActions.append(button(u.active?'Disable':'Enable',u.active?'danger':'good',async()=>{if(u.active&&!confirm('Disable '+u.username+' immediately?'))return;try{await api({action:'enabled',username:u.username,enabled:!u.active});setStatus((u.active?'Disabled ':'Enabled ')+u.username+'.','ok');await load();}catch(e){setStatus(e.message,'err')}}));
      tdActions.append(button('Rename','',async()=>{const n=prompt('New username',u.username);if(!n||n===u.username)return;try{await api({action:'rename',username:u.username,newUsername:n});setStatus('Username changed. Old sessions were revoked.','ok');await load();}catch(e){setStatus(e.message,'err')}}));
      tdActions.append(button('Expiry','',async()=>{const d=prompt('Valid-through date as YYYY-MM-DD. Leave blank for no expiry.',expiryDate(u.expiresAt));if(d===null)return;try{await api({action:'expiry',username:u.username,expiresAt:d.trim()});setStatus('Expiry updated. Existing sessions were revoked.','ok');await load();}catch(e){setStatus(e.message,'err')}}));
      tdActions.append(button('Note','',async()=>{const n=prompt('Customer / note',u.note||'');if(n===null)return;try{await api({action:'note',username:u.username,note:n});setStatus('Note updated.','ok');await load();}catch(e){setStatus(e.message,'err')}}));
    }
    tr.append(tdUser,tdStatus,tdNote,tdExpiry,tdLast,tdActions);body.append(tr);
  }
}
async function create(){const username=$('newUsername').value.trim(),password=$('newPassword').value,note=$('newNote').value.trim(),expiresAt=$('newExpiry').value;try{await api({action:'create',username,password,note,expiresAt});$('newUsername').value='';$('newPassword').value='';$('newNote').value='';$('newExpiry').value='';setStatus('Customer account created.','ok');await load();}catch(e){setStatus(e.message,'err')}}
$('createBtn').addEventListener('click',create);$('refreshBtn').addEventListener('click',load);$('logoutBtn').addEventListener('click',async()=>{await fetch('/api/logout',{method:'POST'}).catch(()=>{});location.replace('/')});load();`;
