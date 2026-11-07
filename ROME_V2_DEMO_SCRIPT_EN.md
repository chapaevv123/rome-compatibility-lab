# Rome Compatibility Lab 2.0 — final 2:40 demo outline

**0:00–0:20 — Problem.** Solidity that compiles can still assume EVM behavior that differs on Rome. Introduce source checks and evidence states.

**0:20–0:50 — Scan.** Open `/scan`, scan the supplied Solidity examples, and show line, severity, confidence, source and remediation.

**0:50–1:10 — Differential.** After the new production release, open `/cross-vm`. Show LaneProbe `COMPATIBLE` after sender/block-context normalization and the other three rows `BLOCKED`. The historical local run remains separate and still says Hadrian `NOT_EXECUTED`. Until that release, show the existing historical table only.

**1:10–1:35 — LaneProbe.** In `/evidence`, open the [deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x76d3a3383926b2d0e6c7953fd28c1a3472ef655a3d5ad9c046b383428ae58004) and [observe()](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f) cases. Show receipt, `Observed` event and `caller()` readback.

**1:35–2:05 — CPI Memo.** Show [CpiMemoProbe deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xac5555d6a67f9995b215ed0e473c6c2cc4bde61149acad239b0714a20a19e946), `memoProgram()` readback and the separate [invokeMemo() EVM receipt](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845).

**2:05–2:25 — Solana settlement.** Open the [mapped Solana transaction](https://explorer.solana.com/tx/5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg?cluster=devnet). Show finalized status, inner Memo instruction, exact `Rome Compatibility Lab CPI-MEMO-01` payload and success logs. Use the case-sensitive signature returned by Hadrian RPC.

**2:25–2:40 — Reproduce.** Show the recorded JSON and `npm run evidence:verify`. Explain that Evidence Explorer rechecks public RPC data on reload and that the completed MetaMask page has no send buttons.

The current v2 production site passed HTTP smoke checks on 7 November 2026. Record the new differential segment only after its separately approved production release. Confirm that both live APIs report their actual statuses while recording, then review the finished video before sharing its link. If Solana Explorer rate limits the transaction page, show the live Evidence Explorer and the exact explorer link rather than claiming that the explorer loaded. No grant, award or Builder Program endorsement is claimed.
