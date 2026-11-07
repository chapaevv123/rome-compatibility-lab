# Rome Compatibility Lab 2.0

[Public product](https://rome-compatibility-lab.vercel.app) · [Live evidence](evidence/hadrian-live.json) · [Release status](PROJECT_STATUS.md) · [Security policy](SECURITY.md)

Rome Compatibility Lab is a source-aware Solidity compatibility preflight for Rome. It reports file and line, confidence, source and remediation for documented Rome constraints. It is not a security audit or a proof that arbitrary Solidity will behave identically on Rome. The public scanner runs locally in the browser. `POST /api/scan` is intentionally disabled until a shared quota and WAF are configured; it returns `503`.

## What is verified

- Four checked-in probes execute in a local EthereumJS EVM. Their historical ledger is [`evidence/local-execution.json`](evidence/local-execution.json); its Hadrian entries remain `NOT_EXECUTED` for that historical run.
- LaneProbe deployment and `observe()`, CpiMemoProbe deployment and `invokeMemo()` have successful Hadrian receipts on chain ID `200010`. The Memo CPI maps to a finalized Solana Devnet transaction with the expected inner Memo instruction and logs. [`/api/evidence/live`](https://rome-compatibility-lab.vercel.app/api/evidence/live) rechecks public RPC evidence on request; Evidence Explorer distinguishes a recorded snapshot from a fresh check.
- The separate [current differential](evidence/live-differential.json) compares the local LaneProbe execution with its matching Hadrian transaction. Sender identity, block number and timestamp are normalized; gas and Solana CU are separate metrics. That scenario is `COMPATIBLE`. `Clean`, `OriginHint` and `Counter` are `BLOCKED`: no corresponding Hadrian deployment and call receipts exist. No divergence is claimed for them.
- The [unsigned plan](evidence/unsigned-differential-plan.json) contains pinned source/bytecode hashes, deployment creation data, call calldata, predicted addresses and read-only deployment gas estimates. Predicted addresses depend on the account nonce and transaction order. Call gas and the complete budget require fresh estimates after deployment. The planner never signs or sends.

## Run and reproduce

Use Node.js 22 and npm. On Windows PowerShell use `npm.cmd`.

```sh
npm ci
npm run dev
npm run evm:local -- .tmp/local-execution-current.json
npm run evidence:verify
npm run differential:verify
npm run differential:plan
npm run cli -- compare-differential old-live-differential.json new-live-differential.json
```

The last three verification/planning commands make read-only public RPC requests. `evidence:verify` updates the Hadrian/Solana snapshot; `differential:verify` updates the differential snapshot; `differential:plan` updates unsigned estimates. None requests a wallet or submits a transaction. For local scanning, paste Solidity, upload up to 40 `.sol` files or select a folder; imports among selected files are checked, but external packages are not resolved and browser uploads are not compiled. A `// rome-lab-ignore RULE: reason` comment suppresses the next line while preserving the finding in the report. JSON and Markdown export, report comparison and the CLI are available.

```sh
npm run cli -- scan probes --out report.json
npm run cli -- scan examples --markdown
npm run cli -- compare old.json new.json
```

CLI scan exit codes: `0` no confirmed high finding, `1` confirmed high finding, `2` invalid input or parse error. The `examples/` scan intentionally exits `1`. A clean scan does not prove compatibility.

## Test and security boundaries

```sh
npm audit --audit-level=low
npm audit --omit=dev --audit-level=low
npm run typecheck
npm run lint
npm test
npm run probe:prepare
npm run cpi:prepare
npm run evm:local -- .tmp/local-execution-current.json
npm run build
npm run test:e2e
```

The hosted API can be enabled only with server-side Upstash Redis quota, a Vercel WAF rule and the documented environment flags; see [`ROME_RELEASE_CHECKLIST_RU.md`](ROME_RELEASE_CHECKLIST_RU.md). Browser scanning never sends source to that API. The repository contains no private keys or seed. The completed MetaMask page is read-only. Rome registry `v0.3.0` and integrity-checked `solc@0.8.24` are pinned. Source is [MIT licensed](LICENSE); bundled third-party notices are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

The released production source is currently on [`feat/rome-compatibility-lab-v2`](https://github.com/chapaevv123/rome-compatibility-lab/tree/feat/rome-compatibility-lab-v2); default `main` is older. The Arena draft is [`ROME_ARENA_SUBMISSION.md`](ROME_ARENA_SUBMISSION.md). No Arena submission, award or grant is claimed.
