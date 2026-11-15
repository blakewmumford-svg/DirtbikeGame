import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});
for(const name of ['tabletop','publish-defaults','engine','bike-visuals','dust','wheelie','split-volume','recorded-only','music','trystero-flow']){
 console.log(`\nRunning ${name} checks`);
 const r=spawnSync(process.execPath,[fileURLToPath(new URL(`../tests/test-${name}.mjs`,import.meta.url))],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
console.log('\nAll bundled regression suites passed. Simulated multiplayer is not a live two-device test.');
