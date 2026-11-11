'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verifyCode}=require('../career/curriculum/verify');
test('native Java compiles dynamic dispatch while hiding host environment and files',()=>{
 process.env.NATIVE_TEST_SENTINEL='synthetic-host-value';try{
 const r=verifyCode({lang:'java',code:'class Main { static class Base { int value(){return 2;} } static class Child extends Base { int value(){return 7;} } public static void main(String[] a){ Base x=new Child(); System.out.println(x.value()); System.out.println(System.getenv("NATIVE_TEST_SENTINEL")==null); System.out.println(new java.io.File("/workspace").exists()); }}',expect:'7\ntrue\nfalse'});
 assert.equal(r.ok,true,JSON.stringify(r));assert.match(r.runtime,/OpenJDK 21/);assert.match(r.profile,/no host workspace\/home or network/);
 }finally{delete process.env.NATIVE_TEST_SENTINEL;}
});
test('Dart checks real null safety and executes typed collection semantics',()=>{
 const r=verifyCode({lang:'dart',code:'void main(){ final prices=<int>[3,5,7]; print(prices.where((n)=>n>3).fold<int>(0,(a,b)=>a+b)); }',expect:'12'});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.runtime,'Dart 3.13.7');
 const bad=verifyCode({lang:'dart',code:'void main(){ int value=null; print(value); }',expect:'null'});assert.equal(bad.ok,false);assert.match(bad.problem,/compilation or execution failed/);
});
test('Kotlin compiles real nullable expressions on the isolated JVM',()=>{
 const r=verifyCode({lang:'kotlin',code:'fun main(){ val value:String?=null; println(value?.length ?: 4); println(listOf(2,3).map{it*it}.sum()) }',expect:'4\n13'});assert.equal(r.ok,true,JSON.stringify(r));assert.match(r.runtime,/Kotlin 2.2.21/);assert.match(r.runtime,/not Android/);
});
test('CPU PyTorch verifies autograd rather than substituting a mathematical mock',()=>{
 const r=verifyCode({lang:'python-torch',code:'import torch, os\ntorch.set_num_threads(1)\nx=torch.tensor([3.0],requires_grad=True)\n(x*x).backward()\nprint(x.grad.item())\nprint(x.device.type)\nprint(os.path.exists("/workspace"))',expect:'6.0\ncpu\nFalse'});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.runtime,'CPU PyTorch 2.15.0+cpu');
});
test('native verification refuses invalid compilation and a contradictory answer key',()=>{
 assert.equal(verifyCode({lang:'java',code:'class Main { broken }',expect:'anything'}).ok,false);
 const r=verifyCode({lang:'dart',code:'void main(){print(4);}',expect:'4',options:['4','5','6','7'],answer:1});assert.equal(r.ok,false);assert.match(r.problem,/keyed option differs/);
});
