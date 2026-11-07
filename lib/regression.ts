export type RunRecord={testId:string;sourceHash:string;bytecodeHash:string;registryVersion:string;ruleVersion?:string;local?:{status:string;returnValue?:string;events?:unknown[];state?:Record<string,string>};hadrian?:{status:string;returnValue?:string;events?:unknown[];state?:Record<string,string>}};
export type Run={records:RunRecord[]};
export function compareRuns(baseline:Run,current:Run){
 if(!Array.isArray(baseline.records)||!Array.isArray(current.records))throw Error('Invalid execution run');
 const old=new Map(baseline.records.map(r=>[r.testId,r]));const now=new Map(current.records.map(r=>[r.testId,r]));
 const changes=[] as {testId:string;kind:'NEW_FAILURE'|'RESOLVED'|'BEHAVIOR_CHANGED'|'INCONCLUSIVE'|'CONFIG_CHANGED'|'NEW_TEST'|'REMOVED_TEST';detail:string}[];
 for(const [id,b] of old){const n=now.get(id);if(!n){changes.push({testId:id,kind:'REMOVED_TEST',detail:'Scenario absent from current run'});continue;}
  if(b.bytecodeHash!==n.bytecodeHash||b.registryVersion!==n.registryVersion||b.ruleVersion!==n.ruleVersion)changes.push({testId:id,kind:'CONFIG_CHANGED',detail:'Bytecode, registry or rule version changed; direct behavior comparison needs review'});
  const be=b.hadrian,ne=n.hadrian;
  if(!be||!ne||be.status==='NOT_EXECUTED'||ne.status==='NOT_EXECUTED'){changes.push({testId:id,kind:'INCONCLUSIVE',detail:'Hadrian execution absent in one or both runs'});continue;}
  if(be.status!=='FAILED'&&ne.status==='FAILED')changes.push({testId:id,kind:'NEW_FAILURE',detail:'Hadrian status changed to FAILED'});
  else if(be.status==='FAILED'&&ne.status!=='FAILED')changes.push({testId:id,kind:'RESOLVED',detail:'Previous Hadrian failure no longer present'});
  else if(JSON.stringify({status:be.status,returnValue:be.returnValue,events:be.events,state:be.state})!==JSON.stringify({status:ne.status,returnValue:ne.returnValue,events:ne.events,state:ne.state}))changes.push({testId:id,kind:'BEHAVIOR_CHANGED',detail:'Observable Hadrian behavior changed'});
 }
 for(const id of now.keys())if(!old.has(id))changes.push({testId:id,kind:'NEW_TEST',detail:'Scenario added in current run'});
 return {changes,summary:Object.fromEntries(['NEW_FAILURE','RESOLVED','BEHAVIOR_CHANGED','INCONCLUSIVE','CONFIG_CHANGED','NEW_TEST','REMOVED_TEST'].map(kind=>[kind,changes.filter(c=>c.kind===kind).length]))};
}
import type {LiveDifferential} from './live-differential';
export function compareLiveDifferentialRuns(baseline:LiveDifferential,current:LiveDifferential){
 if(baseline.chainId!==200010||current.chainId!==200010||baseline.rows.length!==4||current.rows.length!==4)throw Error('Invalid live differential run');
 const old=new Map(baseline.rows.map(row=>[row.testId,row]));
 const changes:{testId:string;kind:'NEW_DIVERGENCE'|'RESOLVED'|'BEHAVIOR_CHANGED'|'INCONCLUSIVE';detail:string}[]=[];
 for(const row of current.rows){const prior=old.get(row.testId);if(!prior)throw Error('Scenario set changed');
  if(row.classification==='BLOCKED'||prior.classification==='BLOCKED'){changes.push({testId:row.testId,kind:'INCONCLUSIVE',detail:'Hadrian execution absent in one or both runs'});continue}
  if(prior.classification!=='BEHAVIORAL_DIVERGENCE'&&row.classification==='BEHAVIORAL_DIVERGENCE')changes.push({testId:row.testId,kind:'NEW_DIVERGENCE',detail:'New observable mismatch'});
  else if(prior.classification==='BEHAVIORAL_DIVERGENCE'&&row.classification!=='BEHAVIORAL_DIVERGENCE')changes.push({testId:row.testId,kind:'RESOLVED',detail:'Previously divergent behavior now matches'});
  else if(prior.classification!==row.classification||prior.transactionHash!==row.transactionHash||JSON.stringify(prior.hadrian)!==JSON.stringify(row.hadrian))changes.push({testId:row.testId,kind:'BEHAVIOR_CHANGED',detail:'Classification, transaction or verified Hadrian behavior changed'});
 }
 return {changes,summary:{NEW_DIVERGENCE:changes.filter(x=>x.kind==='NEW_DIVERGENCE').length,RESOLVED:changes.filter(x=>x.kind==='RESOLVED').length,BEHAVIOR_CHANGED:changes.filter(x=>x.kind==='BEHAVIOR_CHANGED').length,INCONCLUSIVE:changes.filter(x=>x.kind==='INCONCLUSIVE').length}};
}
