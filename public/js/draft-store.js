(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EchoDraftStore=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  function key(identity){if(!identity[0])throw Error('Sign in to save drafts.');return 'el:draft:v1:'+JSON.stringify(identity.map(String));}
  function read(storage,identity){const raw=storage.getItem(key(identity));if(!raw)return null;const row=JSON.parse(raw);if(typeof row.code!=='string'||!Number.isInteger(row.revision))throw Error('Draft could not be read.');return row;}
  function write(storage,identity,code,revision){const current=read(storage,identity);if((current?.revision||0)!==revision)throw Error('A newer draft exists in another tab. Copy your work before reloading.');const next={code,revision:revision+1,saved_at:new Date().toISOString()};storage.setItem(key(identity),JSON.stringify(next));return next;}
  return{key,read,write};
});
