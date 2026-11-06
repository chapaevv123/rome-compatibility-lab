import {writeFileSync} from 'node:fs';
import {verifyReleaseEvidence} from '../lib/release-evidence';

const result=await verifyReleaseEvidence();
writeFileSync('evidence/hadrian-live.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({cpiStatus:result.cpiStatus,evmCases:result.cases.length,solanaSignature:result.solana?.signature??null,solanaError:result.solanaError},null,2));
if(result.cpiStatus!=='LIVE_VERIFIED')process.exitCode=1;
