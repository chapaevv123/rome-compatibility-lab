'use client';
import {useEffect,useRef,useState} from 'react';
import planJson from '../../../evidence/unsigned-differential-plan.json';
import recordedJson from '../../../evidence/differential-transactions.json';
import {DEPLOYER,formatUsdc,type WalletProvider} from './flow';
import {DIFFERENTIAL_STEPS,assertDifferentialPlan,assertDifferentialWallet,quoteDifferentialStep,sendDifferentialStep,verifyDifferentialStep,type DifferentialHashes,type DifferentialPlan,type DifferentialStep,type StepQuote,type VerifiedStep} from '../../../lib/differential-operations';

const plan=planJson as DifferentialPlan;
const storageKey='rome-lab-differential-v1';
const initial=recordedJson as DifferentialHashes;
const provider=()=>((window as Window&{ethereum?:WalletProvider}).ethereum);
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export default function DifferentialConsole(){
  const [connected,setConnected]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState(''),[accepted,setAccepted]=useState(false);
  const [hashes,setHashes]=useState<DifferentialHashes>(initial),[verified,setVerified]=useState<Partial<Record<DifferentialStep,VerifiedStep>>>({}),[quote,setQuote]=useState<StepQuote|null>(null);
  const busyRef=useRef(false);
  useEffect(()=>{try{const raw=localStorage.getItem(storageKey);if(raw){const saved=JSON.parse(raw) as DifferentialHashes;if(saved.version===1&&saved.chainId===200010&&saved.sender.toLowerCase()===DEPLOYER.toLowerCase())setHashes(saved)}}catch{/* A damaged browser record cannot authorize a transaction. */}},[]);
  const guarded=async(task:()=>Promise<void>)=>{if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');try{await task()}catch(cause){setError(cause instanceof Error?cause.message:String(cause))}finally{busyRef.current=false;setBusy(false)}};
  const check=async(record:DifferentialHashes)=>{
    const wallet=provider();if(!wallet)throw Error('MetaMask unavailable');await assertDifferentialPlan(plan);await assertDifferentialWallet(wallet);
    const current:Partial<Record<DifferentialStep,VerifiedStep>>={};
    for(const step of DIFFERENTIAL_STEPS){const hash=record.hashes[step];if(!hash)break;const result=await verifyDifferentialStep(wallet,plan,step,hash);if(!result){setInfo(`${step}: transaction pending; check receipt again later`);break}current[step]=result}
    return current;
  };
  const sync=async(record:DifferentialHashes)=>{
    const response=await fetch('/api/differential/local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});
    const body=await response.json() as {error?:string;verified?:string[]};
    if(!response.ok)throw Error(`Receipt verified in browser, but local evidence was not saved: ${body.error??response.status}`);
    setInfo(`Local evidence saved: ${body.verified?.length??0} verified operations`);
  };
  const save=(record:DifferentialHashes)=>{localStorage.setItem(storageKey,JSON.stringify(record));setHashes(record)};
  const connect=()=>guarded(async()=>{const wallet=provider();if(!wallet)throw Error('MetaMask unavailable');await wallet.request({method:'eth_requestAccounts'});const current=await check(hashes);if(Object.keys(hashes.hashes).length&&Object.keys(current).length===Object.keys(hashes.hashes).length)await sync(hashes);setVerified(current);setConnected(true);setInfo('Wallet and recorded receipts checked. Estimate the next operation explicitly.')});
  const recheck=()=>guarded(async()=>{setQuote(null);const current=await check(hashes);if(Object.keys(current).length===Object.keys(hashes.hashes).length)await sync(hashes);setVerified(current)});
  const next=DIFFERENTIAL_STEPS.find(step=>!verified[step]);
  const estimate=(step:DifferentialStep)=>guarded(async()=>{const wallet=provider();if(!wallet)throw Error('MetaMask unavailable');const result=await quoteDifferentialStep(wallet,plan,step,verified);setQuote(result);setAccepted(false);setInfo('Review the exact transaction details and fee before opening MetaMask.')});
  const submit=(step:DifferentialStep)=>guarded(async()=>{
    if(!quote||quote.step!==step||!accepted)throw Error('Refresh estimate and confirm the details for this operation');
    const wallet=provider();if(!wallet)throw Error('MetaMask unavailable');
    const txHash=await sendDifferentialStep(wallet,plan,quote,verified);
    const updated:DifferentialHashes={...hashes,hashes:{...hashes.hashes,[step]:txHash}};save(updated);setQuote(null);setAccepted(false);
    setInfo(`${step} submitted: ${txHash}. Waiting for receipt; never click send again for this step.`);
    for(let attempt=0;attempt<40;attempt++){
      const result=await verifyDifferentialStep(wallet,plan,step,txHash);
      if(result){await sync(updated);setVerified(current=>({...current,[step]:result}));return}
      await sleep(3000);
    }
    throw Error(`Receipt still pending for ${txHash}. Use Check receipts; do not resend.`);
  });
  return <section className="panel p-6 mt-8" aria-label="Local differential transaction console">
    <h2 className="text-2xl font-bold">Local differential operations</h2>
    <p className="muted mt-3">Six separate owner actions: deploy Clean, OriginHint and Counter in order, then call each once. This console only works on local development. No transaction is sent until you press its Confirm in MetaMask button and approve it inside MetaMask.</p>
    <p className="muted mt-2 break-all">Required account: {DEPLOYER} · Hadrian chain ID 200010. Plan nonce: {plan.cases.map(item=>`${item.id} ${item.expectedNonce}`).join(', ')}. If an unrelated transaction changes a nonce, stop and regenerate the unsigned plan.</p>
    <div className="flex flex-wrap gap-3 mt-5"><button className="rounded-lg border px-4 py-2" onClick={connect} disabled={busy}>Connect MetaMask</button><button className="rounded-lg border px-4 py-2" onClick={recheck} disabled={!connected||busy}>Check receipts and save evidence</button></div>
    {error&&<p role="alert" className="text-red-300 mt-4 break-all">{error}</p>}{info&&<p aria-live="polite" className="muted mt-4 break-all">{info}</p>}
    <div className="grid md:grid-cols-2 gap-4 mt-6">{DIFFERENTIAL_STEPS.map(step=>{const [kind,id]=step.split(':');const item=plan.cases.find(c=>c.id===id)!;const done=verified[step],pending=hashes.hashes[step]&&!done,active=connected&&next===step&&!pending;const currentQuote=quote?.step===step?quote:null;return <article className="rounded-xl border border-[#303447] p-5" key={step}>
      <h3 className="text-xl font-bold">{kind==='deploy'?'Deploy':'Call'} {id}</h3><p className="muted text-sm mt-2 break-all">{kind==='deploy'?`Nonce ${item.expectedNonce} → ${item.predictedAddress}`:`To ${item.predictedAddress}`}</p><p className="muted text-sm mt-1 break-all">Calldata: {kind==='deploy'?`${item.deployment.data.slice(0,22)}… (${(item.deployment.data.length-2)/2} bytes)`:item.call.data}</p>
      {done?<p className="accent mt-3 break-all">Verified receipt: {done.hash}</p>:pending?<p className="muted mt-3 break-all">Submitted, awaiting receipt: {hashes.hashes[step]}</p>:active?<><button className="rounded-lg border px-4 py-2 mt-3" disabled={busy} onClick={()=>estimate(step)}>Refresh estimate</button>{currentQuote&&<div className="mt-3 text-sm"><p>Nonce {currentQuote.nonce.toString()} · Balance {formatUsdc(currentQuote.balance)}</p><p>Estimated gas {currentQuote.estimatedGas.toString()} · gas limit {currentQuote.gasLimit.toString()}</p><p>Max fee per gas {currentQuote.maxFeePerGas.toString()} wei · maximum {formatUsdc(currentQuote.maxCost)}</p><label className="flex gap-2 mt-3"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/>I checked the account, chain, nonce, target, data and maximum fee.</label><button className="rounded-lg border px-4 py-2 mt-3" disabled={busy||!accepted} onClick={()=>submit(step)}>Confirm in MetaMask: {step}</button></div>}</>:<p className="muted mt-3">Locked until previous receipt is verified.</p>}
    </article>})}</div>
    <p className="muted mt-5">Every verified receipt is saved to local evidence. A pending hash stays in this browser so the operation cannot be sent twice. The transaction hashes are public; never enter a private key.</p>
  </section>;
}
