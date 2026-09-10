'use strict';
const fs=require('node:fs'),path=require('node:path');
const {launch,BASE}=require('../qa-audit/browser-lib.cjs');
const inventory=require('./course-inventory-before.json');
const urls=[...new Set(inventory.courses.flatMap(c=>c.levels.map(l=>l.video_url).filter(Boolean)))];
const file=path.join(__dirname,'evidence/video-checks.json'),privateDir=path.join(__dirname,'runtime/video-content');fs.mkdirSync(privateDir,{recursive:true});
const results=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
const queue=urls.filter(url=>!results.some(r=>r.url===url));
function save(row){results.push(row);fs.writeFileSync(file,JSON.stringify(results,null,2));console.log(JSON.stringify({done:results.length,total:urls.length,...row}));}
async function observe(page){return page.evaluate(()=>{const v=document.querySelector('video');return {video:!!v,time:v?.currentTime||0,ready:v?.readyState,error:v?.error?.code,paused:v?.paused,text:document.body.innerText.slice(0,350)};});}
(async()=>{const browser=await launch();try{await Promise.all([1,2].map(async worker=>{
 const ctx=await browser.newContext({viewport:{width:1200,height:800}});const p=await ctx.newPage(),embed=await ctx.newPage();await embed.goto(BASE+'/compiler',{waitUntil:'domcontentloaded'});
 for(;;){const url=queue.shift();if(!url)break;const id=new URL(url).searchParams.get('v'),row={url,id,checked_at:new Date().toISOString(),availability:'UNVERIFIED',embedding:'UNVERIFIED',playback:'UNVERIFIED',relevance:'UNVERIFIED'};
 try{
   const response=await p.goto(url,{waitUntil:'domcontentloaded',timeout:22000});row.http=response.status();await p.waitForFunction(()=>window.ytInitialPlayerResponse,{timeout:8000});
   const content=await p.evaluate(()=>{const r=window.ytInitialPlayerResponse;return {status:r.playabilityStatus,details:r.videoDetails,captions:r.captions?.playerCaptionsTracklistRenderer?.captionTracks||[]};});
   row.title=content.details?.title;row.author=content.details?.author;row.duration_seconds=Number(content.details?.lengthSeconds)||null;row.provider_status=content.status.status;row.provider_reason=content.status.reason;row.availability=content.status.status==='OK'?'AVAILABLE':/unavailable|removed|private|copyright/i.test(content.status.reason||'')?'PROVIDER_RESTRICTION':'UNVERIFIED';
   if(content.captions.length){try{const r=await ctx.request.get(content.captions[0].baseUrl+'&fmt=json3',{timeout:8000});const text=await r.text();content.transcript=text.slice(0,250000);row.transcript_bytes=text.length;row.transcript_http=r.status();}catch(e){row.transcript_error=e.message.slice(0,180);}}
   fs.writeFileSync(path.join(privateDir,id+'.json'),JSON.stringify(content,null,2));
   await embed.setContent('<iframe width="960" height="600" allow="autoplay; encrypted-media" src="https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&enablejsapi=1&origin='+encodeURIComponent(BASE)+'"></iframe>',{waitUntil:'domcontentloaded'});
   const frame=embed.frameLocator('iframe');try{await frame.locator('video').waitFor({timeout:12000});const f=embed.frames().find(f=>f.url().includes('/embed/'));await f.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return v.play().catch(()=>{});});const before=await observe(f);await embed.waitForTimeout(2500);const after=await observe(f);row.embedding='PLAYER_LOADED';row.playback_start=before.time;row.playback_end=after.time;row.playback=after.time>before.time+.5?'PLAYED':'UNVERIFIED';if(row.playback==='UNVERIFIED')row.playback_reason=after.text||'Player time did not advance';}
   catch(e){const f=embed.frames().find(f=>f.url().includes('/embed/'));row.embedding_reason=f?await f.evaluate(()=>document.body.innerText.slice(0,350)).catch(()=>e.message):e.message.slice(0,200);}
   if(results.length<3)await embed.screenshot({path:path.join(__dirname,'evidence/video-probe-'+worker+'.png')});
 }catch(e){row.error=e.message.slice(0,250);}
 save(row);
 }await ctx.close();
}));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
