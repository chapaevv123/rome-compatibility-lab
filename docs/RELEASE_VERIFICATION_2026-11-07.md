# Local release verification — 7 November 2026

Source branch: `feat/rome-compatibility-lab-v2`. This report covers the local candidate. Production returned HTTP 200 and `/api/differential/live` returned 404 on 7 November 2026, confirming this candidate is not published. The last confirmed production SHA is `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c`; a current deployment SHA was not independently exposed by these HTTP responses. GitHub remains on the prior published branch SHA pending owner authorization.

## Independent evidence

`npm.cmd run differential:verify` exit 0, checked `2026-11-07T12:35:36.837Z`: Clean, OriginHint, LaneProbe, Counter COMPATIBLE; divergent 0; blocked 0. The six new hashes are in `evidence/differential-transactions.json`. The verifier compares pinned creation/call input, sender, nonce, code, receipts, event and readback with saved local EVM output. It sends no transaction.

`npm.cmd run evidence:verify` exit 0: four Hadrian evidence cases and finalized Solana Devnet Memo, `LIVE_VERIFIED`, expected payload `Rome Compatibility Lab CPI-MEMO-01`.

## Release matrix

| Gate | Result | Exit code |
| --- | --- | ---: |
| Unit/integration and differential regression | 66/66 PASS | 0 |
| Typecheck | PASS | 0 |
| Lint | PASS | 0 |
| Production build | PASS | 0 |
| Browser E2E, external local dev server | 11 PASS, 1 explicit live-RPC wallet test skipped | 0 |
| npm audit | 0 vulnerabilities | 0 |
| npm audit --omit=dev | 0 vulnerabilities | 0 |
| Differential RPC verifier | 4 compatible | 0 |
| CPI RPC verifier | LIVE_VERIFIED | 0 |

The first sandboxed RPC and npm audit attempts failed due to denied network access, then passed with approved network access. A parallel build/typecheck/lint run also hit a generated `.next/types` race; typecheck and lint were rerun sequentially after the successful build and both exited 0. The first E2E run found outdated expectations for three BLOCKED cases; those assertions were corrected. Playwright managed-server shutdown hung on Windows after all tests, so the final E2E run used its supported external-server mode and exited 0.

## Release boundary

No new on-chain transaction, private key use, GitHub push, main merge, production deployment, paid service or Arena submission. CI on the candidate and public production behavior remain unverified until publication. The authenticated Arena registration form and video remain owner steps.
