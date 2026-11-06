import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {notFound} from 'next/navigation';
const names=['Clean','OriginHint','LaneProbe','Counter'] as const;
export function generateStaticParams(){return names.map(name=>({name:`${name}.sol`}));}
export default async function Source({params}:{params:Promise<{name:string}>}){const {name}=await params;const base=name.endsWith('.sol')?name.slice(0,-4):'';if(!names.includes(base as typeof names[number]))notFound();const source=readFileSync(join(process.cwd(),'probes',`${base}.sol`),'utf8');return <><p className="accent text-xs tracking-widest">REPRODUCIBLE SOURCE</p><h1 className="text-3xl font-bold mt-3">{name}</h1><p className="muted mt-3">The checked-in source used by the local execution ledger.</p><pre className="panel p-6 mt-6 text-sm overflow-auto"><code>{source}</code></pre></>}
