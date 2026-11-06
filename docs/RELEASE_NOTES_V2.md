# Rome Compatibility Lab 2.0 — release candidate

- Source-aware Solidity scan, local EVM evidence and regression comparison remain reproducible.
- LaneProbe deployment and `observe()` are verified on Rome Hadrian, chain ID 200010.
- CpiMemoProbe deployment and `invokeMemo()` have verified EVM receipts, code and readback.
- The mapped Solana Devnet transaction is finalized and includes the expected successful inner Memo instruction and `Rome Compatibility Lab CPI-MEMO-01` payload.
- Evidence Explorer includes four public EVM cases and the Solana settlement, with a recorded JSON snapshot and fresh RPC checks on page load.
- The completed MetaMask workflow is read-only to prevent repeat transactions.

Machine-verifiable evidence: `evidence/hadrian-live.json`; reproduce with `npm run evidence:verify`.

Release status: local release candidate. GitHub push, production deployment and public smoke checks require separate owner approval.
