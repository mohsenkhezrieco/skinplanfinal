import crypto from 'node:crypto';
import {promisify} from 'node:util';

const scryptAsync=promisify(crypto.scrypt);
const USER_SET='skinplan:users';
const USER_PREFIX='skinplan:user:';
const LOGIN_LIMIT_PREFIX='skinplan:login-limit:';
const SCRYPT_N=2**17;
const SCRYPT_R=8;
const SCRYPT_P=1;
const KEYLEN=64;

function redisUrl(){return String(process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'').replace(/\/$/,'')}
function redisToken(){return String(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||'')}
export function storeConfigured(){return Boolean(redisUrl()&&redisToken())}

async function command(args){
  if(!storeConfigured())throw new Error('USER_STORE_NOT_CONFIGURED');
  const r=await fetch(redisUrl(),{
    method:'POST',
    headers:{'Authorization':`Bearer ${redisToken()}`,'Content-Type':'application/json'},
    body:JSON.stringify(args),
    cache:'no-store'
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.error)throw new Error(j.error||`USER_STORE_HTTP_${r.status}`);
  return j.result;
}
async function pipeline(commands){
  if(!storeConfigured())throw new Error('USER_STORE_NOT_CONFIGURED');
  const r=await fetch(`${redisUrl()}/pipeline`,{
    method:'POST',headers:{'Authorization':`Bearer ${redisToken()}`,'Content-Type':'application/json'},
    body:JSON.stringify(commands),cache:'no-store'
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok||!Array.isArray(j))throw new Error(`USER_STORE_PIPELINE_${r.status}`);
  for(const item of j)if(item?.error)throw new Error(item.error);
  return j.map(x=>x.result);
}

export function normalizeUsername(value){return String(value||'').trim().toLowerCase()}
export function validateUsername(value){const u=normalizeUsername(value);return /^[a-z0-9][a-z0-9._-]{2,39}$/.test(u)}
export function validatePassword(value){const p=String(value||'');return p.length>=10&&p.length<=128}
function userKey(username){return USER_PREFIX+normalizeUsername(username)}
function normalizeExpiry(value){
  if(!value)return null;
  const text=String(value).trim();
  const iso=/^\d{4}-\d{2}-\d{2}$/.test(text)?`${text}T23:59:59.999Z`:text;
  const t=Date.parse(iso);if(!Number.isFinite(t))throw new Error('INVALID_EXPIRY');
  return new Date(t).toISOString();
}
function publicUser(u){
  if(!u)return null;
  const {passwordHash,...safe}=u;
  return safe;
}

async function hashPassword(password){
  if(!validatePassword(password))throw new Error('PASSWORD_POLICY');
  const salt=crypto.randomBytes(16);
  const derived=await scryptAsync(String(password),salt,KEYLEN,{N:SCRYPT_N,r:SCRYPT_R,p:SCRYPT_P,maxmem:192*1024*1024});
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}
async function verifyPasswordHash(password,stored){
  try{
    const [alg,n,r,p,saltB64,hashB64]=String(stored||'').split('$');
    if(alg!=='scrypt')return false;
    const expected=Buffer.from(hashB64,'base64url');
    const derived=await scryptAsync(String(password),Buffer.from(saltB64,'base64url'),expected.length,{N:Number(n),r:Number(r),p:Number(p),maxmem:192*1024*1024});
    const got=Buffer.from(derived);
    return got.length===expected.length&&crypto.timingSafeEqual(got,expected);
  }catch{return false}
}

export async function getUser(username){
  const u=normalizeUsername(username);if(!validateUsername(u))return null;
  const raw=await command(['GET',userKey(u)]);if(!raw)return null;
  try{return JSON.parse(raw)}catch{return null}
}
export async function listUsers(){
  const names=(await command(['SMEMBERS',USER_SET]))||[];
  if(!names.length)return [];
  const vals=await command(['MGET',...names.map(userKey)]);
  return (vals||[]).map(v=>{try{return JSON.parse(v)}catch{return null}}).filter(Boolean).map(publicUser).sort((a,b)=>a.username.localeCompare(b.username));
}
async function saveUser(user){
  user.updatedAt=new Date().toISOString();
  await pipeline([['SET',userKey(user.username),JSON.stringify(user)],['SADD',USER_SET,user.username]]);
  return publicUser(user);
}

export async function createUser({username,password,role='user',note='',expiresAt=null}){
  username=normalizeUsername(username);
  if(!validateUsername(username))throw new Error('INVALID_USERNAME');
  if(!validatePassword(password))throw new Error('PASSWORD_POLICY');
  if(await getUser(username))throw new Error('USER_EXISTS');
  const now=new Date().toISOString();
  const user={username,passwordHash:await hashPassword(password),role:role==='admin'?'admin':'user',active:true,sessionVersion:1,note:String(note||'').trim().slice(0,160),expiresAt:normalizeExpiry(expiresAt),createdAt:now,updatedAt:now,lastLoginAt:null};
  await saveUser(user);return publicUser(user);
}

export async function ensureOwnerUser(){
  if(!storeConfigured())throw new Error('USER_STORE_NOT_CONFIGURED');
  const username=normalizeUsername(process.env.SKINPLAN_OWNER_USERNAME||'');
  const password=String(process.env.SKINPLAN_OWNER_PASSWORD||'');
  const existingUsers=await command(['SCARD',USER_SET]);
  if(Number(existingUsers)>0)return true;
  if(!validateUsername(username)||!validatePassword(password))throw new Error('OWNER_NOT_CONFIGURED');
  try{await createUser({username,password,role:'admin',note:'SkinPlan owner'});}catch(e){if(e.message!=='USER_EXISTS')throw e;}
  return true;
}

export function userIsUsable(user){
  if(!user||!user.active)return false;
  if(user.expiresAt){const t=Date.parse(user.expiresAt);if(Number.isFinite(t)&&t<=Date.now())return false;}
  return true;
}
export async function authenticateUser(username,password){
  const user=await getUser(username);
  if(!user||!userIsUsable(user))return null;
  if(!(await verifyPasswordHash(password,user.passwordHash)))return null;
  user.lastLoginAt=new Date().toISOString();
  await saveUser(user);
  return user;
}

export async function setUserEnabled(username,enabled){
  const user=await getUser(username);if(!user)throw new Error('USER_NOT_FOUND');
  if(user.role==='admin')throw new Error('OWNER_PROTECTED');
  user.active=Boolean(enabled);user.sessionVersion=Number(user.sessionVersion||0)+1;
  return saveUser(user);
}
export async function setUserPassword(username,password){
  const user=await getUser(username);if(!user)throw new Error('USER_NOT_FOUND');
  if(!validatePassword(password))throw new Error('PASSWORD_POLICY');
  user.passwordHash=await hashPassword(password);user.sessionVersion=Number(user.sessionVersion||0)+1;
  return saveUser(user);
}
export async function renameUser(oldUsername,newUsername){
  oldUsername=normalizeUsername(oldUsername);newUsername=normalizeUsername(newUsername);
  if(!validateUsername(newUsername))throw new Error('INVALID_USERNAME');
  const user=await getUser(oldUsername);if(!user)throw new Error('USER_NOT_FOUND');
  if(user.role==='admin')throw new Error('OWNER_PROTECTED');
  if(await getUser(newUsername))throw new Error('USER_EXISTS');
  user.username=newUsername;user.sessionVersion=Number(user.sessionVersion||0)+1;user.updatedAt=new Date().toISOString();
  await pipeline([
    ['SET',userKey(newUsername),JSON.stringify(user)],['SADD',USER_SET,newUsername],['DEL',userKey(oldUsername)],['SREM',USER_SET,oldUsername]
  ]);
  return publicUser(user);
}
export async function setUserExpiry(username,expiresAt){
  const user=await getUser(username);if(!user)throw new Error('USER_NOT_FOUND');
  if(user.role==='admin')throw new Error('OWNER_PROTECTED');
  const value=normalizeExpiry(expiresAt);
  user.expiresAt=value;user.sessionVersion=Number(user.sessionVersion||0)+1;
  return saveUser(user);
}
export async function setUserNote(username,note){
  const user=await getUser(username);if(!user)throw new Error('USER_NOT_FOUND');
  user.note=String(note||'').trim().slice(0,160);return saveUser(user);
}

export async function loginRateLimitKey(request,username){
  const raw=request.headers.get('x-forwarded-for')||request.headers.get('x-real-ip')||'unknown';
  const ip=raw.split(',')[0].trim().replace(/[^a-zA-Z0-9:._-]/g,'').slice(0,80)||'unknown';
  const u=normalizeUsername(username).replace(/[^a-z0-9._-]/g,'').slice(0,40)||'unknown';
  return `${LOGIN_LIMIT_PREFIX}${ip}:${u}`;
}
export async function checkLoginRateLimit(request,username){
  const key=await loginRateLimitKey(request,username);
  const [count]=await pipeline([['INCR',key],['EXPIRE',key,600]]);
  return {allowed:Number(count)<=10,count:Number(count),key};
}
export async function clearLoginRateLimit(key){if(key)await command(['DEL',key]).catch(()=>{});}
