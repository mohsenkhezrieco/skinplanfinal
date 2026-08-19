import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const [products,sourceMap]=await Promise.all([
  fs.readFile(path.join(root,'products.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(root,'product-image-sources.json'),'utf8').then(JSON.parse)
]);
const productById=new Map(products.map(p=>[p.id,p]));

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
          'Access-Control-Allow-Origin':'*',
          'X-Content-Type-Options':'nosniff'
        }
      });
    }catch{}
  }

  return Response.json(
    {error:'A real packshot could not be retrieved for this product.'},
    {status:404,headers:{'Cache-Control':'no-store'}}
  );
}
