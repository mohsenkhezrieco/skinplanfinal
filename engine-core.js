(function(global){
  'use strict';
  const E={};
  const clampLevel=v=>Math.max(1,Math.min(5,Number(v)||1));

  E.concernLevels=function(raw){
    const r={};
    for(const [k,v] of Object.entries(raw||{}))r[k]=clampLevel(v);

    const surfaceSens=r.surfaceSensitivity||1;
    const deepSens=r.deepSensitivity||1;
    const heat=r.spotHeat||1;
    const sensitivityCore=Math.max(surfaceSens,deepSens);

    // Heatmap is a modifier, never an independent barrier trigger.
    let barrier=sensitivityCore;
    if(sensitivityCore>=3 && heat>=4)barrier=Math.max(barrier,heat);

    // Pigment treatment requires an actual spot/colour abnormality.
    const pigmentCore=Math.max(r.surfaceSpot||1,r.deepSpot||1,r.skinColor||1);
    let pigment=pigmentCore;
    if(pigmentCore>=3 && heat>=4)pigment=Math.max(pigment,heat);

    // Blackhead is the treatment trigger for congestion; pore only grades severity.
    const blackhead=r.blackhead||1;
    const pore=r.pore||1;
    const congestion=blackhead>=3?Math.max(blackhead,pore):blackhead;

    // Wrinkle is the treatment trigger for ageing; collagen/texture only grade severity.
    const wrinkle=r.wrinkle||1;
    let ageing=wrinkle;
    if(wrinkle>=3)ageing=Math.max(wrinkle,Math.min(4,r.collagen||1),Math.min(4,r.texture||1));

    return {
      barrier,
      acne:r.acne||1,
      bacteria:r.bacteria||1,
      pigment,
      congestion,
      ageing,
      _sensitivityCore:sensitivityCore,
      _pigmentCore:pigmentCore
    };
  };

  E.barrierFirst=function(levels,baumann){
    const B=String(baumann||'');
    return levels.barrier>=4 || (B[1]==='S' && levels.barrier===3);
  };

  E.orderedConcerns=function(levels,baumann){
    const B=String(baumann||'');
    const bonus={acne:0.30,pigment:B[2]==='P'?0.35:0.15,congestion:0.10,ageing:B[3]==='W'?0.30:0.05};
    const clinicalOrder={acne:0,pigment:1,congestion:2,ageing:3};
    return ['acne','pigment','congestion','ageing']
      .map(key=>({key,level:levels[key],score:levels[key]+bonus[key]}))
      .filter(x=>x.level>=3)
      .sort((a,b)=>(b.score-a.score)||(clinicalOrder[a.key]-clinicalOrder[b.key]));
  };

  E.basePolicy=function({baumann,moisture,levels}){
    const B=String(baumann||'');
    const D=B[0]==='D', O=B[0]==='O', S=B[1]==='S';
    const moistureNum=moisture==null?null:Number(moisture);
    const dehydrated=Number.isFinite(moistureNum)&&moistureNum<30;

    const cleanserRole=(D||S||levels.barrier>=3)?'cleanser_sensitive':'cleanser_oily';
    let moisturiserRole='moisturiser_sensitive';
    if(D){
      moisturiserRole='moisturiser_barrier_dry';
    }else if(O){
      // An O Baumann classification is not overridden by a single sebum sub-score.
      // Dehydrated/inflamed oily skin gets a sensitive moisturiser, not an automatically rich dry-skin cream.
      moisturiserRole=(dehydrated||levels.barrier>=4)?'moisturiser_sensitive':'moisturiser_oily';
    }

    let spfRole='spf_general';
    if(levels.pigment>=3||B[2]==='P'||levels.ageing>=4)spfRole='spf_pigment';
    else if(O&&(levels.acne>=3||levels.congestion>=3))spfRole='spf_oily';

    return {cleanserRole,moisturiserRole,spfRole};
  };

  E.expandedCovers=function(active,baseCovers,levels){
    const out=new Set(baseCovers||[]);
    const t=active?.therapy||'';
    if(t==='azelaic'){
      if(levels.acne>=3)out.add('acne');
      if(levels.pigment>=3)out.add('pigment');
    }
    if(['bha','bha_pigment','multi_acid','blemish_acid','blemish'].includes(t)){
      if(levels.acne>=3)out.add('acne');
      if(levels.congestion>=3)out.add('congestion');
    }
    if(t==='bha_pigment' && levels.pigment>=3)out.add('pigment');
    return [...out];
  };

  function chooseComb(arr,k,start=0,prefix=[],out=[]){
    if(k===0){out.push(prefix.slice());return out;}
    for(let i=start;i<=arr.length-k;i++){
      prefix.push(arr[i]);chooseComb(arr,k-1,i+1,prefix,out);prefix.pop();
    }
    return out;
  }
  function cyclicDistance(a,b){const d=Math.abs(a-b);return Math.min(d,7-d);}
  function validSameActiveDays(days,minGap){
    const required=(Number(minGap)||0)+1;
    for(let i=0;i<days.length;i++)for(let j=i+1;j<days.length;j++){
      if(cyclicDistance(days[i],days[j])<required)return false;
    }
    return true;
  }
  function scheduleScore(assignments){
    const used=[];
    Object.values(assignments).forEach(ds=>used.push(...ds));
    used.sort((a,b)=>a-b);
    if(used.length<2)return 0;
    let penalty=0;
    for(let i=0;i<used.length;i++){
      const a=used[i],b=used[(i+1)%used.length];
      const d=i===used.length-1?(b+7-a):(b-a);
      if(d===1)penalty+=5;
      else if(d===2)penalty+=1;
    }
    // Prefer weekdays for treatment when schedules are otherwise equal.
    for(const d of used)if(d===5||d===6)penalty+=0.05;
    return penalty;
  }

  E.adjustCounts=function(items,{sensitive=false,currentIndex=null}={}){
    const maxActive=sensitive?3:4;
    const counts=items.map(x=>({
      ...x,
      count:Math.max(0,Number(x.count)||0),
      current:x.index===currentIndex
    }));
    let total=counts.reduce((a,x)=>a+x.count,0);
    if(total<=maxActive)return {counts,maxActive,paused:[]};

    // Make room for the newly introduced treatment first by tapering older maintenance actives.
    const previous=counts.filter(x=>!x.current).sort((a,b)=>a.index-b.index);
    for(const x of previous){
      while(total>maxActive && x.count>1){x.count--;total--;}
    }
    // If still crowded, pause the oldest prior active(s); progression is conditional on reassessment.
    for(const x of previous){
      while(total>maxActive && x.count>0){x.count--;total--;}
    }
    // Last resort: reduce the new treatment, but never below one application/week.
    const current=counts.find(x=>x.current);
    while(total>maxActive && current && current.count>1){current.count--;total--;}

    return {counts,maxActive,paused:counts.filter(x=>!x.current&&x.count===0).map(x=>x.key)};
  };

  E.scheduleWeek=function(items,{sensitive=false,currentIndex=null}={}){
    const adjusted=E.adjustCounts(items,{sensitive,currentIndex});
    const active=adjusted.counts.filter(x=>x.count>0);
    const days=[0,1,2,3,4,5,6];
    const options=active.map(x=>({
      item:x,
      choices:chooseComb(days,x.count).filter(ds=>validSameActiveDays(ds,x.minGap||0))
    }));
    if(options.some(x=>x.choices.length===0))return {...adjusted,week:null,assignments:null,error:'No spacing-valid weekly schedule.'};

    let best=null,bestScore=Infinity;
    function backtrack(i,used,assign){
      if(i===options.length){
        const sc=scheduleScore(assign);
        if(sc<bestScore){bestScore=sc;best=JSON.parse(JSON.stringify(assign));}
        return;
      }
      const {item,choices}=options[i];
      for(const choice of choices){
        if(choice.some(d=>used.has(d)))continue;
        choice.forEach(d=>used.add(d));assign[item.key]=choice;
        backtrack(i+1,used,assign);
        choice.forEach(d=>used.delete(d));delete assign[item.key];
      }
    }
    backtrack(0,new Set(),{});
    if(!best)return {...adjusted,week:null,assignments:null,error:'No non-overlapping weekly schedule.'};
    const week=days.map(day=>({day,type:'recovery',key:null}));
    for(const x of active){for(const d of best[x.key]||[])week[d]={day:d,type:'active',key:x.key};}
    return {...adjusted,week,assignments:best,error:null};
  };

  global.SkinPlanEngine=E;
})(typeof window!=='undefined'?window:globalThis);
