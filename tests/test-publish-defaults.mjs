import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {applyPublishedDefaults} from '../scripts/publish-defaults.mjs';
const source=fs.readFileSync(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url),'utf8');
const readSchema=s=>vm.runInNewContext('('+s.match(/const TUNING_SCHEMA = (\[[\s\S]*?\n\]);/)[1]+')',{}, {timeout:1000});
const fields=readSchema(source);
const payload={format:'dirtbike-defaults-v1',settings:Object.fromEntries(fields.map(s=>[s.key,s.value])),debug:{hitboxes:true,contacts:false}};
payload.settings.dustSize=8;
const raw=JSON.stringify(payload),updated=applyPublishedDefaults(source,raw);
assert.equal(readSchema(updated).find(s=>s.key==='dustSize').value,8);
assert.ok(updated.includes('const DEFAULT_DEBUG={"hitboxes":true,"contacts":false};'));
assert.equal(applyPublishedDefaults(updated,raw),updated,'Publishing the same settings is repeatable');
assert.equal(updated.split('const CRASH_VOICE_DATA=')[1],source.split('const CRASH_VOICE_DATA=')[1],'Embedded audio and subsequent game code are unchanged');
for(const mutate of [p=>p.settings.dustSize=999,p=>p.settings.dustSize='8',p=>delete p.settings.dustSize,p=>p.settings.unknown=1,p=>p.settings.turnLeanDirection=.5,p=>p.debug.hitboxes='true',p=>p.format='wrong']){
 const invalid=JSON.parse(raw);mutate(invalid);assert.throws(()=>applyPublishedDefaults(source,JSON.stringify(invalid)));
}
assert.throws(()=>applyPublishedDefaults(source,'$(touch /tmp/should-never-run)'));
assert.throws(()=>applyPublishedDefaults(source,'x'.repeat(50001)));
console.log('PASS: publish updates defaults and debug views, is repeatable, preserves audio, and rejects invalid settings');
