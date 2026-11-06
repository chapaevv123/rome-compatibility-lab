'use client';
import {useState} from 'react';
import Link from 'next/link';
const steps=[
 {title:'Scan a real source',description:'Open the browser scanner, upload a Solidity file or folder, then inspect the exact file and line in the report.',href:'/scan',action:'Open scanner'},
 {title:'Inspect executed local probes',description:'Review four decoded local EVM results with source and bytecode hashes. The historical ledger remains separate from later Hadrian transactions.',href:'/evidence',action:'Open evidence'},
 {title:'Verify the live boundary',description:'Inspect four Hadrian receipts and the mapped, finalized Solana Memo instruction. The planned MetaMask operations are complete.',href:'/hadrian',action:'Open Hadrian lab'},
] as const;
export function Walkthrough(){const [index,setIndex]=useState(0);const step=steps[index];return <section className="panel p-7 mt-8" aria-label="Interactive product walkthrough"><p className="accent text-xs tracking-widest">REVIEWER WALKTHROUGH · {index+1} / {steps.length}</p><h2 className="text-2xl font-bold mt-3">{step.title}</h2><p className="muted mt-3 max-w-2xl">{step.description}</p><div className="flex flex-wrap gap-3 mt-6"><button type="button" className="px-4 py-2 rounded-lg border border-[#474b5b] disabled:opacity-40" disabled={index===0} onClick={()=>setIndex(index-1)}>Previous</button><button type="button" className="px-4 py-2 rounded-lg border border-[#474b5b] disabled:opacity-40" disabled={index===steps.length-1} onClick={()=>setIndex(index+1)}>Next step</button><Link href={step.href} className="button">{step.action} →</Link></div></section>}
