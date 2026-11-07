# Rome Compatibility Lab 2.0 — release candidate

- Source-aware Solidity scan, local EVM evidence and regression comparison remain reproducible.
- LaneProbe deployment and `observe()` are verified on Rome Hadrian, chain ID 200010.
- CpiMemoProbe deployment and `invokeMemo()` have verified EVM receipts, code and readback.
- The mapped Solana Devnet transaction is finalized and includes the expected successful inner Memo instruction and `Rome Compatibility Lab CPI-MEMO-01` payload.
- Evidence Explorer includes four public EVM cases and the Solana settlement, with a recorded JSON snapshot and fresh RPC checks on page load.
- The completed MetaMask workflow is read-only to prevent repeat transactions.

Machine-verifiable evidence: `evidence/hadrian-live.json`; reproduce with `npm run evidence:verify`.

The evidence release at SHA `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c` remains production. The local release candidate now has four independently RPC-verified COMPATIBLE differential cases (Clean, OriginHint, LaneProbe, Counter), with all six new transaction hashes and matching local EVM evidence. `npm run differential:verify` reproduced 4 compatible, 0 divergent, 0 blocked on 7 November 2026. The separate CPI proof remains LIVE_VERIFIED. GitHub push, CI and a new Vercel release still require owner approval.
