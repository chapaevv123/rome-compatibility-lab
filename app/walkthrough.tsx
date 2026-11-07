import Link from 'next/link';
const steps=[
  ['STEP 1','Scan sample Solidity','The exact pinned LaneProbe source is preloaded. Run the browser scan.','/scan','Open sample scan'],
  ['STEP 2','Review compatibility finding','Inspect file, line, confidence and runtime verification guidance.','/report','Open report'],
  ['STEP 3','Compare local EVM vs Rome','Review four live differential cases and normalized conditions.','/cross-vm','Open comparison'],
  ['STEP 4','Inspect Hadrian and Solana proofs','Follow transaction receipts and the finalized Memo CPI.','/evidence','Open proofs']
];
export function Walkthrough(){return <section className="mt-8" aria-label="Judge Walkthrough"><h2 className="text-2xl font-bold mb-5">Judge Walkthrough</h2><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{steps.map(([step,title,description,href,action])=><article className="panel p-6" key={step}><p className="accent text-xs tracking-widest">{step}</p><h3 className="text-lg font-bold mt-3">{title}</h3><p className="muted text-sm mt-3 min-h-16">{description}</p><Link className="accent underline text-sm mt-4 inline-block" href={href}>{action} →</Link></article>)}</div><p className="muted text-sm mt-4">The report is available after running a scan in this browser session.</p></section>}
