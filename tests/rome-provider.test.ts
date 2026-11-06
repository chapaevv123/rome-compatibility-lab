import {it} from 'node:test';import assert from 'node:assert/strict';
import {createApprovedRomeProvider} from '../lib/rome-provider';
const address='0x1000000000000000000000000000000000000001' as const;
it('burner adapter refuses a send without approval and enforces the ceiling',async()=>{
 let sent=0;const provider=createApprovedRomeProvider({address,read:async()=>null,send:async()=>{sent++;return '0xabc';}});
 const tx={from:address,gas:'0x82',maxFeePerGas:'0x70',maxPriorityFeePerGas:'0x2'};
 await assert.rejects(()=>provider.request({method:'eth_sendTransaction',params:[tx]}),/ceiling/);
 provider.approve(14559n);await assert.rejects(()=>provider.request({method:'eth_sendTransaction',params:[tx]}),/ceiling/);
 provider.approve(14560n);assert.equal(await provider.request({method:'eth_sendTransaction',params:[tx]}),'0xabc');assert.equal(sent,1);
 await assert.rejects(()=>provider.request({method:'eth_sendTransaction',params:[tx]}),/ceiling/);
});
it('burner adapter rejects a mismatched sender and unknown RPC method',async()=>{const provider=createApprovedRomeProvider({address,read:async()=>null,send:async()=>{throw Error('unexpected send');}});provider.approve(100000n);await assert.rejects(()=>provider.request({method:'eth_sendTransaction',params:[{from:'0x2000000000000000000000000000000000000002',gas:'0x1',maxFeePerGas:'0x1',maxPriorityFeePerGas:'0x1'}]}),/Invalid SDK/);await assert.rejects(()=>provider.request({method:'eth_sign',params:[]}),/Unexpected SDK/);});
