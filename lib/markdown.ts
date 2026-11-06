import type {ScanReport} from './types';

const safe=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','\\|').replaceAll('\n',' ');
export function toMarkdown(report:ScanReport){
 const lines=[
  '# Rome Compatibility Lab report','',
  `Status: ${report.status}. This is an AST compatibility preflight, not a security audit or on-chain proof.`,
  `Rule version: ${safe(report.ruleVersion)}`,
  `Files: ${report.files}`,'',
  '| Severity | Confidence | File:line | Rule | Explanation | Recommendation |','| --- | --- | --- | --- | --- | --- |',
  ...report.findings.map(f=>`| ${f.severity} | ${f.confidence} | ${safe(f.file)}:${f.line} | ${safe(f.rule)} | ${safe(f.message)} | ${safe(f.recommendation)} |`),
  '',
  ...(report.parseErrors.length?['## Parse errors','',...report.parseErrors.map(e=>`- ${safe(e.file)}: ${safe(e.message)}`),'']:[]),
  ...(report.imports?.length?['## Imports','',...report.imports.map(i=>`- ${safe(i.status)} ${safe(i.file)}:${i.line} → ${safe(i.importPath)}`),'']:[]),
 ];
 if(!report.findings.length)lines.push('No rules matched. This does not prove full compatibility.');
 return lines.join('\n')+'\n';
}
