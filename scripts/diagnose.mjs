import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});
console.log('This attempts actual public relay access. Read reports/trystero-live-results.json: process completion does not mean peers connected.');
const r=spawnSync(process.execPath,[fileURLToPath(new URL('../tests/test-trystero-live.mjs',import.meta.url))],{stdio:'inherit'});process.exitCode=r.status||0;
