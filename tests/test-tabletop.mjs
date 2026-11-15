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
globalThis.__screamTest={reset,repairHere,simulateSubstep,
 set({air=false,y=.08,roll=0,speedValue=8}={}){reset();showMenuStage('riding');grounded=!air;pos.y=y;speed=speedValue;airRoll=roll;airRollVelocity=0;airTravelHeading=yaw;currentSamples=sampleWheels()},
 get state(){return{roll:airRoll,yaw,velocity:horizontalVelocity(),grounded,collision:lastCollision,position:pos.toArray()}}
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
async function step(n){await page.evaluate(n=>{for(let i=0;i<n;i++)__screamTest.simulateSubstep(1/120)},n)}
async function state(){return page.evaluate(()=>__screamTest.state)}
let code=0;
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__screamTest);
 await check('Left/right arrows tabletop the bike in air without yawing or steering its flight',async()=>{
  const out=[];
  for(const [key,sign] of [['ArrowLeft',1],['ArrowRight',-1]]){
   await page.evaluate(()=>__screamTest.set({air:true,y:50}));await page.keyboard.down(key);await step(90);await page.keyboard.up(key);
   const held=await state();assert.ok(held.roll*sign>1.2);assert.ok(Math.abs(held.yaw)<1e-8&&Math.abs(held.velocity.x)<1e-8);
   await step(90);const released=await state();assert.ok(Math.abs(released.roll)<.08);out.push({key,held:held.roll,released:released.roll});
  }return out;
 });
 await check('Arrow tabletop controls are inactive on dirt; A still steers',async()=>{
  await page.evaluate(()=>__screamTest.set());await page.keyboard.down('ArrowLeft');await step(20);await page.keyboard.up('ArrowLeft');const ground=await state();assert.equal(ground.yaw,0);assert.equal(ground.roll,0);
  await page.keyboard.down('a');await step(20);await page.keyboard.up('a');assert.ok((await state()).yaw>0);return ground;
 });
 await check('Landing sideways hits the body; repair and reset restore the upright bike',async()=>{
  await page.evaluate(()=>__screamTest.set({air:true,y:.1,roll:1.4}));await page.keyboard.down('ArrowLeft');await step(2);await page.keyboard.up('ArrowLeft');const sideways=await state();assert.equal(sideways.grounded,false);assert.match(sideways.collision,/Sideways|body/i);
  await page.evaluate(()=>__screamTest.repairHere());assert.equal((await state()).roll,0);
  await page.evaluate(()=>{__screamTest.set({air:true,y:30,roll:1});__screamTest.reset()});assert.equal((await state()).roll,0);return sideways;
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/tabletop-results.json',import.meta.url)),JSON.stringify({scope:'Airborne tabletop controls, direction preservation, and landing/repair behavior.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
