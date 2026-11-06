import {it} from 'node:test';import assert from 'node:assert/strict';import {compareRuns,type Run} from '../lib/regression';
const base:Run={records:[{testId:'counter',sourceHash:'a',bytecodeHash:'b',registryVersion:'v0.3.0',hadrian:{status:'SUCCESS',state:{count:'1'}}}]};
it('reports a new failure from actual run fields',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],hadrian:{status:'FAILED'}}]}).summary.NEW_FAILURE,1));
it('marks missing Hadrian execution inconclusive',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],hadrian:{status:'NOT_EXECUTED'}}]}).summary.INCONCLUSIVE,1));
it('flags bytecode changes separately',()=>assert.equal(compareRuns(base,{records:[{...base.records[0],bytecodeHash:'new'}]}).summary.CONFIG_CHANGED,1));
