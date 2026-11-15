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
globalThis.__visualTest={bike,wheels,handlebar,throttleGrip,riderArms,orange,updateBikeVisuals,prepareDefaultsPublish,
 setThrottle(on){showMenuStage('riding');keys.KeyW=on;controller.throttle=0;paused=false},
 update(time){for(let i=0;i<60;i++)updateBikeVisuals(1/60,time)},
 render(){document.getElementById('tuner').style.visibility='hidden';bike.position.set(0,.08,25);bike.rotation.set(0,0,0);camera.position.set(4,3.2,21.5);camera.lookAt(0,1.5,25);renderer.render(scene,camera)},
 cameraPose(mode,x,y,z,heading,tilt,roll){showMenuStage('riding');camMode=mode;pos.set(x,y,z);yaw=heading;pitch=tilt;frame.rotation.z=roll;camera.position.set(200,150,300);draw(1/60,0);return{local:frame.worldToLocal(camera.position.clone()).toArray(),up:camera.up.toArray(),direction:camera.getWorldDirection(new THREE.Vector3()).applyQuaternion(frame.getWorldQuaternion(new THREE.Quaternion()).invert()).toArray()}},
 get selected(){return selectedPaint},get paintCount(){return BIKE_PAINTS.length}
};`;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/favicon')){res.writeHead(204).end();return}
 const source=fs.readFileSync(target,'utf8').replace('currentSamples=sampleWheels();loop();',instrumentation+(req.url.includes('live')?'loop();':''));
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
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__visualTest);
 await check('Square tire knobs are batched and attached to both rolling wheels',async()=>{
  const counts=await page.evaluate(()=>__visualTest.wheels.map(w=>w.getObjectByName('Knobby tire tread').count));assert.deepEqual(counts,[96,96]);return counts;
 });
 await check('W twists the right grip and wrist, dips the elbow, and release returns to rest',async()=>{
  const state=await page.evaluate(()=>{const t=__visualTest;t.setThrottle(true);t.update(0);const right=t.riderArms[1],left=t.riderArms[0];const on={grip:t.throttleGrip.rotation.x,wrist:right.glove.rotation.x,elbow:right.elbow.y,left:left.glove.rotation.x};t.setThrottle(false);t.update(0);return{on,off:{grip:t.throttleGrip.rotation.x,elbow:right.elbow.y}}});
  assert.ok(state.on.grip<-.6&&state.on.wrist<-.6&&state.on.elbow<2.13);assert.ok(Math.abs(state.on.left)<.001);assert.ok(Math.abs(state.off.grip)<.001&&Math.abs(state.off.elbow-2.24)<.001);return state;
 });
 await check('Rainbow paint cycles, persists, and switching to a solid color stops the cycling',async()=>{
  await page.getByRole('button',{name:'Rainbow gas dirt bike',includeHidden:true}).evaluate(el=>el.click());
  const colors=await page.evaluate(()=>{const t=__visualTest;t.update(0);const first=t.orange.color.getHex();t.update(1);return{first,next:t.orange.color.getHex(),selected:t.selected,count:t.paintCount}});
  assert.notEqual(colors.first,colors.next);assert.equal(colors.selected,10);assert.equal(colors.count,11);
  await page.reload();await page.waitForFunction(()=>!!window.__visualTest);assert.equal(await page.evaluate(()=>__visualTest.selected),10);
  await page.getByRole('button',{name:'Blue gas dirt bike',exact:true,includeHidden:true}).evaluate(el=>el.click());
  const solid=await page.evaluate(()=>{const t=__visualTest;t.update(0);const first=t.orange.color.getHex();t.update(1);return{first,next:t.orange.color.getHex()}});assert.equal(solid.first,solid.next);assert.equal(solid.first,0x2582f5);return{colors,solid};
 });
 await page.evaluate(()=>{__visualTest.setThrottle(true);__visualTest.update(1);__visualTest.render()});
 await page.screenshot({path:fileURLToPath(new URL('../reports/bike-realism.png',import.meta.url))});
 await check('First-person camera stays fixed ahead of the helmet through movement and lean',async()=>{
  const poses=await page.evaluate(()=>{
   const t=__visualTest,rest=t.cameraPose(1,0,.08,25,0,0,0),moved=t.cameraPose(1,18,4,-30,1.2,.5,.25),external=t.cameraPose(0,18,4,-30,1.2,.5,.25);
   t.cameraPose(1,0,.08,25,0,0,0);return{rest,moved,external};
  });
  for(const pose of [poses.rest,poses.moved]){
   for(const [i,v] of [0,2.5,-.30].entries())assert.ok(Math.abs(pose.local[i]-v)<1e-8);
   assert.ok(pose.direction[2]<-.95&&pose.direction[1]<0);
  }
  assert.deepEqual(poses.external.up,[0,1,0]);
  await page.screenshot({path:fileURLToPath(new URL('../reports/first-person.png',import.meta.url))});return poses;
 });
 await check('Publish defaults prepares current tuning without sending credentials',async()=>{
  const result=await page.evaluate(async()=>{
   document.querySelector('[data-tab="Debug"]').click();
   const input=document.querySelector('[aria-label="Rear-tire dust size"]');input.value='6';input.dispatchEvent(new Event('input',{bubbles:true}));
   const oldOpen=window.open,oldClipboard=Object.getOwnPropertyDescriptor(navigator,'clipboard');let opened,copied;
   window.open=url=>{opened=url;return null};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}});
   try{await __visualTest.prepareDefaultsPublish();return{opened,payload:JSON.parse(copied),status:document.getElementById('publish-defaults-status').textContent}}
   finally{window.open=oldOpen;if(oldClipboard)Object.defineProperty(navigator,'clipboard',oldClipboard);else delete navigator.clipboard}
  });
  assert.equal(result.opened,'https://github.com/blakewmumford-svg/DirtbikeGame/actions/workflows/publish-defaults.yml');
  assert.equal(result.payload.format,'dirtbike-defaults-v1');assert.equal(result.payload.settings.dustSize,6);assert.ok(result.status.includes('Copied!'));
  return{destination:result.opened,dustSize:result.payload.settings.dustSize};
 });
 await check('Live game loop renders and responds to real W key presses',async()=>{
  await page.goto(`http://127.0.0.1:${server.address().port}/?live`);await page.waitForFunction(()=>!!window.__visualTest);
  await page.evaluate(()=>__visualTest.setThrottle(false));await page.keyboard.down('w');
  await page.waitForFunction(()=>__visualTest.throttleGrip.rotation.x<-.5);await page.keyboard.up('w');
  await page.waitForFunction(()=>Math.abs(__visualTest.throttleGrip.rotation.x)<.02);
  return{rendered:true,keyPressAndRelease:true};
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/bike-visuals-results.json',import.meta.url)),JSON.stringify({scope:'Bike visual detail, throttle animation, and rainbow paint behavior.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
