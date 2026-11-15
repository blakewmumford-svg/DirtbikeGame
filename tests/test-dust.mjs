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
globalThis.__screamTest={rideAudio,updateTireDust,clearTireDust,tireDust,tireChips,updateRideAudio,popCrashBubble,popMoonPow,handleBikeCrash,makeRagdoll,beginSpaceFall,simulate,simulateSubstep,reset,toggleWheelie,showMenuStage,clearCrashEffects,stopRideSounds,speakCrash,
 head(){return ragdoll.nodes.head.p},contacts(){currentSamples=sampleWheels()},rearOff(){currentSamples[1].contact=false},
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
 await check('Grounded rear wheel emits pooled dust and dirt behind the bike',async()=>{const s=await page.evaluate(()=>{const t=__screamTest;t.reset();t.set({stage:'riding',speed:8,grounded:true,throttle:true});t.contacts();for(let i=0;i<45;i++)t.updateTireDust(1/60);return{dust:t.tireDust.filter(p=>p.obj.visible).length,chips:t.tireChips.filter(p=>p.obj.visible).length,behind:t.tireDust.filter(p=>p.obj.visible).every(p=>p.obj.position.z>26)}});assert.ok(s.dust>0&&s.chips>0&&s.behind);return s});
 await check('Stationary, airborne and rear-tire-off-ground states do not emit',async()=>{const values=await page.evaluate(()=>{const t=__screamTest;const out=[];for(const kind of ['stopped','air','rearOff']){t.reset();t.set({stage:'riding',speed:kind==='stopped'?0:8,grounded:kind!=='air',throttle:true});t.contacts();if(kind==='rearOff')t.rearOff();for(let i=0;i<90;i++)t.updateTireDust(1/60);out.push({kind,count:[...t.tireDust,...t.tireChips].filter(p=>p.obj.visible).length})}return out});assert.ok(values.every(v=>v.count===0));return values});
 await check('Menus and reset clear the trail; particle counts stay bounded',async()=>{const s=await page.evaluate(()=>{const t=__screamTest;t.reset();t.set({stage:'riding',speed:20,grounded:true,throttle:true});t.contacts();for(let i=0;i<1000;i++)t.updateTireDust(1/120);const total=t.tireDust.length+t.tireChips.length;t.set({stage:'lobby'});const menu=[...t.tireDust,...t.tireChips].some(p=>p.obj.visible);t.reset();return{total,menu,reset:[...t.tireDust,...t.tireChips].some(p=>p.obj.visible)}});assert.equal(s.total,58);assert.equal(s.menu,false);assert.equal(s.reset,false);return s});assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/dust-results.json',import.meta.url)),JSON.stringify({scope:'Browser rear-tire particle behavior with controlled contact states; visual-only effect.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
