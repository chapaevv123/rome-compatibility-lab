# v2 review branch release notes

- Upgraded official Rome registry from v0.1.0 to the latest observed tag v0.3.0.
- Added focused static rules for disabled SELFDESTRUCT, literal modexp calls and gas-stipend review, with scoped documented suppression.
- Added four real local EVM probe executions and a portable evidence ledger.
- Added differential and execution-regression classifiers; Hadrian remains NOT_EXECUTED.
- Added CPI probe compilation against the official Rome Solidity MIT interface.
- Added a fixed official Rome SDK v0.4.0 `submitRomeTx` module, approval-limited burner adapter, and read-only receipt verifier; no signed path has run.
- Added relative-import presence checks, project-folder scan, local source pages and an interactive reviewer walkthrough.
- Added Hadrian, CPI and expanded evidence screens; kept public API read-only/fail-closed.

Review status: no Hadrian transaction, CPI receipt, Solana-side evidence or video recording yet. Production deployment is pending owner approval.
