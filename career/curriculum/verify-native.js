'use strict';
// Optional native development runtimes. No workspace/home binds, network or fallback.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const DART='/tmp/echolens-wave4-dart/dart-sdk',TORCH='/tmp/echolens-wave4-torch',KOTLIN='/tmp/echolens-wave4-kotlin/kotlinc',JAVA='/usr/lib/jvm/java-21-openjdk-amd64/bin/java';
const LIMITS='import os,sys,resource\nresource.setrlimit(resource.RLIMIT_CPU,(8,8))\nresource.setrlimit(resource.RLIMIT_AS,(3221225472,3221225472))\nresource.setrlimit(resource.RLIMIT_FSIZE,(8388608,8388608))\nresource.setrlimit(resource.RLIMIT_NPROC,(64,64))\n';
const JVM=['-XX:ActiveProcessorCount=1','-XX:+UseSerialGC','-Xmx96m','-Xss256k','-XX:MaxMetaspaceSize=128m','-XX:CompressedClassSpaceSize=32m','-XX:ReservedCodeCacheSize=32m'];
function verifyNative(q,{sandbox,python,pythonRoot}){
 if(!q.code||q.expect==null)return {ran:false};
 const args=[...sandbox];let command,runtime,profile='Isolated native runtime; private environment, no host workspace/home or network; bounded CPU, memory, processes and output.';
 if(q.lang==='dart'){
  if(!fs.existsSync(path.join(DART,'bin/dart')))return {ran:true,ok:false,problem:'Pinned Dart development runtime unavailable; no unsandboxed fallback.'};
  args.push('--ro-bind',DART,'/dart-sdk','--setenv','DART_SUPPRESS_ANALYTICS','true');
  const launcher=LIMITS+'open("/tmp/example.dart","w",encoding="utf-8").write(sys.argv[1])\nos.execv("/dart-sdk/bin/dart",["/dart-sdk/bin/dart","--disable-dart-dev","/tmp/example.dart"])';
  command=['/usr/bin/python3','-I','-c',launcher,q.code];runtime='Dart '+fs.readFileSync(path.join(DART,'version'),'utf8').trim();
 }else if(q.lang==='java'){
  if(!fs.existsSync(JAVA))return {ran:true,ok:false,problem:'Java source-launch runtime unavailable; no unsandboxed fallback.'};
  if(fs.existsSync('/etc/java-21-openjdk'))args.push('--ro-bind','/etc/java-21-openjdk','/etc/java-21-openjdk');
  const launcher=LIMITS+'open("/tmp/Main.java","w",encoding="utf-8").write(sys.argv[1])\nos.execv('+JSON.stringify(JAVA)+','+JSON.stringify([JAVA,...JVM,'/tmp/Main.java'])+')';
  command=['/usr/bin/python3','-I','-c',launcher,q.code];runtime='OpenJDK '+(fs.readFileSync('/usr/lib/jvm/java-21-openjdk-amd64/release','utf8').match(/^JAVA_VERSION="([^"]+)"/m)?.[1]||'21');
 }else if(q.lang==='kotlin'){
  if(!fs.existsSync(path.join(KOTLIN,'lib/kotlin-compiler.jar'))||!fs.existsSync(JAVA))return {ran:true,ok:false,problem:'Pinned Kotlin/Java development runtime unavailable; no unsandboxed fallback.'};
  args.push('--ro-bind',KOTLIN,'/kotlin');
  if(fs.existsSync('/etc/java-21-openjdk'))args.push('--ro-bind','/etc/java-21-openjdk','/etc/java-21-openjdk');
  const vm=[JAVA,...JVM.map(a=>a==='-Xmx96m'?'-Xmx192m':a)];
  const compile=[...vm,'-cp','/kotlin/lib/*','org.jetbrains.kotlin.cli.jvm.K2JVMCompiler','-no-stdlib','-no-reflect','-classpath','/kotlin/lib/kotlin-stdlib.jar:/kotlin/lib/annotations-13.0.jar','-d','/tmp/classes','/tmp/Main.kt'];
  const run=[...vm,'-cp','/tmp/classes:/kotlin/lib/kotlin-stdlib.jar','MainKt'];
  const launcher=LIMITS.replaceAll('(8,8)','(12,12)').replaceAll('3221225472','4294967296')+'import subprocess\nopen("/tmp/Main.kt","w",encoding="utf-8").write(sys.argv[1])\nsubprocess.run('+JSON.stringify(compile)+',check=True)\nos.execv('+JSON.stringify(JAVA)+','+JSON.stringify(run)+')';
  command=['/usr/bin/python3','-I','-c',launcher,q.code];runtime='Kotlin '+fs.readFileSync(path.join(KOTLIN,'build.txt'),'utf8').trim().split('-')[0]+' on OpenJDK 21 (standalone JVM; not Android)';
 }else if(q.lang==='python-torch'){
  if(!fs.existsSync(path.join(TORCH,'torch/__init__.py'))||!fs.existsSync(python))return {ran:true,ok:false,problem:'Pinned CPU PyTorch development runtime unavailable; no unsandboxed fallback.'};
  args.push('--ro-bind',pythonRoot,pythonRoot,'--ro-bind',TORCH,'/torch-packages','--setenv','OPENBLAS_NUM_THREADS','1','--setenv','OMP_NUM_THREADS','1','--setenv','MKL_NUM_THREADS','1');
  const launcher=LIMITS.replaceAll('3221225472','4294967296')+'sys.path.insert(0,"/torch-packages")\nexec(sys.argv[1])';
  command=[python,'-I','-c',launcher,q.code];runtime='CPU PyTorch '+fs.readFileSync(path.join(TORCH,'torch/version.py'),'utf8').match(/__version__[^=]*=\s*['"]([^'"]+)/)?.[1];
  profile+=' Single-thread CPU tensors; no GPU, provider calls or external datasets.';
 }else return {ran:false};
 let output;
 try{output=execFileSync('bwrap',[...args,...command],{encoding:'utf8',timeout:q.lang==='kotlin'?18000:14000,maxBuffer:65536,env:{},stdio:['pipe','pipe','pipe']}).trimEnd();}
 catch(e){return {ran:true,ok:false,problem:e.code==='ENOENT'||String(e.stderr||'').includes('bwrap:')?'Native verification requires bubblewrap isolation; no unsandboxed fallback.':'Native compilation or execution failed: '+String(e.stderr||e.message).trim().slice(-1500)};}
 if(output!==String(q.expect).trimEnd())return {ran:true,ok:false,output,problem:'Native output differs from the declared expected output.'};
 if(Array.isArray(q.options)&&Number.isInteger(q.answer)&&String(q.options[q.answer]).trim()!==String(q.expect).trim())return {ran:true,ok:false,output,problem:'The keyed option differs from verified native output.'};
 return {ran:true,ok:true,output,runtime,profile};
}
module.exports={verifyNative};
