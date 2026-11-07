'use client';
import Link from 'next/link';
import {useDifferentialEvidence,useReleaseEvidence,evidenceLabel} from './evidence/use-evidence';
export function ProofSummary(){
  const differential=useDifferentialEvidence(),release=useReleaseEvidence();
  const compatible=differential.data.summary.compatible;
  return <section className="panel p-7" aria-label="Current proof summary">
    <p className="accent text-xs tracking-widest">TESTED SCOPE · PUBLIC RECEIPTS</p>
    <h2 className="text-2xl font-bold mt-3">{compatible}/4 tested scenarios compatible</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 text-sm">
      <p>Compatible <strong>{compatible}</strong> / 4 tested</p><p>Observed divergences <strong>{differential.data.summary.divergent}</strong></p>
      <p>Hadrian receipts <strong>{release.data.cases.length===4?'verified in recorded check':'incomplete'}</strong></p><p>Solana Memo CPI <strong>{release.data.cpiStatus==='LIVE_VERIFIED'?'verified in recorded check':'pending'}</strong></p>
    </div>
    <p className="muted text-sm mt-4" aria-live="polite">Differential: {evidenceLabel(differential.live,differential.error,differential.checkedAt)}. Hadrian/Solana: {evidenceLabel(release.live,release.error,release.checkedAt)}.</p>
    <p className="muted text-sm mt-2">These results cover four pinned scenarios and their normalized conditions; they do not establish compatibility of arbitrary contracts.</p>
    <div className="flex flex-wrap gap-5 mt-4 text-sm"><Link className="accent underline" href="/cross-vm">Inspect comparison →</Link><Link className="accent underline" href="/cpi">Inspect Memo CPI →</Link><Link className="accent underline" href="/evidence">Open receipts →</Link></div>
  </section>
}
