import {it} from 'node:test';
import assert from 'node:assert/strict';
import {submitRomeTx} from '../vendor/rome-sdk/write.mjs';
it('official Rome write wrapper pads estimate and uses 1559 fees',async()=>{
 let sent:Record<string,string>|undefined;
 const provider={async request({method,params=[]}:{method:string;params?:unknown[]}):Promise<unknown>{
  if(method==='eth_estimateGas')return '0x64';
  if(method==='eth_getBlockByNumber')return {baseFeePerGas:'0x64'};
  if(method==='eth_maxPriorityFeePerGas')return '0x2';
  if(method==='eth_gasPrice')return '0x66';
  if(method==='eth_sendTransaction'){sent=(params[0]||{}) as Record<string,string>;return '0xabc';}
  throw Error('unexpected method');
 }};
 const hash=await submitRomeTx(provider,{from:'0x1000000000000000000000000000000000000001',data:'0x01'});
 assert.equal(hash,'0xabc');assert.equal(sent?.gas,'0x82');assert.equal(sent?.maxFeePerGas,'0x70');assert.equal(sent?.maxPriorityFeePerGas,'0x2');
});
