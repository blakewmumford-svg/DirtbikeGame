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
globalThis.__screamTest={riderBalance,riderArms,riderLegs,upperBody,stuntPose,THREE,scene,multiplayer,receivePose,updateRemoteRiders,updatePlayerIndicators,removeRemote,
 set({v=0,gas=0,brake=0,air=false}={}){reset();showMenuStage('riding');speed=v;grounded=!air;keys.KeyW=gas;keys.KeyS=brake;pos.y=air?20:.08;paused=false;bike.position.copy(pos);bike.rotation.set(0,0,0);frame.rotation.z=0},
 pose(time=0,frames=60){for(let i=0;i<frames;i++)updateBikeVisuals(1/60,time)},
 get state(){return{speed,pos:pos.toArray(),pitch,yaw,lean:riderBalance.lean,feet:riderBalance.feet,walk:riderBalance.walk,torso:upperBody.rotation.x,hands:riderArms.map(a=>a.glove.position.toArray()),boots:riderLegs.map(l=>l.boot.position.toArray())}},
 camera(){camera.position.set(0,3,35);camera.up.set(0,1,0);camera.lookAt(0,2,10);camera.updateMatrixWorld()},
 screenshot(){camera.position.set(4,3.3,21.5);camera.lookAt(0,1.5,25);renderer.render(scene,camera)}
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
 await check('Throttle leans forward and braking leans back without altering physics',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.set({v:10,gas:1});const before=t.state;t.pose();const gas=t.state;t.set({v:10,brake:1});t.pose();return{before,gas,brake:t.state}});
  assert.ok(result.gas.lean>.9&&result.gas.torso<-.3);assert.ok(result.brake.lean<-.9&&result.brake.torso>.3);assert.equal(result.gas.speed,result.before.speed);assert.deepEqual(result.gas.pos,result.before.pos);assert.equal(result.gas.pitch,result.before.pitch);return{gas:result.gas.lean,brake:result.brake.lean};
 });
 await check('Stopped feet reach terrain; reverse walks with both hands on the bars',async()=>{
  const result=await page.evaluate(()=>{const t=__screamTest;t.set();t.pose();const stopped=t.state;t.set({v:-1.2,brake:1});t.pose(0,20);const first=t.state;t.pose(0,20);const second=t.state;t.set({v:8});t.pose();const riding=t.state;t.set({air:true});t.pose();return{stopped,first,second,riding,air:t.state}});
  assert.ok(result.stopped.feet>.99);assert.ok(result.stopped.boots.every(p=>p[1]<.2));assert.notDeepEqual(result.first.boots,result.second.boots);assert.ok(result.first.hands.every(p=>Math.abs(p[1]-2.08)<.001&&Math.abs(p[2]+.26)<.001));assert.ok(result.riding.feet<.001&&result.air.feet<.001);return{stopped:result.stopped.boots,walk:[result.first.boots,result.second.boots]};
 });
 await page.evaluate(()=>{__screamTest.set({v:-1});__screamTest.pose();__screamTest.screenshot()});await page.screenshot({path:fileURLToPath(new URL('../reports/reverse-walk.png',import.meta.url))});
 await check('One mobile random-trick button covers all three choices and is airborne-only',async()=>{
  const result=await page.evaluate(()=>{
   const t=__screamTest,button=document.querySelector('[data-random-trick]');t.set();t.pose();const disabled=button.disabled,out=[];const random=Math.random;
   try{for(const n of [.1,.5,.9]){t.set({air:true});t.pose();Math.random=()=>n;button.click();t.pose();out.push(t.stuntPose.name)}}finally{Math.random=random}
   return{disabled,out,buttons:[...document.querySelectorAll('#touch-controls button')].map(b=>b.textContent)};
  });assert.equal(result.disabled,true);assert.deepEqual(result.out,['No-hander','Superman','Can-can']);assert.equal(result.buttons.filter(x=>x==='Random trick').length,1);assert.ok(!result.buttons.includes('Superman'));return result;
 });
 await check('Player arrows follow color and direction, hide stale peers, and are removed on leave',async()=>{
  const result=await page.evaluate(()=>{
   const t=__screamTest;t.set();t.multiplayer.connected=true;t.multiplayer.joined=true;t.camera();
   const pose=(x,z,paint)=>({p:[x,.1,z],yaw:0,pitch:0,roll:0,paint,stage:'riding',ragdoll:false,space:false});
   t.receivePose('friend',pose(70,10,2));t.updateRemoteRiders(1);t.updatePlayerIndicators();const entry=t.multiplayer.seen.get('friend'),el=entry.indicator;const first={x:parseFloat(el.style.left),color:el.style.color,label:el.getAttribute('aria-label'),hidden:el.hidden};
   t.receivePose('friend',pose(-70,10,1));t.updateRemoteRiders(1);t.updatePlayerIndicators();const second={x:parseFloat(el.style.left),color:el.style.color};
   t.receivePose('friend',pose(0,80,10));t.updateRemoteRiders(1);t.updatePlayerIndicators();const behind={x:el.style.left,y:el.style.top,rotation:el.querySelector('svg').style.transform};entry.lastSeen-=9000;t.updatePlayerIndicators();const stale=el.hidden;t.removeRemote('friend');return{first,second,behind,stale,removed:!el.isConnected};
  });assert.equal(result.first.hidden,false);assert.ok(result.first.x>550&&result.second.x<550);assert.notEqual(result.first.color,result.second.color);assert.match(result.first.label,/Blue/);assert.ok(!result.behind.x.includes('NaN'));assert.equal(result.stale,true);assert.equal(result.removed,true);return result;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/rider-indicators-results.json',import.meta.url)),JSON.stringify({scope:'Rider balance/walk poses, random mobile trick selection, and indicators using simulated peer poses (not live multiplayer).',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
