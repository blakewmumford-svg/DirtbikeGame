import {fileURLToPath} from 'node:url';
import {browserOptions} from './browser-options.mjs';
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';

const target=fileURLToPath(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url));
const html=fs.readFileSync(target,'utf8').replace('currentSamples=sampleWheels();loop();',`globalThis.__test={multiplayer,roomDom,get state(){return {role:multiplayer.role,ready:multiplayer.ready,connected:multiplayer.connected,room:multiplayer.room,peers:[...multiplayer.peers],clients:[...multiplayer.clients],map:activeMap,seen:[...multiplayer.seen.keys()]}}};currentSamples=sampleWheels();loop();`);
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'}).end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch(browserOptions);
const results=[];
async function rider(name){
 const context=await browser.newContext({viewport:{width:1100,height:800}});
 await context.route('https://esm.sh/three@0.170.0',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/three.module.js',import.meta.url)))}));
 // Exact, TLS-verified CDN bundle; actual MQTT and WebRTC traffic is not mocked.
 await context.route('https://esm.sh/trystero@0.22.0/mqtt',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(fileURLToPath(new URL('./fixtures/trystero-mqtt.bundle.mjs',import.meta.url)))}));
 const page=await context.newPage(),logs=[];
 page.on('console',m=>{if(m.type()==='error'||m.text().includes('room:'))logs.push(m.text())});
 page.on('pageerror',e=>logs.push('Page error: '+e.message));
 page.on('websocket',ws=>{logs.push('Opened websocket '+ws.url());ws.on('socketerror',e=>logs.push('WebSocket error: '+e));ws.on('close',()=>logs.push('WebSocket closed: '+ws.url()))});
 await page.goto(origin);await page.waitForFunction(()=>window.__test,null,{timeout:60000});await page.locator('#player-name').fill(name);
 return{page,logs};
}
let host,guest;
try{
 host=await rider('Host');guest=await rider('Friend');
 await host.page.locator('#room-host').click();
 await host.page.waitForFunction(()=>__test.state.ready||__test.state.role==='solo',null,{timeout:45000});
 const hs=await host.page.evaluate(()=>({state:__test.state,status:__test.roomDom.status.textContent,stage:__test.roomDom.networkLog.textContent}));
 results.push({step:'host',...hs});
 if(hs.state.ready){
  await guest.page.locator('#room-input').fill(hs.state.room);await guest.page.locator('#room-join').click();
  try{await guest.page.waitForFunction(()=>__test.state.role==='guest',null,{timeout:45000})}catch{}
  results.push({step:'guest',...(await guest.page.evaluate(()=>({state:__test.state,status:__test.roomDom.status.textContent,stage:__test.roomDom.networkLog.textContent}))),host:await host.page.evaluate(()=>__test.state)});
 }
}catch(e){results.push({step:'error',error:String(e),stack:e.stack})}
finally{
 results.push({step:'logs',host:host?.logs,guest:guest?.logs});
 fs.writeFileSync(fileURLToPath(new URL('../reports/trystero-live-results.json',import.meta.url)),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));await browser.close();server.close();
}
