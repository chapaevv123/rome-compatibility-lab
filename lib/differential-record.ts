import planJson from '../evidence/unsigned-differential-plan.json';
import chain from '../app/hadrian/metamask/hadrian-chain.json';
import {DEPLOYER,type WalletProvider} from '../app/hadrian/metamask/flow';
import {DIFFERENTIAL_STEPS,assertDifferentialPlan,verifyDifferentialStep,type DifferentialHashes,type DifferentialPlan,type DifferentialStep,type VerifiedStep} from './differential-operations';

export const differentialPlan=planJson as DifferentialPlan;
export function emptyDifferentialHashes():DifferentialHashes{return {version:1,chainId:200010,sender:DEPLOYER,hashes:{}}}
const hash=(value:unknown)=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
export function parseDifferentialHashes(raw:unknown):DifferentialHashes{
  const data=raw as DifferentialHashes;
  if(!data||data.version!==1||data.chainId!==200010||data.sender?.toLowerCase()!==DEPLOYER.toLowerCase()||!data.hashes||typeof data.hashes!=='object'||Object.keys(data.hashes).some(key=>!DIFFERENTIAL_STEPS.includes(key as DifferentialStep)||!hash(data.hashes[key as DifferentialStep])))throw Error('Invalid differential transaction record');
  if(new Set(Object.values(data.hashes).map(value=>value?.toLowerCase())).size!==Object.values(data.hashes).length)throw Error('Duplicate transaction hash');
  return {version:1,chainId:200010,sender:DEPLOYER,hashes:Object.fromEntries(DIFFERENTIAL_STEPS.filter(step=>data.hashes[step]).map(step=>[step,data.hashes[step]])) as DifferentialHashes['hashes']};
}
export const publicHadrianProvider:WalletProvider={request:async({method,params=[]})=>{
  const response=await fetch(chain.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`${method}: HTTP ${response.status}`);
  const body=await response.json() as {result?:unknown;error?:{message?:string}};
  if(body.error)throw Error(`${method}: ${body.error.message??'RPC error'}`);
  return body.result??null;
}};
export async function verifyDifferentialHashes(raw:unknown,provider:WalletProvider=publicHadrianProvider):Promise<Partial<Record<DifferentialStep,VerifiedStep>>>{
  const data=parseDifferentialHashes(raw);await assertDifferentialPlan(differentialPlan);
  const verified:Partial<Record<DifferentialStep,VerifiedStep>>={};
  let missing=false;
  for(const step of DIFFERENTIAL_STEPS){
    const txHash=data.hashes[step];
    if(!txHash){missing=true;continue}
    if(missing)throw Error('Differential transaction order has a gap');
    const result=await verifyDifferentialStep(provider,differentialPlan,step,txHash);
    if(!result)throw Error(`${step}: receipt pending; do not mark verified`);
    verified[step]=result;
  }
  return verified;
}
