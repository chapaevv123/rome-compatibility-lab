import {it} from 'node:test';import assert from 'node:assert/strict';import {compareRuns,compareLiveDifferentialRuns,type Run} from '../lib/regression';
import differential from '../evidence/live-differential.json';
import type {LiveDifferential} from '../lib/live-differential';
const base:Run={records:[{testId:'counter',sourceHash:'a',bytecodeHash:'b',registryVersion:'v0.3.0',hadrian:{status:'SUCCESS',state:{count:'1'}}}]};
it('reports a new failure from actual run fields',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],hadrian:{status:'FAILED'}}]}).summary.NEW_FAILURE,1));
it('marks missing Hadrian execution inconclusive',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],hadrian:{status:'NOT_EXECUTED'}}]}).summary.INCONCLUSIVE,1));
it('flags bytecode changes separately',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],bytecodeHash:'new'}]}).summary.CONFIG_CHANGED,1));
it('compares two recorded RPC checks without inventing Hadrian results',()=>{const run=differential as LiveDifferential;const result=compareLiveDifferentialRuns(run,run);assert.equal(result.summary.BEHAVIOR_CHANGED,0);assert.equal(result.summary.INCONCLUSIVE,3)});
it('detects changed verified Hadrian transaction',()=>{const run=differential as LiveDifferential;const changed=structuredClone(run);changed.rows[2].transactionHash='0x'+'ab'.repeat(32);assert.equal(compareLiveDifferentialRuns(run,changed).summary.BEHAVIOR_CHANGED,1)});
