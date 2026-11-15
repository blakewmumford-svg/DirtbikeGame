import {fileURLToPath} from 'node:url';
import {browserOptions} from './browser-options.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';

const target=fileURLToPath(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url));
const results=[];
const errors=[];
const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/favicon')){res.writeHead(204).end();return;}
  const source=fs.readFileSync(target,'utf8').replace('currentSamples=sampleWheels();loop();',`currentSamples=sampleWheels();
  renderer.render=()=>{};
  globalThis.__wheelieTest={
    reset,toggleWheelie,simulateSubstep,
    set(s){
      if(s.p)pos.fromArray(s.p);
      if(s.y!==undefined)pos.y=s.y;
      if(s.pitch!==undefined)pitch=s.pitch;
      if(s.pitchVelocity!==undefined)pitchVelocity=s.pitchVelocity;
      if(s.speed!==undefined)speed=s.speed;
      if(s.vertical!==undefined)vertical=s.vertical;
      if(s.grounded!==undefined)grounded=s.grounded;
      if(s.throttle!==undefined)keys.KeyW=s.throttle;
    },
    rearOnly(angle=.65){
      pitch=angle;pitchVelocity=0;speed=8;vertical=0;grounded=true;
      pos.y=heightAt(pos.x,pos.z)+WHEEL_RADIUS-WHEEL_Y*Math.cos(pitch)+WHEEL_Z[1]*Math.sin(pitch)-.02;
    },
    step(n=1){for(let i=0;i<n;i++)simulateSubstep(1/120);return this.state},
    get state(){return {armed:wheelieArmed,liftTime:wheelieAirTime,grounded,p:pos.toArray(),pitch,pitchVelocity,speed,vertical,samples:sampleWheels().map(s=>({i:s.i,contact:s.contact,clearance:s.clearance}))}}
  };`);
  res.writeHead(200,{'Content-Type':'text/html'}).end(source);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const page=await browser.newPage({viewport:{width:1000,height:800}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://esm.sh/three@0.170.0',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/three.module.js',import.meta.url)),'utf8')}));
let code=0;
async function check(name,fn){const evidence=await fn();results.push({name,status:'passed',evidence});console.log('PASS '+name+' '+JSON.stringify(evidence));}
try{
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>!!window.__wheelieTest,null,{timeout:60000});
  await check('Freshly armed wheelie does not cancel before front tire lifts',async()=>{
    const r=await page.evaluate(()=>{const t=__wheelieTest;t.reset();t.set({speed:8});t.toggleWheelie();const before=t.state;const after=t.step();return{before,after}});
    assert.ok(r.before.armed&&r.before.samples.every(s=>s.contact));
    assert.ok(r.after.armed);assert.equal(r.after.liftTime,0);return r;
  });
  await check('Front tire lowering onto ground cancels wheelie while rear stays grounded',async()=>{
    const r=await page.evaluate(()=>{
      const t=__wheelieTest;t.reset();t.toggleWheelie();t.rearOnly(.65);
      const before=t.state;const first=t.step();
      // Lower the front while constraining the rear axle to its actual tire-rest geometry.
      // This isolates front-wheel touchdown from the separate airborne-landing branch.
      const steps=[];for(let i=1;i<=40;i++){t.rearOnly(Math.max(0,.65-i*.02));const s=t.step();if(i%10===0||!s.armed)steps.push({i,...s});if(!s.armed)break}
      return {before,first,steps,after:t.state};
    });
    assert.equal(r.before.samples[0].contact,false);assert.equal(r.before.samples[1].contact,true);
    assert.ok(r.first.armed&&r.first.liftTime>0);
    assert.equal(r.after.armed,false);assert.ok(r.after.grounded&&r.after.samples[0].contact);
    assert.ok(r.steps.every(s=>s.grounded),'rear tire should stay grounded during wheelie lowering');
    return r;
  });
  await check('Airborne landing cancels wheelie before ground throttle can lift again',async()=>{
    const r=await page.evaluate(()=>{
      const t=__wheelieTest;t.reset();t.toggleWheelie();t.set({y:1.5,speed:8,pitch:0,pitchVelocity:0,vertical:-2,grounded:false,throttle:false});
      const before=t.state;const log=[];for(let i=0;i<240;i++){const s=t.step();if(s.grounded){log.push({i,...s});break}}
      return{before,landing:log[0],after:t.state};
    });
    assert.ok(r.before.armed&&!r.before.grounded);assert.ok(r.landing);
    assert.equal(r.landing.armed,false);assert.equal(r.landing.liftTime,0);return r;
  });
  await check('Continuing to accelerate after touchdown does not rearm wheelie',async()=>{
    const r=await page.evaluate(()=>{const t=__wheelieTest;t.set({throttle:true});let rearmed=false;for(let i=0;i<360;i++){t.step();rearmed ||= t.state.armed}return{rearmed,after:t.state}});
    assert.equal(r.rearmed,false);return r;
  });
  await check('An explicit new wheelie input can arm again',async()=>{
    const r=await page.evaluate(()=>{const t=__wheelieTest;t.set({throttle:false});t.toggleWheelie();return t.state});
    assert.equal(r.armed,true);assert.equal(r.liftTime,0);return r;
  });
  assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({name:'failure',error:String(e),stack:e.stack});}
finally{
  fs.writeFileSync(fileURLToPath(new URL('../reports/wheelie-results.json',import.meta.url)),JSON.stringify({target,scope:'Actual game physics in Chromium; manual substeps and test-only state setup, no mocked tire contacts.',results,errors},null,2));
  await browser.close();server.close();process.exitCode=code;
}
