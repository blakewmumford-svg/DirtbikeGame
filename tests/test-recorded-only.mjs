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
globalThis.__screamTest={rideAudio,RECORDED_REACTIONS,SCREAM_KEYS,popScreamBubble,updateRideAudio,popCrashBubble,popMoonPow,handleBikeCrash,makeRagdoll,beginSpaceFall,simulate,simulateSubstep,reset,toggleWheelie,showMenuStage,clearCrashEffects,stopRideSounds,speakCrash,
 head(){return ragdoll.nodes.head.p},
 set(s){
  if(s.speed!==undefined)speed=s.speed;
  if(s.grounded!==undefined)grounded=s.grounded;
  if(s.throttle!==undefined){keys.KeyW=s.throttle;controller.throttle=0}
  if(s.stage!==undefined)showMenuStage(s.stage);
  if(s.paused!==undefined)paused=s.paused;
  if(s.y!==undefined)pos.y=s.y;
  if(s.pitch!==undefined)pitch=s.pitch;
  if(s.vertical!==undefined)vertical=s.vertical;
 },
 get state(){const a=rideAudio;return{ctx:a.ctx?.state,voice:a.activeVoice?.text,key:a.activeVoice?.key,rate:a.activeVoice?.source.playbackRate.value,voiceEnd:a.voiceEnds,now:a.ctx?.currentTime,voiceDuration:a.activeVoice?.source.buffer.duration,gear:a.gear,rpm:a.rpm,throttle:a.throttle,enabled:a.enabled,stage:menuStage,paused,space:spaceFall.active,moonHit:spaceFall.hit,ragdoll:ragdoll.active,armed:wheelieArmed,grounded,speed,bubbles:bubbles.map(b=>({text:b.el.textContent,age:b.age,life:b.life}))}}
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
async function state(){return page.evaluate(()=>__screamTest.state)}
async function tick(frames=20){await page.evaluate(async n=>{for(let i=0;i<n;i++){__screamTest.updateRideAudio(1/60);await new Promise(r=>setTimeout(r,1000/60))}},frames)}
async function startCrash(){await page.evaluate(()=>{__screamTest.reset();__screamTest.set({stage:'riding',grounded:true,speed:10,throttle:false});__screamTest.handleBikeCrash(25,'Test rock');__screamTest.updateRideAudio(1/60)});await page.waitForTimeout(20)}
async function level(){return page.evaluate(async()=>{const a=__screamTest.rideAudio,b=new Float32Array(a.analyser.fftSize);let energy=0,n=0;for(let i=0;i<8;i++){a.analyser.getFloatTimeDomainData(b);for(const x of b){energy+=x*x;n++}await new Promise(r=>setTimeout(r,25))}return Math.sqrt(energy/n)})}
let code=0;
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__screamTest);
 await page.locator('#lobby-start').click();await page.waitForFunction(()=>__screamTest.rideAudio.ctx?.state==='running');
 await page.evaluate(async()=>{await __screamTest.rideAudio.voiceReady;__screamTest.set({stage:'riding'})});
 await check('Only seven user-provided recordings decode; generated clips are absent',async()=>{
  const clips=await page.evaluate(()=>Object.entries(__screamTest.RECORDED_REACTIONS).map(([key,meta])=>{const b=__screamTest.rideAudio.buffers.get(key),v=b.getChannelData(0);let energy=0,peak=0;for(const x of v){energy+=x*x;peak=Math.max(peak,Math.abs(x))}return{key,...meta,decodedDuration:b.duration,rms:Math.sqrt(energy/v.length),peak}}));
  assert.equal(clips.length,7);assert.ok(clips.every(c=>Math.abs(c.duration-c.decodedDuration)<.01&&c.rms>.04&&c.peak<.8&&c.duration<9.1));assert.deepEqual(await page.evaluate(()=>[...__screamTest.rideAudio.buffers.keys()].sort()),clips.map(c=>c.key).sort());return clips;
 });
 await check('Each recording has the correct bubble and natural-speed playback; chatter cannot interrupt',async()=>{
  const keys=await page.evaluate(()=>Object.keys(__screamTest.RECORDED_REACTIONS)),evidence=[];
  for(const key of keys){
   const r=await page.evaluate(async key=>{const t=__screamTest;t.reset();t.set({stage:'riding'});const b=t.popScreamBubble(t.head(),false,key);await Promise.resolve();const before=t.state;const source=t.rideAudio.activeVoice.source;t.popCrashBubble(t.head());await t.speakCrash('Ow!');return{meta:t.RECORDED_REACTIONS[key],before,after:t.state,sameSource:source===t.rideAudio.activeVoice.source}},key);
   assert.equal(r.before.voice,r.meta.text);assert.equal(r.before.key,key);assert.equal(r.before.rate,1);assert.equal(r.before.bubbles[0].text,r.meta.text);assert.ok(Math.abs(r.before.bubbles[0].life-r.before.voiceDuration)<.001);assert.ok(r.sameSource);assert.equal(r.after.bubbles.length,1);evidence.push(r.before);
  }return evidence;
 });
 await check('Real hard-crash hook rotates the new screams and retains the earlier seven-second scream',async()=>{
  const seen=[];for(let i=0,n=await page.evaluate(()=>__screamTest.SCREAM_KEYS.length);i<n;i++){await startCrash();seen.push(await state())}
  assert.deepEqual(seen.map(s=>s.key),await page.evaluate(()=>__screamTest.SCREAM_KEYS));assert.ok(seen.some(s=>s.key==='AAAAAH!'&&s.voiceDuration===7));return seen;
 });
 await check('Regular collision bubbles use only the recorded reactions',async()=>{
  const s=await page.evaluate(async()=>{const t=__screamTest;t.reset();t.set({stage:'riding'});t.popCrashBubble(t.head());await Promise.resolve();return t.state});assert.equal(s.key,'recorded_peter_ow');assert.equal(s.voice,'Ow!');assert.ok(s.voiceDuration<.6);return s;
 });
 await check('Full Mickey scream stays active beyond the old trim and finishes naturally',async()=>{
  await page.evaluate(()=>{const t=__screamTest;t.reset();t.set({stage:'riding'});t.popScreamBubble(t.head(),false,'recorded_wallace')});
  await page.waitForTimeout(1200);const playing=await state();assert.equal(playing.key,'recorded_wallace');assert.ok(playing.voiceDuration>8.9);assert.ok(playing.bubbles[0].life>8.9);await page.waitForFunction(()=>!__screamTest.rideAudio.activeVoice,null,{timeout:30000});const s=await state();assert.equal(s.voice,undefined);return s;
 });
 await check('Reset cancels the uploaded reaction and removes its bubble',async()=>{
  const s=await page.evaluate(()=>{const t=__screamTest;t.popScreamBubble(t.head(),false,'recorded_woody');t.reset();return t.state});assert.equal(s.voice,undefined);assert.equal(s.bubbles.length,0);return s;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/recorded-only-results.json',import.meta.url)),JSON.stringify({scope:'Real browser WebAudio buffers and game reaction hooks; test-only controlled game state.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
