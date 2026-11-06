import {decodeEventLog,decodeFunctionResult,encodeFunctionData,type Hex} from 'viem';
import chain from '../app/hadrian/metamask/hadrian-chain.json';
import laneArtifact from '../app/hadrian/metamask/lane-probe-artifact.json';
import cpiArtifact from '../app/hadrian/metamask/cpi-memo-artifact.json';
import {DEPLOYER,HADRIAN_CHAIN_ID,EXPLORER,type WalletProvider} from '../app/hadrian/metamask/flow';
import {LANE_ADDRESS,LANE_DEPLOY_HASH,MEMO,operationData,verifyLaneDeployment,verifyOperation} from '../app/hadrian/metamask/operations';

export const RELEASE={
  laneDeploy:{hash:LANE_DEPLOY_HASH,contract:LANE_ADDRESS,name:'LaneProbe deployment'},
  observe:{hash:'0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f',contract:LANE_ADDRESS,name:'LaneProbe observe()'},
  cpiDeploy:{hash:'0xac5555d6a67f9995b215ed0e473c6c2cc4bde61149acad239b0714a20a19e946',contract:'0x501dc0eb3c7542561d92870943fda993691833e6',name:'CpiMemoProbe deployment'},
  invokeMemo:{hash:'0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845',contract:'0x501dc0eb3c7542561d92870943fda993691833e6',name:'CpiMemoProbe invokeMemo()'}
} as const;
export const SOLANA_SIGNATURE='5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg';
const MEMO_PROGRAM='MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
if(chain.chainId!==Number(HADRIAN_CHAIN_ID)||chain.solana.cluster!=='devnet')throw Error('Hadrian registry mismatch');
const hadrian=chain;
const evmRpc=hadrian.rpcUrl;
const solanaRpc=hadrian.solana.rpc;
const solanaExplorer=`${hadrian.solana.explorerUrl}/tx/${SOLANA_SIGNATURE}?cluster=devnet`;
const same=(a:unknown,b:string)=>typeof a==='string'&&a.toLowerCase()===b.toLowerCase();
const asBig=(value:unknown,label:string)=>{if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))throw Error(`Invalid ${label}`);return BigInt(value)};

async function rpc(url:string,method:string,params:unknown[]=[]):Promise<unknown>{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!response.ok)throw Error(`${method}: HTTP ${response.status}`);
  const body=await response.json() as {result?:unknown;error?:{message?:string}};
  if(body.error)throw Error(`${method}: ${body.error.message??'RPC error'}`);
  return body.result??null;
}
const provider:WalletProvider={request:({method,params})=>rpc(evmRpc,method,params)};
export type EvmCase={id:keyof typeof RELEASE;name:string;chainId:number;transactionHash:string;contractAddress:string;blockNumber:string;receiptStatus:'SUCCESS';gasUsed:string;actualFeeWei:string;explorer:string;event:string|null;readback:string|null;status:'LIVE_VERIFIED'|'LIVE_EVM_VERIFIED'};
export type SolanaCase={signature:string;explorer:string;slot:number;commitment:'finalized';instruction:string;programId:string;payload:string;status:'LIVE_VERIFIED';evmTransactionHash:string};
export type ReleaseEvidence={checkedAt:string;chainId:number;cases:EvmCase[];solana:SolanaCase|null;cpiStatus:'LIVE_VERIFIED'|'PENDING_SOLANA_VERIFICATION';solanaError:string|null};

async function verifyEvmCase(id:keyof typeof RELEASE):Promise<EvmCase>{
  const item=RELEASE[id];
  if(asBig(await provider.request({method:'eth_chainId'}),'chain ID')!==HADRIAN_CHAIN_ID)throw Error('Hadrian chain ID mismatch');
  const [rawReceipt,rawTx]=await Promise.all([provider.request({method:'eth_getTransactionReceipt',params:[item.hash]}),provider.request({method:'eth_getTransactionByHash',params:[item.hash]})]);
  const receipt=rawReceipt as Record<string,unknown>|null;
  const tx=rawTx as Record<string,unknown>|null;
  if(!receipt||!tx||!same(receipt.transactionHash,item.hash)||asBig(receipt.status,'receipt status')!==1n||!same(tx.from,DEPLOYER))throw Error(`${id}: receipt or sender mismatch`);
  const block=asBig(receipt.blockNumber,'block number');
  let event:string|null=null;
  let readback:string|null=null;
  if(id==='laneDeploy'){
    await verifyLaneDeployment(provider);
    if(tx.to!==null||!same(receipt.contractAddress,LANE_ADDRESS)||!same(tx.input,laneArtifact.creationBytecode))throw Error('LaneProbe deployment transaction mismatch');
    const code=await provider.request({method:'eth_getCode',params:[LANE_ADDRESS,'latest']});
    if(typeof code!=='string'||code==='0x')throw Error('LaneProbe code missing');
    const result=await provider.request({method:'eth_call',params:[{from:DEPLOYER,to:LANE_ADDRESS,data:encodeFunctionData({abi:laneArtifact.abi as Parameters<typeof encodeFunctionData>[0]['abi'],functionName:'caller'})},`0x${block.toString(16)}`]});
    readback=String(decodeFunctionResult({abi:laneArtifact.abi as Parameters<typeof decodeFunctionResult>[0]['abi'],functionName:'caller',data:result as Hex}));
    if(!same(readback,DEPLOYER))throw Error('LaneProbe readback mismatch');
  }else{
    const kind=id;
    const verified=await verifyOperation(provider,kind,item.hash as Hex,RELEASE.cpiDeploy.contract as Hex);
    if(!verified||!same(verified.contract,item.contract)||verified.block!==block)throw Error(`${id}: verification mismatch`);
    if(id==='observe'){
      const log=(receipt.logs as Array<{address:string;topics:Hex[];data:Hex}>).find(item=>same(item.address,LANE_ADDRESS));
      if(!log)throw Error('Observed event log missing');
      const decoded=decodeEventLog({abi:laneArtifact.abi as Parameters<typeof decodeEventLog>[0]['abi'],topics:log.topics as [Hex,...Hex[]],data:log.data});
      const args=decoded.args as {caller:string;blockNumber:bigint;timestamp:bigint};
      if(decoded.eventName!=='Observed'||!same(args.caller,DEPLOYER)||args.blockNumber!==block||args.timestamp<=0n)throw Error('Observed event values mismatch');
      event=`Observed(caller=${args.caller}, blockNumber=${args.blockNumber}, timestamp=${args.timestamp})`;readback=DEPLOYER;
    }else readback=cpiArtifact.programIdHex;
    if(id==='cpiDeploy'&&!same(tx.input,cpiArtifact.creationBytecode))throw Error('CPI creation bytecode mismatch');
    if(id==='invokeMemo'&&!same(tx.input,operationData('invokeMemo')))throw Error('Memo calldata mismatch');
  }
  if(id==='laneDeploy'||id==='cpiDeploy'){
    if(tx.to!==null||!same(receipt.contractAddress,item.contract))throw Error(`${id}: deployment address mismatch`);
  }else if(!same(tx.to,item.contract)||!same(receipt.to,item.contract))throw Error(`${id}: called contract mismatch`);
  return {id,name:item.name,chainId:Number(HADRIAN_CHAIN_ID),transactionHash:item.hash,contractAddress:item.contract,blockNumber:block.toString(),receiptStatus:'SUCCESS',gasUsed:asBig(receipt.gasUsed,'gas used').toString(),actualFeeWei:(asBig(receipt.gasUsed,'gas used')*asBig(receipt.effectiveGasPrice,'gas price')).toString(),explorer:`${EXPLORER}tx/${item.hash}`,event,readback,status:id==='invokeMemo'?'LIVE_EVM_VERIFIED':'LIVE_VERIFIED'};
}

async function verifySolana():Promise<SolanaCase>{
  const mapped=await rpc(evmRpc,'rome_solanaTxForEvmTx',[RELEASE.invokeMemo.hash]);
  if(!Array.isArray(mapped)||!mapped.includes(SOLANA_SIGNATURE))throw Error('EVM to Solana signature mapping mismatch');
  const [statusRaw,transactionRaw]=await Promise.all([
    rpc(solanaRpc,'getSignatureStatuses',[[SOLANA_SIGNATURE],{searchTransactionHistory:true}]),
    rpc(solanaRpc,'getTransaction',[SOLANA_SIGNATURE,{encoding:'jsonParsed',commitment:'finalized',maxSupportedTransactionVersion:1}])
  ]);
  const status=(statusRaw as {value?:Array<{confirmationStatus?:string;err?:unknown;slot?:number}|null>})?.value?.[0];
  const transaction=transactionRaw as {slot?:number;meta?:{err?:unknown;innerInstructions?:Array<{index:number;instructions:Array<{programId?:string;parsed?:unknown;stackHeight?:number}>}>;logMessages?:string[]};transaction?:{signatures?:string[];message?:{instructions?:Array<{programId?:string}>}}}|null;
  if(!status||status.confirmationStatus!=='finalized'||status.err!==null||!transaction||transaction.slot!==status.slot||transaction.meta?.err!==null||!transaction.transaction?.signatures?.includes(SOLANA_SIGNATURE))throw Error('Solana settlement is not finalized and successful');
  const inner=transaction.meta.innerInstructions?.flatMap(group=>group.instructions)??[];
  if(!inner.some(ix=>ix.programId===MEMO_PROGRAM&&ix.parsed===MEMO&&ix.stackHeight===2))throw Error('Expected Memo inner instruction or payload missing');
  const logs=transaction.meta.logMessages??[];
  const romeProgram=hadrian.romeEvmProgramId;
  if(!transaction.transaction.message?.instructions?.some(ix=>ix.programId===romeProgram)||!logs.includes(`Program ${MEMO_PROGRAM} success`)||!logs.includes(`Program ${romeProgram} success`)||!logs.includes('Program log: Commit'))throw Error('Memo or Rome execution logs missing');
  return {signature:SOLANA_SIGNATURE,explorer:solanaExplorer,slot:transaction.slot!,commitment:'finalized',instruction:'Memo Program',programId:MEMO_PROGRAM,payload:MEMO,status:'LIVE_VERIFIED',evmTransactionHash:RELEASE.invokeMemo.hash};
}

export async function verifyReleaseEvidence():Promise<ReleaseEvidence>{
  const cases=await Promise.all((Object.keys(RELEASE) as Array<keyof typeof RELEASE>).map(verifyEvmCase));
  let solana:SolanaCase|null=null;let solanaError:string|null=null;
  try{solana=await verifySolana()}catch(cause){solanaError=cause instanceof Error?cause.message:String(cause)}
  if(solana)cases.find(item=>item.id==='invokeMemo')!.status='LIVE_VERIFIED';
  return {checkedAt:new Date().toISOString(),chainId:Number(HADRIAN_CHAIN_ID),cases,solana,cpiStatus:solana?'LIVE_VERIFIED':'PENDING_SOLANA_VERIFICATION',solanaError};
}
