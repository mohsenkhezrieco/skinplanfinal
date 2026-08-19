import {authConfigured,ensureAuthReady,sessionUser,clearSessionCookie} from './_private/auth.mjs';
export async function GET(request){
  if(!authConfigured())return Response.json({authenticated:false,configured:false},{status:503,headers:{'Cache-Control':'no-store'}});
  try{await ensureAuthReady()}catch(e){return Response.json({authenticated:false,configured:false,error:e.message},{status:503,headers:{'Cache-Control':'no-store'}})}
  const user=await sessionUser(request);
  if(!user)return Response.json({authenticated:false,configured:true},{status:200,headers:{'Cache-Control':'no-store','Set-Cookie':clearSessionCookie()}});
  return Response.json({authenticated:true,configured:true,username:user.username,role:user.role},{status:200,headers:{'Cache-Control':'no-store'}});
}
