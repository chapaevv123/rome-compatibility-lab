import {decodeEventLog,decodeFunctionResult,encodeFunctionData,encodePacked,type Hex} from 'viem';
import cpi from './cpi-memo-artifact.json';
import lane from './lane-probe-artifact.json';
import {assertWallet,DEPLOYER,HADRIAN_CHAIN_ID,type WalletProvider} from './flow';
import {padRomeGas} from '../../../vendor/rome-sdk/write.mjs';

export const LANE_ADDRESS='0x1607af4e1da1c06362871443d2e95c367b984efa' as const;
export const LANE_DEPLOY_HASH='0x76d3a3383926b2d0e6c7953fd28c1a3472ef655a3d5ad9c046b383428ae58004' as const;
export const MEMO='Rome Compatibility Lab CPI-MEMO-01';
export type Kind='observe'|'cpiDeploy'|'invokeMemo';
export type Quote={kind:Kind;to?:Hex;data:Hex;balance:bigint;estimatedGas:bigint;gasLimit:bigint;maxFeePerGas:bigint;maxPriorityFeePerGas:bigint;maxCost:bigint};
export type Verified={kind:Kind;hash:Hex;contract:Hex;block:bigint;actualFee:bigint;detail:string};
const lower=(value:string)=>value.toLowerCase();
const hash=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
const addr=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{40}$/i.test(value);
const num=(value:unknown,label:string)=>{if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))throw Error(`Invalid ${label}`);return BigInt(value)};
const asHex=(n:bigint)=>`0x${n.toString(16)}` as Hex;
const isCode=(value:unknown)=>typeof value==='string'&&/^0x[0-9a-f]+$/i.test(value)&&value!=='0x';
const laneAbi=lane.abi as Parameters<typeof encodeFunctionData>[0]['abi'];
const cpiAbi=cpi.abi as Parameters<typeof encodeFunctionData>[0]['abi'];

export async function verifyCpiArtifact(){
  if(cpi.status!=='STATIC_ONLY'||cpi.registryVersion!=='v0.3.0'||cpi.chainId!==Number(HADRIAN_CHAIN_ID)||cpi.sourceHash!=='sha256:fb871220e9c4d9eb13e22ae9964636e315297cc748faecc62c6a93ae6f04448a'||cpi.bytecodeHash!=='sha256:302884ae38397c29959a8e0d746bbc8c4749baa79d57c3e10bb2cc69c1ac44ad'||cpi.programIdHex!=='0x054a535a992921064d24e87160da387c7c35b5ddbc92bb81e41fa8404105448d')throw Error('CPI artifact mismatch');
  const bytes=Uint8Array.from(cpi.creationBytecode.slice(2).match(/../g)??[],x=>parseInt(x,16));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(`sha256:${digest}`!==cpi.bytecodeHash)throw Error('CPI bytecode mismatch');
}
export function operationData(kind:Kind):Hex {
  if(kind==='cpiDeploy')return cpi.creationBytecode as Hex;
  if(kind==='observe')return encodeFunctionData({abi:laneAbi,functionName:'observe'});
  return encodeFunctionData({abi:cpiAbi,functionName:'invokeMemo',args:[encodePacked(['string'],[MEMO])]});
}
export async function verifyLaneDeployment(provider:WalletProvider){
  if(num(await provider.request({method:'eth_chainId'}),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('RPC is not Hadrian');
  const raw=await provider.request({method:'eth_getTransactionReceipt',params:[LANE_DEPLOY_HASH]}) as Record<string,unknown>|null;
  if(!raw||lower(String(raw.transactionHash))!==lower(LANE_DEPLOY_HASH)||num(raw.status,'status')!==1n||!addr(raw.contractAddress)||lower(raw.contractAddress)!==lower(LANE_ADDRESS)||num(raw.blockNumber,'block')!==519434508n)throw Error('LaneProbe deployment receipt mismatch');
  const code=await provider.request({method:'eth_getCode',params:[LANE_ADDRESS,'latest']});
  if(!isCode(code))throw Error('LaneProbe code missing');
}
export async function prepareOperation(provider:WalletProvider,kind:Kind,cpiAddress?:Hex):Promise<Quote>{
  await assertWallet(provider);
  if(kind==='cpiDeploy')await verifyCpiArtifact();
  if(kind==='observe')await verifyLaneDeployment(provider);
  if(kind==='invokeMemo'&&!addr(cpiAddress))throw Error('Verified CPI deployment required');
  const to=kind==='observe'?LANE_ADDRESS:kind==='invokeMemo'?cpiAddress:undefined;
  const data=operationData(kind);
  const tx={from:DEPLOYER,...(to?{to}:{}),data};
  const [balanceRaw,gasRaw,priceRaw,blockRaw,tipRaw]=await Promise.all([
    provider.request({method:'eth_getBalance',params:[DEPLOYER,'latest']}),
    provider.request({method:'eth_estimateGas',params:[tx]}),
    provider.request({method:'eth_gasPrice'}),
    provider.request({method:'eth_getBlockByNumber',params:['latest',false]}),
    provider.request({method:'eth_maxPriorityFeePerGas'}).catch(()=>null)
  ]);
  const estimatedGas=num(gasRaw,'gas estimate');
  const gasLimit=padRomeGas(estimatedGas);
  const baseRaw=(blockRaw as {baseFeePerGas?:unknown}|null)?.baseFeePerGas;
  const baseFee=baseRaw?num(baseRaw,'base fee'):0n;
  const gasPrice=num(priceRaw,'gas price');
  const tip=tipRaw?num(tipRaw,'priority fee'):0n;
  const maxFeePerGas=baseFee>0n?baseFee*11n/10n+tip:gasPrice;
  if(estimatedGas<=0n||maxFeePerGas<=0n)throw Error('No usable gas or fee estimate');
  return {kind,to,data,balance:num(balanceRaw,'balance'),estimatedGas,gasLimit,maxFeePerGas,maxPriorityFeePerGas:baseFee>0n?tip:gasPrice,maxCost:gasLimit*maxFeePerGas};
}
export async function sendOperation(provider:WalletProvider,quote:Quote):Promise<Hex>{
  await assertWallet(provider);
  if(quote.kind==='cpiDeploy')await verifyCpiArtifact();
  if(quote.kind==='observe')await verifyLaneDeployment(provider);
  if(quote.data!==operationData(quote.kind)||quote.to!==(quote.kind==='observe'?LANE_ADDRESS:quote.kind==='cpiDeploy'?undefined:quote.to)||quote.kind==='invokeMemo'&&!addr(quote.to))throw Error('Transaction changed');
  const fresh=await prepareOperation(provider,quote.kind,quote.to);
  if(fresh.to!==quote.to||fresh.data!==quote.data||fresh.gasLimit>quote.gasLimit||fresh.maxFeePerGas>quote.maxFeePerGas||fresh.balance<quote.maxCost)throw Error('Balance or fee changed; refresh estimate');
  const tx={from:DEPLOYER,...(quote.to?{to:quote.to}:{}),data:quote.data,gas:asHex(quote.gasLimit),maxFeePerGas:asHex(quote.maxFeePerGas),maxPriorityFeePerGas:asHex(quote.maxPriorityFeePerGas)};
  await assertWallet(provider);
  const result=await provider.request({method:'eth_sendTransaction',params:[tx]});
  if(!hash(result))throw Error('Wallet returned invalid transaction hash');
  return result;
}
export async function verifyOperation(provider:WalletProvider,kind:Kind,txHash:Hex,cpiAddress?:Hex):Promise<Verified|null>{
  if(!hash(txHash))throw Error('Invalid transaction hash');
  if(num(await provider.request({method:'eth_chainId'}),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('RPC is not Hadrian');
  if(kind==='cpiDeploy')await verifyCpiArtifact();
  if(kind==='observe')await verifyLaneDeployment(provider);
  const receipt=await provider.request({method:'eth_getTransactionReceipt',params:[txHash]}) as Record<string,unknown>|null;
  if(!receipt)return null;
  if(lower(String(receipt.transactionHash))!==lower(txHash)||num(receipt.status,'status')!==1n)throw Error('Receipt failed or hash mismatch');
  const tx=await provider.request({method:'eth_getTransactionByHash',params:[txHash]}) as Record<string,unknown>|null;
  if(!tx||!addr(tx.from)||lower(tx.from)!==lower(DEPLOYER)||lower(String(tx.input??tx.data))!==lower(operationData(kind)))throw Error('Transaction sender or calldata mismatch');
  const contract=kind==='observe'?LANE_ADDRESS:kind==='cpiDeploy'?receipt.contractAddress:cpiAddress;
  if(!addr(contract))throw Error('Contract address missing');
  if(kind==='cpiDeploy'?(tx.to!=null||lower(String(receipt.contractAddress))!==lower(contract)):(lower(String(tx.to))!==lower(contract)||lower(String(receipt.to))!==lower(contract)))throw Error('Contract address mismatch');
  const code=await provider.request({method:'eth_getCode',params:[contract,'latest']});
  if(!isCode(code))throw Error('Contract code missing');
  const block=num(receipt.blockNumber,'block');
  const actualFee=num(receipt.gasUsed,'gas used')*num(receipt.effectiveGasPrice,'effective gas price');
  let detail='Deployment code and receipt verified; Solana CPI remains unverified';
  if(kind==='observe'){
    const logs=receipt.logs;
    if(!Array.isArray(logs))throw Error('Observed event missing');
    const found=logs.some(log=>{try{if(!addr(log.address)||lower(log.address)!==lower(LANE_ADDRESS))return false;const event=decodeEventLog({abi:laneAbi,data:log.data,topics:log.topics});const args=event.args as {caller?:string;blockNumber?:bigint;timestamp?:bigint};return event.eventName==='Observed'&&lower(String(args.caller))===lower(DEPLOYER)&&args.blockNumber===block&&typeof args.timestamp==='bigint'&&args.timestamp>0n}catch{return false}});
    if(!found)throw Error('Observed event mismatch');
    const read=await provider.request({method:'eth_call',params:[{from:DEPLOYER,to:LANE_ADDRESS,data:encodeFunctionData({abi:laneAbi,functionName:'caller'})},asHex(block)]});
    if(lower(String(decodeFunctionResult({abi:laneAbi,functionName:'caller',data:read as Hex})))!==lower(DEPLOYER))throw Error('LaneProbe caller() readback mismatch');
    detail='Observed event and caller() readback verified';
  }
  if(kind!=='observe'){
    const read=await provider.request({method:'eth_call',params:[{from:DEPLOYER,to:contract,data:encodeFunctionData({abi:cpiAbi,functionName:'memoProgram'})},asHex(block)]});
    if(lower(String(decodeFunctionResult({abi:cpiAbi,functionName:'memoProgram',data:read as Hex})))!==lower(cpi.programIdHex))throw Error('Memo program readback mismatch');
    if(kind==='invokeMemo')detail='EVM receipt, calldata and memoProgram() verified; Solana CPI execution/settlement unverified';
  }
  return {kind,hash:txHash,contract,block,actualFee,detail};
}
