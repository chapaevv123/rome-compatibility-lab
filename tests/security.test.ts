import {afterEach,describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {POST} from '../app/api/scan/route';
import {scan} from '../lib/scanner';
import {toMarkdown} from '../lib/markdown';
import {acquireScanSlot} from '../lib/scan-quota';

const originalFetch=globalThis.fetch;
const originalEnv={enabled:process.env.ROME_SCAN_API_ENABLED,url:process.env.UPSTASH_REDIS_REST_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN};
afterEach(()=>{globalThis.fetch=originalFetch;for(const [key,value] of Object.entries({ROME_SCAN_API_ENABLED:originalEnv.enabled,UPSTASH_REDIS_REST_URL:originalEnv.url,UPSTASH_REDIS_REST_TOKEN:originalEnv.token})){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
const request=(body:BodyInit,contentType='application/json')=>new NextRequest('http://localhost/api/scan',{method:'POST',headers:{'Content-Type':contentType},body});
function enable(){process.env.ROME_SCAN_API_ENABLED='1';process.env.UPSTASH_REDIS_REST_URL='https://test.upstash.io/';process.env.UPSTASH_REDIS_REST_TOKEN='test-only-token';}

describe('public scan boundary',()=>{
 it('fails closed with no shared quota configuration',async()=>{delete process.env.ROME_SCAN_API_ENABLED;const response=await POST(request('{}'));assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');assert.doesNotMatch(await response.text(),/token|stack|C:\\Users/i);});
 it('fails closed if the shared quota service is unavailable',async()=>{enable();globalThis.fetch=async()=>{throw Error('secret token failed');};const response=await POST(request('{}'));assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/secret token/);});
 it('uses atomic shared quota and releases a granted slot',async()=>{enable();const calls:unknown[][]=[];globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body)) as unknown[];calls.push(body);return Response.json({result:1});};const slot=await acquireScanSlot();assert.equal(slot.status,'allowed');await slot.release?.();assert.equal(calls.length,2);assert.equal(calls[0][0],'EVAL');assert.equal(calls[1][0],'EVAL');});
 it('returns 429 when the shared quota is exhausted',async()=>{enable();globalThis.fetch=async()=>Response.json({result:0});const response=await POST(request('{}'));assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'3600');});
 it('rejects malformed UTF-8, invalid schema and traversal without leaking input',async()=>{enable();globalThis.fetch=async()=>Response.json({result:1});for(const body of [new Uint8Array([0xff]),JSON.stringify({files:[{path:'../secret.sol',content:'secret-marker'}]}),JSON.stringify({files:[{path:'A.sol',content:'pragma solidity ^0.8.24;'}],github:'https://github.com/a/b'})]){const response=await POST(request(body));assert.equal(response.status,400);assert.doesNotMatch(await response.text(),/secret-marker|C:\\Users/);}});
 it('rejects binary source and Markdown HTML injection',()=>{assert.throws(()=>scan([{path:'A.sol',content:'\0binary'}]));const report=scan([{path:'<img src=x>.sol',content:'pragma solidity ^0.8.24; contract A {function f() external view returns(address){return tx.origin;}}'}]);const markdown=toMarkdown(report);assert.doesNotMatch(markdown,/<img/);assert.match(markdown,/&lt;img/);});
});
