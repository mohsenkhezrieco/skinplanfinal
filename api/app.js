import {APP_HTML} from './_private/app-shell.mjs';
import {requireSession} from './_private/auth.mjs';
export async function GET(request){
  const auth=await requireSession(request);if(auth)return auth;
  return new Response(APP_HTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
