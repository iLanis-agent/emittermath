const e = require('./engine.js');
const cases = require('./expected.json');
let pass=0, fail=0;
const close=(a,b)=>Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(b));
function cmp(a,b,path){
  if (typeof b==='number'){ if(!(typeof a==='number'&&close(a,b))) throw new Error(path+': '+a+' != '+b); return; }
  if (typeof b==='object'&&b!==null){ for(const k of Object.keys(b)) cmp(a&&a[k],b[k],path+'.'+k); return; }
  if (a!==b) throw new Error(path+': '+JSON.stringify(a)+' != '+JSON.stringify(b));
}
const fns={need:e.plantNeed,sched:e.schedule,zone:e.zoneFlow,lat:e.lateral};
for(const c of cases){
  try{ cmp(fns[c.fn](...c.args),c.exp,c.fn+'('+c.args+')'); pass++; }
  catch(err){ fail++; console.log('FAIL',err.message); }
}
const A=[[e.GAL_PER_SQFT_IN,0.623],[e.GPH_PER_GPM,60],[e.SUPPLY_FRAC,0.75],[e.SESSION_CAP_H,2],
  [e.LATERAL_GUIDE['1/2'].maxFt,200],[e.LATERAL_GUIDE['1/2'].maxGph,220],[e.plantNeed(1,1).galWeek,0.623]];
for(const [g,w] of A){ if(close(g,w)) pass++; else { fail++; console.log('ANCHOR FAIL',g,w);} }
function prop(name,f){ try{ if(!f()) throw 0; pass++; }catch{ fail++; console.log('PROP FAIL',name); } }
prop('weekly need linear in ET',()=> close(e.plantNeed(10,2).galWeek, 2*e.plantNeed(10,1).galWeek));
prop('daily is weekly/7',()=>{ const p=e.plantNeed(12,1.5); return close(p.galDay,p.galWeek/7); });
prop('more emitters shortens sessions',()=> e.schedule(12,3,4,1).minutes < e.schedule(12,3,1,1).minutes);
prop('session gallons sum to the week',()=>{ const s=e.schedule(21,3,2,1); return close(s.perSession*3,21); });
prop('doubling sessions halves per-session time',()=> close(e.schedule(12,6,2,1).minutes, e.schedule(12,3,2,1).minutes/2));
prop('zone gpm = gph/60',()=>{ const z=e.zoneFlow(90,2,8); return close(z.zoneGpm, z.zoneGph/60); });
prop('over-budget zone does not fit',()=> e.zoneFlow(600,2,5).fits===false);
prop('bigger pipe allows longer runs',()=> e.LATERAL_GUIDE['3/4'].maxFt > e.LATERAL_GUIDE['1/4'].maxFt);
prop('1/4 in line at 40 ft fails length',()=> e.lateral('1/4',40,20).lenOk===false);
prop('watering hours = gallons / rate',()=>{ const w=e.watering(6,3,1); return close(w.hours,2); });
for(const bad of [[0,1],[2,0],[-1,1]]){ try{ e.plantNeed(...bad); fail++; console.log('ERR FAIL need',bad);}catch{ pass++; } }
for(const bad of [[0,3,1,1],[10,0,1,1],[10,2,0,1],[10,2,1,0]]){ try{ e.schedule(...bad); fail++; console.log('ERR FAIL sched',bad);}catch{ pass++; } }
for(const bad of [[0,1,5],[10,0,5],[10,1,0]]){ try{ e.zoneFlow(...bad); fail++; console.log('ERR FAIL zone',bad);}catch{ pass++; } }
try{ e.lateral('1',100,100); fail++; console.log('ERR FAIL lat size'); }catch{ pass++; }
for(const bad of [['1/2',0,100],['1/2',100,0]]){ try{ e.lateral(...bad); fail++; console.log('ERR FAIL lat',bad);}catch{ pass++; } }
console.log(pass+'/'+(pass+fail)+' checks pass');
process.exit(fail?1:0);
