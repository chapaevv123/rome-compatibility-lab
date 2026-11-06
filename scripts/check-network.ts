import {getChain} from '@rome-protocol/registry';
import {createPublicClient,http} from 'viem';

const hadrian=getChain(200010);
if(!hadrian)throw Error('Hadrian not present in pinned registry');
const client=createPublicClient({transport:http(hadrian.rpcUrl,{timeout:10_000})});
const chainId=await Promise.allSettled([client.getChainId(),client.getBlockNumber()]);
const explorer=await (async()=>{
  if(!hadrian.explorerUrl)return {status:'BLOCKED',reason:'Explorer URL absent from registry'};
  try{
    let response=await fetch(hadrian.explorerUrl,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(10_000)});
    if(response.status===405)response=await fetch(hadrian.explorerUrl,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10_000)});
    return response.status>=200&&response.status<400?{status:'LIVE VERIFIED',httpStatus:response.status}:{status:'BLOCKED',httpStatus:response.status};
  }catch(error){return {status:'BLOCKED',reason:String(error)};}
})();
const result={
  source:'rome-registry#v0.1.0',
  configuredChainId:hadrian.chainId,
  rpcUrl:hadrian.rpcUrl,
  explorerUrl:hadrian.explorerUrl,
  chainId:chainId[0].status==='fulfilled'?{status:chainId[0].value===hadrian.chainId?'LIVE VERIFIED':'UNVERIFIED',value:chainId[0].value}:{status:'BLOCKED',reason:String(chainId[0].reason)},
  blockNumber:chainId[1].status==='fulfilled'?{status:'LIVE VERIFIED',value:chainId[1].value.toString()}:{status:'BLOCKED',reason:String(chainId[1].reason)},
  explorer,
};
console.log(JSON.stringify(result,null,2));
if(result.chainId.status!=='LIVE VERIFIED'||result.blockNumber.status!=='LIVE VERIFIED'||result.explorer.status!=='LIVE VERIFIED')process.exitCode=2;
