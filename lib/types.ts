export type EvidenceState = 'LIVE VERIFIED' | 'LOCAL TEST' | 'UNVERIFIED' | 'BLOCKED';
export type Finding = {rule:string; severity:'high'|'medium'|'info'; confidence:'confirmed'|'heuristic'; file:string; line:number; message:string; recommendation:string; source:string};
export type ScanReport = {schemaVersion:1; ruleVersion:string; generatedAt:string; files:number; findings:Finding[]; parseErrors:{file:string;message:string}[]; provenance:{registry:string;scanner:string}; status:EvidenceState};
