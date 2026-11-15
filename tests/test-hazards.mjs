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
globalThis.__screamTest={eventRocks,impactRings,volcanoSmoke,splashDrops,waterRipples,splashMesh,tornadoRoot,tornadoRide,firePatches,disaster,startDisaster,stopDisaster,receiveDisaster,disasterSnapshot,updateWorldEvents,updateEventHazards,applyTornadoForces,updateLightning,lightningRoot,lightningWarning,lightningBolt,stormTracks,
 set(type){reset();showMenuStage('riding');for(const k of Object.keys(keys))keys[k]=false;startDisaster(type)},
 place(x,y,z,v=0){pos.set(x,y,z);speed=v;hazardLastBike.copy(pos)},
 at(time){disaster.time=time;updateWorldEvents(true)},
 sweepRock(){const r=eventRocks[0];pos.set(r.p.x-8,r.p.y-1,r.p.z);hazardLastBike.copy(pos);pos.x+=16;speed=40;updateEventHazards(1/60)},
 frame(dt){simulateSubstep(dt);disaster.time+=dt;updateWorldEvents(true);updateEventHazards(dt)},
 get state(){return{pos:pos.toArray(),speed,vertical,lateralSpeed,damage,ragdoll:ragdoll.active,shake:eventImpactShake,captured:tornadoRide.captured,turns:tornadoRide.turns,cooldown:tornadoRide.cooldown}},
 lightningPreview(time){this.set('storm');this.place(0,.08,25);disaster.lightning={eventId:disaster.id,seq:1,x:0,y:0,z:25,at:2};this.at(time);bike.position.copy(pos);camera.position.set(28,32,65);camera.lookAt(0,30,25);renderer.render(scene,camera)},
 render(){bike.position.copy(pos);bike.rotation.set(pitch,yaw,0,'YXZ');camera.position.copy(pos).add(new THREE.Vector3(14,12,22));camera.lookAt(pos.x,pos.y+2,pos.z);renderer.render(scene,camera)}
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
 await check('Lightning increasingly targets stationary riders and warns before striking',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;function sample(moving){let targeted=0,total=0;for(let trial=1;trial<=40;trial++){t.set('storm');t.disaster.id=trial;t.place(0,.08,25);t.at(0);for(let time=1;time<=100;time++){if(moving)t.place(Math.sin(time*.5)*80,.08,25+Math.cos(time*.5)*80);t.at(time);if(time%5===0&&time>=20){const b=t.disaster.lightning;total++;if(Math.hypot(b.x-t.state.pos[0],b.z-t.state.pos[2])<.01)targeted++}}}return{targeted,total,rate:targeted/total}}return{still:sample(false),moving:sample(true)}});assert.ok(r.still.rate>.8&&r.moving.rate<.3&&r.still.rate>r.moving.rate*3);return r;
 });
 await check('Lightning warning precedes damage; a strike ejects once, while riding away dodges it',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;function setup(){t.set('storm');t.place(0,.08,25);t.disaster.lightning={eventId:t.disaster.id,seq:1,x:0,y:0,z:25,at:2};t.at(1);t.updateEventHazards(.016)}setup();const warning={visible:t.lightningWarning.visible,bolt:t.lightningBolt.visible,...t.state};t.at(2.1);t.updateEventHazards(.016);const hit={visible:t.lightningBolt.visible,...t.state};t.updateEventHazards(.016);const again=t.state;setup();t.place(15,.08,25);t.at(2.1);t.updateEventHazards(.016);const dodged=t.state;t.stopDisaster();return{warning,hit,again,dodged,stopped:t.lightningRoot.visible}});assert.ok(r.warning.visible&&!r.warning.bolt&&!r.warning.ragdoll&&r.warning.damage===0);assert.ok(r.hit.visible&&r.hit.ragdoll&&r.hit.damage===50&&r.hit.vertical>=9);assert.equal(r.again.damage,r.hit.damage);assert.equal(r.dodged.damage,0);assert.equal(r.dodged.ragdoll,false);assert.equal(r.stopped,false);return r;
 });
 await check('Lightning snapshots retain strikes and reject malformed targets',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('storm');const bolt={eventId:t.disaster.id,seq:1,x:10,y:0,z:25,at:8};t.disaster.lightning=bolt;const snap=t.disasterSnapshot();t.stopDisaster();t.receiveDisaster(snap);const restored=t.disaster.lightning;t.receiveDisaster({...snap,lightning:{...bolt,x:Infinity}});return{bolt,restored,invalid:t.disaster.lightning}});assert.deepEqual(r.bolt,r.restored);assert.equal(r.invalid,null);return r;
 });
 await check('Flood produces bounded tire spray and expanding water marks only in shallow water',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('flood');t.place(0,.08,25,12);t.at(2);for(let i=0;i<50;i++)t.updateEventHazards(1/120);const wet={drops:t.splashDrops.filter(p=>p.life>0).length,ripples:t.waterRipples.filter(p=>p.obj.visible).length,visible:t.splashMesh.visible};t.place(0,20,25,12);for(let i=0;i<120;i++)t.updateEventHazards(1/120);const dry=t.splashDrops.filter(p=>p.life>0).length;t.stopDisaster();return{wet,dry,stopped:t.splashMesh.visible}});assert.ok(r.wet.drops>5&&r.wet.drops<=64&&r.wet.ripples>0&&r.wet.visible);assert.equal(r.dry,0);assert.equal(r.stopped,false);return r;
 });
 await check('Tornado roams, carries riders around twice and throws them clear with a recapture cooldown',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('tornado');t.place(12,.08,-15);t.at(0);const start=t.tornadoRoot.position.toArray();let released=null,maxHeight=0;for(let i=0;i<900;i++){t.frame(1/120);maxHeight=Math.max(maxHeight,t.state.pos[1]);if(t.state.cooldown>0){released=t.state;break}}const end=t.tornadoRoot.position.toArray();return{start,end,released,maxHeight}});assert.ok(Math.hypot(r.end[0]-r.start[0],r.end[2]-r.start[2])>20);assert.ok(r.released&&r.released.turns>=Math.PI*4&&r.released.vertical>20&&r.released.cooldown>9);assert.ok(Math.hypot(r.released.speed,r.released.lateralSpeed)>40&&r.maxHeight>15);return r;
 });
 await check('Meteor strikes reach terrain, shake globally, stay solid, and reconstruct from shared snapshots',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('meteor');t.place(400,.08,0);t.at(3.21);const rock=t.eventRocks[0],p=rock.p.toArray(),land={landed:rock.landed,visible:rock.obj.visible,ring:t.impactRings[0].visible,shake:t.state.shake};const snap=t.disasterSnapshot();t.receiveDisaster({...snap,id:snap.id+1});t.at(3.21);const changed=t.eventRocks[0].p.toArray();t.receiveDisaster(snap);t.at(3.21);const restored=t.eventRocks[0].p.toArray();t.place(p[0],p[1]-.5,p[2]+.1,20);t.updateEventHazards(1/60);const hit=t.state;t.stopDisaster();return{p,land,changed,restored,hit,cleared:t.eventRocks.every(r=>!r.active&&!r.obj.visible)}});assert.ok(r.land.landed&&r.land.visible&&r.land.ring&&r.land.shake>.9);assert.deepEqual(r.p,r.restored);assert.notDeepEqual(r.changed,r.p);assert.ok(r.hit.ragdoll&&r.hit.damage>0);assert.ok(r.cleared);return r;
 });
 await check('Airborne meteors directly hit riders and landed rocks crash later approaches',async()=>{
  const out=[];
  for(const time of [2,8])out.push(await page.evaluate(time=>{const t=__screamTest;t.set('meteor');t.at(time);const rock=t.eventRocks[0];t.place(rock.p.x,rock.p.y-1,rock.p.z,25);t.updateEventHazards(.016);return{time,landed:rock.landed,...t.state}},time));
  out.push(await page.evaluate(()=>{const t=__screamTest;t.set('meteor');t.at(8);t.sweepRock();return{swept:true,...t.state}}));
  assert.ok(out.every(s=>s.ragdoll&&s.damage>=28));assert.equal(out[0].landed,false);assert.equal(out[1].landed,true);return out;
 });
 await check('Wildfires hurt on contact with a cooldown and stop hurting when disabled',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('fire');t.at(1);const patch=t.firePatches.children[0];t.place(patch.position.x,patch.position.y+.08,patch.position.z);t.updateEventHazards(.016);const first=t.state.damage;for(let i=0;i<50;i++)t.updateEventHazards(.016);const protectedDamage=t.state.damage;for(let i=0;i<40;i++)t.updateEventHazards(.016);const next=t.state.damage;t.stopDisaster();for(let i=0;i<200;i++)t.updateEventHazards(.016);return{first,protectedDamage,next,off:t.state.damage}});assert.ok(r.first>0);assert.equal(r.first,r.protectedDamage);assert.ok(r.next>r.first);assert.equal(r.off,r.next);return r;
 });
 await check('Volcano smoke rises and large ballistic rocks can hit riders and become obstacles',async()=>{
  const r=await page.evaluate(()=>{const t=__screamTest;t.set('volcano');t.at(2);const rock=t.eventRocks[0],falling=!rock.landed,radius=rock.radius,smoke=t.volcanoSmoke.filter(p=>p.visible).length,y=t.volcanoSmoke[0].position.y;t.place(rock.p.x,rock.p.y-1,rock.p.z);t.updateEventHazards(.016);const hit=t.state;t.at(6);const landed=t.eventRocks[0].landed;t.stopDisaster();return{falling,radius,smoke,y,hit,landed,off:t.volcanoSmoke.every(p=>!p.visible)}});assert.ok(r.falling&&r.radius>=1.5&&r.smoke===16&&r.y>25&&r.hit.ragdoll&&r.hit.damage>0&&r.landed&&r.off);return r;
 });
 await page.evaluate(()=>{document.getElementById('tuner').style.visibility='hidden';__screamTest.lightningPreview(1.5)});await page.screenshot({path:fileURLToPath(new URL('../reports/lightning-warning.png',import.meta.url))});
 await page.evaluate(()=>__screamTest.lightningPreview(2.1));await page.screenshot({path:fileURLToPath(new URL('../reports/lightning-strike.png',import.meta.url))});
 await page.evaluate(()=>{const t=__screamTest;t.set('flood');t.place(0,.08,25,15);t.at(2);for(let i=0;i<50;i++)t.updateEventHazards(1/120);document.getElementById('tuner').style.visibility='hidden';t.render()});await page.screenshot({path:fileURLToPath(new URL('../reports/flood-splashes.png',import.meta.url))});
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/hazards-results.json',import.meta.url)),JSON.stringify({scope:'Flood splashes, moving tornado capture/release, solid falling meteor/volcano rocks, shared reconstruction and wildfire damage.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
