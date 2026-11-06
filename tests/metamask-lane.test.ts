import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {assertWallet,connectWallet,DEPLOYER,prepareQuote,sendLaneDeployment,verifyArtifact,waitForDeployment,type WalletProvider} from '../app/hadrian/metamask/flow';
import artifact from '../app/hadrian/metamask/lane-probe-artifact.json';

const txHash=`0x${'ab'.repeat(32)}` as `0x${string}`;
function wallet(overrides:Record<string,unknown>={}){
  const calls:string[]=[];
  const provider:WalletProvider={isMetaMask:true,request:async ({method,params})=>{
    calls.push(method);
    if(method==='eth_sendTransaction')return txHash;
    if(method==='eth_getTransactionReceipt')return {transactionHash:txHash,status:'0x1',contractAddress:`0x${'12'.repeat(20)}`,gasUsed:'0x1000',effectiveGasPrice:'0x64',blockNumber:'0x2'};
    if(method==='eth_estimateGas'){
      const tx=(params as Record<string,unknown>[])[0];
      assert.equal(tx.from,DEPLOYER);
      assert.equal(tx.data,artifact.creationBytecode);
      assert.equal(tx.to,undefined);
    }
    const values:Record<string,unknown>={eth_chainId:'0x30d4a',eth_accounts:[DEPLOYER],eth_requestAccounts:[DEPLOYER],eth_getBalance:'0xde0b6b3a7640000',eth_estimateGas:'0x1000',eth_gasPrice:'0x64',eth_getBlockByNumber:{baseFeePerGas:'0x64'},eth_maxPriorityFeePerGas:'0x0'};
    return method in overrides?overrides[method]:values[method];
  }};
  return {provider,calls};
}

test('checked-in LaneProbe calldata matches prepared artifact and source',async()=>{
  await verifyArtifact();
  execFileSync(process.execPath,['--require','./scripts/tsx-userinfo.cjs','--import','tsx','scripts/prepare-probe.ts']);
  const prepared=JSON.parse(readFileSync('probe-preparation.json','utf8'));
  assert.equal(artifact.creationBytecode,prepared.creationBytecode);
  assert.equal(artifact.bytecodeHash,prepared.bytecodeHash);
  const source=readFileSync('probes/LaneProbe.sol','utf8').replace(/\r\n/g,'\n');
  assert.equal(artifact.sourceHash,'sha256:'+createHash('sha256').update(source).digest('hex'));
});

test('connect and estimate never request a transaction',async()=>{
  const {provider,calls}=wallet();
  await connectWallet(provider);
  const quote=await prepareQuote(provider);
  assert.equal(quote.address,DEPLOYER);
  assert.equal(quote.gasLimit,0x1000n*13n/10n);
  assert.equal(calls.includes('eth_sendTransaction'),false);
});

test('wrong chain or address cannot estimate or send',async()=>{
  await assert.rejects(assertWallet(wallet({eth_chainId:'0x1'}).provider),/Select Hadrian/);
  await assert.rejects(assertWallet(wallet({eth_accounts:[`0x${'11'.repeat(20)}`]}).provider),/Select only/);
  const {provider,calls}=wallet({eth_chainId:'0x1'});
  await assert.rejects(prepareQuote(provider),/Select Hadrian/);
  assert.equal(calls.includes('eth_sendTransaction'),false);
});

test('wallet changes after the estimate block submission',async()=>{
  const changed:Record<string,unknown>={eth_chainId:'0x30d4a'};
  const {provider,calls}=wallet(changed);
  const quote=await prepareQuote(provider);
  changed.eth_chainId='0x1';
  await assert.rejects(sendLaneDeployment(provider,quote),/Select Hadrian/);
  changed.eth_chainId='0x30d4a';
  changed.eth_accounts=[`0x${'11'.repeat(20)}`];
  await assert.rejects(sendLaneDeployment(provider,quote),/Select only/);
  assert.equal(calls.includes('eth_sendTransaction'),false);
});

test('one explicit deployment uses only checked calldata and waits for receipt',async()=>{
  const {provider,calls}=wallet();
  const quote=await prepareQuote(provider);
  assert.equal(calls.includes('eth_sendTransaction'),false);
  assert.equal(await sendLaneDeployment(provider,quote),txHash);
  const receipt=await waitForDeployment(provider,txHash);
  assert.equal(receipt.actualFee,0x1000n*0x64n);
  assert.equal(calls.filter(call=>call==='eth_sendTransaction').length,1);
  assert.equal(calls.includes('eth_call'),false);
});

test('insufficient balance blocks wallet transaction',async()=>{
  const {provider,calls}=wallet({eth_getBalance:'0x0'});
  const quote=await prepareQuote(provider);
  await assert.rejects(sendLaneDeployment(provider,quote),/Insufficient/);
  assert.equal(calls.includes('eth_sendTransaction'),false);
});
