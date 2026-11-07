import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isLocalEvidenceRequest} from '../lib/local-evidence-access';

test('local evidence accepts equivalent loopback origins on the same port',()=>{
  const target='http://localhost:3101/api/differential/local';
  assert.equal(isLocalEvidenceRequest(target,'http://127.0.0.1:3101','development'),true);
  assert.equal(isLocalEvidenceRequest('http://127.0.0.1:3101/api/differential/local','http://localhost:3101','development'),true);
  assert.equal(isLocalEvidenceRequest(target,'http://localhost:3101','development'),true);
});
test('local evidence still rejects production, remote hosts and cross-port origins',()=>{
  const target='http://localhost:3101/api/differential/local';
  for(const [url,origin,env] of [[target,'http://localhost:3101','production'],[target,'http://localhost:3102','development'],[target,'http://evil.example:3101','development'],['http://evil.example:3101/api/differential/local','http://localhost:3101','development'],[target,null,'development']] as const)assert.equal(isLocalEvidenceRequest(url,origin,env),false);
});
