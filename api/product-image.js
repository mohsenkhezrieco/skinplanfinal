import {PRODUCTS,PRODUCT_IMAGE_SOURCES as sourceMap} from './_private/formulary.mjs';
import {requireSession} from './_private/auth.mjs';

const productById=new Map(PRODUCTS.map(p=>[p.id,p]));

function xmlEsc(v=''){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[c]||c));}
function wrapWords(text,max=28){const words=String(text||'').split(/\s+/);const lines=[];let line='';for(const w of words){const n=line?line+' '+w:w;if(n.length>max&&line){lines.push(line);line=w}else line=n}if(line)lines.push(line);return lines.slice(0,4)}
function placeholderSvg(p){const lines=wrapWords(p.name,30);const tspans=lines.map((x,i)=>`<tspan x="280" dy="${i?26:0}">${xmlEsc(x)}</tspan>`).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="560" viewBox="0 0 560 560"><rect width="560" height="560" rx="28" fill="#f7f4ef"/><rect x="54" y="54" width="452" height="452" rx="24" fill="#ffffff" stroke="#ded7cf" stroke-width="2"/><circle cx="280" cy="180" r="58" fill="#eee7df"/><path d="M250 174h60v72h-60zM260 151h40v30h-40z" fill="#9c7656" opacity=".82"/><text x="280" y="310" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#6d4d36">${xmlEsc(p.brand)}</text><text x="280" y="348" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#2c2c2c">${tspans}</text><text x="280" y="455" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#8c8178">Packshot temporarily unavailable</text></svg>`;}

const headers={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36',
  'accept-language':'en-GB,en;q=0.9'
};

function decodeHtml(s=''){
  return s.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function absolute(v,base){
  if(!v)return null;
  v=decodeHtml(String(v).replace(/\\u002F/g,'/').replace(/\\\//g,'/'));
  try{return new URL(v,base).toString()}catch{return null}
}
function scene7Candidates(code){
  if(!code)return[];
  return [
    `https://boots.scene7.com/is/image/Boots/${code}?wid=1200&hei=1200&fmt=png-alpha&op_sharpen=1`,
    `https://boots.scene7.com/is/image/Boots/${code}?wid=1200&hei=1200&fit=constrain,1&fmt=png-alpha`,
    `https://boots.scene7.com/is/image/Boots/${code}?wid=1000&hei=1000&fmt=jpeg&qlt=95`,
    `https://boots.scene7.com/is/image/Boots/${code}`
  ];
}
function pageCandidates(html,pageUrl){
  const vals=[];
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/ig,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/ig,
    /"zoomImage"\s*:\s*"([^"]+)"/ig,
    /"fullImage"\s*:\s*"([^"]+)"/ig,
    /"ItemImage"\s*:\s*"([^"]+)"/ig,
    /"image"\s*:\s*\[\s*"([^"]+)"/ig,
    /"image"\s*:\s*"([^"]+)"/ig,
    /(https:[^"'\s<]+boots\.scene7\.com[^"'\s<]+)/ig
  ];
  for(const re of patterns){
    let m;
    while((m=re.exec(html))){
      const u=absolute(m[1],pageUrl);
      if(u&&!/NoImageIcon|logo/i.test(u)&&!vals.includes(u))vals.push(u);
    }
  }
  return vals.slice(0,30);
}
async function candidatesFromPage(page){
  if(!page)return[];
  const r=await fetch(page,{redirect:'follow',headers:{...headers,accept:'text/html,application/xhtml+xml'},cache:'no-store'});
  if(!r.ok)return[];
  return pageCandidates(await r.text(),r.url||page);
}
async function fetchImage(url){
  const r=await fetch(url,{
    redirect:'follow',
    headers:{...headers,accept:'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',referer:'https://www.boots.com/'},
    cache:'no-store'
  });
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const ct=(r.headers.get('content-type')||'').toLowerCase();
  if(!ct.startsWith('image/'))throw new Error(`not image: ${ct}`);
  const data=new Uint8Array(await r.arrayBuffer());
  if(data.byteLength<1800)throw new Error('image too small');
  if(data.byteLength>8_000_000)throw new Error('image too large');
  return {data,contentType:ct.split(';')[0]||'image/jpeg'};
}

export async function GET(request){
  const auth=await requireSession(request);if(auth)return auth;
  const id=new URL(request.url).searchParams.get('id')||'';
  const p=productById.get(id);
  if(!p){
    return Response.json({error:'Unknown product image id.'},{status:404,headers:{'Cache-Control':'no-store'}});
  }

  const entry=sourceMap[id]||{};
  const urls=[];
  for(const u of [...(p.imageSourceUrls||[]),...(entry.sources||[]),...scene7Candidates(p.code)]){
    if(u&&!urls.includes(u))urls.push(u);
  }
  for(const u of await candidatesFromPage(entry.boots||p.boots)){
    if(!urls.includes(u))urls.push(u);
  }

  for(const u of urls){
    try{
      const img=await fetchImage(u);
      return new Response(img.data,{
        status:200,
        headers:{
          'Content-Type':img.contentType,
          'Cache-Control':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
          'X-Content-Type-Options':'nosniff'
        }
      });
    }catch{}
  }

  return new Response(placeholderSvg(p),{
    status:200,
    headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=3600, s-maxage=86400','X-Content-Type-Options':'nosniff'}
  });
}
