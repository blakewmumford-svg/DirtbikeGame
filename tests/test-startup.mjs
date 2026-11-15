import {chromium} from 'playwright';
import {browserOptions} from './browser-options.mjs';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';

// Serve the actual distributable: no source hooks or substituted renderer modules.
const target=new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url);
const source=fs.readFileSync(target);
const server=http.createServer((req,res)=>{if(req.url.includes('favicon')){res.writeHead(204).end();return}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(source)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(browserOptions),page=await browser.newPage({viewport:{width:1100,height:850}});
const errors=[],external=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://**',route=>{external.push(route.request().url());return route.abort()});
let code=0;
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!document.getElementById('bone-counter'));
 assert.equal(await page.locator('#err').textContent(),'');await page.locator('#lobby-start').click();await page.locator('#menu-play').click();await page.locator('#menu-start').click();await page.waitForFunction(()=>!document.body.classList.contains('menu-open'));
 await page.keyboard.down('w');await page.waitForFunction(()=>parseInt(document.getElementById('speed').textContent)>0);await page.keyboard.up('w');
 const speed=await page.locator('#speed').textContent();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await page.screenshot({path:fileURLToPath(new URL('../reports/startup-without-network.png',import.meta.url))});
 results.push({name:'Actual game boots and rides with external requests blocked',speed});console.log('PASS Actual game boots and rides with external requests blocked',speed);

}catch(e){code=1;console.error(e);results.push({error:String(e),pageErrors:errors,externalRequests:external})}
finally{fs.writeFileSync(new URL('../reports/startup-results.json',import.meta.url),JSON.stringify({scope:'Unmodified game over HTTP, no engine mocks, external HTTPS requests blocked.',results},null,2));await browser.close();server.close();process.exitCode=code}
