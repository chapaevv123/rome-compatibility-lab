import {decodeEventLog,decodeFunctionResult,encodeFunctionData,getContractAddress,type Hex} from 'viem';
import {DEPLOYER,HADRIAN_CHAIN_ID,type WalletProvider} from '../app/hadrian/metamask/flow';
import {padRomeGas} from '../vendor/rome-sdk/write.mjs';
import local from '../evidence/local-execution.json';
import type {Execution} from './differential';

export const DIFFERENTIAL_IDS=['Clean','OriginHint','Counter'] as const;
export type DifferentialId=typeof DIFFERENTIAL_IDS[number];
export type DifferentialStep=`deploy:${DifferentialId}`|`call:${DifferentialId}`;
export const DIFFERENTIAL_STEPS: DifferentialStep[]=[...DIFFERENTIAL_IDS.map(id=>`deploy:${id}` as const),...DIFFERENTIAL_IDS.map(id=>`call:${id}` as const)];
export type PlanCase={id:DifferentialId;sourceHash:string;bytecodeHash:string;runtimeBytecodeHash:string;runtimeBytecode:Hex;compiler:string;expectedNonce:string;predictedAddress:Hex;deployment:{from:string;to:null;data:Hex};call:{from:string;to:Hex;data:Hex}};
export type DifferentialPlan={chainId:number;sender:string;cases:PlanCase[]};
export type DifferentialHashes={version:1;chainId:200010;sender:string;hashes:Partial<Record<DifferentialStep,Hex>>};
export type StepQuote={step:DifferentialStep;nonce:bigint;balance:bigint;estimatedGas:bigint;gasLimit:bigint;maxFeePerGas:bigint;maxPriorityFeePerGas:bigint;maxCost:bigint;to?:Hex;data:Hex};
export type VerifiedStep={step:DifferentialStep;hash:Hex;contract:Hex;blockNumber:string;gasUsed:string;actualFeeWei:string;execution?:Execution};

const lower=(value:unknown)=>String(value).toLowerCase();
const numeric=(value:unknown,label:string)=>{if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))throw Error(`Invalid ${label}`);return BigInt(value)};
const addr=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{40}$/i.test(value);
const hash=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
const toHex=(value:bigint)=>`0x${value.toString(16)}` as Hex;
const parts=(step:DifferentialStep)=>{const [kind,id]=step.split(':') as ['deploy'|'call',DifferentialId];if(!DIFFERENTIAL_IDS.includes(id)||!['deploy','call'].includes(kind))throw Error('Unknown differential operation');return {kind,id}};
const caseFor=(plan:DifferentialPlan,id:DifferentialId)=>{const item=plan.cases.find(c=>c.id===id);if(!item)throw Error(`${id}: plan missing`);return item};
const txFor=(item:PlanCase,kind:'deploy'|'call')=>kind==='deploy'?{from:DEPLOYER,data:item.deployment.data}:{from:DEPLOYER,to:item.predictedAddress,data:item.call.data};
const sha256=async(value:Hex)=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(value.slice(2).match(/../g)??[],x=>parseInt(x,16))))).map(x=>x.toString(16).padStart(2,'0')).join('');
const callData:Record<DifferentialId,Hex>={
  Clean:encodeFunctionData({abi:[{type:'function',name:'add',stateMutability:'pure',inputs:[{name:'a',type:'uint256'},{name:'b',type:'uint256'}],outputs:[{type:'uint256'}]}],functionName:'add',args:[2n,3n]}),
  OriginHint:encodeFunctionData({abi:[{type:'function',name:'origin',stateMutability:'view',inputs:[],outputs:[{type:'address'}]}],functionName:'origin'}),
  Counter:encodeFunctionData({abi:[{type:'function',name:'increment',stateMutability:'nonpayable',inputs:[],outputs:[]}],functionName:'increment'})
};
const cleanAbi=[{type:'function',name:'add',stateMutability:'pure',inputs:[{name:'a',type:'uint256'},{name:'b',type:'uint256'}],outputs:[{type:'uint256'}]}] as const;
const originAbi=[{type:'function',name:'origin',stateMutability:'view',inputs:[],outputs:[{type:'address'}]}] as const;
const counterAbi=[{type:'function',name:'count',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]},{type:'event',name:'Incremented',inputs:[{name:'value',type:'uint256',indexed:false}]}] as const;

export async function assertDifferentialPlan(plan:DifferentialPlan){
  if(plan.chainId!==Number(HADRIAN_CHAIN_ID)||lower(plan.sender)!==lower(DEPLOYER)||plan.cases.length!==3)throw Error('Wrong differential plan network or sender');
  for(const [index,id] of DIFFERENTIAL_IDS.entries()){
    const item=plan.cases[index];const record=local.records.find(r=>r.testId===id);
    if(!item||item.id!==id||!record||item.sourceHash!==record.sourceHash||item.bytecodeHash!==record.bytecodeHash||item.compiler!==record.compiler)throw Error(`${id}: plan/source mismatch`);
    if(!/^\d+$/.test(item.expectedNonce)||!addr(item.predictedAddress)||lower(getContractAddress({from:DEPLOYER,nonce:BigInt(item.expectedNonce)}))!==lower(item.predictedAddress)||lower(item.deployment.from)!==lower(DEPLOYER)||item.deployment.to!==null||lower(item.call.from)!==lower(DEPLOYER)||lower(item.call.to)!==lower(item.predictedAddress)||lower(item.call.data)!==lower(callData[id]))throw Error(`${id}: plan address or calldata mismatch`);
    if(await sha256(item.deployment.data)!==item.bytecodeHash||await sha256(item.runtimeBytecode)!==item.runtimeBytecodeHash)throw Error(`${id}: bytecode hash mismatch`);
  }
  if(BigInt(plan.cases[1].expectedNonce)!==BigInt(plan.cases[0].expectedNonce)+1n||BigInt(plan.cases[2].expectedNonce)!==BigInt(plan.cases[1].expectedNonce)+1n)throw Error('Deployment nonces are not consecutive');
}
export async function assertDifferentialWallet(provider:WalletProvider){
  if(provider.isMetaMask!==true)throw Error('MetaMask required');
  if(numeric(await provider.request({method:'eth_chainId'}),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('Select Hadrian chain ID 200010');
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||accounts.length!==1||!addr(accounts[0])||lower(accounts[0])!==lower(DEPLOYER))throw Error(`Select only ${DEPLOYER}`);
}
export async function quoteDifferentialStep(provider:WalletProvider,plan:DifferentialPlan,step:DifferentialStep,previous:Partial<Record<DifferentialStep,VerifiedStep>>):Promise<StepQuote>{
  await assertDifferentialPlan(plan);await assertDifferentialWallet(provider);
  const {kind,id}=parts(step);const item=caseFor(plan,id);const stepIndex=DIFFERENTIAL_STEPS.indexOf(step);
  if(stepIndex<0||DIFFERENTIAL_STEPS.slice(0,stepIndex).some(prior=>!previous[prior])||previous[step])throw Error('Verify previous receipts before this operation');
  const tx=txFor(item,kind);
  const [nonceRaw,balanceRaw,codeRaw,gasRaw,priceRaw,blockRaw,tipRaw]=await Promise.all([
    provider.request({method:'eth_getTransactionCount',params:[DEPLOYER,'pending']}),provider.request({method:'eth_getBalance',params:[DEPLOYER,'latest']}),provider.request({method:'eth_getCode',params:[item.predictedAddress,'latest']}),provider.request({method:'eth_estimateGas',params:[tx]}),provider.request({method:'eth_gasPrice'}),provider.request({method:'eth_getBlockByNumber',params:['latest',false]}),provider.request({method:'eth_maxPriorityFeePerGas'}).catch(()=>null)
  ]);
  const nonce=numeric(nonceRaw,'pending nonce');
  if(kind==='deploy'&&(nonce!==BigInt(item.expectedNonce)||codeRaw!=='0x'))throw Error('Deployment nonce changed or contract already exists; regenerate plan and verify any existing transaction');
  if(kind==='call'&&lower(codeRaw)!==lower(item.runtimeBytecode))throw Error('Deployed bytecode mismatch');
  const estimatedGas=numeric(gasRaw,'gas estimate'),gasLimit=padRomeGas(estimatedGas),balance=numeric(balanceRaw,'balance'),gasPrice=numeric(priceRaw,'gas price');
  const baseRaw=(blockRaw as {baseFeePerGas?:unknown}|null)?.baseFeePerGas;
  const baseFee=baseRaw?numeric(baseRaw,'base fee'):0n,tip=tipRaw?numeric(tipRaw,'priority fee'):0n;
  const maxFeePerGas=baseFee>0n?baseFee*11n/10n+tip:gasPrice;
  if(estimatedGas<=0n||maxFeePerGas<=0n||balance<gasLimit*maxFeePerGas)throw Error('Insufficient balance or unusable fee quote');
  return {step,nonce,balance,estimatedGas,gasLimit,maxFeePerGas,maxPriorityFeePerGas:baseFee>0n?tip:gasPrice,maxCost:gasLimit*maxFeePerGas,...(kind==='call'?{to:item.predictedAddress}:{}),data:kind==='deploy'?item.deployment.data:item.call.data};
}
export async function sendDifferentialStep(provider:WalletProvider,plan:DifferentialPlan,quote:StepQuote,previous:Partial<Record<DifferentialStep,VerifiedStep>>):Promise<Hex>{
  const fresh=await quoteDifferentialStep(provider,plan,quote.step,previous);
  if(fresh.nonce!==quote.nonce||fresh.to!==quote.to||fresh.data!==quote.data||fresh.gasLimit>quote.gasLimit||fresh.maxFeePerGas>quote.maxFeePerGas||fresh.maxPriorityFeePerGas>quote.maxPriorityFeePerGas||fresh.balance<quote.maxCost)throw Error('Nonce, calldata, balance or fee changed; refresh estimate');
  await assertDifferentialWallet(provider);
  const tx={from:DEPLOYER,...(quote.to?{to:quote.to}:{}),data:quote.data,nonce:toHex(quote.nonce),gas:toHex(quote.gasLimit),maxFeePerGas:toHex(quote.maxFeePerGas),maxPriorityFeePerGas:toHex(quote.maxPriorityFeePerGas),value:'0x0'};
  const result=await provider.request({method:'eth_sendTransaction',params:[tx]});
  if(!hash(result))throw Error('MetaMask returned invalid transaction hash');
  return result;
}
export async function verifyDifferentialStep(provider:WalletProvider,plan:DifferentialPlan,step:DifferentialStep,txHash:Hex):Promise<VerifiedStep|null>{
  await assertDifferentialPlan(plan);
  if(!hash(txHash)||numeric(await provider.request({method:'eth_chainId'}),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('Wrong chain or transaction hash');
  const {kind,id}=parts(step),item=caseFor(plan,id),expected=txFor(item,kind);
  const [receiptRaw,transactionRaw]=await Promise.all([provider.request({method:'eth_getTransactionReceipt',params:[txHash]}),provider.request({method:'eth_getTransactionByHash',params:[txHash]})]);
  if(!receiptRaw)return null;
  const receipt=receiptRaw as Record<string,unknown>,tx=transactionRaw as Record<string,unknown>|null;
  if(!tx||lower(receipt.transactionHash)!==lower(txHash)||numeric(receipt.status,'receipt status')!==1n||lower(tx.hash)!==lower(txHash)||lower(tx.from)!==lower(DEPLOYER)||lower(tx.input??tx.data)!==lower(expected.data)||numeric(tx.value,'value')!==0n)throw Error(`${step}: receipt or transaction mismatch`);
  const nonce=numeric(tx.nonce,'transaction nonce');
  if(kind==='deploy'&&(nonce!==BigInt(item.expectedNonce)||tx.to!==null||lower(receipt.contractAddress)!==lower(item.predictedAddress)))throw Error(`${step}: deployment address or nonce mismatch`);
  if(kind==='call'&&(lower(tx.to)!==lower(item.predictedAddress)||lower(receipt.to)!==lower(item.predictedAddress)))throw Error(`${step}: call target mismatch`);
  const block=numeric(receipt.blockNumber,'block number'),code=await provider.request({method:'eth_getCode',params:[item.predictedAddress,'latest']});
  if(lower(code)!==lower(item.runtimeBytecode))throw Error(`${step}: deployed bytecode mismatch`);
  const gasUsed=numeric(receipt.gasUsed,'gas used'),actualFeeWei=gasUsed*numeric(receipt.effectiveGasPrice,'effective gas price');
  const result:VerifiedStep={step,hash:txHash,contract:item.predictedAddress,blockNumber:block.toString(),gasUsed:gasUsed.toString(),actualFeeWei:actualFeeWei.toString()};
  if(kind==='deploy')return result;
  let execution:Execution={environment:'HADRIAN',status:'SUCCESS',events:[],state:{},gasUsed:gasUsed.toString()};
  if(id==='Clean'){
    const raw=await provider.request({method:'eth_call',params:[expected,toHex(block)]});
    execution={...execution,returnValue:String(decodeFunctionResult({abi:cleanAbi,functionName:'add',data:raw as Hex}))};
  }else if(id==='OriginHint'){
    const raw=await provider.request({method:'eth_call',params:[expected,toHex(block)]});
    execution={...execution,returnValue:String(decodeFunctionResult({abi:originAbi,functionName:'origin',data:raw as Hex}))};
  }else{
    const logs=receipt.logs as Array<{address:string;data:Hex;topics:[Hex,...Hex[]]}>|undefined;
    const decoded=logs?.filter(log=>lower(log.address)===lower(item.predictedAddress)).map(log=>decodeEventLog({abi:counterAbi,data:log.data,topics:log.topics}));
    if(!decoded||decoded.length!==1||decoded[0].eventName!=='Incremented'||(decoded[0].args as {value:bigint}).value!==1n)throw Error('Counter Incremented(1) event missing');
    const raw=await provider.request({method:'eth_call',params:[{from:DEPLOYER,to:item.predictedAddress,data:encodeFunctionData({abi:counterAbi,functionName:'count'})},toHex(block)]});
    const count=String(decodeFunctionResult({abi:counterAbi,functionName:'count',data:raw as Hex}));
    if(count!=='1')throw Error('Counter count readback mismatch');
    execution={...execution,returnValue:count,events:[{name:'Incremented',args:{value:'1'}}],state:{count}};
  }
  return {...result,execution};
}
