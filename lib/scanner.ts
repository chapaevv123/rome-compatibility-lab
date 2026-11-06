import * as parser from '@solidity-parser/parser';
import type {Finding,ImportReference,ScanReport} from './types';
import {RULE_VERSION,SOURCES} from './rules';

export type SourceFile={path:string;content:string};
const MAX_FILES=40, MAX_BYTES=1024*1024;
const encoder=new TextEncoder();
function isSafePath(path:string){return path.length<240 && !path.startsWith('/') && !/^[A-Za-z]:/.test(path) && !path.includes('\\') && !path.includes('\0') && !path.split('/').some(part=>part==='.'||part==='..'||part==='') && path.endsWith('.sol');}
function resolveImport(from:string,target:string){const parts=from.split('/').slice(0,-1);for(const segment of target.split('/')){if(segment==='.'||segment==='')continue;if(segment==='..'){if(!parts.length)return null;parts.pop();}else parts.push(segment);}return parts.join('/');}
export function scan(files:SourceFile[]):ScanReport {
  if(!Array.isArray(files)||files.length===0||files.length>MAX_FILES||files.some(f=>!f||typeof f.path!=='string'||typeof f.content!=='string'||f.content.includes('\0'))) throw new Error('Provide 1 to 40 text Solidity files');
  if(files.some(f=>encoder.encode(f.content).length>100_000) || files.reduce((n,f)=>n+encoder.encode(f.content).length,0)>MAX_BYTES) throw new Error('Input exceeds 40 files, 100 KB per file, or 1 MiB total');
  const findings:Finding[]=[]; const parseErrors:{file:string;message:string}[]=[];const imports:ImportReference[]=[];
  const paths=new Set(files.map(file=>file.path));
  for(const file of files){
    if(!isSafePath(file.path)) throw new Error('Unsafe Solidity path: '+file.path);
    let ast:any;
    try {ast=parser.parse(file.content,{loc:true,tolerant:false});} catch(e){parseErrors.push({file:file.path,message:String(e)});continue;}
    const add=(node:any,rule:string,severity:Finding['severity'],confidence:Finding['confidence'],message:string,recommendation:string,source:string)=>{
      findings.push({rule,severity,confidence,file:file.path,line:node?.loc?.start?.line||1,message,recommendation,source});
    };
    const suppressed=new Map<string,string>();
    file.content.split(/\r?\n/).forEach((line,index)=>{const match=line.match(/^\s*\/\/\s*rome-lab-ignore\s+([A-Z0-9-]+)\s*:\s*(.{12,})/);if(match)suppressed.set(`${index+2}:${match[1]}`,match[2].trim());});
    parser.visit(ast,{
      ImportDirective(node:any){const target=String(node.path||'');const line=node.loc?.start?.line||1;if(target.startsWith('./')||target.startsWith('../')){const resolvedPath=resolveImport(file.path,target);imports.push({file:file.path,line,importPath:target,resolvedPath:resolvedPath||undefined,status:resolvedPath&&paths.has(resolvedPath)?'RESOLVED':'MISSING'});}else imports.push({file:file.path,line,importPath:target,status:'EXTERNAL_UNCHECKED'});},
      MemberAccess(node:any){
        if(node.expression?.type==='Identifier' && node.expression.name==='tx' && node.memberName==='origin') add(node,'EVM-TX-ORIGIN','medium','heuristic','tx.origin can differ from the expected caller identity in multi-lane flows.','Use msg.sender for authorization; test both EVM and Solana lanes.',SOURCES.sdk);
        if(node.expression?.type==='Identifier' && node.expression.name==='block' && ['timestamp','number','prevrandao'].includes(node.memberName)) add(node,'EVM-BLOCK-CONTEXT','info','heuristic','Behavior depends on block context; compare on both environments.','Assert ranges or invariants rather than exact block values.',SOURCES.evm);
      },
      FunctionCall(node:any){
        const callee=node.expression;
        if(callee?.type==='Identifier'&&callee.name==='selfdestruct') add(node,'ROME-SELFDESTRUCT','high','confirmed','SELFDESTRUCT is deliberately disabled in Rome EVM; execution of this opcode aborts the transaction.','Replace destruction with an explicit disabled state; test the changed lifecycle.', 'https://github.com/rome-protocol/rome-evm#evm-semantics-divergences');
        if(callee?.type==='MemberAccess'&&['transfer','send'].includes(callee.memberName)) add(node,'ROME-GAS-STIPEND','medium','heuristic','Value transfer may rely on a 2300 gas stipend, which Rome does not enforce.','Use checks-effects-interactions and a reentrancy guard where needed; test the recipient callback.',SOURCES.constraints);
        if(callee?.type==='MemberAccess'&&['call','staticcall'].includes(callee.memberName)){
          const target=callee.expression;
          const literal=target?.type==='FunctionCall'&&target.expression?.type==='Identifier'&&target.expression.name==='address'&&target.arguments?.[0]?.type==='NumberLiteral'?target.arguments[0].number:null;
          if(literal && (literal==='5'||/^0x0*5$/i.test(literal)))add(node,'ROME-MODEXP-DISABLED','high','confirmed','Call targets modexp precompile 0x05, which is disabled on Rome.','Replace modexp dependency or handle failure; verify the full call path on Hadrian.',SOURCES.constraints);
        }
        if(callee?.type==='MemberAccess' && callee.expression?.type==='Identifier' && ['CPI','cpi','CPI_PRECOMPILE','CpiProgram'].includes(callee.expression.name) && ['invoke','invoke_signed'].includes(callee.memberName)) {
          const args=node.arguments||[];
          const directEmptyArray=args[1]?.type==='FunctionCall' && args[1].expression?.type==='NewExpression' && args[1].expression.typeName?.type==='ArrayTypeName' && args[1].arguments?.length===1 && args[1].arguments[0]?.type==='NumberLiteral' && args[1].arguments[0].number==='0';
          const empty=(args[1]?.type==='TupleExpression' && Array.isArray(args[1].components) && args[1].components.length===0)||directEmptyArray;
          if(empty) add(node,'ROME-CPI-EMPTY-ACCOUNTS','high','confirmed','CPI accounts array is statically empty. Rome requires a non-empty accounts array.','Pass the required account metas; exclude operator and program id.',SOURCES.cpi);
          else add(node,'ROME-CPI-REVIEW','info','heuristic','CPI call found; account metas and signer must be reviewed in context.','Check predeclared account metas, signer PDA, depth and CU in a runtime test.',SOURCES.cpi);
        }
      }
    });
    for(const finding of findings.filter(f=>f.file===file.path)){
      if(finding.confidence==='heuristic')finding.verification='NEEDS_RUNTIME_VERIFICATION';
      const reason=suppressed.get(`${finding.line}:${finding.rule}`);if(reason)finding.suppression=reason;
    }
  }
  findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.rule.localeCompare(b.rule));
  return {schemaVersion:1,ruleVersion:RULE_VERSION,generatedAt:new Date().toISOString(),files:files.length,findings,parseErrors,imports,provenance:{registry:'rome-registry#v0.3.0',scanner:'@solidity-parser/parser AST'},status:'LOCAL TEST'};
}
export function compare(a:ScanReport,b:ScanReport){const key=(f:Finding)=>`${f.file}:${f.line}:${f.rule}`;const aa=new Set(a.findings.map(key)),bb=new Set(b.findings.map(key));return {added:[...bb].filter(x=>!aa.has(x)),removed:[...aa].filter(x=>!bb.has(x)),ruleChanged:a.ruleVersion!==b.ruleVersion};}
