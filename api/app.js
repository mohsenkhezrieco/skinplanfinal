import {APP_HTML} from './_private/app-shell.mjs';
import {APP_CLIENT} from './_private/app-client-source.mjs';
import {requireSession} from './_private/auth.mjs';

export async function GET(request){
  const auth=await requireSession(request);if(auth)return auth;
  const url=new URL(request.url);
  if(url.searchParams.get('asset')==='client'){
    return new Response(APP_CLIENT,{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
  }
  return new Response(APP_HTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
