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
globalThis.__screamTest={ramps,scene,THREE,riderArms,riderLegs,upperBody,stuntPose,disaster,updateDisasters,startDisaster,stopDisaster,
 set({air=false,stage='riding',pause=false}={}){reset();showMenuStage(stage);grounded=!air;pos.y=air?30:.08;paused=pause},
 pose(){for(let i=0;i<60;i++)updateBikeVisuals(1/60,0)},
 drive(){const before=pos.clone();for(let i=0;i<90;i++){keys.KeyW=true;simulateSubstep(1/120);updateDisasters(1/120)}keys.KeyW=false;return pos.distanceTo(before)},
 renderRamp(){showMenuStage('riding');camera.position.set(20,14,-26);camera.lookAt(0,3,-55);renderer.render(scene,camera)}
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
 await check('All seven ramp decks face upward and are hit by rays from above',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;return t.ramps.map(r=>{const normal=r.deck.geometry.attributes.normal;let min=1;for(let i=0;i<normal.count;i++)min=Math.min(min,normal.getY(i));const ray=new t.THREE.Raycaster(new t.THREE.Vector3(r.x,r.height+10,r.z),new t.THREE.Vector3(0,-1,0));return{id:r.id,normal:min,hits:ray.intersectObject(r.deck).length}})});
  assert.equal(result.length,7);assert.ok(result.every(r=>r.normal>0&&r.hits>0));return result;
 });
 await page.evaluate(()=>__screamTest.renderRamp());await page.screenshot({path:fileURLToPath(new URL('../reports/solid-ramps.png',import.meta.url))});
 await check('Modifier keys pose distinct airborne tricks and return to neutral on landing',async()=>{
  const results=[];
  for(const [key,name] of [['Shift','No-hander'],['Control','Superman'],['Alt','Can-can']]){
   await page.evaluate(()=>__screamTest.set({air:true}));await page.keyboard.down(key);await page.evaluate(()=>__screamTest.pose());
   const pose=await page.evaluate(()=>{const t=__screamTest;return{name:t.stuntPose.name,amount:t.stuntPose.amount,hand:t.riderArms[0].glove.position.y,boot:t.riderLegs[0].boot.position.toArray(),torso:t.upperBody.rotation.x}});
   assert.equal(pose.name,name);assert.ok(pose.amount>.99);if(key==='Shift')assert.ok(pose.hand>2.8);if(key==='Control')assert.ok(pose.boot[2]>2&&pose.torso>1);if(key==='Alt')assert.ok(pose.boot[0]<-1);
   await page.evaluate(()=>{__screamTest.set();__screamTest.pose()});assert.equal(await page.evaluate(()=>__screamTest.stuntPose.amount),0);await page.keyboard.up(key);results.push(pose);
  }return results;
 });
 await check('Ctrl and Alt support quick taps without holding a browser modifier',async()=>{
  for(const key of ['Control','Alt']){await page.evaluate(()=>__screamTest.set({air:true}));await page.keyboard.press(key);await page.evaluate(()=>__screamTest.pose());assert.ok(await page.evaluate(()=>__screamTest.stuntPose.amount)>.99)}return{tap:true};
 });
 await check('Events start after ten minutes, last two minutes, and keep a ten-minute start cadence',async()=>{
  const result=await page.evaluate(()=>{
   const t=__screamTest;t.set();t.stopDisaster();t.disaster.automatic=true;t.updateDisasters(599);const before=t.disaster.type;t.updateDisasters(1);const started=t.disaster.type,remaining=t.disaster.remaining;t.updateDisasters(119);const still=t.disaster.type;t.updateDisasters(1);const ended=t.disaster.type,wait=t.disaster.untilNext;t.updateDisasters(479);const between=t.disaster.type;t.updateDisasters(1);return{before,started,remaining,still,ended,wait,between,next:t.disaster.type};
  });assert.equal(result.before,null);assert.ok(result.started&&result.still&&result.next);assert.equal(result.remaining,120);assert.equal(result.ended,null);assert.equal(result.wait,480);assert.equal(result.between,null);return result;
 });
 await check('Manual event controls work without waiting; pause/menu freeze timers and stop clears effects',async()=>{
  const results=await page.evaluate(()=>{
   const t=__screamTest,out=[];
   for(const type of ['storm','dust','quake']){t.set();t.startDisaster(type);t.updateDisasters(1);out.push({type:t.disaster.type,left:t.disaster.remaining,visible:t.disaster.root.visible});t.set({pause:true});t.updateDisasters(20);out.push({frozen:t.disaster.remaining});t.set({stage:'lobby'});t.updateDisasters(20);out.push({menu:t.disaster.remaining,visible:t.disaster.root.visible});t.stopDisaster();}
   t.set();document.querySelector('[data-tab="Debug"]').click();return out;
  });
  for(let i=0;i<results.length;i+=3){assert.equal(results[i].left,119);assert.equal(results[i].visible,true);assert.equal(results[i+1].frozen,119);assert.equal(results[i+2].menu,119);assert.equal(results[i+2].visible,false)}
  await page.getByRole('combobox',{name:'Disaster type',includeHidden:true}).selectOption('dust');await page.getByRole('button',{name:'Start now',exact:true,includeHidden:true}).evaluate(el=>el.click());assert.equal(await page.evaluate(()=>__screamTest.disaster.type),'dust');
  await page.getByRole('button',{name:'Stop event',exact:true,includeHidden:true}).evaluate(el=>el.click());assert.equal(await page.evaluate(()=>__screamTest.disaster.type),null);return results;
 });
 await check('The bike can still drive during each disaster',async()=>{
  const distances=await page.evaluate(()=>{const t=__screamTest;return ['storm','dust','quake'].map(type=>{t.set();t.startDisaster(type);const distance=t.drive();t.stopDisaster();return{type,distance}})});assert.ok(distances.every(x=>x.distance>1));return distances;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/events-tricks-results.json',import.meta.url)),JSON.stringify({scope:'Solid ramp surfaces, modifier tricks, and timed/manual non-destructive riding events.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
