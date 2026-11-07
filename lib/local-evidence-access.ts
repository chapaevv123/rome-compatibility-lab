const loopback=new Set(['localhost','127.0.0.1']);
export function isLocalEvidenceRequest(requestUrl:string,originHeader:string|null,nodeEnv:string|undefined):boolean{
  if(nodeEnv!=='development'||!originHeader)return false;
  try{
    const target=new URL(requestUrl),origin=new URL(originHeader);
    return loopback.has(target.hostname)&&loopback.has(origin.hostname)&&target.protocol===origin.protocol&&target.port===origin.port&&origin.origin===originHeader&&['http:','https:'].includes(target.protocol);
  }catch{return false}
}
