import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {LANE_SAMPLE,LANE_SOURCE_SHA256,matchingLaneSource} from '../lib/sample-source';
import {scan} from '../lib/scanner';
import ledger from '../evidence/local-execution.json';

it('preloaded sample is byte-identical to pinned LaneProbe artifact',async()=>{
  assert.equal(LANE_SAMPLE,readFileSync('probes/LaneProbe.sol','utf8'));
  assert.equal(`sha256:${createHash('sha256').update(LANE_SAMPLE).digest('hex')}`,LANE_SOURCE_SHA256);
  assert.equal(ledger.records.find(x=>x.testId==='LaneProbe')?.sourceHash,LANE_SOURCE_SHA256);
  assert.equal(await matchingLaneSource([{content:LANE_SAMPLE}]),true);
  assert.equal(scan([{path:'LaneProbe.sol',content:LANE_SAMPLE}]).findings.some(x=>x.rule==='EVM-BLOCK-CONTEXT'),true);
});
it('filename, contract name and block.number cannot link altered source',async()=>{
  const changed=LANE_SAMPLE.replace('block.timestamp','block.number');
  assert.equal(await matchingLaneSource([{content:changed}]),false);
  assert.equal(await matchingLaneSource([{content:LANE_SAMPLE},{content:LANE_SAMPLE}]),false);
});
