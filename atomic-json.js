'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
function atomicJson(file,data,{io=fs,sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)}={}){
  const temporary=file+'.'+crypto.randomUUID()+'.tmp';
  try{
    io.writeFileSync(temporary,JSON.stringify(data,null,2));
    const fd=io.openSync(temporary,'r+');try{io.fsyncSync(fd);}finally{io.closeSync(fd);}
    // Windows antivirus/indexing can briefly lock the destination. Never
    // delete the previous good store to work around a rename failure.
    for(let attempt=0;;attempt++){try{io.renameSync(temporary,file);return;}catch(e){if(attempt>=8||!['EPERM','EACCES','EBUSY'].includes(e.code))throw e;sleep(25);}}
  }catch(e){try{io.unlinkSync(temporary);}catch{}throw e;}
}
module.exports={atomicJson};
