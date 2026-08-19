const E={};
  const ORDER=['budget','mid','premium'];
  E.choose=function(all,{enabledMap={},strategy='clinical',priorityBrand='',brandTiers={}}={}){
    const eligible=(all||[]).filter(p=>p&&enabledMap[p.brand]!==false);
    if(!eligible.length)return null;
    if(priorityBrand){
      const preferred=eligible.find(p=>p.brand===priorityBrand);
      if(preferred)return {product:preferred,note:`Priority brand: ${priorityBrand}`,type:'priority'};
    }
    if(strategy==='budget'){
      for(const tier of ORDER){
        const p=eligible.find(x=>(brandTiers[x.brand]||'premium')===tier);
        if(p){
          const label=tier==='budget'?'Budget':tier==='mid'?'Mid-range':'Premium';
          const suffix=tier==='budget'?'':` fallback`;
          return {product:p,note:`Budget tier first · ${label}${suffix}`,type:'budget'};
        }
      }
    }
    return {product:eligible[0],note:'Clinical efficacy first',type:'clinical'};
  };

export default E;
