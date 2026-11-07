import {writeFileSync} from 'node:fs';
import ledger from '../evidence/local-execution.json';
import {assessLiveDifferential,type LocalLedger} from '../lib/live-differential';
import {verifyReleaseEvidence} from '../lib/release-evidence';
import hashes from '../evidence/differential-transactions.json';
import {verifyDifferentialHashes} from '../lib/differential-record';

const result=assessLiveDifferential(ledger as LocalLedger,await verifyReleaseEvidence(),'RECORDED_RPC_CHECK',await verifyDifferentialHashes(hashes));
writeFileSync('evidence/live-differential.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checkedAt:result.checkedAt,summary:result.summary,rows:result.rows.map(({testId,classification,transactionHash})=>({testId,classification,transactionHash}))},null,2));
if(result.summary.divergent>0)process.exitCode=1;
