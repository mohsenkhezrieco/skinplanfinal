import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const products=JSON.parse(fs.readFileSync(path.join(root,'products.json'),'utf8'));
const sourceMap=JSON.parse(fs.readFileSync(path.join(root,'product-image-sources.json'),'utf8'));
let failures=[];
let local=0,remoteFallback=0;
for(const p of products){
  const rel=String(p.image||'').split('?')[0].replace(/^\//,'');
  const localPath=path.join(root,rel);
  if(rel&&fs.existsSync(localPath)){local++;continue;}
  const urls=[...(p.imageSourceUrls||[]),...((sourceMap[p.id]||{}).sources||[])].filter(Boolean);
  if(urls.length){remoteFallback++;continue;}
  failures.push(`${p.id} | ${p.brand} | ${p.name}`);
}
if(failures.length){
  console.error('Products with neither a local packshot nor an approved real-image source:');
  for(const x of failures)console.error(' - '+x);
  process.exit(1);
}
console.log(`Product image coverage PASS — ${products.length} products; ${local} local packshots; ${remoteFallback} real-packshot proxy fallbacks.`);
