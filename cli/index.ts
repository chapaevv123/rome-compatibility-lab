import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {scan,compare,type SourceFile} from '../lib/scanner';
import type {ScanReport} from '../lib/types';
import {toMarkdown} from '../lib/markdown';
import {compareRuns,type Run} from '../lib/regression';
function collect(root:string):SourceFile[]{const files:SourceFile[]=[];let total=0;function walk(dir:string){for(const entry of readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','out','artifacts'].includes(entry.name))continue;const p=join(dir,entry.name);if(entry.isSymbolicLink())continue;if(entry.isDirectory())walk(p);else if(entry.isFile()&&p.endsWith('.sol')){const size=statSync(p).size;total+=size;if(size>100000||total>1024*1024||files.length>=40)throw new Error('Solidity input exceeds file or total limit');const content=new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(p));if(content.includes('\0'))throw new Error('Binary Solidity file');files.push({path:relative(root,p).replaceAll('\\','/'),content});}}}walk(root);return files;}
const args=process.argv.slice(2);const command=args[0]||'help';
try{
 if(command==='scan'){const root=resolve(args[1]||'.');const report=scan(collect(root));const output=args.includes('--markdown')?toMarkdown(report):JSON.stringify(report,null,2);const out=args.indexOf('--out');if(out>=0&&args[out+1])writeFileSync(args[out+1],output);else console.log(output);process.exitCode=report.parseErrors.length?2:report.findings.some(f=>f.severity==='high'&&f.confidence==='confirmed'&&!f.suppression)?1:0;}
 else if(command==='compare'){const a=JSON.parse(readFileSync(args[1],'utf8')) as ScanReport,b=JSON.parse(readFileSync(args[2],'utf8')) as ScanReport;console.log(JSON.stringify(compare(a,b),null,2));}
 else if(command==='compare-run'){const a=JSON.parse(readFileSync(args[1],'utf8')) as Run,b=JSON.parse(readFileSync(args[2],'utf8')) as Run;console.log(JSON.stringify(compareRuns(a,b),null,2));}
 else {console.log('Usage: npm run cli -- scan <directory> [--markdown] [--out path] | compare <old.json> <new.json> | compare-run <baseline.json> <current.json>');process.exitCode=command==='help'?0:2;}
}catch(e){console.error(String(e));process.exitCode=2;}
