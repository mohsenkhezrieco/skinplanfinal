'use strict';
const $=id=>document.getElementById(id);
async function session(){
  try{
    const r=await fetch('/api/session',{cache:'no-store'});const j=await r.json().catch(()=>({}));
    if(r.ok&&j.authenticated){location.replace(j.role==='admin'?'/api/admin':'/api/app');return;}
    if(j.configured===false){$('status').textContent='Server access control is not configured. See the deployment guide.';$('status').className='status err';}
  }catch{$('status').textContent='Unable to reach the SkinPlan server.';$('status').className='status err';}
}
async function login(){
  const btn=$('loginBtn');btn.disabled=true;$('status').className='status';$('status').textContent='Signing in…';
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('username').value,password:$('password').value})});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Login failed.');
    $('password').value='';location.replace(j.role==='admin'?'/api/admin':'/api/app');
  }catch(e){$('status').textContent=e.message;$('status').className='status err';btn.disabled=false;}
}
$('loginBtn').addEventListener('click',login);$('username').addEventListener('keydown',e=>{if(e.key==='Enter')$('password').focus()});$('password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
session();
