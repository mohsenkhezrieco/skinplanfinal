import assert from 'node:assert/strict';

const strings=new Map();const sets=new Map();
function setFor(k){if(!sets.has(k))sets.set(k,new Set());return sets.get(k)}
async function exec(cmd){
  const [opRaw,...a]=cmd;const op=String(opRaw).toUpperCase();
  if(op==='GET')return strings.get(String(a[0]))??null;
  if(op==='SET'){strings.set(String(a[0]),String(a[1]));return 'OK'}
  if(op==='SADD'){const s=setFor(String(a[0]));let n=0;for(const v of a.slice(1)){if(!s.has(String(v))){s.add(String(v));n++}}return n}
  if(op==='SREM'){const s=setFor(String(a[0]));let n=0;for(const v of a.slice(1)){if(s.delete(String(v)))n++}return n}
  if(op==='SMEMBERS')return [...setFor(String(a[0]))];
  if(op==='SCARD')return setFor(String(a[0])).size;
  if(op==='MGET')return a.map(k=>strings.get(String(k))??null);
  if(op==='DEL'){let n=0;for(const k of a){if(strings.delete(String(k)))n++;if(sets.delete(String(k)))n++}return n}
  if(op==='INCR'){const k=String(a[0]),n=Number(strings.get(k)||0)+1;strings.set(k,String(n));return n}
  if(op==='EXPIRE')return 1;
  throw new Error('Unsupported mock command '+op);
}
globalThis.fetch=async (url,opts={})=>{
  const u=new URL(String(url));
  if(u.pathname==='/pipeline'){
    const cmds=JSON.parse(opts.body);return new Response(JSON.stringify(await Promise.all(cmds.map(async c=>({result:await exec(c)})))),{status:200,headers:{'content-type':'application/json'}});
  }
  const cmd=JSON.parse(opts.body);return new Response(JSON.stringify({result:await exec(cmd)}),{status:200,headers:{'content-type':'application/json'}});
};
process.env.UPSTASH_REDIS_REST_URL='https://mock.upstash.local';
process.env.UPSTASH_REDIS_REST_TOKEN='test-token';
process.env.SKINPLAN_SESSION_SECRET='s'.repeat(64);
process.env.SKINPLAN_OWNER_USERNAME='owner';
process.env.SKINPLAN_OWNER_PASSWORD='OwnerPassword123!';

const store=await import('../api/_private/user-store.mjs');
const auth=await import('../api/_private/auth.mjs');
const login=await import('../api/login.js');
const adminUsers=await import('../api/admin-users.js');

await auth.ensureAuthReady();
const owner=await store.authenticateUser('owner','OwnerPassword123!');
assert.equal(owner.role,'admin');
assert.equal((await store.listUsers())[0].passwordHash,undefined);

const ownerToken=auth.issueSession(owner);
const ownerReq=new Request('https://skinplan.test/api/admin-users',{headers:{cookie:`skinplan_session=${encodeURIComponent(ownerToken)}`,'origin':'https://skinplan.test'}});
assert.equal(await auth.requireAdmin(ownerReq),null);

let r=await adminUsers.POST(new Request('https://skinplan.test/api/admin-users',{method:'POST',headers:{cookie:`skinplan_session=${encodeURIComponent(ownerToken)}`,'origin':'https://skinplan.test','content-type':'application/json'},body:JSON.stringify({action:'create',username:'buyer.one',password:'BuyerPassword123!',note:'Buyer One',expiresAt:'2099-12-31'})}));
assert.equal(r.status,200);
let buyer=await store.authenticateUser('buyer.one','BuyerPassword123!');assert.ok(buyer);
const buyerToken=auth.issueSession(buyer);
let buyerReq=new Request('https://skinplan.test/api/app',{headers:{cookie:`skinplan_session=${encodeURIComponent(buyerToken)}`}});
assert.equal(await auth.requireSession(buyerReq),null);

await store.setUserEnabled('buyer.one',false);
let denied=await auth.requireSession(buyerReq);assert.equal(denied.status,401);
await store.setUserEnabled('buyer.one',true);
await store.setUserPassword('buyer.one','NewBuyerPassword456!');
assert.equal(await store.authenticateUser('buyer.one','BuyerPassword123!'),null);
buyer=await store.authenticateUser('buyer.one','NewBuyerPassword456!');assert.ok(buyer);
await store.renameUser('buyer.one','buyer.two');
assert.equal(await store.getUser('buyer.one'),null);assert.ok(await store.getUser('buyer.two'));
await store.setUserExpiry('buyer.two','2000-01-01');
assert.equal(await store.authenticateUser('buyer.two','NewBuyerPassword456!'),null);

r=await login.POST(new Request('https://skinplan.test/api/login',{method:'POST',headers:{origin:'https://skinplan.test','content-type':'application/json','x-forwarded-for':'1.2.3.4'},body:JSON.stringify({username:'owner',password:'OwnerPassword123!'})}));
assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')||'',/HttpOnly/);assert.match(r.headers.get('set-cookie')||'',/SameSite=Strict/);

console.log('Multi-user auth audit PASS');
