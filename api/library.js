import {PRODUCTS,BRANDS} from './_private/formulary.mjs';
import {requireSession} from './_private/auth.mjs';

const ROLE_CATEGORY={cleanser:'Cleansers',moisturiser:'Moisturisers',spf:'Sunscreens',barrier:'Barrier & recovery',rescue:'Barrier & recovery',pigment:'Pigmentation & tone',retinoid:'Ageing — face',ageing:'Ageing — face',eye_ageing:'Ageing — eye'};
function categoryFor(p){
  if(ROLE_CATEGORY[p.role])return ROLE_CATEGORY[p.role];
  if(p.role==='active'){
    if(['pigment','pigment_am'].includes(p.therapy))return 'Pigmentation & tone';
    return 'Blemish & congestion';
  }
  if(p.role==='support'){
    if(p.therapy==='postblemish')return 'Pigmentation & tone';
    if(p.therapy==='oil_support')return 'Blemish & congestion';
    return 'Support';
  }
  return 'Support';
}
const SUMMARY={
  base:'Daily base-care product in the SkinPlan formulary.',active_cleanser:'Active cleanser containing an exfoliating blemish-support ingredient.',azelaic:'Azelaic-acid option for blemish and uneven-tone support.',retinoid:'Retinoid / retinal option used in staged evening routines.',retinoid_eye:'Eye-area retinoid option for staged evening use.',peptide:'Non-retinoid peptide-based ageing support.',peptide_eye:'Peptide-based eye-area ageing support.',ageing_support:'Non-retinoid hydration / ageing-support option.',ageing_eye_support:'Non-retinoid eye-area ageing support.',bha:'Leave-on BHA / salicylic-acid congestion support.',bha_pigment:'Blemish and post-blemish mark support.',blemish:'Blemish-support treatment.',blemish_acid:'Acid-based blemish-support treatment.',multi_acid:'Multi-acid resurfacing / congestion-support treatment.',pigment:'Uneven-tone and pigmentation-support treatment.',pigment_am:'Morning pigmentation-support treatment.',postblemish:'Gentle post-blemish mark / texture support.',oil_support:'Oil-control and visible-pore support.',barrier:'Barrier-support / calming treatment.',rescue:'Local recovery / rescue balm.',spf:'Daily sunscreen.'
};
function imageUrl(p){const v=String(p.image||'');if(!v)return '';return v.startsWith('/')?v:'/'+v}
function useLabel(p){if(p.useTime==='am')return 'Suggested use: AM';if(p.useTime==='pm')return 'Suggested use: PM';if(p.useTime==='am_pm')return 'Suggested use: AM / PM';return 'Use according to plan';}
export async function GET(request){
  const auth=await requireSession(request);if(auth)return auth;
  const products=Object.values(PRODUCTS).map(p=>({brand:p.brand,name:p.name,category:categoryFor(p),image:imageUrl(p),imageFallback:'/api/product-image?id='+encodeURIComponent(p.id),summary:SUMMARY[p.therapy]||'Curated SkinPlan formulary product.',useTime:useLabel(p),infoUrl:p.boots||''})).sort((a,b)=>a.brand.localeCompare(b.brand,'en')||a.name.localeCompare(b.name,'en'));
  const categories=[...new Set(products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,'en'));
  return Response.json({version:'17.21.3',brands:[...BRANDS],categories,products},{headers:{'Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
