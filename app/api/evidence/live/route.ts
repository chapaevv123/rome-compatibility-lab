import {NextResponse} from 'next/server';
import {verifyReleaseEvidence} from '../../../../lib/release-evidence';

export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json(await verifyReleaseEvidence(),{headers:{'Cache-Control':'no-store'}})}
  catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:String(cause)},{status:503,headers:{'Cache-Control':'no-store'}})}
}
