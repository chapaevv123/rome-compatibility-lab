# Test evidence, 2026-11-06

Run commands from the repository root on Node.js 22:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run evm:local
npm.cmd run probe:prepare
npm.cmd run cpi:prepare
npm.cmd run network:check
npm.cmd run build
npm.cmd run test:e2e
npm.cmd audit
npm.cmd audit --omit=dev
```

`evidence/local-execution.json` contains four actual in-memory EVM runs. This is a historical local snapshot; its Hadrian side was NOT_EXECUTED at the time. Later live transactions are recorded separately in `evidence/hadrian-live.json` and rechecked with `npm run evidence:verify`. The regression tests use synthetic records to test classification logic; they do not represent chain transactions.

Fresh result after v2 continuation: clean `npm ci` PASS; 35 tests PASS, including import resolution, official SDK write policy and burner approval adapter; typecheck and strict TS lint PASS; four local EVM scenarios PASS; production build PASS; six Playwright E2E PASS against production server; full and production-only npm audit both 0 vulnerabilities. CLI scan, identical scan comparison, and execution-ledger comparison ran successfully. Comparing the local ledger with itself produces four INCONCLUSIVE Hadrian entries as intended.

Read-only Hadrian check on 2026-11-06 returned chain ID 200010, block 519396563 and explorer HTTP 200 through registry v0.3.0. This does not verify a contract.

Final read-only Hadrian check returned chain ID 200010, block 519412329 and explorer HTTP 200. This is network metadata only.

Read-only deployment estimate on a **non-owner test address** returned block 519402785, gas 4394041, gas price 148555441800 wei and estimated 0.6527587020423138 test USDC. It signed and sent nothing. The deploy CLI's no-flag safety gate was executed and refused to proceed as designed; the `--send` path was not run.

CPI Memo deployment read-only estimate on the same non-owner address returned block 519409552, gas 17673161 and estimated 2.6254442403575298 test USDC. The CPI invocation itself was not estimated or executed. `cpi-preparation.json` contains the registry Memo program as base58 and bytes32 plus constructor ABI argument.
