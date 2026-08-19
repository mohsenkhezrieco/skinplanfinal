import {authConfigured,ensureAuthReady,issueSession,sessionCookie,sameOrigin} from './_private/auth.mjs';
import {authenticateUser,checkLoginRateLimit,clearLoginRateLimit,normalizeUsername} from './_private/user-store.mjs';

export async function POST(request){
  if(!sameOrigin(request))return Response.json({error:'Origin rejected.'},{status:403,headers:{'Cache-Control':'no-store'}});
  if(!authConfigured())return Response.json({error:'Access control is not configured. Connect Upstash Redis and set SKINPLAN_SESSION_SECRET.'},{status:503,headers:{'Cache-Control':'no-store'}});
  try{await ensureAuthReady()}catch(e){return Response.json({error:e.message==='OWNER_NOT_CONFIGURED'?'Create the owner account by setting SKINPLAN_OWNER_USERNAME and SKINPLAN_OWNER_PASSWORD, then redeploy.':'User store is unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}
  let body={};try{body=await request.json()}catch{}
  const username=normalizeUsername(body?.username);
  const rate=await checkLoginRateLimit(request,username).catch(()=>({allowed:true,key:null}));
  if(!rate.allowed)return Response.json({error:'Too many login attempts. Try again in a few minutes.'},{status:429,headers:{'Cache-Control':'no-store','Retry-After':'600'}});
  const user=await authenticateUser(username,body?.password).catch(()=>null);
  if(!user)return Response.json({error:'Invalid username or password, or this account is disabled/expired.'},{status:401,headers:{'Cache-Control':'no-store'}});
  await clearLoginRateLimit(rate.key);
  const token=issueSession(user);
  return Response.json({ok:true,username:user.username,role:user.role},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie(token)}});
}
export function GET(){return new Response(null,{status:405,headers:{'Allow':'POST','Cache-Control':'no-store'}})}
