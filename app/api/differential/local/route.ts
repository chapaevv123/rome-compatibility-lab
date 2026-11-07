import {writeFileSync} from 'node:fs';
import {NextRequest,NextResponse} from 'next/server';
import ledger from '../../../../evidence/local-execution.json';
import {verifyDifferentialHashes,parseDifferentialHashes} from '../../../../lib/differential-record';
import {assessLiveDifferential,type LocalLedger} from '../../../../lib/live-differential';
import {verifyReleaseEvidence} from '../../../../lib/release-evidence';
import {isLocalEvidenceRequest} from '../../../../lib/local-evidence-access';

export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
  if(!isLocalEvidenceRequest(request.url,request.headers.get('origin'),process.env.NODE_ENV))return NextResponse.json({error:'Local development only'},{status:403});
  try{
    const raw=await request.json();const hashes=parseDifferentialHashes(raw);
    const verified=await verifyDifferentialHashes(hashes);
    const differential=assessLiveDifferential(ledger as LocalLedger,await verifyReleaseEvidence(),'RECORDED_RPC_CHECK',verified);
    writeFileSync('evidence/differential-transactions.json',JSON.stringify(hashes,null,2)+'\n');
    writeFileSync('evidence/live-differential.json',JSON.stringify(differential,null,2)+'\n');
    return NextResponse.json({summary:differential.summary,verified:Object.keys(verified)},{headers:{'Cache-Control':'no-store'}});
  }catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:String(cause)},{status:422,headers:{'Cache-Control':'no-store'}})}
}
