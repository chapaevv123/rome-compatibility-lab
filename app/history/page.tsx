'use client';
import {useState} from 'react';
import {compareRuns,type Run} from '@/lib/regression';
import {compare,scan} from '@/lib/scanner';
import type {ScanReport} from '@/lib/types';
import recordedReport from '@/examples/regression-baseline.json';
import {LANE_SAMPLE} from '@/lib/sample-source';

type Comparison={kind:'scanner'|'execution';changes:string[];summary:string};
function isScan(value:unknown):value is ScanReport{return !!value&&typeof value==='object'&&'findings' in value&&Array.isArray(value.findings)&&value.findings.length<=1000&&'ruleVersion' in value&&typeof value.ruleVersion==='string'}
function isRun(value:unknown):value is Run{return !!value&&typeof value==='object'&&'records' in value&&Array.isArray(value.records)&&value.records.length<=1000&&value.records.every((r:unknown)=>!!r&&typeof r==='object'&&'testId' in r&&'sourceHash' in r&&'bytecodeHash' in r)}
function perform(old:unknown,now:unknown):Comparison{
  if(isScan(old)&&isScan(now)){
    const result=compare(old,now),unchanged=Math.max(0,now.findings.length-result.added.length);
    return {kind:'scanner',changes:[...result.added.map(x=>`NEW · ${x}`),...result.removed.map(x=>`RESOLVED · ${x}`)],summary:`New ${result.added.length} · Resolved ${result.removed.length} · Unchanged ${unchanged}${result.ruleChanged?' · Rule version changed':''}`};
  }
  if(isRun(old)&&isRun(now)){
    const result=compareRuns(old,now);
    return {kind:'execution',changes:result.changes.map(x=>`${x.kind} · ${x.testId}: ${x.detail}`),summary:Object.entries(result.summary).map(([k,v])=>`${k} ${v}`).join(' · ')};
  }
  throw Error('Files must both be scanner JSON exports or both be execution ledgers');
}
export default function History(){
  const [result,setResult]=useState<Comparison|null>(null),[error,setError]=useState(''),[demo,setDemo]=useState(false);
  async function run(){setResult(null);setError('');setDemo(false);try{
    const a=document.querySelector<HTMLInputElement>('#old')?.files?.[0],b=document.querySelector<HTMLInputElement>('#new')?.files?.[0];
    if(!a||!b)throw Error('Choose both Baseline and Current JSON files');
    if(a.size>2_000_000||b.size>2_000_000)throw Error('Each report must be under 2 MB');
    let old:unknown,now:unknown;try{old=JSON.parse(await a.text());now=JSON.parse(await b.text())}catch{throw Error('Invalid JSON file. Export a report from this app and try again')}
    setResult(perform(old,now));
  }catch(e){setError(e instanceof Error?e.message:'Invalid report')}}
  function showDemo(){
    setError('');setDemo(true);
    setResult(perform(recordedReport,scan([{path:'LaneProbe.sol',content:LANE_SAMPLE}])));
  }
  return <><p className="accent text-xs tracking-widest">06 / REGRESSION INTELLIGENCE</p><h1 className="text-4xl font-bold mt-3">Regression History</h1><p className="muted mt-4 max-w-3xl">Baseline is the earlier report; Current is the newer report. Compare two scanner JSON exports to spot new, resolved and unchanged findings, or compare two execution ledgers for behavior and configuration changes. Files stay in your browser.</p>
    <div className="panel p-7 mt-8 grid md:grid-cols-2 gap-5"><label>Baseline JSON<input id="old" aria-label="Baseline report" className="input mt-3" type="file" accept=".json"/></label><label>Current JSON<input id="new" aria-label="Current report" className="input mt-3" type="file" accept=".json"/></label><button className="button w-fit" onClick={run}>Compare runs</button></div>
    <div className="panel p-6 mt-5"><h2 className="text-xl font-bold">Try a fixture comparison</h2><p className="muted text-sm mt-2">Compare checked-in <code>examples/regression-baseline.json</code> (five probe sources) with a fresh browser scan of the checked-in LaneProbe source. This illustrates the regression engine across different source sets; it is not a live execution or a revision of the same project.</p><button className="button mt-4" onClick={showDemo}>Show fixture comparison</button></div>
    {error&&<p className="panel p-5 mt-5 text-red-300" role="alert">{error}</p>}
    {!result&&!error&&<p className="panel p-6 mt-5 muted">No comparison yet. Select two exports or open the fixture example.</p>}
    {result&&<section className="panel p-6 mt-5" aria-live="polite"><p className="accent text-xs">{demo?'FIXTURE EXAMPLE':'LOCAL FILE COMPARISON'} · {result.kind}</p><h2 className="text-xl font-bold mt-2">{result.summary}</h2>{result.changes.length?<ul className="mt-4 space-y-2 text-sm">{result.changes.map((change,index)=><li className="border-t border-[#303447] pt-2 break-words" key={index}>{change}</li>)}</ul>:<p className="muted mt-3">No changes detected in the compared fields.</p>}</section>}
  </>;
}
