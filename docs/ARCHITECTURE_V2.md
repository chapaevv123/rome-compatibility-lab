# Architecture v2 (review branch)

The public Next.js app runs source scanning in the browser. The server scan endpoint stays disabled until a shared quota and WAF are configured. No browser flow accepts a private key or executes submitted Solidity.

`lib/scanner.ts` parses each file separately with Solidity AST locations. Rules are versioned in `lib/rules.ts`. Relative imports are resolved against selected project paths and marked RESOLVED or MISSING; external package imports remain EXTERNAL_UNCHECKED. The browser does not compile arbitrary submissions. A documented `// rome-lab-ignore RULE: reason` comment suppresses only the following line and remains visible in exports.

This document records the earlier preflight architecture. Current live execution evidence is in `evidence/hadrian-live.json` and is rechecked by `npm run evidence:verify`; historical local ledgers remain unchanged.

`scripts/run-local-evm.ts` compiles four checked-in probes with hash-checked solc 0.8.24 and executes them in EthereumJS VM. The generated local ledger records source/bytecode hashes, decoded events, return values, state and local gas. `lib/differential.ts` compares normalized observable behavior while keeping EVM gas and Solana CU separate. `lib/regression.ts` compares two execution ledgers, flags changed configuration and treats missing Hadrian execution as inconclusive.

`scripts/prepare-probe.ts` and `scripts/prepare-cpi.ts` emit unsigned artifacts. `scripts/check-network.ts` and `scripts/dry-run-hadrian.ts` make read-only RPC calls. There is no signing or submission path in the public app. The Rome Solidity ABI header in `vendor/rome-solidity/interface.sol` is copied from the official MIT SDK with SHA-256 `6bfd051c0b1af98362667a007c1b8fcd0a72c870a1a0e0d2579918d9dbcb9933`; the full upstream SDK dependency was removed because its dependency graph produced eight npm audit findings.

`scripts/deploy-hadrian.ts` is a local-only, opt-in transaction script. It requires `--send`, a matching burner address/key, and an exact interactive approval per group. It runs the official Rome SDK v0.4.0 `submitRomeTx` module from `vendor/rome-sdk/write.mjs`, with a project EIP-1193 adapter that rejects transactions beyond the approved fee ceiling. This path has type/unit validation only; no signed testnet run has occurred. `scripts/verify-hadrian.ts` independently rereads receipts and code, and records the raw Rome-to-Solana settlement mapping for CPI investigation.

Evidence states are per claim: local EVM execution is LOCAL_VERIFIED, RPC metadata is LIVE_VERIFIED, CPI compilation is STATIC_ONLY, and Hadrian/CPI execution is NOT_RUN. A future on-chain ledger must include transaction hash, receipt, address, block, state readback and Solana-side signature before any LIVE_VERIFIED label is used.
