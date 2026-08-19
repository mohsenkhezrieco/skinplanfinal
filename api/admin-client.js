import {ADMIN_CLIENT} from './_private/admin-client-source.mjs';
import {requireAdmin} from './_private/auth.mjs';
export async function GET(request){
  const auth=await requireAdmin(request);if(auth)return auth;
  return new Response(ADMIN_CLIENT,{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
