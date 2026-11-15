import fs from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';

export function applyPublishedDefaults(source, raw){
 if(typeof raw!=='string'||raw.length>50000)throw Error('Settings must be copied from the game (maximum 50 KB).');
 const data=JSON.parse(raw);
 if(data?.format!=='dirtbike-defaults-v1'||!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))throw Error('Use Copy settings & open GitHub in the Debug tab.');
 const match=source.match(/const TUNING_SCHEMA = (\[[\s\S]*?\n\]);/);
 if(!match)throw Error('Tuning schema not found.');
 const schema=vm.runInNewContext('('+match[1]+')',Object.create(null),{timeout:1000});
 const known=new Set(schema.map(s=>s.key));
 if(Object.keys(data.settings).some(k=>!known.has(k))||Object.keys(data.settings).length!==known.size)throw Error('Settings do not match the current game. Refresh the game and copy again.');
 for(const field of schema){
  const n=data.settings[field.key];
  if(typeof n!=='number'||!Number.isFinite(n)||n<field.min||n>field.max||(field.type==='toggle'&&n!==0&&n!==1)||(field.options&&!field.options.some(o=>o.value===n)))throw Error('Invalid setting: '+field.key);
 }
 if(!data.debug||typeof data.debug.hitboxes!=='boolean'||typeof data.debug.contacts!=='boolean'||Object.keys(data.debug).some(k=>!['hitboxes','contacts'].includes(k)))throw Error('Invalid debug views.');
 let count=0;
 const nextSchema=match[1].replace(/(^.*key:'([^']+)'.*?\bvalue:)([-\d.]+)/gm,(line,prefix,key)=>{count++;return prefix+JSON.stringify(data.settings[key])});
 if(count!==schema.length)throw Error('Could not update every default.');
 if(!/const DEFAULT_DEBUG=\{[^\n]*\};/.test(source))throw Error('Debug defaults not found.');
 return source.replace(match[1],nextSchema).replace(/const DEFAULT_DEBUG=\{[^\n]*\};/,'const DEFAULT_DEBUG='+JSON.stringify(data.debug)+';');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const target=new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url);
 const source=fs.readFileSync(target,'utf8');
 const next=applyPublishedDefaults(source,process.env.DEFAULTS_JSON);
 fs.writeFileSync(target,next);
 console.log('Validated and applied owner-selected game defaults.');
}
