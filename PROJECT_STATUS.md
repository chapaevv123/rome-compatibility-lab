# Project status — 7 November 2026

**Candidate:** local branch `feat/rome-compatibility-lab-v2`; last confirmed production SHA is `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c`; the current site returns HTTP 200 and `/api/differential/live` returns 404, so this local candidate is not published. GitHub push, main merge, Vercel deployment and Arena submission are pending.

**Differential:** `npm.cmd run differential:verify` independently rechecked six owner-sent transactions through Hadrian RPC at `2026-11-07T12:35:36.837Z`. Clean, OriginHint, LaneProbe and Counter are `COMPATIBLE`; divergent 0, blocked 0. The verifier checks chain, sender, nonce, transaction input, receipt, deployment bytecode, event and readback against pinned plan and local EVM. Hashes, contracts and results: [recorded evidence](evidence/live-differential.json), [six hashes](evidence/differential-transactions.json). Recorded snapshots are distinguished from fresh RPC responses in the UI.

**CPI:** `npm.cmd run evidence:verify` returned `LIVE_VERIFIED`: four Hadrian cases and finalized Solana Devnet Memo with exact `Rome Compatibility Lab CPI-MEMO-01` payload. [Evidence](evidence/hadrian-live.json). This is a separate proof from four differential cases.

**Product:** Evidence Explorer and EVM vs Rome show all four cases, contract addresses, hashes, local/Hadrian results, compatibility, explorer links and verification time. Browser scanner is available; public `POST /api/scan` remains disabled without shared quota/WAF. Production transaction controls are absent; local development only has the owner wallet console. Historical local ledger retains its original `NOT_EXECUTED` Hadrian column.

**Release:** See [checklist](ROME_V2_RELEASE_CHECKLIST_RU.md). A new commit needs CI, owner-approved push and deployment, production SHA/API/browser verification. Video and Arena registration remain owner actions. No award or grant is claimed. The public Arena page provides no full judging rubric.
