import {clearSessionCookie,sameOrigin} from './_private/auth.mjs';
export function POST(request){
  if(!sameOrigin(request))return Response.json({error:'Origin rejected.'},{status:403,headers:{'Cache-Control':'no-store'}});
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':clearSessionCookie()}});
}
