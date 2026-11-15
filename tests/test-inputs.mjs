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
globalThis.__screamTest={touchInput,touchPointers,controller,readController,updateBikeVisuals,stuntPose,
 set({air=false}={}){reset();showMenuStage('riding');grounded=!air;pos.y=air?30:.08;paused=false;const render=renderer.render;renderer.render=()=>{};for(let i=0;i<60;i++)draw(1/60,0);renderer.render=render;draw(1/60,0)},
 get inputs(){return{throttle:throttleInput(),brake:brakeInput(),steer:steerInput(),roll:rollControlInput(),boost:boostInput(),wheelie:wheelieArmed,camera:camMode,paused,grounded}},
 pose(){for(let i=0;i<60;i++)updateBikeVisuals(1/60,0)}
};`;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/favicon')){res.writeHead(204).end();return}
 const source=fs.readFileSync(target,'utf8').replace('currentSamples=sampleWheels();loop();',instrumentation);
 res.writeHead(200,{'Content-Type':'text/html'}).end(source);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
await page.route('https://esm.sh/three@0.170.0',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/three.module.js',import.meta.url)),'utf8')}));
async function check(name,fn){const evidence=await fn();results.push({name,status:'passed',evidence});console.log('PASS '+name+' '+JSON.stringify(evidence))}
const cdp=await page.context().newCDPSession(page);
async function point(label,id){const box=await page.getByRole('button',{name:label,exact:true}).boundingBox();assert.ok(box,label+' visible');return{x:box.x+box.width/2,y:box.y+box.height/2,id,radiusX:4,radiusY:4,force:1}}
async function touch(type,points){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)))}
async function inputs(){return page.evaluate(()=>__screamTest.inputs)}
let code=0;
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__screamTest);
 await page.evaluate(()=>__screamTest.set());
 await check('Mobile controls fit portrait and landscape and hide in menus',async()=>{
  const sizes=[];
  for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:480}]){
   await page.setViewportSize(size);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(()=>__screamTest.set());const boxes=await page.locator('#touch-controls button:visible').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
   assert.ok(boxes.length>=10);assert.ok(boxes.every(b=>b.x>=0&&b.y>=0&&b.right<=size.width&&b.bottom<=size.height),JSON.stringify({size,boxes}));
   const tools=await page.locator('.touch-tools button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));assert.ok(tools.every(b=>Math.abs(b.bottom-size.height)<1&&b.y>size.height-45));assert.equal(tools.length,3);const boost=await page.getByRole('button',{name:'Boost',exact:true}).boundingBox();assert.ok(boost.width>=140&&boost.height>=54);const random=await page.getByRole('button',{name:'Random trick',exact:true}).boundingBox(),brake=await page.getByRole('button',{name:'Brake / frontflip',exact:true}).boundingBox();assert.ok(Math.abs(random.width-brake.width)<1&&Math.abs(random.height-brake.height)<1&&random.y+random.height<=brake.y);
   await page.screenshot({path:fileURLToPath(new URL(`../reports/mobile-${size.width}.png`,import.meta.url))});sizes.push(size);
  }
  await page.setViewportSize({width:390,height:844});return sizes;
 });
 await check('Two fingers can steer and accelerate together; cancellation releases both',async()=>{
  const left=await point('← Steer',1),gas=await point('Gas / backflip',2);
  await touch('touchStart',[left,gas]);const held=await inputs();assert.equal(held.throttle,1);assert.equal(held.steer,1);
  await page.evaluate(()=>{const id=[...__screamTest.touchPointers].find(([,action])=>action==='throttle')[0];document.querySelector('[data-hold=throttle]').dispatchEvent(new PointerEvent('pointerup',{pointerId:id,bubbles:true}))});assert.equal((await inputs()).throttle,0);assert.equal((await inputs()).steer,1);
  await touch('touchCancel',[]);assert.equal((await inputs()).steer,0);return held;
 });
 await check('Touch Boost alone applies throttle and boost',async()=>{
  const boost=await point('Boost',1);await touch('touchStart',[boost]);const state=await inputs();assert.equal(state.throttle,1);assert.equal(state.boost,true);await touch('touchCancel',[]);return state;
 });
 await check('Keyboard and touch inputs are independent; menu and pause clear touch holds',async()=>{
  await page.keyboard.down('w');const gas=await point('Gas / backflip',1);await touch('touchStart',[gas]);await touch('touchEnd',[]);assert.equal((await inputs()).throttle,1);await page.keyboard.up('w');assert.equal((await inputs()).throttle,0);
  await touch('touchStart',[gas]);await page.getByRole('button',{name:'Pause',exact:true}).dispatchEvent('click',{detail:0});assert.equal((await inputs()).throttle,0);await touch('touchEnd',[]);
  await page.evaluate(()=>__screamTest.set());await touch('touchStart',[gas]);await page.locator('#open-main-menu').evaluate(b=>b.click());assert.equal((await inputs()).throttle,0);assert.equal(await page.locator('#touch-controls').isVisible(),false);await touch('touchEnd',[]);await page.evaluate(()=>__screamTest.set());return{independent:true,cleared:true};
 });
 await check('Mobile wheelie and random trick controls are usable without keyboard keys',async()=>{
  await page.getByRole('button',{name:'Wheelie',exact:true}).tap();assert.equal((await inputs()).wheelie,true);
  await page.evaluate(()=>__screamTest.set({air:true}));assert.equal(await page.getByRole('button',{name:'Tilt →',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Garage',exact:true}).count(),0);
  await page.evaluate(()=>__screamTest.pose());await page.getByRole('button',{name:'Random trick',exact:true}).tap();await page.evaluate(()=>__screamTest.pose());assert.ok(['No-hander','Superman','Can-can'].includes(await page.evaluate(()=>__screamTest.stuntPose.name)));return{wheelie:true,trick:true};
 });
 await check('Connected controller works on mobile, has air tricks, and disconnect releases input',async()=>{
  await page.evaluate(()=>{
   window.testPad={index:0,connected:true,mapping:'standard',id:'Test controller',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]});__screamTest.readController();window.testPad.buttons[7]={pressed:true,value:.8};window.testPad.axes[0]=-.7;__screamTest.readController();
  });const pad=await inputs();assert.ok(pad.throttle>.5&&pad.throttle<1&&pad.steer>.5);
  await page.evaluate(()=>{__screamTest.set({air:true});window.testPad.axes[2]=.8;window.testPad.buttons[4]={pressed:true,value:1};__screamTest.readController();__screamTest.pose()});assert.equal((await inputs()).roll,0);assert.equal(await page.evaluate(()=>__screamTest.stuntPose.name),'Superman');
  await page.evaluate(()=>{__screamTest.set();window.testPad.buttons[7]={pressed:false,value:0};window.testPad.buttons[5]={pressed:true,value:1};__screamTest.readController()});assert.equal((await inputs()).throttle,1);assert.equal((await inputs()).boost,true);
  await page.evaluate(()=>{window.testPad=null;__screamTest.readController()});assert.equal((await inputs()).throttle,0);assert.equal((await inputs()).steer,0);return{analog:pad,disconnected:true};
 });
 await check('Touch show/hide preference persists and sound controls remain accessible in Info',async()=>{
  await page.evaluate(()=>__screamTest.set());await page.locator('#hud-toggle').tap();
  const preference=page.getByRole('combobox',{name:'Touch controls visibility',includeHidden:true});await preference.scrollIntoViewIfNeeded();assert.ok(await preference.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el}));await preference.selectOption('off');assert.equal(await page.locator('#touch-controls').isVisible(),false);await preference.selectOption('on');assert.equal(await page.locator('#touch-controls').isVisible(),true);assert.ok(await page.locator('#hud #sound-controls').isVisible());
  await page.reload();await page.waitForFunction(()=>!!window.__screamTest);await page.evaluate(()=>__screamTest.set());assert.equal(await preference.inputValue(),'on');return{saved:true,audioInInfo:true};
 });
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/inputs-results.json',import.meta.url)),JSON.stringify({scope:'Mobile multi-touch, keyboard coexistence, layout, and mocked standard Gamepad API behavior; physical devices not verified.',results,errors},null,2));await browser.close();server.close();process.exitCode=code}
