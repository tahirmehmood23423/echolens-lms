'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,base='http://127.0.0.1:4318';
(async()=>{const before=path.join(root,'course-inventory-before.json'),current=path.join(root,'course-inventory.json');if(!fs.existsSync(before))fs.copyFileSync(current,before);
const {catalogue}=await(await fetch(base+'/api/public/catalogue')).json();const courses=[];
for(const item of catalogue.filter(c=>c.price_pkr===0&&c.track_key)){const r=await fetch(base+'/api/public/tracks/'+encodeURIComponent(item.track_key));if(!r.ok)throw Error('Track unavailable: '+item.track_key);courses.push({catalogue:item,...await r.json()});}
fs.writeFileSync(current,JSON.stringify({generated_at:new Date().toISOString(),courses},null,2));console.log(JSON.stringify({courses:courses.length,modules:courses.reduce((n,c)=>n+new Set(c.levels.map(l=>l.week)).size,0),lessons:courses.reduce((n,c)=>n+c.levels.length,0),assignments:courses.reduce((n,c)=>n+c.levels.reduce((m,l)=>m+l.problems.length,0),0)}));})().catch(e=>{console.error(e);process.exitCode=1});
