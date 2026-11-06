import {readFileSync} from 'node:fs';
import {getChain} from '@rome-protocol/registry';
import {createPublicClient,http,isAddress,formatEther} from 'viem';

// Read-only deployment preparation: no private key, signing, or transaction send.
const address=process.env.ROME_BURNER_ADDRESS||process.env.ROME_ESTIMATE_ADDRESS;
if(!address||!isAddress(address)){
 console.error('Set ROME_BURNER_ADDRESS to your public burner address, or ROME_ESTIMATE_ADDRESS for a generic read-only RPC estimate. No key is needed.');
 process.exit(2);
}
const chain=getChain(200010);
if(!chain)throw Error('Hadrian missing from pinned registry');
const cpi=process.argv.includes('--cpi');
const artifact=JSON.parse(readFileSync(cpi?'cpi-preparation.json':'probe-preparation.json','utf8')) as {status:string;creationBytecode:string;compiler:string;network?:{chainId:number};chainId?:number;registryVersion?:string};
if(artifact.status!==(cpi?'STATIC_ONLY':'UNVERIFIED')||!artifact.compiler.startsWith('0.8.24+')||(artifact.network?.chainId??artifact.chainId)!==200010||artifact.registryVersion!=='v0.3.0'||!/^0x[0-9a-f]+$/i.test(artifact.creationBytecode))throw Error('Regenerate the unsigned probe artifact first');
const client=createPublicClient({transport:http(chain.rpcUrl,{timeout:10_000})});
const chainId=await client.getChainId();if(chainId!==200010)throw Error('RPC chain ID mismatch');
const [block,gasPrice,balance,estimatedGas]=await Promise.all([
 client.getBlockNumber(),client.getGasPrice(),client.getBalance({address}),client.estimateGas({account:address,data:artifact.creationBytecode as `0x${string}`})
]);
const estimatedCost=estimatedGas*gasPrice;
console.log(JSON.stringify({status:'READ_ONLY_ESTIMATE',scenario:cpi?'CPI_MEMO_DEPLOY_ONLY':'LANE_PROBE_DEPLOY',chainId,blockNumber:block.toString(),rpcUrl:chain.rpcUrl,explorerUrl:chain.explorerUrl,estimateAddress:address,addressIsOwnerBurner:!!process.env.ROME_BURNER_ADDRESS,balanceWei:balance.toString(),balanceNative:formatEther(balance),estimatedGas:estimatedGas.toString(),gasPriceWei:gasPrice.toString(),estimatedCostWei:estimatedCost.toString(),estimatedCostNative:formatEther(estimatedCost),fundingShortfallWei:balance<estimatedCost?(estimatedCost-balance).toString():'0',note:'eth_estimateGas can overpredict on Rome; CPI call not estimated here; actual charge is known only from a permitted receipt. No transaction was signed or sent.'},null,2));
