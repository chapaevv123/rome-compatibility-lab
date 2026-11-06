'use client';
import {useState} from 'react';

const sample=`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract LaneProbe {\n    event Observed(address caller, uint256 blockNumber);\n    function observe() external {\n        emit Observed(msg.sender, block.number);\n    }\n}`;
const hostedEnabled=process.env.NEXT_PUBLIC_SCAN_API_ENABLED==='1';

export default function ScanPage(){
 const [source,setSource]=useState(sample),[name,setName]=useState('LaneProbe.sol'),[github,setGithub]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(file?:File){
  if(!file)return;
  try{if(file.size>100_000)throw Error('File exceeds 100 KB');const content=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());setName(file.name);setSource(content);setGithub('');setError('');}
  catch(e){setError(e instanceof Error?e.message:'Invalid Solidity file');}
 }
 async function run(){
  setBusy(true);setError('');
  try{
   let result:unknown;
   if(github){
    if(!hostedEnabled)throw Error('GitHub import is unavailable in local demo mode');
    const response=await fetch('/api/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({github})});
    const payload=await response.json();if(!response.ok)throw Error(payload.error||'Scan failed');result=payload;
   }else{
    const {scan}=await import('@/lib/scanner');
    result=scan([{path:name,content:source}]);
   }
   sessionStorage.setItem('rome-report',JSON.stringify(result));location.href='/report';
  }catch(e){setError(e instanceof Error?e.message:'Scan failed');setBusy(false);}
 }
 return <><p className="accent text-xs tracking-widest">01 / SOURCE PREFLIGHT</p><h1 className="text-4xl font-bold mt-3">Scan Contract</h1><p className="muted mt-4 max-w-3xl">Paste or upload a Solidity file for a local AST preflight. GitHub import is available only when protected hosted scanning is configured. This does not compile or execute submitted code.</p><div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-8"><div className="panel p-6"><label className="text-sm muted" htmlFor="solidity-file">Upload Solidity file (100 KB max)</label><input id="solidity-file" aria-label="Upload Solidity file" className="input mt-2 mb-5" type="file" accept=".sol" onChange={e=>void upload(e.target.files?.[0])}/><label className="text-sm muted" htmlFor="solidity-name">Filename</label><input id="solidity-name" className="input mt-2 mb-5" value={name} onChange={e=>setName(e.target.value)}/><label className="text-sm muted" htmlFor="solidity-source">Solidity source</label><textarea id="solidity-source" aria-label="Solidity source" className="input mt-2 font-mono text-sm h-80" value={source} onChange={e=>setSource(e.target.value)}/><p className="muted text-sm my-4">For multiple files use the CLI or, when enabled, a public GitHub repository.</p><button className="button" onClick={run} disabled={busy}>{busy?'Scanning…':'Run preflight →'}</button>{error&&<p role="alert" className="text-red-300 mt-4">{error}</p>}</div><aside className="panel p-6 h-fit"><h2 className="font-bold text-xl">Import from GitHub</h2><p className="muted text-sm mt-3 mb-5">{hostedEnabled?'Public repositories only; up to 40 Solidity files and 1 MiB total. No scripts run.':'Unavailable in local demo mode until a shared quota is configured.'}</p><input aria-label="GitHub URL" className="input" placeholder="https://github.com/owner/repo" value={github} onChange={e=>setGithub(e.target.value)} disabled={!hostedEnabled}/><div className="border-t border-[#303447] mt-6 pt-6"><p className="accent text-xs tracking-widest">SCOPE</p><p className="muted text-sm mt-3">AST checks are a compatibility preflight. They do not establish bytecode equivalence or a security audit.</p></div></aside></div></>;
}
