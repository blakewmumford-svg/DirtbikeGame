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
globalThis.__screamTest={riderLegs,stuntPose,
 set(air=false,v=0){reset();showMenuStage('riding');grounded=!air;speed=v;pos.y=air?30:.08;for(const k of Object.keys(keys))keys[k]=false;controller.boost=false},
 pose(n=60){for(let i=0;i<n;i++)updateBikeVisuals(1/60,0)},
 wheelie(v=8){this.set();pitch=.55;pitchVelocity=0;speed=v;keys.KeyW=true;grounded=true;wheelieArmed=true;pos.y=heightAt(pos.x,pos.z)+WHEEL_RADIUS-WHEEL_Y*Math.cos(pitch)+WHEEL_Z[1]*Math.sin(pitch)-.02;currentSamples=sampleWheels()},
 step(n){for(let i=0;i<n;i++)simulateSubstep(1/120)},
 get state(){return{bank:turnLeanAngle,target:turnLeanTarget,yaw,pitch,grounded,armed:wheelieArmed,ragdoll:ragdoll.active,frameBank:frame.rotation.z}},
 render(){bike.position.copy(pos);bike.rotation.set(pitch,yaw,0,'YXZ');camera.position.set(5,2.8,25);camera.lookAt(0,1.5,25);document.getElementById('tuner').style.visibility='hidden';renderer.render(scene,camera)}
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
 await check('Knees bend toward the front while riding, stopped and reverse walking',async()=>{
  const samples=await page.evaluate(()=>{const t=__screamTest,out=[];for(const v of [8,0,-1.2]){t.set(false,v);t.pose();for(let i=0;i<8;i++){t.pose(10);out.push({v,legs:t.riderLegs.map(l=>({hip:l.hip.toArray(),knee:l.knee.toArray(),foot:l.foot.toArray()}))})}}return out});
  assert.ok(samples.every(s=>s.legs.every(l=>l.knee[2]<Math.min(l.hip[2],l.foot[2]))));return{poses:samples.length};
 });
 await page.evaluate(()=>{__screamTest.set(false,-1.2);__screamTest.pose();__screamTest.render()});await page.screenshot({path:fileURLToPath(new URL('../reports/forward-knees.png',import.meta.url))});
 await check('Shift, Ctrl and Alt latch on a tap and end on the next tap, not on key release',async()=>{
  const results=[];
  for(const [key,name] of [['Shift','No-hander'],['Control','Superman'],['Alt','Can-can']]){
   await page.evaluate(()=>__screamTest.set(true));await page.keyboard.press(key);await page.evaluate(()=>__screamTest.pose(180));const on=await page.evaluate(()=>({...__screamTest.stuntPose}));assert.equal(on.name,name);assert.equal(on.latched,name);assert.ok(on.amount>.99);
   await page.keyboard.press(key);await page.evaluate(()=>__screamTest.pose());const off=await page.evaluate(()=>({...__screamTest.stuntPose}));assert.ok(off.amount<.001&&!off.latched);results.push({key,on:on.name,off:off.amount});
  }return results;
 });
 await check('Key repeat does not cancel a trick; landing clears the toggle',async()=>{
  await page.evaluate(()=>__screamTest.set(true));await page.keyboard.down('Alt');await page.keyboard.down('Alt');await page.evaluate(()=>__screamTest.pose());assert.equal(await page.evaluate(()=>__screamTest.stuntPose.latched),'Can-can');await page.keyboard.up('Alt');await page.evaluate(()=>{__screamTest.set();__screamTest.pose()});assert.equal(await page.evaluate(()=>__screamTest.stuntPose.latched),'');return{repeatSafe:true,landingClears:true};
 });
 await check('Wheelie turns bank the entire bike and combine responsive steering with lean with a bounded angle',async()=>{
  const results=[];
  for(const [key,sign] of [['a',1],['d',-1]]){
   await page.evaluate(()=>__screamTest.wheelie());await page.keyboard.down(key);await page.evaluate(()=>__screamTest.step(1));const first=await page.evaluate(()=>__screamTest.state);assert.ok(first.yaw*sign>.001);
   await page.evaluate(()=>__screamTest.step(35));const turning=await page.evaluate(()=>__screamTest.state);await page.keyboard.up(key);assert.ok(turning.bank*sign>.15);assert.ok(turning.yaw*sign>.18);assert.ok(Math.abs(turning.bank)<.43);assert.equal(turning.frameBank,turning.bank);assert.equal(turning.ragdoll,false);results.push({key,first,turning});
  }return results;
 });
 await check('Low-speed wheelies steer more tightly than fast wheelies in both directions',async()=>{
  const result=[];
  for(const key of ['a','d'])for(const v of [2,8,18]){await page.evaluate(v=>__screamTest.wheelie(v),v);await page.keyboard.down(key);await page.evaluate(()=>__screamTest.step(1));const state=await page.evaluate(()=>__screamTest.state);await page.keyboard.up(key);result.push({key,v,...state})}
  for(const key of ['a','d']){const states=result.filter(s=>s.key===key);assert.ok(Math.abs(states[0].yaw)>Math.abs(states[1].yaw));assert.ok(Math.abs(states[1].yaw)>Math.abs(states[2].yaw));assert.ok(states.every(s=>s.armed&&!s.ragdoll))}return result;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/riding-controls-results.json',import.meta.url)),JSON.stringify({scope:'Anatomical knee direction, keyboard trick toggles, and bank-driven wheelie turning.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
