# Control examples

`regression-baseline.json` is a versioned scanner fixture generated from the five checked-in `probes/*.sol` files with `npm run cli -- scan probes --out examples/regression-baseline.json`. It exists for the browser History demo and clean-checkout tests. It is a static scanner report, not live or on-chain evidence. The root `report.json` is a locally generated, ignored CLI output and is deliberately not imported by the app.

Run `npm run cli -- scan examples --out example-report.json`. Exit code **1** is expected: the CPI control intentionally has a confirmed high finding. The tool is a Rome compatibility preflight, not a security audit.

| File | Expected result | Why |
| --- | --- | --- |
| `CommentOnly.sol` | 0 findings | `tx.origin` and `block.timestamp` appear only in a comment or string. |
| `BlockContext.sol` | 2 `EVM-BLOCK-CONTEXT` info heuristics on line 7 | Exact block number and timestamp should be compared by invariant across environments. |
| `CpiEmptyAccounts.sol` | 1 `ROME-CPI-EMPTY-ACCOUNTS` confirmed high on line 12 | A direct `new AccountMeta[](0)` goes to the official-style CPI `invoke` call. Rome requires a non-empty account list. This fixture compiles with pinned Solidity 0.8.24 but is intentionally unsuitable for deployment. |

Additional baseline probes live in `probes/`: `Clean.sol` is a negative control, `OriginHint.sol` produces a medium heuristic, and `LaneProbe.sol` is the unsigned local deployment probe. The scanner does not resolve imports or data flow, so indirect array construction requires manual review; a clean report cannot prove compatibility.
