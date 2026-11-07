# Project status — 7 November 2026

**Release candidate:** `feat/rome-compatibility-lab-v2`, prepared locally from `abb4fb82a1bfd49f0313dffa754ffd1797411950`. Push, merge, Vercel production deployment and Arena submission have not been performed in this completion pass. The currently deployed source SHA has not been re-established by this local build.

## Verified core

- The Solidity AST scanner, file/line report, JSON/Markdown export, four local EVM scenarios, regression engine and production read-only controls remain intact.
- Read-only `npm run differential:verify` passed at `2026-11-07T18:31:51.336Z`: Clean, OriginHint, LaneProbe and Counter were `COMPATIBLE`; divergent 0, blocked 0. See [the RPC snapshot](evidence/live-differential.json). These four tests use declared normalization; gas parity and arbitrary Solidity compatibility are not claimed.
- Read-only `npm run evidence:verify` passed at `2026-11-07T18:32:04.729Z`: four Hadrian operations and the finalized Solana Devnet inner Memo instruction with exact payload `Rome Compatibility Lab CPI-MEMO-01`. See [the CPI snapshot](evidence/hadrian-live.json).

## Judge experience release candidate

The Overview now identifies the developer audience, problem, scan/execute/verify path, four tested outcomes and public receipts. Four direct Judge Walkthrough links lead to sample scan, report, differential and proof. The preloaded LaneProbe source is byte-identical to the pinned probe; SHA-256 must match before the report shows a related runtime example. Other code receives runtime guidance without inherited proof. EVM vs Rome and Evidence Explorer keep historical `NOT_EXECUTED` in collapsed archive sections. Hadrian Lab and CPI Lab expose real operations, receipt blocks, settlement facts and direct explorer links. History has a labeled fixture comparison; Docs has a browser-first quickstart.

Both live APIs attempt fresh read-only RPC on page load. `FRESH_RPC`, `RECORDED`, `STALE` and `BLOCKED` labels distinguish current checks from saved snapshots. GitHub Import remains unavailable without shared quota and abuse controls; upload, folder and paste remain available. The public scan API still fails closed with `503`.

## Quality gate

`npm test`: 68 pass, exit 0. Typecheck, lint and production build: exit 0. Both npm audits: 0 vulnerabilities, exit 0 after network-enabled retry. Production-build browser E2E: 12 pass, 2 explicit skips, exit 0. Desktop 1440px and mobile 390px screenshots were reviewed; no horizontal overflow on the tested Overview and mobile CPI recovery path. See [judge review](docs/JUDGE_EXPERIENCE_2026-11-07.md) and [release checklist](ROME_V2_RELEASE_CHECKLIST_RU.md).

**Before public release:** owner authorization for push, merge and deployment, then CI and production browser/API verification against the deployed commit. Arena registration and video remain owner actions. No new blockchain transaction was sent.
