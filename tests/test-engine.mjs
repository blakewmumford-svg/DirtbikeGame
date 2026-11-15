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
 await page.locator('#lobby-start').click();await page.waitForFunction(()=>__screamTest.rideAudio.ctx?.state==='running');
 await page.locator('#music-volume').fill('0');await page.locator('#voice-volume').fill('0');
 await page.evaluate(()=>__screamTest.set({stage:'riding',grounded:true,speed:0,throttle:false}));await tick(30);
 const idle=await level();assert.ok(idle>.0005,'Idle must be audible');
 const graph=await page.evaluate(()=>{const a=__screamTest.rideAudio,d=a.engine.buffer.getChannelData(0);return{loop:a.engine.loop,duration:a.engine.buffer.duration,peak:Math.max(...d.slice(0,10000).map(Math.abs)),samples:d.length}});
 assert.equal(graph.loop,true);assert.ok(graph.duration>1&&graph.peak>.1&&graph.peak<1);
 await page.evaluate(()=>__screamTest.set({grounded:false,speed:80,throttle:true}));await tick(35);
 const rev=await state(),loud=await level();assert.ok(rev.rpm>7500&&loud>idle,'Free rev should build RPM and exhaust level');
 await page.evaluate(()=>__screamTest.set({throttle:false}));await tick(45);const released=await state();
 assert.ok(released.rpm<2200,'Airborne revs must drop on release even with high travel speed');
 await page.evaluate(()=>__screamTest.set({grounded:true,speed:8,throttle:true}));await tick(30);const gear=await state();assert.ok(gear.gear>1);
 await page.locator('#sound-volume').fill('0');await tick(35);const silent=await level();assert.ok(silent<.0001);
 await page.locator('#sound-volume').fill('80');await page.evaluate(()=>__screamTest.set({paused:true}));await tick(30);assert.ok(await level()<.0001);
 assert.deepEqual(errors,[]);console.log('PASS engine: audible idle, bounded combustion waveform, throttle/free-rev response, air release, gear shift, independent bike mute and pause',JSON.stringify({idle,loud,graph,rpm:rev.rpm,released:released.rpm,silent}));
}catch(e){code=1;console.error(e)}finally{await browser.close();server.close();process.exitCode=code}
