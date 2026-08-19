import {requireAdmin,sameOrigin} from './_private/auth.mjs';
import {listUsers,createUser,setUserEnabled,setUserPassword,renameUser,setUserExpiry,setUserNote} from './_private/user-store.mjs';
function friendly(e){
  const m=String(e?.message||e||'');
  const map={INVALID_USERNAME:'Username must be 3–40 characters using letters, numbers, dot, underscore or hyphen.',PASSWORD_POLICY:'Password must be 10–128 characters.',USER_EXISTS:'That username already exists.',USER_NOT_FOUND:'User not found.',OWNER_PROTECTED:'The owner account cannot be disabled, renamed or expired from this panel.',INVALID_EXPIRY:'Use a valid expiry date.'};
  return map[m]||'Unable to update the account.';
}
export async function GET(request){
  const auth=await requireAdmin(request);if(auth)return auth;
  try{return Response.json({users:await listUsers()},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Unable to read the user store.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
export async function POST(request){
  if(!sameOrigin(request))return Response.json({error:'Origin rejected.'},{status:403,headers:{'Cache-Control':'no-store'}});
  const auth=await requireAdmin(request);if(auth)return auth;
  let b={};try{b=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400,headers:{'Cache-Control':'no-store'}})}
  try{
    let user;
    if(b.action==='create')user=await createUser({username:b.username,password:b.password,note:b.note,expiresAt:b.expiresAt||null});
    else if(b.action==='enabled')user=await setUserEnabled(b.username,Boolean(b.enabled));
    else if(b.action==='password')user=await setUserPassword(b.username,b.password);
    else if(b.action==='rename')user=await renameUser(b.username,b.newUsername);
    else if(b.action==='expiry')user=await setUserExpiry(b.username,b.expiresAt||null);
    else if(b.action==='note')user=await setUserNote(b.username,b.note);
    else return Response.json({error:'Unknown account action.'},{status:400,headers:{'Cache-Control':'no-store'}});
    return Response.json({ok:true,user},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:friendly(e)},{status:400,headers:{'Cache-Control':'no-store'}})}
}
