import {writeFileSync} from 'node:fs';
import ledger from '../evidence/local-execution.json';
import {assessLiveDifferential,type LocalLedger} from '../lib/live-differential';
import {verifyReleaseEvidence} from '../lib/release-evidence';

const result=assessLiveDifferential(ledger as LocalLedger,await verifyReleaseEvidence(),'RECORDED_RPC_CHECK');
writeFileSync('evidence/live-differential.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checkedAt:result.checkedAt,summary:result.summary,rows:result.rows.map(({testId,classification,transactionHash})=>({testId,classification,transactionHash}))},null,2));
if(result.summary.divergent>0)process.exitCode=1;
