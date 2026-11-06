// Shared quota and concurrency gate for all serverless instances. An unavailable
// store denies requests; the per-instance guard in the route is only a backup.
const TAKE=`local count=redis.call('INCR',KEYS[1]); if count==1 then redis.call('EXPIRE',KEYS[1],3600) end; if count>tonumber(ARGV[1]) then return 0 end; local active=redis.call('INCR',KEYS[2]); if active==1 then redis.call('EXPIRE',KEYS[2],45) end; if active>tonumber(ARGV[2]) then redis.call('DECR',KEYS[2]); return -1 end; return 1`;
const RELEASE=`local active=tonumber(redis.call('GET',KEYS[1]) or '0'); if active>0 then return redis.call('DECR',KEYS[1]) end; return 0`;
const MAX_PER_HOUR=120;
const MAX_ACTIVE=8;

function config(){
 if(process.env.ROME_SCAN_API_ENABLED!=='1')return null;
 const token=process.env.UPSTASH_REDIS_REST_TOKEN;
 const raw=process.env.UPSTASH_REDIS_REST_URL;
 if(!token||!raw)return null;
 try{const url=new URL(raw);if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;return {url:url.toString(),token};}catch{return null;}
}

async function evalRedis(script:string,keys:string[],args:number[],settings:NonNullable<ReturnType<typeof config>>){
 const response=await fetch(settings.url,{method:'POST',headers:{'Authorization':`Bearer ${settings.token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,keys.length,...keys,...args]),cache:'no-store',signal:AbortSignal.timeout(2000)});
 if(!response.ok)throw Error('Quota service unavailable');
 const data:unknown=await response.json();
 if(!data||typeof data!=='object'||!('result' in data)||!Number.isInteger(Number(data.result)))throw Error('Invalid quota response');
 return Number(data.result);
}

export type ScanSlot={status:'disabled'|'unavailable'|'limited'|'busy'|'allowed';release?:()=>Promise<void>};
export async function acquireScanSlot():Promise<ScanSlot>{
 const settings=config();if(!settings)return {status:'disabled'};
 const hour=Math.floor(Date.now()/3_600_000);
 const activeKey='rome-compat-lab:scan:active:v1';
 try{
  const result=await evalRedis(TAKE,[`rome-compat-lab:scan:hour:v1:${hour}`,activeKey],[MAX_PER_HOUR,MAX_ACTIVE],settings);
  if(result===0)return {status:'limited'};
  if(result===-1)return {status:'busy'};
  if(result!==1)return {status:'unavailable'};
  return {status:'allowed',release:async()=>{try{await evalRedis(RELEASE,[activeKey],[],settings);}catch{/* TTL clears abandoned leases. */}}};
 }catch{return {status:'unavailable'};}
}
