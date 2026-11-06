import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scan,compare} from '../lib/scanner';

describe('Solidity preflight',()=>{
 it('finds semantic AST references with locations',()=>{const r=scan([{path:'A.sol',content:'pragma solidity ^0.8.24; contract A { function f() public view returns(address) { return tx.origin; } }'}]);assert.equal(r.findings.length,1);assert.equal(r.findings[0].rule,'EVM-TX-ORIGIN');assert.equal(r.findings[0].line,1);assert.equal(r.findings[0].confidence,'heuristic');});
 it('does not report comments or string literals',()=>{const r=scan([{path:'A.sol',content:'pragma solidity ^0.8.24; contract A { string public x = "tx.origin"; // tx.origin\n function f() public pure returns(uint){return 1;} }'}]);assert.equal(r.findings.length,0);});
 it('reports parse failures separately',()=>{const r=scan([{path:'Broken.sol',content:'contract {'}]);assert.equal(r.parseErrors.length,1);assert.equal(r.findings.length,0);});
 it('rejects traversal',()=>{assert.throws(()=>scan([{path:'../secret.sol',content:''}]),/Unsafe/);});
 it('caps a single source before AST parsing',()=>{assert.throws(()=>scan([{path:'Large.sol',content:' '.repeat(100001)}]),/100 KB/);});
 it('compares runs reproducibly',()=>{const a=scan([{path:'A.sol',content:'pragma solidity ^0.8.24; contract A {}'}]);const b=scan([{path:'A.sol',content:'pragma solidity ^0.8.24; contract A {function f() public view returns(address){return tx.origin;}}'}]);assert.equal(compare(a,b).added.length,1);});
 it('matches documented control examples without comment false positives',()=>{const names=['CommentOnly.sol','BlockContext.sol','CpiEmptyAccounts.sol'];const report=scan(names.map(path=>({path,content:readFileSync(`examples/${path}`,'utf8')})));assert.equal(report.parseErrors.length,0);assert.equal(report.findings.filter(f=>f.file==='CommentOnly.sol').length,0);assert.equal(report.findings.filter(f=>f.rule==='EVM-BLOCK-CONTEXT').length,2);assert.deepEqual(report.findings.filter(f=>f.rule==='ROME-CPI-EMPTY-ACCOUNTS').map(f=>[f.file,f.line,f.severity,f.confidence]),[['CpiEmptyAccounts.sol',12,'high','confirmed']]);});
});
