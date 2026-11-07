# Rome Compatibility Lab 2.0 — release candidate

- Source-aware Solidity scan, local EVM evidence and regression comparison remain reproducible.
- LaneProbe deployment and `observe()` are verified on Rome Hadrian, chain ID 200010.
- CpiMemoProbe deployment and `invokeMemo()` have verified EVM receipts, code and readback.
- The mapped Solana Devnet transaction is finalized and includes the expected successful inner Memo instruction and `Rome Compatibility Lab CPI-MEMO-01` payload.
- Evidence Explorer includes four public EVM cases and the Solana settlement, with a recorded JSON snapshot and fresh RPC checks on page load.
- The completed MetaMask workflow is read-only to prevent repeat transactions.

Machine-verifiable evidence: `evidence/hadrian-live.json`; reproduce with `npm run evidence:verify`.

The evidence release at SHA `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c` is live in production and passed public smoke checks on 7 November 2026. The newer live differential work remains local pending a new CI and separate owner approval for production deployment. It reuses LaneProbe's verified receipt; Clean, OriginHint and Counter remain BLOCKED without matching Hadrian transactions.
