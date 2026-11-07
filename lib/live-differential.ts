import {compareExecution,type DifferentialResult,type Execution} from './differential';
import {RELEASE,type ReleaseEvidence} from './release-evidence';
import laneArtifact from '../app/hadrian/metamask/lane-probe-artifact.json';
import {DEPLOYER} from '../app/hadrian/metamask/flow';
import {LANE_ADDRESS,LANE_DEPLOY_HASH} from '../app/hadrian/metamask/operations';
import type {DifferentialId,VerifiedStep} from './differential-operations';

export const SCENARIOS=['Clean','OriginHint','LaneProbe','Counter'] as const;
export type ScenarioId=typeof SCENARIOS[number];
export type LocalRecord={testId:string;sourceHash:string;bytecodeHash:string;compiler:string;registryVersion:string;local:Execution};
export type LocalLedger={records:LocalRecord[]};
export type LiveRow={testId:ScenarioId;local:Execution;hadrian:Execution;classification:DifferentialResult['classification']|'BLOCKED';differences:string[];reason:string;transactionHash?:string;contractAddress?:string};
export type LiveDifferential={checkedAt:string;chainId:200010;source:'FRESH_RPC'|'RECORDED_RPC_CHECK';rows:LiveRow[];summary:{compatible:number;divergent:number;blocked:number}};

const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
const asEvent=(value:unknown):{name:string;args:Record<string,string>}=>{
  if(!value||typeof value!=='object')throw Error('Local event missing');
  const event=value as {name?:unknown;args?:unknown};
  if(typeof event.name!=='string'||!event.args||typeof event.args!=='object')throw Error('Invalid local event');
  return {name:event.name,args:event.args as Record<string,string>};
};
export function assessLiveDifferential(ledger:LocalLedger,evidence:ReleaseEvidence,source:LiveDifferential['source']='FRESH_RPC',verified:Partial<Record<`deploy:${DifferentialId}`|`call:${DifferentialId}`,VerifiedStep>>={}):LiveDifferential {
  if(evidence.chainId!==200010||!Number.isFinite(Date.parse(evidence.checkedAt)))throw Error('Wrong Hadrian chain ID or verification time');
  if(!Array.isArray(ledger.records)||ledger.records.length!==4||new Set(ledger.records.map(item=>item.testId)).size!==4)throw Error('Expected four distinct local scenarios');
  const rows:LiveRow[]=SCENARIOS.map(testId=>{
    const record=ledger.records.find(item=>item.testId===testId);
    if(!record||record.local.environment!=='LOCAL_EVM'||record.local.status!=='SUCCESS'||record.registryVersion!=='v0.3.0')throw Error(`${testId}: invalid local execution`);
    if(testId!=='LaneProbe'){
      const deploy=verified[`deploy:${testId}`],call=verified[`call:${testId}`];
      if(!deploy||!call||!call.execution)return {testId,local:record.local,hadrian:{environment:'HADRIAN',status:'NOT_EXECUTED'},classification:'BLOCKED',differences:[],reason:'No complete verified Hadrian deployment and call receipts. See unsigned transaction plan; no result is inferred from local EVM.'};
      if(deploy.contract.toLowerCase()!==call.contract.toLowerCase()||BigInt(call.blockNumber)<BigInt(deploy.blockNumber)||deploy.hash.toLowerCase()===call.hash.toLowerCase())throw Error(`${testId}: verified receipt pair mismatch`);
      const local=testId==='OriginHint'?{...record.local,returnValue:'SENDER'}:record.local;
      const hadrian=testId==='OriginHint'?{...call.execution,returnValue:call.execution.returnValue?.toLowerCase()===DEPLOYER.toLowerCase()?'SENDER':call.execution.returnValue}:call.execution;
      const comparison=compareExecution(local,hadrian);
      return {testId,local:record.local,hadrian:call.execution,classification:comparison.classification,differences:comparison.differences,reason:'Hadrian deployment/call receipts, calldata, deployed bytecode, event and readback were rechecked against RPC; sender role was normalized for OriginHint.',transactionHash:call.hash,contractAddress:call.contract};
    }
    if(record.sourceHash!==laneArtifact.sourceHash||record.bytecodeHash!==laneArtifact.bytecodeHash||record.compiler!==laneArtifact.compiler)throw Error('LaneProbe local source or bytecode differs from deployed artifact');
    const deploy=evidence.cases.find(item=>item.id==='laneDeploy');
    const observe=evidence.cases.find(item=>item.id==='observe');
    if(!deploy||!observe||deploy.chainId!==200010||observe.chainId!==200010||deploy.status!=='LIVE_VERIFIED'||observe.status!=='LIVE_VERIFIED'||deploy.receiptStatus!=='SUCCESS'||observe.receiptStatus!=='SUCCESS'||!same(deploy.transactionHash,LANE_DEPLOY_HASH)||!same(observe.transactionHash,RELEASE.observe.hash)||!same(deploy.contractAddress,LANE_ADDRESS)||!same(observe.contractAddress,LANE_ADDRESS)||!same(observe.readback??'',DEPLOYER)||BigInt(observe.blockNumber)<=BigInt(deploy.blockNumber)||BigInt(observe.gasUsed)<=0n)throw Error('LaneProbe deployment or call evidence mismatch');
    const localEvent=asEvent(record.local.events?.[0]);
    if(record.local.events?.length!==1||localEvent.name!=='Observed'||!same(localEvent.args.caller??'',record.local.returnValue??'')||!/^\d+$/.test(localEvent.args.blockNumber??'')||!/^\d+$/.test(localEvent.args.timestamp??''))throw Error('LaneProbe local event mismatch');
    const match=/^Observed\(caller=(0x[0-9a-fA-F]{40}), blockNumber=(\d+), timestamp=(\d+)\)$/.exec(observe.event??'');
    if(!match||!same(match[1],DEPLOYER)||match[2]!==observe.blockNumber||BigInt(match[3])<=0n)throw Error('LaneProbe on-chain event mismatch');
    const local:Execution={...record.local,returnValue:'SENDER',events:[{name:'Observed',args:{caller:'SENDER',blockNumber:'BLOCK_CONTEXT',timestamp:'TIME_CONTEXT'}}]};
    const hadrian:Execution={environment:'HADRIAN',status:'SUCCESS',returnValue:'SENDER',events:[{name:'Observed',args:{caller:'SENDER',blockNumber:'BLOCK_CONTEXT',timestamp:'TIME_CONTEXT'}}],state:{},gasUsed:observe.gasUsed};
    const comparison=compareExecution(local,hadrian);
    return {testId,local:record.local,hadrian:{environment:'HADRIAN',status:'SUCCESS',returnValue:observe.readback??undefined,events:[{name:'Observed',args:{caller:match[1],blockNumber:match[2],timestamp:match[3]}}],state:{},gasUsed:observe.gasUsed},classification:comparison.classification,differences:comparison.differences,reason:'Fresh RPC verified deployment input, call calldata, successful receipts, code, event and readback. Sender role, block number and timestamp were normalized; gas was excluded.',transactionHash:observe.transactionHash,contractAddress:LANE_ADDRESS};
  });
  return {checkedAt:evidence.checkedAt,chainId:200010,source,rows,summary:{compatible:rows.filter(row=>row.classification==='COMPATIBLE').length,divergent:rows.filter(row=>row.classification==='BEHAVIORAL_DIVERGENCE').length,blocked:rows.filter(row=>row.classification==='BLOCKED').length}};
}
