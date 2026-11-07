# Rome behavior matrix

| Documented behavior | Hypothesis | Test | Result |
| --- | --- | --- | --- |
| `SELFDESTRUCT` disabled; unsupported opcode aborts transaction ([Rome EVM](https://github.com/rome-protocol/rome-evm#evm-semantics-divergences)) | Direct source use needs migration | AST positive/negative and suppression tests | LOCAL_VERIFIED scanner rule; Hadrian NOT_RUN |
| No 2300 gas stipend ([constraints](https://docs.rome.builders/core-concepts/constraints)) | `.transfer`/`.send` may depend on stipend | AST heuristic and runtime plan | LOCAL_VERIFIED detection; behavior NOT_RUN |
| Modexp `0x05` disabled ([constraints](https://docs.rome.builders/core-concepts/constraints)) | Literal `address(5).call/staticcall` targets it | AST positive and address-six negative | LOCAL_VERIFIED scanner rule; Hadrian NOT_RUN |
| CPI accounts declared upfront, depth four, 64-address transaction cap ([constraints](https://docs.rome.builders/core-concepts/constraints)) | Memo probe invokes with a Helper-derived authority PDA signer meta | Official-interface compilation, Hadrian invocation receipt, EVM-to-Solana mapping and finalized inner Memo/logs | LIVE_VERIFIED for this Memo probe only; does not prove general CPI compatibility |
| Legacy/cached mutating tracks cannot mix ([constraints](https://docs.rome.builders/core-concepts/constraints)) | Mixed contract may fail | Requires interprocedural analysis and live execution | NOT_RUN; no static error emitted |
| `block.number` refers to Solana slot and `BLOCKHASH` has different meaning ([Rome EVM](https://github.com/rome-protocol/rome-evm#evm-semantics-divergences)) | Exact block values differ | Local LaneProbe event and Hadrian `Observed` receipt | LaneProbe event verified on both; block context normalized for semantic comparison. `BLOCKHASH` behavior NOT_RUN |
| Oracle `getRoundData` unsupported ([constraints](https://docs.rome.builders/core-concepts/constraints)) | Oracle adapter may revert | Needs ABI-aware call resolution and deployed target | NOT_RUN; no static error emitted |

Registry tags checked through official Git refs on 2026-11-06: `v0.1.0`, `v0.2.0`, `v0.3.0`. This branch pins `v0.3.0` in package and lockfile.
