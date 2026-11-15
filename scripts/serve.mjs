import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));const port=Number(process.env.PORT||8000);
http.createServer((req,res)=>{
 let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 if(requested==='/')requested='/dirtbike_wheelie_landing_fixed.html';
 const file=path.resolve(root,'.'+requested);
 if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return}
 const types={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wav':'audio/wav','.mp3':'audio/mpeg'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}).listen(port,'0.0.0.0',()=>console.log(`Game preview: http://localhost:${port} (use your cloud workspace port preview). Public tablet access may require an HTTPS deployment.`));
