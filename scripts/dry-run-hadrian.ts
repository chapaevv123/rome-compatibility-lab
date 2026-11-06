import {readFileSync} from 'node:fs';
import {getChain} from '@rome-protocol/registry';
import {createPublicClient,http,isAddress,formatEther} from 'viem';

// Read-only deployment preparation: no private key, signing, or transaction send.
const address=process.env.ROME_BURNER_ADDRESS;
if(!address||!isAddress(address)){
 console.error('Set ROME_BURNER_ADDRESS to the public address of a separate testnet burner wallet. No key is needed.');
 process.exit(2);
}
const chain=getChain(200010);
if(!chain)throw Error('Hadrian missing from pinned registry');
const artifact=JSON.parse(readFileSync('probe-preparation.json','utf8')) as {status:string;creationBytecode:string;compiler:string;network:{chainId:number}};
if(artifact.status!=='UNVERIFIED'||artifact.compiler!=='solc@0.8.24'||artifact.network.chainId!==200010||!/^0x[0-9a-f]+$/i.test(artifact.creationBytecode))throw Error('Regenerate the unsigned probe artifact first');
const client=createPublicClient({transport:http(chain.rpcUrl,{timeout:10_000})});
const chainId=await client.getChainId();if(chainId!==200010)throw Error('RPC chain ID mismatch');
const [block,gasPrice,balance,estimatedGas]=await Promise.all([
 client.getBlockNumber(),client.getGasPrice(),client.getBalance({address}),client.estimateGas({account:address,data:artifact.creationBytecode as `0x${string}`})
]);
const estimatedCost=estimatedGas*gasPrice;
console.log(JSON.stringify({status:'READ_ONLY_ESTIMATE',chainId,blockNumber:block.toString(),rpcUrl:chain.rpcUrl,explorerUrl:chain.explorerUrl,burnerAddress:address,balanceWei:balance.toString(),balanceNative:formatEther(balance),estimatedGas:estimatedGas.toString(),gasPriceWei:gasPrice.toString(),estimatedCostWei:estimatedCost.toString(),estimatedCostNative:formatEther(estimatedCost),fundingShortfallWei:balance<estimatedCost?(estimatedCost-balance).toString():'0',note:'eth_estimateGas can overpredict on Rome; actual charge is known only from a permitted receipt. No transaction was signed or sent.'},null,2));
