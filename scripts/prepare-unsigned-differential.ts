import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {encodeFunctionData,getContractAddress,type Hex} from 'viem';
import chain from '../app/hadrian/metamask/hadrian-chain.json';
import {DEPLOYER,HADRIAN_CHAIN_ID} from '../app/hadrian/metamask/flow';
import ledger from '../evidence/local-execution.json';
import {padRomeGas} from '../vendor/rome-sdk/write.mjs';

// Read-only planner. It does not use a wallet, sign, or submit transactions.
const compilerPath=new URL('../vendor/solc-0.8.24/soljson.cjs',import.meta.url);
if(createHash('sha256').update(readFileSync(compilerPath)).digest('hex')!=='fb59b825b7d57f9de89cd9de2415b12aab1fcc7eb2573fd2bf5c9b969eacf4d9')throw Error('Compiler integrity failure');
const soljson=createRequire(import.meta.url)(fileURLToPath(compilerPath)) as {cwrap:(name:string,returnType:string,argTypes:string[])=>Function};
const version=String(soljson.cwrap('solidity_version','string',[])());
const compile=soljson.cwrap('solidity_compile','string',['string','number','number']);
if(chain.chainId!==Number(HADRIAN_CHAIN_ID))throw Error('Pinned Hadrian chain mismatch');
async function rpc(method:string,params:unknown[]=[]):Promise<unknown>{
  const response=await fetch(chain.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`${method}: HTTP ${response.status}`);
  const body=await response.json() as {result?:unknown;error?:{message?:string}};
  if(body.error)throw Error(`${method}: ${body.error.message??'RPC error'}`);
  return body.result??null;
}
const asBig=(value:unknown,label:string)=>{if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))throw Error(`Invalid ${label}`);return BigInt(value)};
if(asBig(await rpc('eth_chainId'),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('RPC is not Hadrian');
const [nonceRaw,priceRaw,balanceRaw,blockRaw]=await Promise.all([rpc('eth_getTransactionCount',[DEPLOYER,'pending']),rpc('eth_gasPrice'),rpc('eth_getBalance',[DEPLOYER,'latest']),rpc('eth_blockNumber')]);
const startingNonce=asBig(nonceRaw,'nonce');const gasPrice=asBig(priceRaw,'gas price');const balance=asBig(balanceRaw,'balance');
const cases=[{id:'Clean',call:'add',args:[2n,3n]},{id:'OriginHint',call:'origin',args:[]},{id:'Counter',call:'increment',args:[]}] as const;
const planned=[];
for(const [index,scenario] of cases.entries()){
  const file=`probes/${scenario.id}.sol`;const source=readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  const input={language:'Solidity',sources:{[file]:{content:source}},settings:{outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
  const output=JSON.parse(compile(JSON.stringify(input),0,0));
  if(output.errors?.some((e:{severity:string})=>e.severity==='error'))throw Error(`${scenario.id}: compilation failed`);
  const contract=output.contracts[file][scenario.id];const bytecode=`0x${contract.evm.bytecode.object}` as Hex;
  const runtimeBytecode=`0x${contract.evm.deployedBytecode.object}` as Hex;
  const runtimeBytecodeHash='sha256:'+createHash('sha256').update(contract.evm.deployedBytecode.object,'hex').digest('hex');
  const local=ledger.records.find(item=>item.testId===scenario.id);
  const sourceHash='sha256:'+createHash('sha256').update(source).digest('hex');
  const bytecodeHash='sha256:'+createHash('sha256').update(contract.evm.bytecode.object,'hex').digest('hex');
  if(!local||local.sourceHash!==sourceHash||local.bytecodeHash!==bytecodeHash||local.compiler!==version)throw Error(`${scenario.id}: local source/bytecode mismatch`);
  const nonce=startingNonce+BigInt(index);
  const predictedAddress=getContractAddress({from:DEPLOYER,nonce});
  const predictedCode=await rpc('eth_getCode',[predictedAddress,'latest']);
  if(predictedCode!=='0x')throw Error(`${scenario.id}: predicted address already contains code; review existing deployment before planning another`);
  const calldata=encodeFunctionData({abi:contract.abi,functionName:scenario.call,args:[...scenario.args]});
  let deploymentEstimate:string|null=null;let deploymentGasLimit:string|null=null;let deploymentMaxCostWei:string|null=null;let estimateError:string|null=null;
  try{const gas=asBig(await rpc('eth_estimateGas',[{from:DEPLOYER,data:bytecode}]),'deployment gas');const limit=padRomeGas(gas);deploymentEstimate=gas.toString();deploymentGasLimit=limit.toString();deploymentMaxCostWei=(limit*gasPrice).toString()}catch(cause){estimateError=cause instanceof Error?cause.message:String(cause)}
  planned.push({id:scenario.id,source:file,sourceHash,bytecodeHash,runtimeBytecodeHash,runtimeBytecode,compiler:version,expectedNonce:nonce.toString(),predictedAddress,nonceWarning:'Address is valid only if this account sends these deployments in order with no intervening transaction.',deployment:{from:DEPLOYER,to:null,data:bytecode,estimatedGas:deploymentEstimate,gasLimit:deploymentGasLimit,maxCostWei:deploymentMaxCostWei,estimateError},call:{from:DEPLOYER,to:predictedAddress,data:calldata,estimatedGas:null,gasLimit:null,maxCostWei:null,reason:'Call gas and fee must be estimated after deployment against the actual contract address; do not sign from this draft.'}});
}
const result={status:'UNSIGNED_BLOCKED',checkedAt:new Date().toISOString(),chainId:Number(HADRIAN_CHAIN_ID),rpcBlock:asBig(blockRaw,'block number').toString(),sender:DEPLOYER,senderBalanceWei:balance.toString(),gasPriceWei:gasPrice.toString(),currency:'test USDC (18 decimals in Rome registry)',deploymentTotalMaxCostWei:planned.every(item=>item.deployment.maxCostWei!==null)?planned.reduce((sum,item)=>sum+BigInt(item.deployment.maxCostWei!),0n).toString():null,warning:'Read-only estimates are time and account dependent. Total excludes three call transactions; exact final budget is BLOCKED until contracts exist and fresh MetaMask quotes are reviewed.',cases:planned};
writeFileSync('evidence/unsigned-differential-plan.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,rpcBlock:result.rpcBlock,gasPriceWei:result.gasPriceWei,balanceWei:result.senderBalanceWei,deploymentTotalMaxCostWei:result.deploymentTotalMaxCostWei,cases:planned.map(item=>({id:item.id,predictedAddress:item.predictedAddress,estimatedGas:item.deployment.estimatedGas,estimateError:item.deployment.estimateError}))},null,2));
