'use client';

import {useRef,useState} from 'react';
import {assertWallet,connectWallet,DEPLOYER,EXPLORER,formatUsdc,prepareQuote,sendLaneDeployment,waitForDeployment,type DeploymentQuote,type DeploymentReceipt,type WalletProvider} from './flow';

function metaMask():WalletProvider {
  const provider=(window as Window & {ethereum?:WalletProvider}).ethereum;
  if(!provider||provider.isMetaMask!==true)throw Error('MetaMask is not available in this browser');
  return provider;
}
function message(error:unknown):string {
  return error instanceof Error?error.message:String(error);
}

export default function ManualLaneDeployment(){
  const sending=useRef(false);
  const [connected,setConnected]=useState(false);
  const [quote,setQuote]=useState<DeploymentQuote|null>(null);
  const [hash,setHash]=useState<`0x${string}`|null>(null);
  const [receipt,setReceipt]=useState<DeploymentReceipt|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function connect(){
    setBusy(true);setError('');setQuote(null);
    try{await connectWallet(metaMask());setConnected(true);}catch(cause){setConnected(false);setError(message(cause));}finally{setBusy(false);}
  }
  async function estimate(){
    setBusy(true);setError('');setQuote(null);
    try{const next=await prepareQuote(metaMask());setQuote(next);}catch(cause){setError(message(cause));}finally{setBusy(false);}
  }
  async function deploy(){
    if(!quote||hash||sending.current)return;
    sending.current=true;
    let submitted=false;
    setBusy(true);setError('');
    try{
      const provider=metaMask();
      await assertWallet(provider);
      const txHash=await sendLaneDeployment(provider,quote);
      submitted=true;
      setHash(txHash);
      setReceipt(await waitForDeployment(provider,txHash));
    }catch(cause){setError(message(cause));}finally{if(!submitted)sending.current=false;setBusy(false);}
  }
  return <>
    <p className="accent text-xs tracking-widest">HADRIAN / MANUAL METAMASK DEPLOY</p>
    <h1 className="text-4xl font-bold mt-3">Deploy LaneProbe</h1>
    <p className="muted mt-4 max-w-3xl">One constructor transaction. This page never requests a private key and never calls observe(). MetaMask asks for your final approval before any transaction is sent.</p>
    <section className="panel p-6 mt-8 max-w-3xl" aria-label="Deployment steps">
      <h2 className="text-xl font-bold">1. Connect the exact wallet</h2>
      <p className="muted mt-2 break-all">Expected address: {DEPLOYER}</p>
      <p className="muted">Network: Hadrian · chain ID 200010 · gas token: test USDC</p>
      <button className="button mt-4" type="button" onClick={connect} disabled={busy||!!hash}>Connect MetaMask</button>
      {connected&&<p className="mt-3" role="status">Connected address and chain verified.</p>}
    </section>
    <section className="panel p-6 mt-5 max-w-3xl" aria-label="Fee estimate">
      <h2 className="text-xl font-bold">2. Review the fee</h2>
      <button className="button mt-4" type="button" onClick={estimate} disabled={!connected||busy||!!hash}>Refresh read-only estimate</button>
      {quote&&<div className="mt-4 space-y-2" role="status">
        <p className="break-all">Wallet: {quote.address}</p>
        <p>Balance: {formatUsdc(quote.balance)}</p>
        <p>Estimated gas: {quote.estimatedGas.toString()} · padded limit: {quote.gasLimit.toString()}</p>
        <p>Maximum displayed fee: <strong>{formatUsdc(quote.maxCost)}</strong></p>
        <p className="muted text-sm">This is a ceiling from the current fee context, not the final charge. A changed fee requires a new estimate.</p>
        {quote.balance<quote.maxCost&&<p className="accent">Insufficient test USDC. Fund this wallet on Hadrian before deployment.</p>}
      </div>}
    </section>
    <section className="panel p-6 mt-5 max-w-3xl" aria-label="Manual deployment">
      <h2 className="text-xl font-bold">3. Request one deployment</h2>
      <p className="muted mt-2">This button only opens the MetaMask transaction approval. You can reject it there.</p>
      <button className="button mt-4" type="button" onClick={deploy} disabled={!quote||quote.balance<quote.maxCost||busy||!!hash}>Open MetaMask approval for LaneProbe</button>
      {busy&&<p className="mt-3" role="status">Waiting for wallet or receipt…</p>}
      {hash&&<p className="mt-3 break-all">Transaction: <a className="accent underline" href={`${EXPLORER}tx/${hash}`} target="_blank" rel="noreferrer">{hash}</a></p>}
      {receipt&&<div className="mt-4 space-y-2" role="status">
        <p>Contract: <a className="accent underline break-all" href={`${EXPLORER}address/${receipt.contractAddress}`} target="_blank" rel="noreferrer">{receipt.contractAddress}</a></p>
        <p>Block: {receipt.blockNumber.toString()}</p>
        <p>Gas used: {receipt.gasUsed.toString()}</p>
        <p>Actual fee: {formatUsdc(receipt.actualFee)}</p>
      </div>}
      {error&&<p className="mt-4 accent" role="alert">{error}</p>}
    </section>
  </>;
}
