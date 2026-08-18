import fs from 'node:fs';
const products=JSON.parse(fs.readFileSync(new URL('../products.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ids=['boj_green_plum_cleanser','boj_red_bean_gel','boj_glow_serum','boj_glow_deep','boj_green_plum_toner','boj_revive_eye','boj_aqua_fresh_spf'];
for(const id of ids){if(!products.some(p=>p.id===id)) throw new Error(`Missing ${id}`);}
if(products.filter(p=>p.brand==='Beauty of Joseon').length<10) throw new Error('BOJ expansion count too low');
const m=html.match(/const RANKINGS=(\{.*?\});\nconst ROLE_LABELS=/s);
if(!m) throw new Error('RANKINGS not found');
const r=JSON.parse(m[1]);
if(r.eye_ageing?.[0]!=='boj_revive_eye') throw new Error('eye_ageing ranking missing');
for(const [role,id] of [['moisturiser_oily','boj_red_bean_gel'],['pigment_only','boj_glow_deep'],['oil_support','boj_glow_serum'],['spf_oily','boj_aqua_fresh_spf']]){if(!r[role]?.includes(id)) throw new Error(`${id} missing from ${role}`);}
console.log('PASS — Beauty of Joseon library expansion v17.11');
