import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {importGitHub} from '../lib/github';

const json=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
async function withFetch(responses:Response[],run:(calls:Array<[RequestInfo|URL,RequestInit|undefined]>)=>Promise<void>){
 const original=globalThis.fetch;
 const calls:Array<[RequestInfo|URL,RequestInit|undefined]>=[];
 globalThis.fetch=async(input,init)=>{calls.push([input,init]);const response=responses.shift();if(!response)throw Error('Unexpected fetch');return response;};
 try{await run(calls);}finally{globalThis.fetch=original;}
}
describe('GitHub URL guard',()=>{
 it('rejects non GitHub hosts before network access',async()=>{await assert.rejects(importGitHub('https://127.0.0.1/owner/repo'),/Only public/);});
 it('rejects encoded and literal traversal',async()=>{await assert.rejects(importGitHub('https://github.com/owner/repo/tree/..%2Fsecret'),/Only public/);await assert.rejects(importGitHub('https://github.com/owner/..'),/Invalid GitHub/);});
 it('rejects traversal returned by GitHub tree',async()=>{await withFetch([json({private:false,default_branch:'main'}),json({tree:[{type:'blob',path:'../secret.sol',size:1,sha:'a'.repeat(40)}]})],async calls=>{await assert.rejects(importGitHub('https://github.com/owner/repo'),/unsafe/);assert.equal(calls.length,2);});});
 it('rejects oversized Solidity files instead of silently omitting them',async()=>{await withFetch([json({private:false,default_branch:'main'}),json({tree:[{type:'blob',path:'large.sol',size:100001,sha:'a'.repeat(40)}]})],async()=>{await assert.rejects(importGitHub('https://github.com/owner/repo'),/oversized/);});});
 it('validates blob bytes and keeps all requests on the fixed GitHub API',async()=>{await withFetch([json({private:false,default_branch:'main'}),json({tree:[{type:'blob',path:'src/A.sol',size:3,sha:'a'.repeat(40)}]}),json({encoding:'base64',content:Buffer.from('abc').toString('base64')})],async calls=>{assert.deepEqual(await importGitHub('https://github.com/owner/repo'),[{path:'src/A.sol',content:'abc'}]);for(const [url,init] of calls){assert.match(String(url),/^https:\/\/api\.github\.com\/repos\/owner\/repo/);assert.equal(init?.redirect,'error');}});});
 it('rejects a blob whose actual size differs from the tree',async()=>{await withFetch([json({private:false,default_branch:'main'}),json({tree:[{type:'blob',path:'A.sol',size:4,sha:'a'.repeat(40)}]}),json({encoding:'base64',content:Buffer.from('abc').toString('base64')})],async()=>{await assert.rejects(importGitHub('https://github.com/owner/repo'),/size mismatch/);});});
 it('rejects binary bytes mislabeled as Solidity',async()=>{await withFetch([json({private:false,default_branch:'main'}),json({tree:[{type:'blob',path:'A.sol',size:1,sha:'a'.repeat(40)}]}),json({encoding:'base64',content:'/w=='})],async()=>{await assert.rejects(importGitHub('https://github.com/owner/repo'),/UTF-8/);});});
});
