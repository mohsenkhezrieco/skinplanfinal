import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../engine-core.js',import.meta.url),'utf8');
const ctx={globalThis:{}};
ctx.window=undefined;
vm.createContext(ctx);
vm.runInContext(code,ctx);
const E=ctx.globalThis.SkinPlanEngine;
if(!E)throw new Error('SkinPlanEngine failed to load');

let checks=0;
function assert(cond,msg){checks++;if(!cond)throw new Error(msg)}
const L=[1,2,3,4,5];

// Boundary/exhaustive concern tests.
for(const ss of L)for(const ds of L)for(const heat of L){
  const x=E.concernLevels({surfaceSensitivity:ss,deepSensitivity:ds,spotHeat:heat});
  const core=Math.max(ss,ds);
  if(core<=2)assert(x.barrier===core,`Heat alone changed barrier: ${ss}/${ds}/${heat}`);
  if(core>=3&&heat>=4)assert(x.barrier===Math.max(core,heat),'Heat modifier failed');
}
for(const sp of L)for(const dp of L)for(const col of L)for(const heat of L){
  const x=E.concernLevels({surfaceSpot:sp,deepSpot:dp,skinColor:col,spotHeat:heat});
  const core=Math.max(sp,dp,col);
  if(core<=2)assert(x.pigment===core,'Heat alone triggered pigment');
  if(core>=3&&heat>=4)assert(x.pigment===Math.max(core,heat),'Pigment heat modifier failed');
}
for(const bh of L)for(const pore of L){
  const x=E.concernLevels({blackhead:bh,pore});
  if(bh<=2)assert(x.congestion===bh,'Pore alone triggered congestion');
  else assert(x.congestion===Math.max(bh,pore),'Pore severity modifier failed');
}
for(const wr of L)for(const co of L)for(const tx of L){
  const x=E.concernLevels({wrinkle:wr,collagen:co,texture:tx});
  if(wr<=2)assert(x.ageing===wr,'Collagen/texture alone triggered ageing');
  else assert(x.ageing>=wr&&x.ageing<=5,'Ageing modifier invalid');
}

// Explicit regression case from clinic testing.
{
  const x=E.concernLevels({
    acne:1,blackhead:2,pore:3,bacteria:1,
    surfaceSensitivity:1,deepSensitivity:1,
    surfaceSpot:5,deepSpot:3,spotHeat:5,skinColor:3,
    wrinkle:4,collagen:3,texture:3
  });
  assert(x.barrier===1,'Regression: severe spot heat incorrectly triggers barrier recovery');
  assert(x.pigment===5,'Regression: pigmentation priority not retained');
  assert(x.ageing===4,'Regression: ageing concern not retained');
  assert(!E.barrierFirst(x,'DSPW'),'Regression: DSPW with normal sensitivity still forced barrier phase');
}

// All 16 Baumann types x all derived concern combinations.
const baumanns=[];
for(const a of ['D','O'])for(const b of ['S','R'])for(const c of ['P','N'])for(const d of ['W','T'])baumanns.push(a+b+c+d);
for(const B of baumanns){
  for(const barrier of L)for(const acne of L)for(const pigment of L)for(const congestion of L)for(const ageing of L){
    const levels={barrier,acne,pigment,congestion,ageing,bacteria:1};
    const order=E.orderedConcerns(levels,B);
    assert(order.every(x=>x.level>=3),'Sub-threshold concern entered plan');
    assert(new Set(order.map(x=>x.key)).size===order.length,'Duplicate concern');
    const bf=E.barrierFirst(levels,B);
    if(barrier>=4)assert(bf,'Severe barrier concern did not gate');
    if(barrier<=2)assert(!bf,'Normal barrier concern gated');
    if(barrier===3&&B[1]==='S')assert(bf,'Sensitive Level III barrier did not gate');
    if(barrier===3&&B[1]==='R')assert(!bf,'Resistant Level III barrier incorrectly gated');

    for(const moisture of [15,35,60]){
      const p=E.basePolicy({baumann:B,moisture,levels});
      assert(['cleanser_sensitive','cleanser_oily'].includes(p.cleanserRole),'Invalid cleanser role');
      assert(['moisturiser_barrier_dry','moisturiser_sensitive','moisturiser_oily'].includes(p.moisturiserRole),'Invalid moisturiser role');
      assert(['spf_general','spf_pigment','spf_oily'].includes(p.spfRole),'Invalid SPF role');
      if(B[0]==='D')assert(p.moisturiserRole==='moisturiser_barrier_dry','Dry Baumann did not get dry/barrier moisturiser');
      if(B[0]==='O'&&moisture>=30&&barrier<=3)assert(p.moisturiserRole==='moisturiser_oily','Robust hydrated oily Baumann did not get lightweight moisturiser');
    }
  }
}

// Weekly scheduler: all common protocol combinations.
const protocols=[
  {key:'az',minGap:1,count:3,index:0},
  {key:'bha',minGap:2,count:2,index:0},
  {key:'ret',minGap:2,count:2,index:0},
  {key:'pep',minGap:0,count:3,index:0},
  {key:'pig',minGap:1,count:3,index:0}
];
function cyclic(a,b){const d=Math.abs(a-b);return Math.min(d,7-d)}
for(const sensitive of [false,true]){
  for(let mask=1;mask<(1<<protocols.length);mask++){
    const items=protocols.filter((_,i)=>mask&(1<<i)).map((x,i)=>({...x,index:i}));
    const currentIndex=items.at(-1).index;
    const r=E.scheduleWeek(items,{sensitive,currentIndex});
    assert(!r.error,`No schedule for mask ${mask} sensitive=${sensitive}: ${r.error}`);
    const activeDays=r.week.filter(x=>x.type==='active');
    assert(activeDays.length<= (sensitive?3:4),'Weekly active cap exceeded');
    assert(new Set(activeDays.map(x=>x.day)).size===activeDays.length,'Two actives assigned same evening');
    for(const c of r.counts.filter(x=>x.count>1)){
      const days=(r.assignments[c.key]||[]);
      for(let i=0;i<days.length;i++)for(let j=i+1;j<days.length;j++){
        assert(cyclic(days[i],days[j])>=c.minGap+1,`minGap violated for ${c.key}`);
      }
    }
  }
}

console.log(`PASS — ${checks.toLocaleString()} decision checks`);

// Phase-decision integration regression: same pigment profile, Acne L1 vs L5 must change pathway.
{
  const base={barrier:2,pigment:5,congestion:2,ageing:4,bacteria:2};
  const low={...base,acne:1};
  const high={...base,acne:5};
  const p1=E.phaseDecision('pigment',low,{sensitive:true});
  const p2=E.phaseDecision('pigment',high,{sensitive:true});
  assert(p1.kind==='pigment_only','Acne L1 + pigment L5 should be pigment-only');
  assert(p2.kind==='acne_pigment_shared','Acne L5 + pigment L5 must use shared acne+pigment pathway');
  assert(p2.covers.includes('acne')&&p2.covers.includes('pigment'),'Shared pathway must cover both acne and pigment');
}
