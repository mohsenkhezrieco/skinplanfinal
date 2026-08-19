import crypto from 'node:crypto';
import {storeConfigured,getUser,userIsUsable,ensureOwnerUser} from './user-store.mjs';

const COOKIE='skinplan_session';
const MAX_AGE=8*60*60;

function b64url(input){return Buffer.from(input).toString('base64url')}
function unb64url(input){return Buffer.from(input,'base64url').toString('utf8')}
function safeEqual(a,b){const A=Buffer.from(String(a));const B=Buffer.from(String(b));return A.length===B.length&&crypto.timingSafeEqual(A,B)}
function secret(){return String(process.env.SKINPLAN_SESSION_SECRET||'')}
export function authConfigured(){return secret().length>=32&&storeConfigured()}
export async function ensureAuthReady(){if(!authConfigured())return false;await ensureOwnerUser();return true}

export function issueSession(user){
  if(!authConfigured())throw new Error('AUTH_NOT_CONFIGURED');
  const payload={sub:user.username,role:user.role,sv:Number(user.sessionVersion||1),exp:Math.floor(Date.now()/1000)+MAX_AGE,nonce:crypto.randomBytes(16).toString('hex')};
  const body=b64url(JSON.stringify(payload));
  const sig=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function cookieValue(request){
  const raw=request.headers.get('cookie')||'';
  for(const part of raw.split(';')){const [k,...rest]=part.trim().split('=');if(k===COOKIE)return decodeURIComponent(rest.join('='));}
  return '';
}
function verifyTokenSignature(request){
  if(!authConfigured())return null;
  const token=cookieValue(request);if(!token)return null;
  const [body,sig]=token.split('.');if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  if(!safeEqual(sig,expected))return null;
  try{const p=JSON.parse(unb64url(body));if(Number(p.exp)<=Math.floor(Date.now()/1000))return null;return p}catch{return null}
}
export async function sessionUser(request){
  const payload=verifyTokenSignature(request);if(!payload?.sub)return null;
  const user=await getUser(payload.sub).catch(()=>null);
  if(!user||!userIsUsable(user))return null;
  if(Number(payload.sv)!==Number(user.sessionVersion||1))return null;
  return user;
}
export async function requireSession(request){
  if(!authConfigured())return new Response(JSON.stringify({error:'SkinPlan access control is not configured on the server.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const user=await sessionUser(request);if(!user)return new Response(JSON.stringify({error:'Authentication required.'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':clearSessionCookie()}});
  return null;
}
export async function requireAdmin(request){
  if(!authConfigured())return new Response(JSON.stringify({error:'SkinPlan access control is not configured on the server.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const user=await sessionUser(request);
  if(!user)return new Response(JSON.stringify({error:'Authentication required.'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':clearSessionCookie()}});
  if(user.role!=='admin')return new Response(JSON.stringify({error:'Owner access required.'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  return null;
}
export function sessionCookie(token){return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`}
export function clearSessionCookie(){return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`}
export function sameOrigin(request){const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host}catch{return false}}
