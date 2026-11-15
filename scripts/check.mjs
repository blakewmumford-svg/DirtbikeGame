import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const source=fs.readFileSync(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url),'utf8');
const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
const module=source.split('<script type="module">')[1]?.split('</script>')[0];assert.ok(module,'Missing game module');
assert.ok(!source.includes('__screamTest')&&!source.includes('globalThis.__test='),'Test instrumentation in game');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dirtbike-check-'));
try{const file=path.join(dir,'game.mjs');fs.writeFileSync(file,module);const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});assert.equal(r.status,0,'Game JavaScript syntax');}finally{fs.rmSync(dir,{recursive:true,force:true})}
const voices=JSON.parse(source.match(/const CRASH_VOICE_DATA=(.*);\n/)[1]);
const meta=JSON.parse(source.match(/const RECORDED_REACTIONS=(.*);\n/)[1]);
assert.deepEqual(Object.keys(voices).sort(),Object.keys(meta).sort(),'Every reaction must have matching metadata');
for(const [key,data] of Object.entries(voices)){const b=Buffer.from(data,'base64');assert.equal(b.toString('ascii',0,4),'RIFF',key+' missing WAV data');assert.ok(b.length>1000,key+' empty clip')}
const music=JSON.parse(source.match(/const GAME_MUSIC_DATA=(.*);\n/)[1]);assert.ok(music.menu&&music.ride,'Missing menu or riding music');
console.log(`PASS: syntax, ${ids.length} unique IDs, ${Object.keys(voices).length} uploaded reactions, music, no test hooks.`);
