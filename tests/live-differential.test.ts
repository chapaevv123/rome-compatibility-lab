import {test} from 'node:test';
import assert from 'node:assert/strict';
import local from '../evidence/local-execution.json';
import evidence from '../evidence/hadrian-live.json';
import {assessLiveDifferential,type LocalLedger} from '../lib/live-differential';
import type {ReleaseEvidence} from '../lib/release-evidence';
import {DEPLOYER,type WalletProvider} from '../app/hadrian/metamask/flow';
import {LANE_ADDRESS,LANE_DEPLOY_HASH,verifyOperation} from '../app/hadrian/metamask/operations';

const clone=()=>structuredClone(evidence) as ReleaseEvidence;
const ledger=local as LocalLedger;
test('only matching LaneProbe is comparable; other scenarios stay blocked',()=>{
  const result=assessLiveDifferential(ledger,clone());
  assert.deepEqual(result.summary,{compatible:1,divergent:0,blocked:3});
  assert.equal(result.rows.find(row=>row.testId==='LaneProbe')?.classification,'COMPATIBLE');
  for(const id of ['Clean','OriginHint','Counter'])assert.equal(result.rows.find(row=>row.testId===id)?.hadrian.status,'NOT_EXECUTED');
});
test('wrong chain ID is rejected',()=>{const data=clone();data.chainId=1;assert.throws(()=>assessLiveDifferential(ledger,data),/chain ID/)});
test('failed receipt cannot be reused as verified',()=>{const data=clone();data.cases[1].receiptStatus='REVERT' as 'SUCCESS';assert.throws(()=>assessLiveDifferential(ledger,data),/evidence mismatch/)});
test('wrong or reused transaction hash is rejected',()=>{const data=clone();data.cases[1].transactionHash=data.cases[0].transactionHash;assert.throws(()=>assessLiveDifferential(ledger,data),/evidence mismatch/)});
test('event, readback and local bytecode tampering are rejected',()=>{
  const data=clone();data.cases[1].event='Observed(caller=0x0000000000000000000000000000000000000000, blockNumber=519444073, timestamp=1)';
  assert.throws(()=>assessLiveDifferential(ledger,data),/event mismatch/);
  const data2=clone();data2.cases[1].readback='0x0000000000000000000000000000000000000000';
  assert.throws(()=>assessLiveDifferential(ledger,data2),/evidence mismatch/);
  const changed=structuredClone(local) as LocalLedger;changed.records[2].bytecodeHash='sha256:wrong';
  assert.throws(()=>assessLiveDifferential(changed,clone()),/bytecode differs/);
});
test('RPC failure must not produce a live claim',async()=>{
  const failure=async()=>{throw Error('RPC unavailable')};
  await assert.rejects(async()=>assessLiveDifferential(ledger,await failure()),/RPC unavailable/);
});
test('receipt verifier rejects invalid calldata, wrong chain, failed transaction and RPC error',async()=>{
  const observeHash='0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f';
  const provider=(mode:'calldata'|'chain'|'failed'|'rpc'):WalletProvider=>({request:async({method,params})=>{
    if(mode==='rpc')throw Error('RPC unavailable');
    if(method==='eth_chainId')return mode==='chain'?'0x1':'0x30d4a';
    if(method==='eth_getTransactionReceipt')return (params?.[0]===LANE_DEPLOY_HASH)?{transactionHash:LANE_DEPLOY_HASH,status:'0x1',contractAddress:LANE_ADDRESS,blockNumber:'0x1ef5f10c'}:{transactionHash:observeHash,status:mode==='failed'?'0x0':'0x1',to:LANE_ADDRESS,blockNumber:'0x1ef61569',gasUsed:'0x2711',effectiveGasPrice:'0x1',logs:[]};
    if(method==='eth_getCode')return '0x6000';
    if(method==='eth_getTransactionByHash')return {from:DEPLOYER,to:LANE_ADDRESS,input:'0xdead'};
    throw Error(`Unexpected ${method}`);
  }});
  await assert.rejects(verifyOperation(provider('calldata'),'observe',observeHash),/calldata mismatch/);
  await assert.rejects(verifyOperation(provider('chain'),'observe',observeHash),/not Hadrian/);
  await assert.rejects(verifyOperation(provider('failed'),'observe',observeHash),/Receipt failed/);
  await assert.rejects(verifyOperation(provider('rpc'),'observe',observeHash),/RPC unavailable/);
});
