import {it} from 'node:test';
import assert from 'node:assert/strict';
import {compareExecution,type Execution} from '../lib/differential';
const local:Execution={environment:'LOCAL_EVM',status:'SUCCESS',returnValue:'1',state:{count:'1'},gasUsed:'45000'};
const hadrian:Execution={environment:'HADRIAN',status:'SUCCESS',returnValue:'1',state:{count:'1'},gasUsed:'100000',computeUnits:'200000'};
it('ignores incomparable gas and CU metrics',()=>assert.equal(compareExecution(local,hadrian).classification,'COMPATIBLE'));
it('does not claim execution when Hadrian is absent',()=>assert.equal(compareExecution(local,{environment:'HADRIAN',status:'NOT_EXECUTED'}).classification,'NOT_EXECUTED'));
it('detects state divergence',()=>assert.deepEqual(compareExecution(local,{...hadrian,state:{count:'2'}}).differences,['state']));
it('classifies a declared block-context difference',()=>assert.equal(compareExecution(local,{...hadrian,returnValue:'2'},['returnValue']).classification,'EXPECTED_DIFFERENCE'));
