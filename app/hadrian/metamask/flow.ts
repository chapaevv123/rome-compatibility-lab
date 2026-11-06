import {padRomeGas, submitRomeTx} from '../../../vendor/rome-sdk/write.mjs';
import artifact from './lane-probe-artifact.json';

export const HADRIAN_CHAIN_ID = 200010n;
export const DEPLOYER = '0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d' as const;
export const EXPLORER = 'https://via-hadrian.testnet.romeprotocol.xyz/';
const EXPECTED_SOURCE_HASH = 'sha256:2ad0c44097cc945cef7a8d180e0382f814820cba43004d4d2e5d5caf7fdb7732';
const EXPECTED_BYTECODE_HASH = 'sha256:b8d358d94f50e7642c3702859d7732f3e448b8abbba3d84ca3b158bc8ff0b4da';

export type WalletProvider = {
  isMetaMask?: boolean;
  request(args:{method:string;params?:unknown[]}):Promise<unknown>;
};
export type DeploymentQuote = {
  address:typeof DEPLOYER;
  balance:bigint;
  estimatedGas:bigint;
  gasLimit:bigint;
  maxFeePerGas:bigint;
  maxCost:bigint;
};
export type DeploymentReceipt = {
  transactionHash:`0x${string}`;
  contractAddress:`0x${string}`;
  gasUsed:bigint;
  actualFee:bigint;
  blockNumber:bigint;
};

function hex(value:unknown,label:string):bigint {
  if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))throw Error(`Invalid ${label} from wallet`);
  return BigInt(value);
}
function address(value:unknown):value is `0x${string}` {
  return typeof value==='string'&&/^0x[0-9a-fA-F]{40}$/.test(value);
}
function txHash(value:unknown):value is `0x${string}` {
  return typeof value==='string'&&/^0x[0-9a-fA-F]{64}$/.test(value);
}
export function formatUsdc(wei:bigint):string {
  const whole=wei/10n**18n;
  const fraction=(wei%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');
  return `${whole}${fraction?'.'+fraction:''} USDC`;
}
export async function verifyArtifact():Promise<void> {
  if(artifact.contract!=='LaneProbe'||artifact.status!=='UNVERIFIED'||artifact.registryVersion!=='v0.3.0'||artifact.network.chainId!==Number(HADRIAN_CHAIN_ID)||artifact.sourceHash!==EXPECTED_SOURCE_HASH||artifact.bytecodeHash!==EXPECTED_BYTECODE_HASH||!/^0x(?:[0-9a-fA-F]{2})+$/.test(artifact.creationBytecode))throw Error('LaneProbe artifact mismatch');
  const bytes=Uint8Array.from(artifact.creationBytecode.slice(2).match(/../g)!,part=>parseInt(part,16));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(part=>part.toString(16).padStart(2,'0')).join('');
  if(`sha256:${digest}`!==EXPECTED_BYTECODE_HASH)throw Error('LaneProbe bytecode hash mismatch');
}
export async function assertWallet(provider:WalletProvider):Promise<typeof DEPLOYER> {
  if(provider.isMetaMask!==true)throw Error('Open this page in a browser with MetaMask');
  const chainId=hex(await provider.request({method:'eth_chainId'}),'chain ID');
  if(chainId!==HADRIAN_CHAIN_ID)throw Error(`Select Hadrian (chain ID 200010) in MetaMask; connected chain ID is ${chainId}`);
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||accounts.length!==1||!address(accounts[0])||accounts[0].toLowerCase()!==DEPLOYER.toLowerCase())throw Error(`Select only ${DEPLOYER} in MetaMask`);
  return DEPLOYER;
}
export async function connectWallet(provider:WalletProvider):Promise<typeof DEPLOYER> {
  if(provider.isMetaMask!==true)throw Error('MetaMask provider unavailable');
  await provider.request({method:'eth_requestAccounts'});
  return assertWallet(provider);
}
export async function prepareQuote(provider:WalletProvider):Promise<DeploymentQuote> {
  await verifyArtifact();
  const account=await assertWallet(provider);
  const deployment={from:account,data:artifact.creationBytecode};
  const [balanceRaw,gasRaw,gasPriceRaw,blockRaw]=await Promise.all([
    provider.request({method:'eth_getBalance',params:[account,'latest']}),
    provider.request({method:'eth_estimateGas',params:[deployment]}),
    provider.request({method:'eth_gasPrice'}),
    provider.request({method:'eth_getBlockByNumber',params:['latest',false]})
  ]);
  const estimatedGas=hex(gasRaw,'gas estimate');
  const gasLimit=padRomeGas(estimatedGas);
  const block=blockRaw as {baseFeePerGas?:unknown}|null;
  const baseFee=block?.baseFeePerGas?hex(block.baseFeePerGas,'base fee'):0n;
  const gasPrice=hex(gasPriceRaw,'gas price');
  const tipRaw=await provider.request({method:'eth_maxPriorityFeePerGas'}).catch(()=>null);
  const tip=tipRaw===null?0n:hex(tipRaw,'priority fee');
  const maxFeePerGas=baseFee>0n?baseFee*11n/10n+tip:gasPrice;
  if(estimatedGas<=0n||maxFeePerGas<=0n)throw Error('No usable gas estimate or fee');
  return {address:account,balance:hex(balanceRaw,'balance'),estimatedGas,gasLimit,maxFeePerGas,maxCost:gasLimit*maxFeePerGas};
}
export async function sendLaneDeployment(provider:WalletProvider,quote:DeploymentQuote):Promise<`0x${string}`> {
  await verifyArtifact();
  await assertWallet(provider);
  if(quote.address!==DEPLOYER||quote.gasLimit<=0n||quote.maxFeePerGas<=0n||quote.maxCost!==quote.gasLimit*quote.maxFeePerGas)throw Error('Invalid deployment quote');
  if(quote.balance<quote.maxCost)throw Error('Insufficient Hadrian test USDC for the displayed maximum fee');
  let sent=false;
  const guarded:WalletProvider={request:async args=>{
    if(args.method!=='eth_sendTransaction')return provider.request(args);
    if(sent)throw Error('Deployment was already submitted');
    await assertWallet(provider);
    const tx=Array.isArray(args.params)?args.params[0] as Record<string,unknown>:null;
    if(!tx||tx.from?.toString().toLowerCase()!==DEPLOYER.toLowerCase()||tx.to!==undefined||tx.data!==artifact.creationBytecode||tx.value!==undefined&&hex(tx.value,'value')!==0n)throw Error('Unexpected deployment transaction');
    if(hex(tx.gas,'gas limit')>quote.gasLimit||hex(tx.maxFeePerGas,'max fee')>quote.maxFeePerGas)throw Error('Network fee changed; refresh the estimate before sending');
    sent=true;
    return provider.request(args);
  }};
  const result=await submitRomeTx(guarded,{from:DEPLOYER,data:artifact.creationBytecode as `0x${string}`,fallbackGas:quote.gasLimit});
  if(!txHash(result))throw Error('Wallet returned an invalid transaction hash');
  return result;
}
export async function waitForDeployment(provider:WalletProvider,hash:`0x${string}`):Promise<DeploymentReceipt> {
  for(let attempt=0;attempt<40;attempt++){
    const raw=await provider.request({method:'eth_getTransactionReceipt',params:[hash]});
    if(raw){
      const receipt=raw as Record<string,unknown>;
      if(receipt.transactionHash?.toString().toLowerCase()!==hash.toLowerCase())throw Error('Receipt transaction hash mismatch');
      if(hex(receipt.status,'receipt status')!==1n)throw Error(`Deployment failed on-chain: ${hash}`);
      if(!address(receipt.contractAddress))throw Error('Receipt has no contract address');
      const gasUsed=hex(receipt.gasUsed,'gas used');
      const effectiveGasPrice=hex(receipt.effectiveGasPrice,'effective gas price');
      return {transactionHash:hash,contractAddress:receipt.contractAddress,gasUsed,actualFee:gasUsed*effectiveGasPrice,blockNumber:hex(receipt.blockNumber,'block number')};
    }
    await new Promise(resolve=>setTimeout(resolve,3000));
  }
  throw Error(`Receipt pending. Check ${EXPLORER}tx/${hash}`);
}
