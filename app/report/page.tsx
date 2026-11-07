'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {ScanReport} from '@/lib/types';
import {toMarkdown} from '@/lib/markdown';
import {ImportSummary} from './imports';
import {LANE_SOURCE_SHA256} from '@/lib/sample-source';
import ledger from '@/evidence/local-execution.json';
import {useReleaseEvidence,evidenceLabel} from '../evidence/use-evidence';

function trustedSource(value:string){try{const u=new URL(value);return u.protocol==='https:'&&['github.com','docs.rome.builders','docs.soliditylang.org'].includes(u.hostname)?u.href:null}catch{return null}}
function validReport(value:unknown):value is ScanReport{return !!value&&typeof value==='object'&&'findings' in value&&Array.isArray(value.findings)&&value.findings.length<=1000&&'parseErrors' in value&&Array.isArray(value.parseErrors)&&'ruleVersion' in value&&typeof value.ruleVersion==='string'}
function save(filename:string,content:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function ReportPage(){
  const [report,setReport]=useState<ScanReport|null>(null);
  const release=useReleaseEvidence();
  useEffect(()=>{try{const stored=sessionStorage.getItem('rome-report');if(stored&&stored.length<=2_000_000){const parsed:unknown=JSON.parse(stored);if(validReport(parsed))setReport(parsed)}}catch{}},[]);
  const linked=report?.files===1&&report.sampleSourceHash===LANE_SOURCE_SHA256&&ledger.records.some(row=>row.testId==='LaneProbe'&&row.sourceHash===LANE_SOURCE_SHA256);
  const receipt=release.data.cases.find(item=>item.id==='observe');
  return <><p className="accent text-xs tracking-widest">02 / ANALYSIS</p><h1 className="text-4xl font-bold mt-3">Compatibility Report</h1>
    {!report?<div className="panel p-8 mt-8"><p className="muted">No report in this browser session. Run a scan first.</p><Link href="/scan" className="button inline-block mt-5">Open scanner</Link></div>:<>
      <p className="muted mt-4">{report.status}: AST compatibility preflight. Findings are review prompts, not a security audit or on-chain proof.</p>
      <div className="flex flex-wrap gap-4 mt-8">{[['Files',report.files],['Findings',report.findings.length],['Parse errors',report.parseErrors.length],['Rule version',report.ruleVersion]].map(([key,value])=><div key={key} className="panel p-5 min-w-36"><p className="muted text-xs">{key}</p><strong className="text-xl">{value}</strong></div>)}</div>
      <div className="flex flex-wrap justify-between items-center gap-3 mt-9 mb-5"><h2 className="text-2xl font-bold">Findings</h2><div className="flex flex-wrap gap-3"><button className="button" onClick={()=>save('rome-compatibility-report.json',JSON.stringify(report,null,2),'application/json')}>Download JSON</button><button className="button" onClick={()=>save('rome-compatibility-report.md',toMarkdown(report),'text/markdown')}>Download Markdown</button></div></div>
      {report.findings.length===0?<div className="panel p-7 muted">No rules matched. This does not prove full compatibility.</div>:<div className="space-y-4">{report.findings.map((finding,index)=>{
        const sampleFinding=linked&&finding.rule==='EVM-BLOCK-CONTEXT';
        return <article className="panel p-6" key={index}><div className="flex gap-3 items-center flex-wrap"><span className="rounded bg-orange-500/20 accent px-2 py-1 text-xs uppercase">{finding.severity}</span><span className="rounded bg-slate-700 px-2 py-1 text-xs uppercase">{finding.confidence}</span><code>{finding.rule}</code>{finding.verification&&<span className="text-amber-300 text-xs">{finding.verification}</span>}{finding.suppression&&<span className="text-slate-300 text-xs">SUPPRESSED</span>}</div>
          <p className="muted text-sm mt-4">{finding.file}:{finding.line}</p><p className="mt-2"><strong>Why this matters:</strong> {finding.message}</p><p className="muted mt-3"><strong>Potential compatibility impact:</strong> Runtime behavior can differ when the flagged construct affects observable output. This static finding alone does not establish a divergence.</p><p className="muted mt-3"><strong>Recommended action:</strong> {finding.recommendation}</p><p className="muted mt-3"><strong>Confidence and evidence scope:</strong> {finding.confidence} source finding; {finding.verification?'runtime verification required':'review the source and test the affected path'}.</p>
          {finding.suppression&&<p className="text-sm mt-3">Suppression reason: {finding.suppression}</p>}{trustedSource(finding.source)&&<a href={trustedSource(finding.source)!} target="_blank" rel="noopener noreferrer" className="accent underline text-sm mt-3 inline-block">Relevant documentation ↗</a>}
          {sampleFinding?<div className="rounded-xl border border-[#474b5b] p-4 mt-5"><p className="accent text-sm font-bold">Related pinned LaneProbe runtime example</p><p className="muted text-sm mt-2">The scanned source SHA-256 matches the checked-in LaneProbe source. COMPATIBLE describes this specific test under normalized sender role and block context; gas parity is excluded. It does not verify another contract or all executions of this source.</p><p className="muted text-sm mt-2" aria-live="polite">Hadrian evidence: {evidenceLabel(release.live,release.error,release.checkedAt)}</p><div className="flex flex-wrap gap-5 mt-3 text-sm"><Link href="/cross-vm#laneprobe" className="accent underline">Live Differential case →</Link>{receipt&&<a href={receipt.explorer} target="_blank" rel="noreferrer" className="accent underline">Hadrian observe() receipt ↗</a>}</div></div>:<div className="rounded-xl border border-[#474b5b] p-4 mt-5"><p className="text-amber-300 text-sm font-bold">Runtime verification required</p><p className="muted text-sm mt-2">Review this finding, run the affected path in a local EVM, and compare with a separate Rome execution. The public LaneProbe proof is not evidence for this submitted code.</p><Link href="/cross-vm" className="accent underline text-sm mt-3 inline-block">See comparison method →</Link></div>}
        </article>})}</div>}
      <ImportSummary imports={report.imports||[]}/>{report.parseErrors.map((error,index)=><div className="panel p-5 mt-4 text-red-300" key={index}>{error.file}: {error.message}</div>)}
    </>}
  </>;
}
