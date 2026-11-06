import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {DEPLOYER,type WalletProvider} from '../app/hadrian/metamask/flow';
import {LANE_ADDRESS,LANE_DEPLOY_HASH,operationData,prepareOperation,sendOperation,verifyCpiArtifact} from '../app/hadrian/metamask/operations';
import artifact from '../app/hadrian/metamask/cpi-memo-artifact.json';
import hadrian from '../app/hadrian/metamask/hadrian-chain.json';
import {getChain} from '@rome-protocol/registry';

const sent=`0x${'ab'.repeat(32)}`;
function mock(){
  const calls:string[]=[];
  let chain='0x30d4a';
  const provider:WalletProvider={isMetaMask:true,request:async ({method,params})=>{
    calls.push(method);
    if(method==='eth_chainId')return chain;
    if(method==='eth_accounts')return [DEPLOYER];
    if(method==='eth_getTransactionReceipt')return {transactionHash:LANE_DEPLOY_HASH,status:'0x1',contractAddress:LANE_ADDRESS,blockNumber:'0x1ef5f10c'};
    if(method==='eth_getCode')return '0x6000';
    if(method==='eth_estimateGas'){const tx=(params as Record<string,unknown>[])[0];assert.equal(tx.from,DEPLOYER);assert.equal(tx.to,LANE_ADDRESS);assert.equal(tx.data,operationData('observe'));return '0x10000'}
    if(method==='eth_sendTransaction'){const tx=(params as Record<string,unknown>[])[0];assert.equal(tx.to,LANE_ADDRESS);assert.equal(tx.data,operationData('observe'));return sent}
    const values:Record<string,unknown>={eth_getBalance:'0xde0b6b3a7640000',eth_gasPrice:'0x64',eth_getBlockByNumber:{baseFeePerGas:'0x64'},eth_maxPriorityFeePerGas:'0x0'};
    return values[method];
  }};
  return {provider,calls,changeChain:(value:string)=>{chain=value}};
}

test('CPI deployment uses the pinned prepared artifact and current ABI',async()=>{await verifyCpiArtifact();assert.match(operationData('cpiDeploy'),/^0x[0-9a-f]+$/i);execFileSync(process.execPath,['--require','./scripts/tsx-userinfo.cjs','--import','tsx','scripts/prepare-cpi.ts']);const prepared=JSON.parse(readFileSync('cpi-preparation.json','utf8'));assert.equal(artifact.creationBytecode,prepared.creationBytecode);assert.deepEqual(artifact.abi,prepared.abi)});
test('server-safe Hadrian metadata matches registry v0.3.0',()=>{assert.deepEqual(hadrian,getChain(200010))});
test('observe estimate is read-only and a changed chain blocks sending',async()=>{
  const {provider,calls,changeChain}=mock();
  const quote=await prepareOperation(provider,'observe');
  assert.equal(quote.to,LANE_ADDRESS);
  assert.equal(calls.includes('eth_sendTransaction'),false);
  changeChain('0x1');
  await assert.rejects(sendOperation(provider,quote),/Select Hadrian/);
  assert.equal(calls.includes('eth_sendTransaction'),false);
});
test('observe submission occurs only after an explicit send call',async()=>{
  const {provider,calls}=mock();
  const quote=await prepareOperation(provider,'observe');
  assert.equal(calls.filter(x=>x==='eth_sendTransaction').length,0);
  assert.equal(await sendOperation(provider,quote),sent);
  assert.equal(calls.filter(x=>x==='eth_sendTransaction').length,1);
});
