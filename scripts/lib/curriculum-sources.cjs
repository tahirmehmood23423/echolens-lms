'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function verifyHttpSnapshot(root,reference,repo){
 const meta=reference.source,url=new URL(meta.url);
 if(repo!=='aws/official-documentation-snapshots'||url.protocol!=='https:'||!['docs.aws.amazon.com','aws.amazon.com'].includes(url.hostname)||url.username||url.password)throw Error('Unsupported official snapshot source.');
 const base=fs.realpathSync(root),target=path.resolve(base,meta.path);
 if(!target.startsWith(base+path.sep)||!fs.realpathSync(target).startsWith(base+path.sep))throw Error('Invalid snapshot path.');
 const record=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'))[meta.path];
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
 if(!record||record.url!==meta.url||record.http_status!==200||record.sha256!==sha256||sha256!==meta.sha256||!meta.fetched_at||record.fetched_at!==meta.fetched_at)throw Error('Official HTTP snapshot evidence mismatch: '+reference.id);
 return {id:reference.id,path:meta.path,url:meta.url,sha256,fetched_at:meta.fetched_at,checked_by:'Captured official HTTPS response bytes and matching capture manifest; not an immutable Git revision'};
}
module.exports={verifyHttpSnapshot};
