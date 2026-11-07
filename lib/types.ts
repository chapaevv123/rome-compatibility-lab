export type EvidenceState = 'LIVE VERIFIED' | 'LOCAL TEST' | 'UNVERIFIED' | 'BLOCKED';
export type Finding = {rule:string; severity:'high'|'medium'|'info'; confidence:'confirmed'|'heuristic'; file:string; line:number; message:string; recommendation:string; source:string; verification?:'NEEDS_RUNTIME_VERIFICATION'; suppression?:string};
export type ImportReference={file:string;line:number;importPath:string;resolvedPath?:string;status:'RESOLVED'|'MISSING'|'EXTERNAL_UNCHECKED'};
export type ScanReport = {schemaVersion:1; ruleVersion:string; generatedAt:string; files:number; findings:Finding[]; parseErrors:{file:string;message:string}[]; imports?:ImportReference[]; provenance:{registry:string;scanner:string}; status:EvidenceState; sampleSourceHash?:string};
