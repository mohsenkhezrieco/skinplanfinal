import {requireSession,sameOrigin} from './_private/auth.mjs';
const METRICS = [
  ['acne',['pockmark','reflection']],
  ['blackhead',['blackhead']],
  ['pore',['pore']],
  ['oil',['deep_grease']],
  ['bacteria',['acne']],
  ['surfaceSensitivity',['sensitive']],
  ['deepSensitivity',['red_area']],
  ['surfaceSpot',['spot']],
  ['deepSpot',['uv_spot']],
  ['spotHeat',['hotmap_spot']],
  ['skinColor',['color']],
  ['wrinkle',['wrinkle']],
  ['collagen',['collagen']],
  ['texture',['roughness']]
];

function deriveLevel(score){
  score=Number(score);
  if(score<=29)return 5;
  if(score<=49)return 4;
  if(score<=69)return 3;
  if(score<=89)return 2;
  return 1;
}

function parseReportUrl(input){
  let text=String(input||'').trim().replace(/\\&/g,'&').replace(/\^&/g,'&');
  const md=text.match(/\]\((https?:\/\/[^)]+)\)/);
  if(md)text=md[1];

  let u;
  try{u=new URL(text)}catch{throw new Error('Invalid X3 report link.')}
  if(u.hostname.toLowerCase()!=='x3.aiskinia.com')throw new Error('Only x3.aiskinia.com report links are accepted.');

  const combined=(u.search||'')+'&'+(u.hash||'').replace(/^#/,'');
  const sm=combined.match(/[?&]shareId=([^&#]+)/i);
  const qm=combined.match(/[?&]qr_id=([^&#]+)/i);
  if(!sm||!qm)throw new Error('The link must contain shareId and qr_id.');

  const shareId=decodeURIComponent(sm[1]);
  const qrId=decodeURIComponent(qm[1]);
  if(!/^[a-f0-9]{20,64}$/i.test(shareId))throw new Error('Invalid shareId.');
  if(!/^\d{1,20}$/.test(qrId))throw new Error('Invalid qr_id.');
  return {shareId,qrId};
}


const DEMO_SHARE_ID = 'de000000000000000000000000000001';
const DEMO_QR_ID = '999001';

function demoReport(){
  const scores={
    acne:38,
    blackhead:44,
    pore:55,
    oil:62,
    bacteria:42,
    surfaceSensitivity:72,
    deepSensitivity:68,
    surfaceSpot:46,
    deepSpot:41,
    spotHeat:58,
    skinColor:73,
    wrinkle:66,
    collagen:61,
    texture:52
  };
  return {
    demo:true,
    baumann:'OSPW',
    moisture:42,
    skinAge:38,
    totalScore:57,
    metrics:Object.fromEntries(Object.entries(scores).map(([id,score])=>[id,{score,level:deriveLevel(score),source:'SkinPlan demo sample'}]))
  };
}

function pick(a,paths){
  for(const p of paths){
    if(a?.[p] && typeof a[p]==='object')return [p,a[p]];
  }
  return [null,null];
}

function sanitize(raw){
  const a=raw?.analysis;
  if(!a)throw new Error('X3 response did not contain an analysis object.');

  const metrics={};
  for(const [id,paths] of METRICS){
    const [source,obj]=pick(a,paths);
    if(!obj || obj.score===undefined || obj.score===null)throw new Error(`X3 response is missing ${id}.`);
    metrics[id]={score:Number(obj.score),level:Number(obj.level||deriveLevel(obj.score)),source};
  }

  const baumann=a.bowman_type?.type||'';
  if(!/^[OD][SR][PN][WT]$/.test(baumann))throw new Error('Valid Baumann type was not found in the X3 response.');

  return {
    baumann,
    moisture:a.water?.result??a.water?.score??null,
    skinAge:a.age?.result??null,
    totalScore:a.final_result?.score??raw.score??null,
    metrics
  };
}

export async function POST(request){
  const auth=await requireSession(request);if(auth)return auth;
  if(!sameOrigin(request))return Response.json({error:'Origin rejected.'},{status:403,headers:{'Cache-Control':'no-store'}});
  try{
    const body=await request.json();
    const {shareId,qrId}=parseReportUrl(body?.url);

    if(shareId.toLowerCase()===DEMO_SHARE_ID && qrId===DEMO_QR_ID){
      return Response.json(demoReport(),{
        status:200,
        headers:{
          'Cache-Control':'no-store, no-cache, must-revalidate',
          'Pragma':'no-cache',
          'X-Content-Type-Options':'nosniff'
        }
      });
    }

    const target=`https://x3.aiskinia.com/xcX3SkinSrv/analysis/shareDetail?shareId=${encodeURIComponent(shareId)}&qr_id=${encodeURIComponent(qrId)}`;
    const upstream=await fetch(target,{
      method:'GET',
      headers:{
        'accept':'application/json, text/plain, */*',
        'locale':'en',
        'x-sid':'h5',
        'x-tid':`h5_${Date.now()}`,
        'referer':'https://x3.aiskinia.com/xcx3skinweb/'
      },
      cache:'no-store'
    });

    if(!upstream.ok){
      return Response.json(
        {error:`X3 returned HTTP ${upstream.status}. The share link may have expired or X3 may be temporarily unavailable.`},
        {status:502,headers:{'Cache-Control':'no-store'}}
      );
    }

    let raw;
    try{raw=await upstream.json()}
    catch{
      return Response.json({error:'X3 returned a non-JSON response.'},{status:502,headers:{'Cache-Control':'no-store'}});
    }

    if(raw?.code!==undefined && Number(raw.code)!==0){
      return Response.json({error:`X3 API error ${raw.code}.`},{status:502,headers:{'Cache-Control':'no-store'}});
    }

    const clean=sanitize(raw);
    return Response.json(clean,{
      status:200,
      headers:{
        'Cache-Control':'no-store, no-cache, must-revalidate',
        'Pragma':'no-cache',
        'X-Content-Type-Options':'nosniff'
      }
    });
  }catch(error){
    return Response.json(
      {error:error?.message||'Unable to import X3 report.'},
      {status:400,headers:{'Cache-Control':'no-store'}}
    );
  }
}

export function GET(){return new Response(null,{status:405,headers:{'Allow':'POST','Cache-Control':'no-store'}})}
