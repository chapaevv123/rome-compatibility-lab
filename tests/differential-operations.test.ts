import {test} from 'node:test';
import assert from 'node:assert/strict';
import planJson from '../evidence/unsigned-differential-plan.json';
import {DEPLOYER,type WalletProvider} from '../app/hadrian/metamask/flow';
import {assertDifferentialPlan,numeric,quoteDifferentialStep,sendDifferentialStep,verifyDifferentialStep,type DifferentialPlan} from '../lib/differential-operations';
import {parseDifferentialHashes} from '../lib/differential-record';
import {encodeAbiParameters,encodeEventTopics} from 'viem';

const plan=planJson as DifferentialPlan;
const txHash=`0x${'ab'.repeat(32)}` as const;
test('pending nonce accepts JSON-RPC, EIP-1193 and viem quantities without weakening validation',()=>{
  for(const value of ['0x4','4',4,4n])assert.equal(numeric(value,'pending nonce'),4n);
  for(const value of [4.5,-1,-1n,'-1','04','0x4garbage','',null,{},Number.MAX_SAFE_INTEGER+1])assert.throws(()=>numeric(value,'pending nonce'),/Invalid pending nonce/);
});
function wallet(change:Record<string,unknown>={}){
  const calls:string[]=[];let sent:unknown=null;
  const provider:WalletProvider={isMetaMask:true,request:async({method,params})=>{
    calls.push(method);
    if(method==='eth_sendTransaction'){sent=params?.[0];return txHash}
    const defaults:Record<string,unknown>={eth_chainId:'0x30d4a',eth_accounts:[DEPLOYER],eth_getTransactionCount:'0x4',eth_getBalance:'0x8ac7230489e80000',eth_getCode:'0x',eth_estimateGas:'0x100000',eth_gasPrice:'0x100',eth_getBlockByNumber:{baseFeePerGas:'0x100'},eth_maxPriorityFeePerGas:'0x10'};
    if(method in change)return change[method];
    if(method in defaults)return defaults[method];
    throw Error(`Unexpected ${method}`);
  }};
  return {provider,calls,get sent(){return sent}};
}
test('pinned plan accepts exact creation, runtime and call data; rejects tampering',async()=>{
  await assertDifferentialPlan(plan);
  const modified=structuredClone(plan);modified.cases[0].call.data='0xdead';
  await assert.rejects(assertDifferentialPlan(modified),/calldata mismatch/);
  const modifiedCode=structuredClone(plan);modifiedCode.cases[0].runtimeBytecode='0x6000';
  await assert.rejects(assertDifferentialPlan(modifiedCode),/bytecode hash mismatch/);
});
test('quote is read-only and rejects wrong chain, nonce, occupied address and insufficient balance',async()=>{
  const good=wallet();const quote=await quoteDifferentialStep(good.provider,plan,'deploy:Clean',{});
  assert.equal(quote.nonce,4n);assert.equal(good.calls.includes('eth_sendTransaction'),false);
  for(const nonce of [4,4n,'4'])assert.equal((await quoteDifferentialStep(wallet({eth_getTransactionCount:nonce}).provider,plan,'deploy:Clean',{})).nonce,4n);
  for(const [key,value,pattern] of [['eth_chainId','0x1',/Hadrian/],['eth_getTransactionCount','0x5',/nonce changed/],['eth_getCode','0x6000',/already exists/],['eth_getBalance','0x1',/Insufficient balance/]] as const){
    const invalid=wallet({[key]:value});await assert.rejects(quoteDifferentialStep(invalid.provider,plan,'deploy:Clean',{}),pattern);assert.equal(invalid.calls.includes('eth_sendTransaction'),false);
  }
});
test('one explicit send uses the quoted nonce and exact creation bytecode',async()=>{
  const mock=wallet();const quote=await quoteDifferentialStep(mock.provider,plan,'deploy:Clean',{});
  assert.equal(mock.calls.includes('eth_sendTransaction'),false);
  assert.equal(await sendDifferentialStep(mock.provider,plan,quote,{}),txHash);
  assert.deepEqual(mock.sent,{from:DEPLOYER,data:plan.cases[0].deployment.data,nonce:'0x4',gas:`0x${quote.gasLimit.toString(16)}`,maxFeePerGas:`0x${quote.maxFeePerGas.toString(16)}`,maxPriorityFeePerGas:`0x${quote.maxPriorityFeePerGas.toString(16)}`,value:'0x0'});
  assert.equal(mock.calls.filter(x=>x==='eth_sendTransaction').length,1);
});
test('fresh nonce or fee change prevents MetaMask send',async()=>{
  const mock=wallet();const quote=await quoteDifferentialStep(mock.provider,plan,'deploy:Clean',{});
  const changed=wallet({eth_getTransactionCount:'0x5'});
  await assert.rejects(sendDifferentialStep(changed.provider,plan,quote,{}),/nonce changed/);
  assert.equal(changed.calls.includes('eth_sendTransaction'),false);
  const altered=wallet();
  await assert.rejects(sendDifferentialStep(altered.provider,plan,{...quote,data:'0xdead'},{}),/calldata/);
  assert.equal(altered.calls.includes('eth_sendTransaction'),false);
});
test('already verified deployment cannot be quoted again',async()=>{
  const mock=wallet();
  await assert.rejects(quoteDifferentialStep(mock.provider,plan,'deploy:Clean',{'deploy:Clean':{step:'deploy:Clean',hash:txHash,contract:plan.cases[0].predictedAddress,blockNumber:'1',gasUsed:'1',actualFeeWei:'1'}}),/previous receipts/);
  assert.equal(mock.calls.includes('eth_sendTransaction'),false);
});
test('receipt verifier rejects failed deployment and accepts exact code and transaction',async()=>{
  const item=plan.cases[0];const base={transactionHash:txHash,status:'0x1',contractAddress:item.predictedAddress,blockNumber:'0x100',gasUsed:'0x1000',effectiveGasPrice:'0x100'};
  const transaction={hash:txHash,from:DEPLOYER,to:null,input:item.deployment.data,nonce:'0x4',value:'0x0'};
  const good=wallet({eth_getTransactionReceipt:base,eth_getTransactionByHash:transaction,eth_getCode:item.runtimeBytecode});
  const verified=await verifyDifferentialStep(good.provider,plan,'deploy:Clean',txHash);
  assert.equal(verified?.contract,item.predictedAddress);
  const failed=wallet({eth_getTransactionReceipt:{...base,status:'0x0'},eth_getTransactionByHash:transaction});
  await assert.rejects(verifyDifferentialStep(failed.provider,plan,'deploy:Clean',txHash),/receipt or transaction mismatch/);
});
test('Counter call requires the real Incremented event and count readback',async()=>{
  const item=plan.cases[2];const eventAbi=[{type:'event',name:'Incremented',inputs:[{name:'value',type:'uint256',indexed:false}]}] as const;
  const topics=encodeEventTopics({abi:eventAbi,eventName:'Incremented'});
  const receipt={transactionHash:txHash,status:'0x1',to:item.predictedAddress,blockNumber:'0x110',gasUsed:'0x2000',effectiveGasPrice:'0x100',logs:[{address:item.predictedAddress,topics,data:encodeAbiParameters([{type:'uint256'}],[1n])}]};
  const transaction={hash:txHash,from:DEPLOYER,to:item.predictedAddress,input:item.call.data,nonce:'0x9',value:'0x0'};
  const good=wallet({eth_getTransactionReceipt:receipt,eth_getTransactionByHash:transaction,eth_getCode:item.runtimeBytecode,eth_call:encodeAbiParameters([{type:'uint256'}],[1n])});
  assert.equal((await verifyDifferentialStep(good.provider,plan,'call:Counter',txHash))?.execution?.state?.count,'1');
  const bad=wallet({eth_getTransactionReceipt:{...receipt,logs:[]},eth_getTransactionByHash:transaction,eth_getCode:item.runtimeBytecode});
  await assert.rejects(verifyDifferentialStep(bad.provider,plan,'call:Counter',txHash),/Incremented/);
});
test('capture refuses duplicate or unknown transaction hashes',()=>{
  const base={version:1,chainId:200010,sender:DEPLOYER,hashes:{'deploy:Clean':txHash}};
  assert.equal(parseDifferentialHashes(base).hashes['deploy:Clean'],txHash);
  assert.throws(()=>parseDifferentialHashes({...base,hashes:{...base.hashes,'call:Clean':txHash}}),/Duplicate/);
  assert.throws(()=>parseDifferentialHashes({...base,hashes:{bad:txHash}}),/Invalid/);
});
