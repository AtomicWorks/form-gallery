import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const entry=path.join(dist,'index.html');
let html=await fs.readFile(entry,'utf8');
// On Vercel, social previews should point to this deployment, not the old host.
const host=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;
if(host){
  const origin=new URL(`https://${host}`).origin;
  html=html.replace(/(<meta property="og:image" content=")[^"]+("\s*\/?>)/,`$1${origin}/social.svg$2`);
  await fs.writeFile(entry,html);
}
const assets=new Set([...html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)].map(m=>m[1]));
assets.add('/vendor/three.module.js');assets.add('/vendor/three.core.js');
for(const asset of assets){await fs.access(path.join(dist,asset.slice(1)));}
console.log(`FORM ready: index.html and ${assets.size} local assets verified.`);
