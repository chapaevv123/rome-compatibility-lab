# Rome Compatibility Lab 2.0 — 2:45 demo script

**0:00–0:20 — Problem.** Solidity compilation alone does not establish Rome compatibility. The lab gives source findings and execution evidence with explicit verification states.

**0:20–0:45 — Scanner and report.** Open /scan, run the supplied Solidity example, show file/line, confidence, official source and remediation. Open its report.

**0:45–1:05 — Local EVM.** Open /cross-vm. Explain the historical local EthereumJS EVM ledger and its original NOT_EXECUTED Hadrian column; it is a separate run.

**1:05–1:40 — Live Differential.** Show Clean, OriginHint, LaneProbe and Counter, all COMPATIBLE after fresh RPC verification. Show local return/events/state versus Hadrian, and normalization of sender role and LaneProbe block context. Do not claim gas parity. Open the Clean [call](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x39a9e0664b7d23b41d870d6ee12d29024f2e7ee7e357af89cafe96e8909d3d68) and Counter [call](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x5f8fbbdaeb2d6548c07997ce5ab2f52c09d30594f9f9b58530e09af1f8c5cc11).

**1:40–2:00 — Hadrian Lab.** Show [LaneProbe observe](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f), its event/readback and the read-only production console.

**2:00–2:25 — CPI Lab.** Show [invokeMemo](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845) and the [finalized Solana transaction](https://explorer.solana.com/tx/5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg?cluster=devnet) containing `Rome Compatibility Lab CPI-MEMO-01`.

**2:25–2:45 — Evidence Explorer and value.** Show four differential cases and the separate CPI proof. Reload; display fresh RPC time or clearly labeled recorded snapshot if RPC fails. Say teams can inspect documented Rome constraints before deployment and reproduce exact probe comparisons.

Record only after the owner-approved production release and confirm the public API statuses during capture. No mock transaction, grant or award claim. Video is not yet recorded.
