export type Execution = {environment:'LOCAL_EVM'|'HADRIAN'; status:'SUCCESS'|'REVERT'|'NOT_EXECUTED'; returnValue?:string; events?:{name:string;args:unknown}[]; state?:Record<string,string>; gasUsed?:string; computeUnits?:string; reason?:string};
export type DifferentialResult = {classification:'EXPECTED_DIFFERENCE'|'COMPATIBLE'|'BEHAVIORAL_DIVERGENCE'|'INCONCLUSIVE'|'NOT_EXECUTED'; differences:string[]; note:string};
export function compareExecution(local:Execution,hadrian:Execution,expectedDifferences:string[]=[]):DifferentialResult {
 if(local.environment!=='LOCAL_EVM'||hadrian.environment!=='HADRIAN')throw Error('Expected LOCAL_EVM and HADRIAN records');
 if(local.status==='NOT_EXECUTED'||hadrian.status==='NOT_EXECUTED')return {classification:'NOT_EXECUTED',differences:[],note:'Both environments must have real execution records.'};
 const differences:string[]=[];
 if(local.status!==hadrian.status)differences.push('status');
 if(local.returnValue!==hadrian.returnValue)differences.push('returnValue');
 if(JSON.stringify(local.events||[])!==JSON.stringify(hadrian.events||[]))differences.push('events');
 if(JSON.stringify(local.state||{})!==JSON.stringify(hadrian.state||{}))differences.push('state');
 if(local.reason!==hadrian.reason)differences.push('reason');
 // EVM gas and Solana compute units are retained as separate metrics, never compared as equal units.
 if(!differences.length)return {classification:'COMPATIBLE',differences,note:'Compared observable behavior; excluded gas, CU and environment-specific metadata.'};
 if(differences.every(d=>expectedDifferences.includes(d)))return {classification:'EXPECTED_DIFFERENCE',differences,note:'Observed differences match the declared scenario expectations.'};
 return {classification:'BEHAVIORAL_DIVERGENCE',differences,note:'Unexpected observable behavior changed; investigate the source and receipts.'};
}
