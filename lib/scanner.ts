import * as parser from '@solidity-parser/parser';
import type {Finding,ScanReport} from './types';
import {RULE_VERSION,SOURCES} from './rules';

export type SourceFile={path:string;content:string};
const MAX_FILES=40, MAX_BYTES=1024*1024;
const encoder=new TextEncoder();
function isSafePath(path:string){return path.length<240 && !path.startsWith('/') && !/^[A-Za-z]:/.test(path) && !path.includes('\\') && !path.includes('\0') && !path.split('/').some(part=>part==='.'||part==='..'||part==='') && path.endsWith('.sol');}
export function scan(files:SourceFile[]):ScanReport {
  if(!Array.isArray(files)||files.length===0||files.length>MAX_FILES||files.some(f=>!f||typeof f.path!=='string'||typeof f.content!=='string'||f.content.includes('\0'))) throw new Error('Provide 1 to 40 text Solidity files');
  if(files.some(f=>encoder.encode(f.content).length>100_000) || files.reduce((n,f)=>n+encoder.encode(f.content).length,0)>MAX_BYTES) throw new Error('Input exceeds 40 files, 100 KB per file, or 1 MiB total');
  const findings:Finding[]=[]; const parseErrors:{file:string;message:string}[]=[];
  for(const file of files){
    if(!isSafePath(file.path)) throw new Error('Unsafe Solidity path: '+file.path);
    let ast:any;
    try {ast=parser.parse(file.content,{loc:true,tolerant:false});} catch(e){parseErrors.push({file:file.path,message:String(e)});continue;}
    const add=(node:any,rule:string,severity:Finding['severity'],confidence:Finding['confidence'],message:string,recommendation:string,source:string)=>{
      findings.push({rule,severity,confidence,file:file.path,line:node?.loc?.start?.line||1,message,recommendation,source});
    };
    parser.visit(ast,{
      MemberAccess(node:any){
        if(node.expression?.type==='Identifier' && node.expression.name==='tx' && node.memberName==='origin') add(node,'EVM-TX-ORIGIN','medium','heuristic','tx.origin can differ from the expected caller identity in multi-lane flows.','Use msg.sender for authorization; test both EVM and Solana lanes.',SOURCES.sdk);
        if(node.expression?.type==='Identifier' && node.expression.name==='block' && ['timestamp','number','prevrandao'].includes(node.memberName)) add(node,'EVM-BLOCK-CONTEXT','info','heuristic','Behavior depends on block context; compare on both environments.','Assert ranges or invariants rather than exact block values.',SOURCES.evm);
      },
      FunctionCall(node:any){
        const callee=node.expression;
        if(callee?.type==='MemberAccess' && callee.expression?.type==='Identifier' && ['CPI','cpi','CPI_PRECOMPILE','CpiProgram'].includes(callee.expression.name) && ['invoke','invoke_signed'].includes(callee.memberName)) {
          const args=node.arguments||[];
          const directEmptyArray=args[1]?.type==='FunctionCall' && args[1].expression?.type==='NewExpression' && args[1].expression.typeName?.type==='ArrayTypeName' && args[1].arguments?.length===1 && args[1].arguments[0]?.type==='NumberLiteral' && args[1].arguments[0].number==='0';
          const empty=(args[1]?.type==='TupleExpression' && Array.isArray(args[1].components) && args[1].components.length===0)||directEmptyArray;
          if(empty) add(node,'ROME-CPI-EMPTY-ACCOUNTS','high','confirmed','CPI accounts array is statically empty. Rome requires a non-empty accounts array.','Pass the required account metas; exclude operator and program id.',SOURCES.cpi);
          else add(node,'ROME-CPI-REVIEW','info','heuristic','CPI call found; account metas and signer must be reviewed in context.','Check non-empty account metas, signer PDA, and SDK interfaces.',SOURCES.cpi);
        }
      }
    });
  }
  findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.rule.localeCompare(b.rule));
  return {schemaVersion:1,ruleVersion:RULE_VERSION,generatedAt:new Date().toISOString(),files:files.length,findings,parseErrors,provenance:{registry:'rome-registry#v0.1.0',scanner:'@solidity-parser/parser AST'},status:'LOCAL TEST'};
}
export function compare(a:ScanReport,b:ScanReport){const key=(f:Finding)=>`${f.file}:${f.line}:${f.rule}`;const aa=new Set(a.findings.map(key)),bb=new Set(b.findings.map(key));return {added:[...bb].filter(x=>!aa.has(x)),removed:[...aa].filter(x=>!bb.has(x)),ruleChanged:a.ruleVersion!==b.ruleVersion};}
