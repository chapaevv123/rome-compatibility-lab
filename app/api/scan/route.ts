import {NextRequest,NextResponse} from 'next/server';
import {scan,type SourceFile} from '@/lib/scanner';
import {importGitHub} from '@/lib/github';
import {acquireScanSlot} from '@/lib/scan-quota';

export const runtime='nodejs';
export const maxDuration=30;
const MAX_BODY=1_100_000;
let activeRequests=0;

function reply(error:string,status:number,headers?:Record<string,string>){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store',...headers}});}

async function readBody(req:NextRequest){
 const length=req.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY))throw Error('SIZE');
 const reader=req.body?.getReader();if(!reader)throw Error('INPUT');
 const chunks:Uint8Array[]=[];let size=0;
 let expired=false;
 const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},10_000);
 try{
  while(true){
   const chunk=await reader.read();
   if(expired)throw Error('TIMEOUT');
   if(chunk.done)break;
   size+=chunk.value.length;
   if(size>MAX_BODY){await reader.cancel();throw Error('SIZE');}
   chunks.push(chunk.value);
  }
 }finally{clearTimeout(timer);reader.releaseLock();}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw Error('INPUT');}
}

function validateFiles(value:unknown):SourceFile[]{
 if(!Array.isArray(value)||value.length===0||value.length>40)throw Error('INPUT');
 for(const file of value){
  if(!file||typeof file!=='object'||Array.isArray(file)||Object.keys(file).some(k=>k!=='path'&&k!=='content')||typeof file.path!=='string'||typeof file.content!=='string')throw Error('INPUT');
 }
 return value as SourceFile[];
}

export async function POST(req:NextRequest){
 if(activeRequests>=2)return reply('Scanner is busy; retry shortly',429,{'Retry-After':'5'});
 activeRequests++;
 let release:undefined|(()=>Promise<void>);
 try{
  const slot=await acquireScanSlot();
  if(slot.status==='disabled')return reply('Hosted scanning is unavailable; use local Solidity scan',503);
  if(slot.status==='unavailable')return reply('Scanner temporarily unavailable',503);
  if(slot.status==='limited'||slot.status==='busy')return reply('Scan quota reached; retry later',429,{'Retry-After':slot.status==='busy'?'5':'3600'});
  release=slot.release;
  if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return reply('Expected application/json',415);
  const body=await readBody(req);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='files'&&k!=='github')||('files' in body)===('github' in body))return reply('Provide files or GitHub URL',400);
  let files:SourceFile[];
  if('github' in body){if(typeof body.github!=='string')return reply('Invalid GitHub URL',400);files=await importGitHub(body.github);}
  else files=validateFiles(body.files);
  return NextResponse.json(scan(files),{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(error instanceof Error&&error.message==='SIZE')return reply('Request too large',413);
  if(error instanceof Error&&error.message==='TIMEOUT')return reply('Request timed out',408);
  return reply('Invalid scan input',400);
 }finally{if(release)await release();activeRequests--;}
}
