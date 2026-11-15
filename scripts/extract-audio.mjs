import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dirtbike_wheelie_landing_fixed.html',import.meta.url),'utf8');
const folder=new URL('../assets/extracted-audio/',import.meta.url);fs.mkdirSync(folder,{recursive:true});
for(const [declaration,extension] of [['CRASH_VOICE_DATA','wav'],['GAME_MUSIC_DATA','mp3']]){
 const values=JSON.parse(source.match(new RegExp('const '+declaration+'=(.*);\\n'))[1]);
 for(const [key,data] of Object.entries(values))fs.writeFileSync(new URL(key.replace(/[^a-z0-9_-]/gi,'_')+'.'+extension,folder),Buffer.from(data,'base64'));
}
const party=JSON.parse(source.match(/const PARTY_MUSIC_DATA=(.*);\n/)[1]);fs.writeFileSync(new URL('neon-overdrive.mp3',folder),Buffer.from(party,'base64'));
const track=JSON.parse(source.match(/const PARTY_TRACK=(.*);\n/)[1]);fs.writeFileSync(new URL('party-track.json',folder),JSON.stringify(track,null,2));
const meta=JSON.parse(source.match(/const RECORDED_REACTIONS=(.*);\n/)[1]);fs.writeFileSync(new URL('reactions.json',folder),JSON.stringify(meta,null,2));
console.log('Extracted the embedded voice WAVs, music MP3s (including Neon Overdrive), and metadata to assets/extracted-audio/. The game still uses its embedded copies.');
