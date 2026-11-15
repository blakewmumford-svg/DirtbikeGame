import {fileURLToPath} from 'node:url';
import {browserOptions} from './browser-options.mjs';
import {chromium} from 'playwright';
import {WebSocketServer} from 'ws';
import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const wss=new WebSocketServer({host:'127.0.0.1',port:0});
await new Promise(r=>wss.on('listening',r));
const clients=new Map();
function tx(socket,data){if(socket.readyState===1)socket.send(JSON.stringify(data))}
wss.on('connection',socket=>{
 socket.on('message',raw=>{const m=JSON.parse(raw.toString());
  if(m.type==='join'){
   const entry={socket,id:m.id,room:m.room};
   for(const other of clients.values())if(other.room===entry.room){tx(other.socket,{type:'peer',id:entry.id});tx(socket,{type:'peer',id:other.id})}
   clients.set(socket,entry);
  }else if(m.type==='data'){
   const from=clients.get(socket);if(!from)return;
   for(const other of clients.values())if(other!==from&&other.room===from.room)tx(other.socket,{type:'data',id:from.id,data:m.data});
  }
 });
 socket.on('close',()=>{const left=clients.get(socket);clients.delete(socket);if(left)for(const other of clients.values())if(other.room===left.room)tx(other.socket,{type:'leave',id:left.id})});
});
const mockModule=`let socket;export const getRelaySockets=()=>({'test-relay':socket});export function joinRoom(config,roomId){const id=crypto.randomUUID();let onJoin=()=>{},onLeave=()=>{},onData=()=>{};socket=new WebSocket('ws://127.0.0.1:${wss.address().port}');socket.onopen=()=>socket.send(JSON.stringify({type:'join',room:roomId,id}));socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='peer')onJoin(m.id);if(m.type==='leave')onLeave(m.id);if(m.type==='data')onData(m.data,m.id)};return{makeAction(){return[(data)=>{if(socket.readyState===1)socket.send(JSON.stringify({type:'data',data}));return Promise.resolve()},callback=>onData=callback]},onPeerJoin(cb){onJoin=cb},onPeerLeave(cb){onLeave=cb},leave(){socket.close()}}}`;
let source=fs.readFileSync(fileURLToPath(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url)),'utf8');
source=source.replace('currentSamples=sampleWheels();loop();',`renderer.render=()=>{};globalThis.__test={multiplayer,roomDom,tuning,applyValues,canEditTuning,onRealtimeMessage,disaster,startDisaster,stopDisaster,hostAnnouncement,updateDisasters,rain,floodWater,firePatches,confetti,meteorHeads,tornadoRoot,volcanoRoot,showMenuStage,trajectory(time){updateFallingRocks(time,true);moveTornado(time);return{rocks:eventRocks.filter(r=>r.active).map(r=>r.p.toArray()),tornado:tornadoRoot.position.toArray()}},get state(){return {role:multiplayer.role,ready:multiplayer.ready,room:multiplayer.room,peers:[...multiplayer.peers],clients:[...multiplayer.clients],map:activeMap,stage:menuStage,remotes:[...multiplayer.seen].map(([id,e])=>({id,visible:e.obj.visible,target:e.target}))}}};currentSamples=sampleWheels();loop();`);
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'}).end(source)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions);
const errors=[],results=[];
async function rider(name){const context=await browser.newContext({viewport:{width:1100,height:850}});
 await context.route('https://esm.sh/three@0.170.0',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/three.module.js',import.meta.url)))}));
 await context.route('https://esm.sh/trystero@0.22.0/mqtt',r=>r.fulfill({status:200,contentType:'application/javascript',body:mockModule}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.__test);await page.locator('#player-name').fill(name);return page}
async function state(page){return page.evaluate(()=>__test.state)}
async function step(name,fn){await fn();results.push(name);console.log('PASS',name)}
async function ride(page){await page.locator('#lobby-start').click();await page.locator('#menu-play').click();await page.locator('#menu-start').click();await page.waitForFunction(()=>__test.state.stage==='riding')}
let code=0,host,guest;
try{
 host=await rider('Host');guest=await rider('Friend');await guest.evaluate(()=>__test.applyValues({...__test.tuning,dustSize:3}));
 await step('Default system is Trystero; host creates a room without Supabase setup',async()=>{assert.equal(await host.locator('#room-system').inputValue(),'trystero');await host.locator('#room-host').click();await host.waitForFunction(()=>__test.state.role==='host'&&__test.state.ready,null,{timeout:10000})});
 await step('Guest joins by code and names sync',async()=>{await guest.locator('#room-input').fill((await state(host)).room);await guest.locator('#room-join').click();await guest.waitForFunction(()=>__test.state.role==='guest',null,{timeout:12000});await host.waitForFunction(()=>__test.state.clients.length===1);assert.equal((await state(guest)).peers[0][1].name,'Host');assert.equal((await state(host)).peers[0][1].name,'Friend')});
 await step('Map and rider positions sync through Trystero action callbacks',async()=>{await host.locator('#lobby-start').click();await host.locator('#menu-play').click();await host.locator('[data-map="forest"]').click();await guest.waitForFunction(()=>__test.state.map==='forest');await host.evaluate(()=>__test.showMenuStage('lobby'));await ride(host);await ride(guest);await host.waitForFunction(()=>__test.state.remotes.some(r=>r.visible&&r.target?.stage==='riding'));await guest.waitForFunction(()=>__test.state.remotes.some(r=>r.visible&&r.target?.stage==='riding'))});
 await step('Enter opens Debug and the next press closes it',async()=>{
  await host.keyboard.press('Enter');assert.equal(await host.locator('[data-tab="Debug"]').getAttribute('class'),'active');assert.ok(!(await host.locator('#tuner').getAttribute('class')||'').includes('collapsed'));await host.keyboard.press('Enter');assert.ok((await host.locator('#tuner').getAttribute('class')).includes('collapsed'));
 });
 await step('Host tuning is shared; guests are read-only and reject non-host updates',async()=>{
  await guest.keyboard.press('Enter');assert.equal(await guest.locator('[data-disaster-type=party]').isDisabled(),true);assert.equal(await host.locator('[data-disaster-type=party]').isDisabled(),false);await host.evaluate(()=>__test.applyValues({...__test.tuning,dustSize:7,gravity:18}));await guest.waitForFunction(()=>__test.tuning.dustSize===7&&__test.tuning.gravity===18);
  assert.equal(await guest.evaluate(()=>__test.canEditTuning()),false);assert.ok(await guest.locator('#tuning-fields input[type=range]').first().isDisabled());
  await guest.evaluate(()=>{__test.applyValues({...__test.tuning,dustSize:10});__test.onRealtimeMessage({_from:'f'.repeat(24),t:'tuning',settings:{...__test.tuning,dustSize:11}})});assert.equal(await guest.evaluate(()=>__test.tuning.dustSize),7);assert.equal(await host.evaluate(()=>__test.tuning.dustSize),7);
 });
 await step('Host-started events reach guests, refresh from host snapshots, and stop for everyone',async()=>{
  for(const type of ['storm','flood','fire','party','meteor','volcano','tornado']){
   await host.evaluate(type=>__test.startDisaster(type),type);await guest.waitForFunction(type=>__test.disaster.type===type,type);
   assert.ok(await guest.evaluate(()=>__test.disaster.remaining>110));await guest.waitForFunction(type=>__test[{storm:'rain',flood:'floodWater',fire:'firePatches',party:'confetti',meteor:'meteorHeads',volcano:'volcanoRoot',tornado:'tornadoRoot'}[type]].visible,type);
   if(['meteor','volcano','tornado'].includes(type)){const a=await host.evaluate(()=>__test.trajectory(8)),b=await guest.evaluate(()=>__test.trajectory(8));assert.deepEqual(a,b)}
   await guest.evaluate(()=>__test.startDisaster('quake'));assert.equal(await guest.evaluate(()=>__test.disaster.type),type);
   await guest.evaluate(()=>{__test.disaster.type=null});await host.evaluate(()=>__test.hostAnnouncement());await guest.waitForFunction(type=>__test.disaster.type===type,type);
   await host.evaluate(()=>__test.stopDisaster());await guest.waitForFunction(()=>__test.disaster.type===null);
  }
 });
 await step('Late joiners get the active meteor shower and the host clock runs in menus',async()=>{
  await host.evaluate(()=>{__test.showMenuStage('lobby');__test.startDisaster('meteor')});
  const late=await rider('Late rider');await late.locator('#room-input').fill((await state(host)).room);await late.locator('#room-join').click();await late.waitForFunction(()=>__test.state.role==='guest'&&__test.disaster.type==='meteor',null,{timeout:12000});
  await host.waitForFunction(()=>__test.disaster.remaining<119);assert.ok(Math.abs((await host.evaluate(()=>__test.disaster.remaining))-(await late.evaluate(()=>__test.disaster.remaining)))<3);
  await late.evaluate(()=>__test.roomDom.leave.click());await host.waitForFunction(()=>__test.state.clients.length===1);await host.evaluate(()=>{__test.stopDisaster();__test.showMenuStage('riding')});
 });
 await step('Leaving removes guest from roster',async()=>{await guest.evaluate(()=>__test.roomDom.leave.click());await host.waitForFunction(()=>__test.state.clients.length===0);assert.equal(await guest.evaluate(()=>__test.tuning.dustSize),3);assert.equal(await guest.evaluate(()=>__test.canEditTuning()),true)});
 assert.deepEqual(errors,[]);
}catch(e){code=1;console.error(e);if(host)console.error('Host:',await host.locator('#room-network-log').textContent());if(guest)console.error('Guest:',await guest.locator('#room-network-log').textContent());results.push({error:String(e),stack:e.stack})}
finally{fs.writeFileSync(fileURLToPath(new URL('../reports/trystero-flow-results.json',import.meta.url)),JSON.stringify({scope:'Simulated Trystero peer delivery; verifies game integration, not real network connections.',results,errors},null,2));await browser.close();for(const client of wss.clients)client.terminate();await new Promise(r=>wss.close(r));server.close();process.exitCode=code}
