# Project status — 7 November 2026

**Production:** `https://rome-compatibility-lab.vercel.app`, SHA `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c`, technically released. The new differential work in this branch is local only until a new CI and owner-authorized production release.

**Current differential:** LaneProbe `COMPATIBLE` against its existing Hadrian `observe()` receipt, after sender/block/timestamp normalization. Clean, OriginHint and Counter `BLOCKED`: local EVM execution is reproducible, but no matching Hadrian deployment/call transactions exist. No unsupported incompatibility or full four-case verification is claimed. See [`evidence/live-differential.json`](evidence/live-differential.json) and [`evidence/unsigned-differential-plan.json`](evidence/unsigned-differential-plan.json).

**Existing on-chain evidence:** four successful EVM transactions on Hadrian chain ID 200010; CpiMemoProbe `invokeMemo()` maps to finalized Solana Devnet Memo CPI. [`/api/evidence/live`](https://rome-compatibility-lab.vercel.app/api/evidence/live) rechecks them on request. The original historical local ledger remains separate. Public `/api/scan` stays disabled (`503`) without shared quota/WAF; browser scanning is available.

**UX check:** the current production reviewer path worked in desktop and mobile headless Chromium without JavaScript errors. Mobile Evidence Explorer had horizontal overflow from long evidence values; the local candidate fixes panel wrapping and its mobile E2E passes. Production retains that defect until the owner approves the next release.

**Release gates:** local quality tests and complete GitHub Actions CI for the new commit, then explicit owner approval before another production deployment. Do not merge into `main` before checking branch protection and conflicts. Default `main` still lags the released feature branch. Video is not recorded; Arena application is not submitted. The public Arena page describes app registration, linked contracts and milestones, but does not publish a complete judging rubric. The unauthenticated form shows email and EVM/Solana wallet entry; fields after authentication are unverified.

**Source of original scope:** no `AGENTS.md`, `PROJECT_STATUS.md` or standalone original ТЗ file existed in this repository at the start of this work. Scope was reconstructed from the owner's current request, release checklist, architecture, behavior matrix and existing code. Parent `Pulse/AGENTS.md` was read; the main Pulse project was not changed.
