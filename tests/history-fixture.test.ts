import {it} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {scan} from '../lib/scanner';

it('History imports a tracked scanner fixture reproducible in a clean checkout',()=>{
  const page=readFileSync('app/history/page.tsx','utf8');
  const match=page.match(/import recordedReport from '@\/([^']+\.json)'/);
  assert.ok(match,'History must import a versioned JSON fixture');
  const path=match[1];
  assert.equal(execFileSync('git',['ls-files','--error-unmatch','--',path],{encoding:'utf8'}).trim(),path);
  const fixture=JSON.parse(readFileSync(path,'utf8'));
  const files=readdirSync('probes').filter(name=>name.endsWith('.sol')).map(name=>({path:name,content:readFileSync(`probes/${name}`,'utf8')}));
  const fresh=scan(files);
  assert.equal(fixture.files,files.length);
  assert.deepEqual(fixture.findings,fresh.findings);
  assert.deepEqual(fixture.parseErrors,fresh.parseErrors);
  assert.deepEqual(fixture.imports,JSON.parse(JSON.stringify(fresh.imports)));
});
