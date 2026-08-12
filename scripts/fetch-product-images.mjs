import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const products=JSON.parse(await fs.readFile(path.join(root,'products.json'),'utf8'));
const outDir=path.join(root,'assets','products');
await fs.mkdir(outDir,{recursive:true});

const headers={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36',
  'accept-language':'en-GB,en;q=0.9'
};
function decodeHtml(s=''){return s.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function absolute(v,base){if(!v)return null;v=decodeHtml(v.replace(/\\u002F/g,'/').replace(/\\\//g,'/'));try{return new URL(v,base).toString()}catch{return null}}
async function downloadImage(url){
  const r=await fetch(url,{redirect:'follow',headers:{...headers,accept:'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',referer:'https://www.boots.com/'}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);const ct=(r.headers.get('content-type')||'').toLowerCase();if(!ct.startsWith('image/'))throw new Error(`not image: ${ct}`);const b=Buffer.from(await r.arrayBuffer());if(b.length<1800)throw new Error('image too small');return b;
}
async function useful(b){
  const im=sharp(b,{failOn:'none'}).rotate();const meta=await im.metadata();if((meta.width||0)<180||(meta.height||0)<180)return false;
  const raw=await im.resize(120,120,{fit:'contain',background:'#fff'}).removeAlpha().raw().toBuffer();let sum=0,sum2=0;for(const v of raw){sum+=v;sum2+=v*v}const n=raw.length,mean=sum/n,variance=sum2/n-mean*mean;return variance>120;
}
function pageCandidates(html,pageUrl){
  const vals=[];const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/ig,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/ig,
    /"zoomImage"\s*:\s*"([^"]+)"/ig,/"fullImage"\s*:\s*"([^"]+)"/ig,/"image"\s*:\s*"([^"]+)"/ig,
    /(https:[^\"'\\s<]+boots\.scene7\.com[^\"'\\s<]+)/ig
  ];
  for(const re of patterns){let m;while((m=re.exec(html))){const u=absolute(m[1],pageUrl);if(u&&!/NoImageIcon/i.test(u)&&!vals.includes(u))vals.push(u)}}
  return vals.slice(0,20);
}
async function candidatesFromPage(page){
  if(!page)return[];const r=await fetch(page,{redirect:'follow',headers:{...headers,accept:'text/html,application/xhtml+xml'}});if(!r.ok)throw new Error(`Boots page HTTP ${r.status}`);const text=await r.text();return pageCandidates(text,r.url||page);
}
let updated=0,failed=0;const failures=[];
for(const p of products){
  const dest=path.join(outDir,`${p.id}.jpg`);let ok=false;const urls=[...(p.imageSourceUrls||[])];
  try{for(const u of await candidatesFromPage(p.boots))if(!urls.includes(u))urls.push(u)}catch(e){console.log(`PAGE ${p.id}: ${e.message}`)}
  for(const u of urls){
    try{const b=await downloadImage(u);if(!(await useful(b)))throw new Error('blank/error-looking image');const out=await sharp(b,{failOn:'none'}).rotate().resize(900,900,{fit:'contain',background:'#fff'}).jpeg({quality:92,mozjpeg:true}).toBuffer();await fs.writeFile(dest,out);console.log(`OK ${p.id} <- ${u}`);updated++;ok=true;break}catch(e){console.log(`FAIL ${p.id} ${u}: ${e.message}`)}
  }
  if(!ok){failed++;failures.push(p.id);console.log(`KEEP existing ${p.id}`)}
}
console.log(`Done. Updated ${updated}; kept existing for ${failed}.`);if(failures.length)console.log(`Not updated: ${failures.join(', ')}`);
