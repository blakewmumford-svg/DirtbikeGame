import {fileURLToPath} from 'node:url';
import {browserOptions} from './browser-options.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';

const target=fileURLToPath(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url));
const results=[],errors=[];
const instrumentation=`
currentSamples=sampleWheels();
globalThis.__screamTest={wildlife,wolfPacks,wildlifeBatches,updateWildlife,disaster,updateDisasters,startDisaster,stopDisaster,AUTOMATIC_EVENTS,floodWater,firePatches,meteorHeads,confetti,
 reset(){reset();showMenuStage('riding');for(const a of wildlife){a.position.copy(a.home);a.cooldown=0}for(const p of wolfPacks){p.attackCooldown=0;p.callTimer=0}},
 riderReset(){reset();showMenuStage('riding')},
 get state(){return{damage,ragdoll:ragdoll.active}},
 preview(type){this.reset();startDisaster(type);updateDisasters(3);updateWildlife(0);this.render()},
 animalsPreview(){this.reset();for(const [i,species] of ['bear','fox','wolf'].entries()){const a=wildlife.find(a=>a.species===species);a.position.set((i-1)*3,0,25)}updateWildlife(0);this.render()},
 render(){camera.position.set(5,3.5,35);camera.lookAt(0,1,25);renderer.render(scene,camera)}
};`;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/favicon')){res.writeHead(204).end();return}
 const source=fs.readFileSync(target,'utf8').replace('currentSamples=sampleWheels();loop();',instrumentation);
 res.writeHead(200,{'Content-Type':'text/html'}).end(source);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const page=await browser.newPage({viewport:{width:1100,height:850}});
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
await page.route('https://esm.sh/three@0.170.0',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/three.module.js',import.meta.url)),'utf8')}));
async function check(name,fn){const evidence=await fn();results.push({name,status:'passed',evidence});console.log('PASS '+name+' '+JSON.stringify(evidence))}
let code=0;
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__screamTest);
 await check('Wildlife includes bears, foxes and two wolf packs of 5–15 with instanced meshes',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;return{bears:t.wildlife.filter(a=>a.species==='bear').length,foxes:t.wildlife.filter(a=>a.species==='fox').length,packs:t.wolfPacks.map(p=>({size:p.count,actual:t.wildlife.filter(a=>a.pack===p).length})),batches:t.wildlifeBatches.length}});assert.equal(result.bears,3);assert.equal(result.foxes,5);assert.equal(result.packs.length,2);assert.ok(result.packs.every(p=>p.size>=5&&p.size<=15&&p.actual===p.size));assert.ok(result.batches<50);return result;
 });
 await page.evaluate(()=>__screamTest.animalsPreview());await page.screenshot({path:fileURLToPath(new URL('../reports/wildlife.png',import.meta.url))});
 await check('Bears chase nearby riders and a swipe causes damage and ragdoll once',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.reset();const a=t.wildlife.find(a=>a.species==='bear');a.position.set(0,0,40);t.updateWildlife(.1);const chase={mode:a.mode,z:a.position.z};a.position.set(0,0,26);t.updateWildlife(.016);const hit=t.state;t.updateWildlife(.016);return{chase,hit,again:t.state,cooldown:a.cooldown}});assert.equal(result.chase.mode,'chase');assert.ok(result.chase.z<40);assert.equal(result.hit.ragdoll,true);assert.ok(result.hit.damage>=20);assert.equal(result.hit.damage,result.again.damage);assert.ok(result.cooldown>5);return result;
 });
 await check('Foxes flee; wolves warn at a distance and attack only inside four meters',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.reset();const fox=t.wildlife.find(a=>a.species==='fox');fox.position.set(0,0,32);t.updateWildlife(.1);const flee={mode:fox.mode,z:fox.position.z};t.reset();const wolf=t.wildlife.find(a=>a.species==='wolf');wolf.position.set(0,0,37);t.updateWildlife(.1);const warning={mode:wolf.mode,...t.state};wolf.position.set(0,0,27);t.updateWildlife(.016);const close=t.state;const cooldown=wolf.pack.attackCooldown;t.riderReset();t.updateWildlife(.1);return{flee,warning,close,cooldown,protected:t.state}});assert.equal(result.flee.mode,'flee');assert.ok(result.flee.z>32);assert.equal(result.warning.mode,'warn');assert.equal(result.warning.damage,0);assert.equal(result.warning.ragdoll,false);assert.equal(result.close.ragdoll,true);assert.ok(result.close.damage>=12);assert.ok(result.cooldown>4);assert.equal(result.protected.damage,0);return result;
 });
 await check('Meteor is automatic, party is manual only, and every new effect clears on stop',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.reset();t.stopDisaster();t.disaster.automatic=true;const random=Math.random;Math.random=()=>.999;try{t.updateDisasters(600)}finally{Math.random=random}const automatic=t.disaster.type;const effects=[];for(const [type,key] of [['flood','floodWater'],['fire','firePatches'],['meteor','meteorHeads'],['party','confetti']]){t.startDisaster(type);t.updateDisasters(1);effects.push({type,active:t[key].visible});t.stopDisaster();effects.push({off:!t[key].visible})}return{pool:t.AUTOMATIC_EVENTS,automatic,effects}});assert.ok(result.pool.includes('meteor')&&!result.pool.includes('party'));assert.equal(result.automatic,'meteor');assert.ok(result.effects.every(e=>e.active===true||e.off===true));return result;
 });
 for(const type of ['fire','flood','meteor','party']){await page.evaluate(type=>__screamTest.preview(type),type);await page.screenshot({path:fileURLToPath(new URL('../reports/event-'+type+'.png',import.meta.url))})}
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/wildlife-events-results.json',import.meta.url)),JSON.stringify({scope:'Instanced wildlife AI/attack cooldowns and expanded event effects; live networking tested separately with simulated peers.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
