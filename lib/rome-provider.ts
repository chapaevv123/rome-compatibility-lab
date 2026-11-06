import type {Hex} from 'viem';
export type RomeWriteRequest={from:string;to?:Hex;data?:Hex;gas:string;maxFeePerGas?:string;maxPriorityFeePerGas?:string};
export function createApprovedRomeProvider(config:{address:Hex;read:(method:string,params:unknown[])=>Promise<unknown>;send:(tx:{to?:Hex;data?:Hex;gas:bigint;maxFeePerGas:bigint;maxPriorityFeePerGas:bigint})=>Promise<Hex>}){
 let approvedMaxWei=0n;
 return {
  approve(maxWei:bigint){if(maxWei<=0n)throw Error('Invalid approval ceiling');approvedMaxWei=maxWei;},
  async request({method,params=[]}:{method:string;params?:unknown[]}):Promise<unknown>{
   if(method==='eth_sendTransaction'){
    const tx=params[0] as RomeWriteRequest|undefined;
    if(!tx||tx.from.toLowerCase()!==config.address.toLowerCase()||!tx.gas||!tx.maxFeePerGas||!tx.maxPriorityFeePerGas)throw Error('Invalid SDK transaction');
    const gas=BigInt(tx.gas),maxFeePerGas=BigInt(tx.maxFeePerGas),maxPriorityFeePerGas=BigInt(tx.maxPriorityFeePerGas);
    if(gas<=0n||maxFeePerGas<=0n||gas*maxFeePerGas>approvedMaxWei||approvedMaxWei===0n)throw Error('SDK transaction exceeds approved cost ceiling');
    approvedMaxWei=0n;
    return config.send({to:tx.to,data:tx.data,gas,maxFeePerGas,maxPriorityFeePerGas});
   }
   if(!['eth_estimateGas','eth_getBlockByNumber','eth_maxPriorityFeePerGas','eth_gasPrice'].includes(method))throw Error('Unexpected SDK RPC method');
   return config.read(method,params);
  }
 };
}
