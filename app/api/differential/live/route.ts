import {NextResponse} from 'next/server';
import ledger from '../../../../evidence/local-execution.json';
import {assessLiveDifferential,type LocalLedger} from '../../../../lib/live-differential';
import {verifyReleaseEvidence} from '../../../../lib/release-evidence';
import recordedHashes from '../../../../evidence/differential-transactions.json';
import {verifyDifferentialHashes} from '../../../../lib/differential-record';

export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json(assessLiveDifferential(ledger as LocalLedger,await verifyReleaseEvidence(),'FRESH_RPC',await verifyDifferentialHashes(recordedHashes)),{headers:{'Cache-Control':'no-store'}})}
  catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:String(cause)},{status:503,headers:{'Cache-Control':'no-store'}})}
}
