import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {getChain} from '@rome-protocol/registry';
import {createPublicClient,createWalletClient,http,encodeFunctionData,decodeEventLog,isAddress,type Hex,type Abi} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {submitRomeTx,padRomeGas} from '../vendor/rome-sdk/write.mjs';
import {createApprovedRomeProvider} from '../lib/rome-provider';

if(process.argv[2]!=='--send')throw Error('Explicit --send flag required. Use npm run hadrian:dry-run first.');
const cpi=process.argv.includes('--cpi');
const network=getChain(200010);if(!network||network.chainId!==200010)throw Error('Hadrian registry mismatch');
const key=process.env.ROME_BURNER_PRIVATE_KEY;
const publicAddress=process.env.ROME_BURNER_ADDRESS;
if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key)||!publicAddress||!isAddress(publicAddress))throw Error('Set a separate burner key and its public address in local environment variables');
const account=privateKeyToAccount(key as Hex);
if(account.address.toLowerCase()!==publicAddress.toLowerCase())throw Error('Burner public address does not match private key');
const artifact=JSON.parse(readFileSync(cpi?'cpi-preparation.json':'probe-preparation.json','utf8')) as {status:string;network?:{chainId:number};chainId?:number;contract?:string;sourceHash:string;bytecodeHash?:string;compiler:string;creationBytecode:Hex;abi:readonly unknown[];registryVersion:string;programIdHex?:Hex};
const source=readFileSync(cpi?'probes/CpiMemoProbe.sol':'probes/LaneProbe.sol','utf8').replace(/\r\n/g,'\n');
if(artifact.status!==(cpi?'STATIC_ONLY':'UNVERIFIED')||(artifact.network?.chainId??artifact.chainId)!==200010||artifact.registryVersion!=='v0.3.0'||(!cpi&&artifact.contract!=='LaneProbe')||artifact.sourceHash!=='sha256:'+createHash('sha256').update(source).digest('hex'))throw Error('Stale or wrong unsigned artifact');
const publicClient=createPublicClient({transport:http(network.rpcUrl,{timeout:15_000})});
if(await publicClient.getChainId()!==200010)throw Error('RPC is not Hadrian testnet');
const chain={id:200010,name:network.name,nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:{default:{http:[network.rpcUrl]}}} as const;
const wallet=createWalletClient({account,chain,transport:http(network.rpcUrl,{timeout:15_000})});
const rl=createInterface({input,output});
const provider=createApprovedRomeProvider({address:account.address,read:(method,params)=>publicClient.request({method,params} as never),send:tx=>wallet.sendTransaction(tx)});
async function approve(label:string,gas:bigint,price:bigint){const max=gas*price;const answer=await rl.question(`${label} on Hadrian 200010 from ${account.address}; max ${max} wei. Type APPROVE ${label}: `);if(answer.trim()!==`APPROVE ${label}`)throw Error('Transaction group not approved');provider.approve(max);}
try{
 const balance=await publicClient.getBalance({address:account.address});
 const price=await publicClient.getGasPrice();
 const deploymentGas=await publicClient.estimateGas({account:account.address,data:artifact.creationBytecode});
 const deployLimit=padRomeGas(deploymentGas);
 const block=await publicClient.getBlock();const tip=await publicClient.estimateMaxPriorityFeePerGas().catch(()=>0n);
 const feeCeiling=(block.baseFeePerGas||price)*11n/10n+tip;
 if(balance<deployLimit*feeCeiling)throw Error('Burner has insufficient test USDC for deployment estimate');
 await approve('DEPLOY',deployLimit,feeCeiling);
 const deployHash=await submitRomeTx(provider,{from:account.address,data:artifact.creationBytecode});
 const evidencePath=cpi?'hadrian-cpi-execution.json':'hadrian-execution.json';
 writeFileSync(evidencePath,JSON.stringify({status:'SUBMITTED_UNVERIFIED',testId:cpi?'CPI-MEMO-DEPLOY-01':'LANE-PROBE-DEPLOY-01',chainId:200010,registryVersion:'v0.3.0',compiler:artifact.compiler,sourceHash:artifact.sourceHash,bytecodeHash:artifact.bytecodeHash,checkedAt:new Date().toISOString(),deploy:{hash:deployHash,explorerUrl:`${network.explorerUrl}tx/${deployHash}`},observe:{status:'NOT_RUN'}},null,2));
 const receipt=await publicClient.waitForTransactionReceipt({hash:deployHash,timeout:120_000});
 if(receipt.status!=='success'||!receipt.contractAddress){writeFileSync(evidencePath,JSON.stringify({status:'FAILED',deploy:{hash:deployHash,blockNumber:receipt.blockNumber.toString(),receiptStatus:receipt.status}},null,2));throw Error(`Deployment failed: ${deployHash}`);}
 const address=receipt.contractAddress;
 const code=await publicClient.getCode({address});if(!code||code==='0x')throw Error('Deployment receipt has no contract code');
 const deployEvidence={status:cpi?'PENDING_SOLANA_VERIFICATION':'LIVE_VERIFIED',testId:cpi?'CPI-MEMO-DEPLOY-01':'LANE-PROBE-DEPLOY-01',chainId:200010,registryVersion:'v0.3.0',compiler:artifact.compiler,sourceHash:artifact.sourceHash,bytecodeHash:artifact.bytecodeHash,checkedAt:new Date().toISOString(),contractAddress:address,contractCodePresent:true,deploy:{hash:deployHash,blockNumber:receipt.blockNumber.toString(),status:receipt.status,gasUsed:receipt.gasUsed.toString(),explorerUrl:`${network.explorerUrl}tx/${deployHash}`},observe:{status:'NOT_RUN'}};
 writeFileSync(evidencePath,JSON.stringify(deployEvidence,null,2));
 console.log(`Deployment receipt and code verified; saved ${deployHash} to ${evidencePath}`);
 const callData=cpi?encodeFunctionData({abi:artifact.abi as Abi,functionName:'invokeMemo',args:['0x726f6d652d6c6162']}):encodeFunctionData({abi:artifact.abi as Abi,functionName:'observe'});
 const callGas=await publicClient.estimateGas({account:account.address,to:address,data:callData});
 const callBlock=await publicClient.getBlock();const callTip=await publicClient.estimateMaxPriorityFeePerGas().catch(()=>0n);
 await approve(cpi?'CPI_INVOKE':'OBSERVE',padRomeGas(callGas),(callBlock.baseFeePerGas||await publicClient.getGasPrice())*11n/10n+callTip);
 const callHash=await submitRomeTx(provider,{from:account.address,to:address,data:callData});
 writeFileSync(evidencePath,JSON.stringify({...deployEvidence,observe:{status:'SUBMITTED_UNVERIFIED',hash:callHash,explorerUrl:`${network.explorerUrl}tx/${callHash}`}},null,2));
 const callReceipt=await publicClient.waitForTransactionReceipt({hash:callHash,timeout:120_000});
 if(callReceipt.status!=='success'){writeFileSync(evidencePath,JSON.stringify({...deployEvidence,status:'FAILED',observe:{hash:callHash,blockNumber:callReceipt.blockNumber.toString(),status:callReceipt.status}},null,2));throw Error(`Observe transaction failed: ${callHash}`);}
 const events=callReceipt.logs.filter(log=>log.address.toLowerCase()===address.toLowerCase()).map(log=>{const event=decodeEventLog({abi:artifact.abi as Abi,data:log.data,topics:log.topics}) as {eventName:string;args:unknown};return {name:event.eventName,args:JSON.parse(JSON.stringify(event.args,(_,v)=>typeof v==='bigint'?v.toString():v))};});
 const readback=await publicClient.readContract({address,abi:artifact.abi as Abi,functionName:cpi?'memoProgram':'caller',account:account.address});
 if(cpi&&readback!==artifact.programIdHex)throw Error('CPI contract program ID readback mismatch');
 const evidence={status:cpi?'PENDING_SOLANA_VERIFICATION':'LIVE_VERIFIED',testId:cpi?'CPI-MEMO-01':'LANE-PROBE-01',chainId:200010,registryVersion:'v0.3.0',compiler:artifact.compiler,sourceHash:artifact.sourceHash,bytecodeHash:artifact.bytecodeHash,checkedAt:new Date().toISOString(),contractAddress:address,contractCodePresent:true,deploy:{hash:deployHash,blockNumber:receipt.blockNumber.toString(),status:receipt.status,gasUsed:receipt.gasUsed.toString(),explorerUrl:`${network.explorerUrl}tx/${deployHash}`},observe:{hash:callHash,blockNumber:callReceipt.blockNumber.toString(),status:callReceipt.status,gasUsed:callReceipt.gasUsed.toString(),explorerUrl:`${network.explorerUrl}tx/${callHash}`,events,readback},note:cpi?'Solana settlement signature and Memo program invocation must be independently checked before CPI is LIVE_VERIFIED.':'Solana settlement signature must be collected separately; EVM gas is not Solana CU.'};
 writeFileSync(evidencePath,JSON.stringify(evidence,null,2));
 console.log(`${evidence.status} receipt and state readback saved to ${evidencePath}`);
}finally{rl.close();}
