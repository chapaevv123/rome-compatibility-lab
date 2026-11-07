'use client';
import {useEffect,useState} from 'react';
import releaseSnapshot from '@/evidence/hadrian-live.json';
import differentialSnapshot from '@/evidence/live-differential.json';
import type {ReleaseEvidence} from '@/lib/release-evidence';
import type {LiveDifferential} from '@/lib/live-differential';

function useRpcEvidence<T extends {checkedAt:string}>(path:string,recorded:T,valid:(value:T)=>boolean){
  const [live,setLive]=useState<T|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch(path,{cache:'no-store',signal:controller.signal}).then(async response=>{
      const body=await response.json();
      if(!response.ok)throw Error(body.error??`HTTP ${response.status}`);
      if(!valid(body as T))throw Error('Unexpected RPC evidence response');
      setLive(body as T);
    }).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:String(cause))});
    return()=>controller.abort();
  },[path]);
  return {data:live??recorded,live:!!live,error,checkedAt:(live??recorded).checkedAt};
}
export function useReleaseEvidence(){return useRpcEvidence<ReleaseEvidence>('/api/evidence/live',releaseSnapshot as ReleaseEvidence,value=>value.chainId===200010&&value.cases?.length===4&&!!value.checkedAt)}
export function useDifferentialEvidence(){return useRpcEvidence<LiveDifferential>('/api/differential/live',differentialSnapshot as LiveDifferential,value=>value.source==='FRESH_RPC'&&value.chainId===200010&&value.rows?.length===4)}
export function evidenceLabel(live:boolean,error:string,checkedAt:string){return `${live?'FRESH_RPC':error?'STALE · RECORDED':'RECORDED · CHECKING RPC'} · Last successful check ${checkedAt}${error?`; current RPC unavailable: ${error}`:''}`}
