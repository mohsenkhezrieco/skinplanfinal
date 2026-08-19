import {ADMIN_HTML} from './_private/admin-shell.mjs';
import {requireAdmin} from './_private/auth.mjs';
export async function GET(request){
  const auth=await requireAdmin(request);if(auth)return auth;
  return new Response(ADMIN_HTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
