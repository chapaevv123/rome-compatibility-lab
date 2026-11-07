import Link from 'next/link';
import {Walkthrough} from './walkthrough';
import {ProofSummary} from './proof-summary';
export default function Home(){return <>
  <section className="py-14 md:py-24 relative overflow-hidden"><div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl"/><p className="uppercase tracking-[.3em] text-xs accent mb-6">Pulse Labs / Developer tooling</p>
    <h1 className="text-5xl md:text-7xl font-black max-w-4xl leading-[1.03]">Know what crosses <span className="accent">the boundary.</span></h1>
    <p className="muted text-lg max-w-2xl mt-7 leading-relaxed">For Solidity and EVM developers building on Rome: a source scan alone cannot guarantee the same runtime behavior. Scan a contract, compare local EVM execution with Rome Hadrian, then inspect public receipts and a verified EVM → Solana Memo CPI.</p>
    <div className="flex flex-wrap gap-4 mt-9"><Link href="/scan" className="button">Scan Solidity →</Link><Link href="/evidence" className="px-5 py-3 rounded-xl border border-[#474b5b]">Explore live evidence</Link></div>
  </section>
  <ProofSummary/>
  <div className="grid md:grid-cols-3 gap-5 mt-8">{[['01 / SCAN','Source-aware findings','AST analysis with file and line references, confidence and remediation.'],['02 / COMPARE','Runtime comparison','Four tested cases compare local EVM and Hadrian under declared normalization.'],['03 / VERIFY','Public proof','Read-only RPC checks of Hadrian receipts and finalized Solana Memo CPI.']].map(([n,h,p])=><div className="panel p-7" key={h}><span className="accent text-xs tracking-widest">{n}</span><h2 className="text-2xl font-bold mt-5 mb-3">{h}</h2><p className="muted">{p}</p></div>)}</div>
  <Walkthrough/>
</>}
