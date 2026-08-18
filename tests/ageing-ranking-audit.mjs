import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const m=html.match(/const RANKINGS=(\{.*?\});\nconst ROLE_LABELS=/s);
if(!m) throw new Error('RANKINGS not found');
const r=JSON.parse(m[1]);
const expected=['lrp_retinol_b3','avene_retinal_night','neutro_retinol','ord_granactive','cerave_retinol','inkey_retinol','ord_retinal_02','inkey_advanced_retinal'];
if(JSON.stringify(r.ageing_retinoid)!==JSON.stringify(expected)) throw new Error('Ageing retinoid ranking mismatch');
console.log('PASS — ageing_retinoid ranking v17.12');
