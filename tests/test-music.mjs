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
globalThis.__screamTest={rideAudio,updateRideAudio,popCrashBubble,popMoonPow,handleBikeCrash,makeRagdoll,beginSpaceFall,simulate,simulateSubstep,reset,toggleWheelie,showMenuStage,clearCrashEffects,stopRideSounds,speakCrash,
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
 get state(){const a=rideAudio;return{ctx:a.ctx?.state,voice:a.activeVoice?.text,rate:a.activeVoice?.source.playbackRate.value,voiceEnd:a.voiceEnds,now:a.ctx?.currentTime,voiceDuration:a.activeVoice?.source.buffer.duration,gear:a.gear,rpm:a.rpm,throttle:a.throttle,enabled:a.enabled,stage:menuStage,paused,space:spaceFall.active,moonHit:spaceFall.hit,ragdoll:ragdoll.active,armed:wheelieArmed,grounded,speed,bubbles:bubbles.map(b=>({text:b.el.textContent,age:b.age,life:b.life}))}}
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
 await check('Music waits for user interaction, then plays only menu loop',async()=>{
  assert.equal(await page.evaluate(()=>__screamTest.rideAudio.ctx),null);await page.locator('#lobby-start').click();
  await page.evaluate(async()=>{await __screamTest.rideAudio.musicReady});await tick(30);
  const s=await page.evaluate(()=>{const a=__screamTest.rideAudio;return{menu:a.musicMenuGain.gain.value,ride:a.musicRideGain.gain.value,sources:a.musicSources.length,tracks:[...a.musicBuffers].map(([name,b])=>({name,duration:b.duration,nonzero:b.getChannelData(0).some(x=>Math.abs(x)>.05)})),engine:a.engineGain.gain.value}});
  assert.ok(s.menu>.1&&s.ride<.001&&s.engine<.001);assert.equal(s.sources,2);assert.ok(s.tracks.every(t=>t.nonzero));assert.ok((await level())>.005);return s;
 });
 await check('Riding switches off menu tune and plays full DnB loop',async()=>{
  await page.evaluate(()=>__screamTest.set({stage:'riding',throttle:false}));await tick(30);
  const s=await page.evaluate(()=>{const a=__screamTest.rideAudio;return{menu:a.musicMenuGain.gain.value,ride:a.musicRideGain.gain.value}});assert.ok(s.menu<.001&&s.ride>.2);return s;
 });
 await check('Music volume is independent, saved, and can silence music',async()=>{
  const before=await page.evaluate(()=>({bike:__screamTest.rideAudio.bikeVolume,voice:__screamTest.rideAudio.voiceVolume}));await page.locator('#music-volume').fill('0');await tick(30);
  const s=await page.evaluate(()=>{const a=__screamTest.rideAudio;return{music:a.musicRideGain.gain.value,bike:a.bikeVolume,voice:a.voiceVolume,saved:JSON.parse(localStorage.getItem('dirtbike_sound_v1'))}});assert.ok(s.music<.001);assert.equal(s.bike,before.bike);assert.equal(s.voice,before.voice);assert.equal(s.saved.musicVolume,0);
  await page.locator('#music-volume').fill('70');await tick(30);assert.ok(await page.evaluate(()=>__screamTest.rideAudio.musicRideGain.gain.value>.6));return s;
 });
 await check('Pause, background, and global mute silence the music',async()=>{
  await page.evaluate(()=>__screamTest.set({paused:true}));await tick(30);assert.ok((await level())<.0001);
  await page.evaluate(()=>{__screamTest.set({paused:false});Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await tick(30);assert.ok((await level())<.0001);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await tick(30);await page.locator('#sound-toggle').click();await tick(30);assert.ok((await level())<.0001);await page.locator('#sound-toggle').click();await tick(30);assert.ok((await level())>.005);return{passed:true};
 });
 await check('Returning to menu restores light tune without creating extra sources; controls fit mobile',async()=>{
  await page.evaluate(()=>__screamTest.set({stage:'lobby'}));await tick(30);const s=await page.evaluate(()=>{const a=__screamTest.rideAudio;return{menu:a.musicMenuGain.gain.value,ride:a.musicRideGain.gain.value,sources:a.musicSources.length}});assert.ok(s.menu>.1&&s.ride<.001);assert.equal(s.sources,2);
  await page.setViewportSize({width:390,height:844});await page.locator('#music-volume').scrollIntoViewIfNeeded();assert.ok(await page.locator('#music-volume').isVisible());
  const rect=await page.locator('#sound-controls').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=391);await page.screenshot({path:fileURLToPath(new URL('../reports/mobile-controls.png',import.meta.url))});return{...s,rect};
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/music-results.json',import.meta.url)),JSON.stringify({scope:'Actual WebAudio music buffers, output analyser and menu/riding transitions.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
