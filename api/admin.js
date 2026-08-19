import {ADMIN_HTML} from './_private/admin-shell.mjs';
import {ADMIN_CLIENT} from './_private/admin-client-source.mjs';
import {PRODUCTS,RANKINGS,ROLE_LABELS} from './_private/formulary.mjs';
import {requireAdmin} from './_private/auth.mjs';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function productName(id){const p=PRODUCTS[id];return p?`${p.brand} — ${p.name}`:id}
function renderFormulary(){
  const sections=Object.entries(RANKINGS).map(([role,ids])=>`<section class="card"><h2>${esc(ROLE_LABELS[role]||role)}</h2><div class="internal">Internal role: <code>${esc(role)}</code> · owner-only rank order</div><div class="table"><table><thead><tr><th>Rank</th><th>Product</th><th>Internal rationale</th></tr></thead><tbody>${ids.map((id,i)=>{const p=PRODUCTS[id];return `<tr><td><b>#${i+1}</b></td><td>${esc(productName(id))}</td><td>${esc(p?.why||'')}</td></tr>`}).join('')}</tbody></table></div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>SkinPlan — Owner Formulary</title><style>:root{--bg:#10122f;--panel:#272764;--line:#454597;--muted:#bcc2ea}*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#10122f,#151741);color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;min-height:100vh}.shell{max-width:1180px;margin:auto;padding:24px}.hero,.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px;margin-bottom:14px}.hero{display:flex;justify-content:space-between;align-items:center;gap:12px}.hero h1{margin:0}.muted,.internal{color:var(--muted);font-size:12px}.btn{display:inline-block;text-decoration:none;padding:10px 13px;border-radius:10px;background:#4b4c9a;color:#fff;font-weight:800}.card h2{margin:0 0 4px;font-size:18px}.table{overflow:auto;margin-top:12px}table{width:100%;border-collapse:collapse;min-width:760px}th,td{padding:9px;border-bottom:1px solid #454789;text-align:left;font-size:12px;vertical-align:top}th{color:#d7dbff;font-size:10px;text-transform:uppercase}code{background:#181a49;border-radius:5px;padding:2px 5px}</style></head><body><main class="shell"><section class="hero"><div><h1>Owner Formulary View</h1><div class="muted">Full internal ranking is visible only to the Owner account. Customer Product Library remains alphabetical and does not expose this order.</div></div><div><a class="btn" href="/api/admin">Access Control</a> <a class="btn" href="/api/app">Open SkinPlan</a></div></section>${sections}</main></body></html>`;
}

export async function GET(request){
  const auth=await requireAdmin(request);if(auth)return auth;
  const url=new URL(request.url);
  if(url.searchParams.get('asset')==='client'){
    return new Response(ADMIN_CLIENT,{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
  }
  if(url.searchParams.get('view')==='formulary'){
    return new Response(renderFormulary(),{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
  }
  return new Response(ADMIN_HTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
