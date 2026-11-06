# Rome Compatibility Lab v2 — 2–3 minute narration

**0:00–0:25 — Problem.** “Solidity code can compile and still rely on Ethereum behavior that Rome handles differently. Rome developers need a source-level preflight and evidence that keeps static findings separate from actual execution.”

**0:25–0:55 — Scan.** Open Scan Solidity, select `CpiEmptyAccounts.sol` and a new file using `selfdestruct` or `address(5).staticcall`. Run the scan. Show file/line, severity, confidence, primary source and remediation. Explain that stipend warnings need runtime verification.

**0:55–1:25 — Execution.** Open EVM vs Rome. Show four actual local runs: arithmetic, origin, event/block context and state increment. Open the JSON ledger and rerun `npm run evm:local`. Point out source and bytecode hashes and that Hadrian is NOT_EXECUTED.

**1:25–1:50 — CPI.** Open CPI Lab and compile `npm run cpi:prepare`. Show the official Rome Solidity interface, Memo program ID from registry v0.3.0 and read-only deployment estimate. State clearly: “This proves compilation and deployment estimation only; no successful CPI has been observed.”

**1:50–2:15 — Regression and evidence.** Compare two local execution ledgers in History, then show Evidence Explorer. Explain why missing Hadrian receipts are inconclusive and why EVM gas is never equated to Solana CU.

**2:15–2:40 — Reproduce and next milestone.** Show `npm test`, `npm run network:check` and the read-only dry-run command. Explain that a funded, approved burner wallet run will provide receipts, events, state readback, explorer and Solana settlement evidence. Do not show a fabricated transaction.

## Application text

**Product pitch:** Rome Compatibility Lab is a source-aware Solidity preflight and execution evidence workbench for teams bringing contracts to Rome.

**Technical overview:** Versioned AST rules identify documented Rome constraints with exact file and line references. Four checked-in probes compile and execute in a local EVM. A portable ledger records hashes, return values, events and state, while differential and regression engines keep unexecuted Hadrian cases explicit.

**Architecture summary:** Browser-local scans protect source privacy and server capacity. A CLI handles project files. Hash-checked compiler artifacts, registry v0.3.0, official Rome Solidity ABI and read-only Hadrian diagnostics support reproducibility. Signed transactions require a separate reviewed burner workflow.

**Builder application:** We are building a developer tool for Rome builders to review source assumptions, reproduce local behavior and collect chain evidence. The public demo currently demonstrates static scanning and local evidence. Hadrian execution and CPI are prepared but unverified; contract addresses will be added only after real testnet receipts.

**Grant rationale:** Funding would support robust Hadrian/CPI test infrastructure, richer rule coverage, chain-backed regression runs and public reproduction guides. A grant is discretionary; no grant or Arena outcome is claimed.
