import {readFileSync,writeFileSync} from 'node:fs';
import {getChain} from '@rome-protocol/registry';
import {createPublicClient,http,isAddress,isHash,type Abi,type Hex} from 'viem';

const cpi=process.argv.includes('--cpi');
const evidencePath=cpi?'hadrian-cpi-execution.json':'hadrian-execution.json';
const artifactPath=cpi?'cpi-preparation.json':'probe-preparation.json';
const chain=getChain(200010);if(!chain||chain.chainId!==200010)throw Error('Hadrian registry mismatch');
const evidence=JSON.parse(readFileSync(evidencePath,'utf8')) as {chainId:number;contractAddress:string;sourceHash:string;deploy:{hash:string};observe?:{hash?:string}};
const artifact=JSON.parse(readFileSync(artifactPath,'utf8')) as {sourceHash:string;abi:Abi;programIdHex?:Hex};
if(evidence.chainId!==200010||evidence.sourceHash!==artifact.sourceHash||!isAddress(evidence.contractAddress)||!isHash(evidence.deploy.hash))throw Error('Invalid or stale evidence');
const client=createPublicClient({transport:http(chain.rpcUrl,{timeout:15_000})});
if(await client.getChainId()!==200010)throw Error('RPC chain ID mismatch');
const deploy=await client.getTransactionReceipt({hash:evidence.deploy.hash as Hex});
const code=await client.getCode({address:evidence.contractAddress as Hex});
if(deploy.status!=='success'||deploy.contractAddress?.toLowerCase()!==evidence.contractAddress.toLowerCase()||!code||code==='0x')throw Error('Deployment receipt/code mismatch');
let call:{status:string;hash?:string;blockNumber?:string;readback?:string;solana?:unknown}={status:'NOT_RUN'};
if(evidence.observe?.hash){
 if(!isHash(evidence.observe.hash))throw Error('Invalid call transaction hash');
 const receipt=await client.getTransactionReceipt({hash:evidence.observe.hash as Hex});
 if(receipt.status!=='success'||receipt.to?.toLowerCase()!==evidence.contractAddress.toLowerCase())throw Error('Call receipt mismatch');
 const readback=await client.readContract({address:evidence.contractAddress as Hex,abi:artifact.abi,functionName:cpi?'memoProgram':'caller'});
 if(cpi&&readback!==artifact.programIdHex)throw Error('Memo program readback mismatch');
 call={status:'LIVE_EVM_RECEIPT_VERIFIED',hash:receipt.transactionHash,blockNumber:receipt.blockNumber.toString(),readback:String(readback)};
 if(cpi){
  const response=await fetch(chain.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'rome_solanaTxForEvmTx',params:[receipt.transactionHash]}),signal:AbortSignal.timeout(15_000)});
  const mapping=await response.json() as {result?:unknown;error?:unknown};
  call.solana={status:'INCONCLUSIVE',mapping:mapping.result??null,error:mapping.error??null,note:'Inspect mapped signatures and Solana transaction logs before claiming CPI success.'};
 }
}
const result={status:cpi?'PENDING_SOLANA_VERIFICATION':'LIVE_VERIFIED',checkedAt:new Date().toISOString(),chainId:200010,registryVersion:'v0.3.0',contractAddress:evidence.contractAddress,sourceHash:evidence.sourceHash,deploy:{hash:deploy.transactionHash,blockNumber:deploy.blockNumber.toString(),status:deploy.status,codePresent:true},call};
writeFileSync(cpi?'hadrian-cpi-verification.json':'hadrian-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
