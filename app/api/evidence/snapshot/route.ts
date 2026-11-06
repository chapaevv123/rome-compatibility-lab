import {NextResponse} from 'next/server';
import snapshot from '../../../../evidence/hadrian-live.json';
export async function GET(){return NextResponse.json(snapshot)}
