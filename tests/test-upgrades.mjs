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
globalThis.__screamTest={wildlife,wolfPacks,WILDLIFE_SCALE,updateWildlife,disaster,startDisaster,stopDisaster,applyTornadoForces,simulateSubstep,rideAudio,PARTY_TRACK,updateRideMusic,updateRideAudio,
 set(v=0,x=0,z=25){reset();showMenuStage('riding');stopDisaster();for(const k of Object.keys(keys))keys[k]=false;controller.throttle=0;controller.boost=false;speed=v;pos.set(x,.08,z);wildlifeLastBikePosition.copy(pos);for(const a of wildlife){a.position.copy(a.home);a.flight=null;a.cooldown=0;a.chaseUntil=0}for(const p of wolfPacks){p.callTimer=0;p.attackCooldown=0}},
 get state(){return{speed,gas:throttleInput(),boost:boostInput(),damage,bend:bikeBend,ragdoll:ragdoll.active,debris:debris.length,pos:pos.toArray(),vertical,lateral:lateralSpeed,grounded}},
 driveWildlife(n=45){for(let i=0;i<n;i++){simulateSubstep(1/120);updateWildlife(1/120)}},
 pause(){paused=true},
 step(n=60){for(let i=0;i<n;i++)simulateSubstep(1/120)},
 visual(){document.getElementById('tuner').classList.add('collapsed');bike.position.copy(pos);bike.rotation.set(pitch,yaw,0,'YXZ');camera.position.set(16,10,44);camera.lookAt(0,3,25);renderer.render(scene,camera)}
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
 await check('Backspace alone boosts and accelerates; Shift is no longer ground boost',async()=>{
  await page.evaluate(()=>{__screamTest.set();window.backspacePrevented=false;addEventListener('keydown',e=>{if(e.code==='Backspace')window.backspacePrevented=e.defaultPrevented})});
  await page.keyboard.down('Backspace');const before=await page.evaluate(()=>__screamTest.state);assert.equal(before.gas,1);assert.equal(before.boost,true);await page.evaluate(()=>__screamTest.step());await page.keyboard.up('Backspace');const after=await page.evaluate(()=>__screamTest.state);assert.ok(after.speed>8);assert.equal(await page.evaluate(()=>window.backspacePrevented),true);
  await page.evaluate(()=>__screamTest.set());await page.keyboard.down('Shift');assert.equal(await page.evaluate(()=>__screamTest.state.boost),false);await page.keyboard.up('Shift');return{before,after};
 });
 await check('Animals are larger with moderate population increase and wolves chase on close approach',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.set();const wolf=t.wildlife.find(a=>a.species==='wolf');wolf.position.set(0,0,55);t.updateWildlife(.1);const call=wolf.pack.lastCall;wolf.position.set(0,0,33);t.updateWildlife(.1);return{call,scale:t.WILDLIFE_SCALE,bears:t.wildlife.filter(a=>a.species==='bear').length,foxes:t.wildlife.filter(a=>a.species==='fox').length,packs:t.wolfPacks.map(p=>p.count),mode:wolf.mode,z:wolf.position.z}});assert.equal(result.scale.bear,1.15*4);assert.ok(result.scale.wolf>.85*1.5);assert.equal(result.bears,4);assert.equal(result.foxes,7);assert.ok(result.packs.every(n=>n>=5&&n<=15));assert.equal(result.call,'howl');assert.equal(result.mode,'chase');assert.ok(result.z<33);return result;
 });
 await page.evaluate(()=>{const t=__screamTest;t.set();for(const [species,x,z] of [['bear',-8,17],['wolf',1,19],['fox',5,21]]){const a=t.wildlife.find(a=>a.species===species);a.position.set(x,0,z)}t.updateWildlife(0);document.getElementById('tuner').style.visibility='hidden';t.visual()});
 await page.screenshot({path:fileURLToPath(new URL('../reports/larger-wildlife.png',import.meta.url))});await page.evaluate(()=>{document.getElementById('tuner').style.visibility=''});
 await check('Fast collisions fling every animal species, eject the rider and wreck the bike; flight is bounded',async()=>{
  const result=await page.evaluate(()=>{
   const t=__screamTest,out=[];
   for(const species of ['bear','fox','wolf']){t.set(38);const a=t.wildlife.find(a=>a.species===species);a.position.set(0,0,26);t.updateWildlife(.016);const hit={species,...t.state,launched:!!a.flight,up:a.flight?.velocity.y};const y=a.position.y,angle=a.flight?.limbs[0].angle;t.updateWildlife(.5);hit.rise=a.position.y-y;hit.limbsMove=a.flight?.limbs[0].angle!==angle;t.updateWildlife(12);hit.recovered=a.flight===null;out.push(hit)}return out;
  });assert.ok(result.every(s=>s.launched&&s.ragdoll&&s.damage>=80&&s.bend>=.85&&s.debris>=3&&s.up>20&&s.rise>4&&s.limbsMove&&s.recovered));return result;
 });
 await check('A fast approaching bike reaches the collision before an animal can swipe or bite',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;return ['bear','wolf'].map(species=>{t.set(38);const a=t.wildlife.find(a=>a.species===species);a.position.set(0,0,15);t.driveWildlife();return{species,launched:!!a.flight,rider:t.state.ragdoll}})});assert.ok(result.every(x=>x.launched&&x.rider));return result;
 });
 await check('Visible disaster test buttons include volcano/tornado and party remains manual',async()=>{
  await page.evaluate(()=>__screamTest.set());await page.keyboard.press('Enter');
  const buttons=await page.locator('[data-disaster-type]').allTextContents();assert.equal(buttons.length,9);assert.ok(buttons.includes('Volcano')&&buttons.includes('Tornado')&&buttons.includes('Party mode'));
  await page.screenshot({path:fileURLToPath(new URL('../reports/disaster-buttons.png',import.meta.url))});await page.getByRole('button',{name:'Volcano',exact:true}).click();assert.equal(await page.evaluate(()=>__screamTest.disaster.type),'volcano');await page.getByRole('button',{name:'Stop event',exact:true}).click();return buttons;
 });
 await check('Tornado lifts and swirls a nearby bike, and stopping removes the force',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.set(0,12,-15);t.startDisaster('tornado');t.step(120);const inStorm=t.state;t.stopDisaster();const before=t.state;t.applyTornadoForces(.5);return{inStorm,before,after:t.state}});assert.ok(result.inStorm.pos[1]>1&&!result.inStorm.grounded);assert.ok(Math.abs(result.inStorm.lateral)>1);assert.deepEqual(result.before,result.after);return result.inStorm;
 });
 await check('Party music is a full original song and follows music volume/pause',async()=>{
  await page.evaluate(()=>__screamTest.set());
  await page.locator('#sound-toggle').dispatchEvent('pointerdown');await page.keyboard.press('w');await page.waitForFunction(()=>__screamTest.rideAudio.ctx?.state==='running');
  const result=await page.evaluate(async()=>{const t=__screamTest,a=t.rideAudio;await a.musicReady;t.startDisaster('party');for(let i=0;i<35;i++){t.updateRideAudio(1/60);await new Promise(r=>setTimeout(r,16))}const party=a.partyGain.gain.value,b=a.partySource.buffer.getChannelData(0);let sum=0;for(const x of b)sum+=x*x;const duration=a.partySource.buffer.duration;a.musicVolume=0;for(let i=0;i<35;i++){t.updateRideAudio(1/60);await new Promise(r=>setTimeout(r,16))}const muted=a.partyGain.gain.value,mutedSource=a.partySource===null;a.musicVolume=.4;for(let i=0;i<35;i++){t.updateRideAudio(1/60);await new Promise(r=>setTimeout(r,16))}t.pause();for(let i=0;i<35;i++){t.updateRideAudio(1/60);await new Promise(r=>setTimeout(r,16))}return{party,rms:Math.sqrt(sum/b.length),duration,muted,paused:a.partyGain.gain.value,mutedSource,pausedSource:a.partySource===null};});assert.ok(result.party>.1&&result.rms>.01);assert.ok(Math.abs(result.duration-120)<.1);assert.ok(result.mutedSource&&result.pausedSource,JSON.stringify(result));return result;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/upgrades-results.json',import.meta.url)),JSON.stringify({scope:'Backspace boost, larger wildlife/chases/flight crashes, disaster buttons, tornado physics and original party-loop audio.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
