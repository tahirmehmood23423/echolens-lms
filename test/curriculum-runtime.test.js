'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verifyCode}=require('../career/curriculum/verify');
test('native JavaScript executes with private environment and host workspace absent',()=>{
 process.env.VERIFIER_TEST_SENTINEL='synthetic-host-value';try{
 const r=verifyCode({lang:'javascript',code:'console.log([1,2,3].map(x=>x*2).join(","));console.log(process.env.VERIFIER_TEST_SENTINEL===undefined);console.log(require("fs").existsSync("/workspace"));',expect:'2,4,6\ntrue\nfalse'});
 assert.equal(r.ok,true,JSON.stringify(r));assert.match(r.profile,/no network/);
 }finally{delete process.env.VERIFIER_TEST_SENTINEL;}
});
test('pandas executes real grouped operations in the isolated package runtime',()=>{
 const r=verifyCode({lang:'python-pandas',code:'import pandas as pd, os\ndf=pd.DataFrame({"group":["A","A","B"],"units":[2,3,4]})\nprint(df.groupby("group")["units"].sum().to_dict())\nprint(os.path.exists("/workspace"))',expect:"{'A': 5, 'B': 4}\nFalse"});assert.equal(r.ok,true,JSON.stringify(r));
});
test('FastAPI validates and filters actual synthetic ASGI requests without a TCP server',()=>{
 const code='from fastapi import FastAPI\nfrom fastapi.testclient import TestClient\nfrom pydantic import BaseModel\nclass Public(BaseModel):\n    value: int\na=FastAPI()\n@a.post("/items", response_model=Public)\ndef create(item: Public):\n    return {"value":item.value,"private_note":"SYNTHETIC"}\nwith TestClient(a) as c:\n    print(c.post("/items",json={"value":2}).json())\n    print(c.post("/items",json={}).status_code)';
 assert.equal(verifyCode({lang:'python-fastapi',code,expect:"{'value': 2}\n422"}).ok,true);
});
test('additional runtime profiles reject wrong outputs and unsupported languages',()=>{
 assert.equal(verifyCode({lang:'javascript',code:'console.log(2+2)',expect:'5'}).ok,false);
 assert.equal(verifyCode({lang:'python-pandas',code:'print(4)',expect:'5'}).ok,false);
 assert.equal(verifyCode({lang:'untrusted-shell',code:'echo secret',expect:'secret'}).ran,false);
});
test('strict TypeScript checks real types before emitted JavaScript executes',()=>{
 const valid=verifyCode({lang:'typescript',code:'const count: number = 3; console.log(count * 2);',expect:'6'});assert.equal(valid.ok,true,JSON.stringify(valid));assert.equal(valid.runtime,'TypeScript 5.9.3');
 const invalid=verifyCode({lang:'typescript',code:'const count: number = "three"; console.log("must not run");',expect:'TS2322'});assert.equal(invalid.ok,true,JSON.stringify(invalid));
});
test('actual React server rendering escapes text and keeps host workspace unavailable',()=>{
 const r=verifyCode({lang:'javascript-react',code:'const React=require("react"),{renderToStaticMarkup}=require("react-dom/server");console.log(renderToStaticMarkup(React.createElement("p",null,"<script>")));console.log(require("fs").existsSync("/workspace"));',expect:'<p>&lt;script&gt;</p>\nfalse'});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.runtime,'React 19.2.0');assert.match(r.profile,/not evidence about browser effects/);
});
