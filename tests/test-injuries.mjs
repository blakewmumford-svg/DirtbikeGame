import {fileURLToPath} from 'node:url';
import {browserOptions} from './browser-options.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';

const target=fileURLToPath(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url));
const results=[],errors=[];
const instrumentation=`
currentSamples=sampleWheels();renderer.render=()=>{};
globalThis.__screamTest={
 crash(severity=28){reset();paused=false;showMenuStage('riding');makeRagdoll(severity)},
 hit(part,velocity){const j=ragdoll.nodes[part],dt=1/120;j.p.set(0,.03,25);j.old.copy(j.p);j.old.y+=velocity*dt;collideRagdollJoint(j,part,dt,true)},
 repair:repairHere,reset,menu(){showMenuStage('lobby');syncBoneCounter()},resume(){showMenuStage('riding');syncBoneCounter()},
 get state(){return{bones:brokenBones.size,text:boneCounter.textContent,hidden:boneCounter.hidden,ragdoll:ragdoll.active}}
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
 await check('Ragdoll immediately shows a per-crash bone count outside the collapsed Info HUD',async()=>{
  await page.evaluate(()=>__screamTest.crash());const r=await page.evaluate(()=>__screamTest.state);assert.ok(r.ragdoll&&r.bones>0&&!r.hidden);assert.equal(r.text,'🦴 Bones broken: '+r.bones);assert.ok(await page.locator('#bone-counter').isVisible());assert.equal(await page.locator('#bone-counter').evaluate(el=>getComputedStyle(el).pointerEvents),'none');return r;
 });
 await check('Hard body contacts add bones, soft contacts do not, and the same bones cannot count twice',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.crash();const start=t.state.bones;t.hit('lKnee',12);const hard=t.state.bones;t.hit('lKnee',12);const duplicate=t.state.bones;t.hit('rHand',2);const soft=t.state.bones;t.hit('rHand',24);return{start,hard,duplicate,soft,another:t.state.bones}});assert.ok(r.hard>r.start);assert.equal(r.duplicate,r.hard);assert.equal(r.soft,r.hard);assert.ok(r.another>r.hard);return r;
 });
 await check('More severe crashes break more bones; recovery and new crashes reset the count',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.crash(12);const low=t.state.bones;t.crash(48);const high=t.state.bones;t.repair();const repair=t.state;t.crash();t.reset();const reset=t.state;t.crash(12);return{low,high,repair,reset,next:t.state.bones}});assert.ok(r.high>r.low);assert.ok(r.repair.hidden&&r.repair.bones===0&&!r.repair.ragdoll);assert.ok(r.reset.hidden&&r.reset.bones===0);assert.equal(r.next,r.low);return r;
 });
 await check('Menus hide the counter without losing the crash summary; mobile counter fits clear of top controls',async()=>{
  await page.evaluate(()=>{__screamTest.crash();__screamTest.menu()});assert.equal(await page.locator('#bone-counter').isVisible(),false);await page.evaluate(()=>__screamTest.resume());assert.equal(await page.locator('#bone-counter').isVisible(),true);
  const sizes=[];for(const size of [{width:390,height:844},{width:320,height:480},{width:844,height:390}]){await page.setViewportSize(size);const r=await page.locator('#bone-counter').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=size.width&&r.y+r.height<=size.height);sizes.push({size,rect:r})}await page.screenshot({path:fileURLToPath(new URL('../reports/broken-bones-counter.png',import.meta.url))});return sizes;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/injuries-results.json',import.meta.url)),JSON.stringify({scope:'Per-crash bone score from actual ragdoll contacts, unique bone counting, recovery cleanup, and visible responsive counter.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
