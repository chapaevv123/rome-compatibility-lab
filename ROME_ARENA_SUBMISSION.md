# Rome Arena — release-ready English description

Status: prepared, **not submitted**. The v2 production release and video still require owner approval and public smoke checks.

**Name:** Rome Compatibility Lab

**Short description:** A Solidity compatibility preflight for Rome with explainable source findings, reproducible local EVM runs and public Hadrian/Solana execution evidence.

**Project description:** Rome Compatibility Lab helps Solidity teams identify documented Rome-specific constraints before deployment. The browser scanner reports exact file and line references, confidence, source links and remediation. Four checked-in probes provide historical local EVM evidence. A separate public ledger verifies LaneProbe deployment and `observe()`, CpiMemoProbe deployment and `invokeMemo()` on Rome Hadrian (chain ID 200010). Hadrian RPC maps the Memo call to a finalized Solana Devnet transaction whose inner Memo instruction contains the expected payload and success logs. Evidence Explorer displays the public receipts and rechecks them through RPC on reload. This is a compatibility tool, not a professional security audit.

**Website:** https://rome-compatibility-lab.vercel.app (publish v2 before submission)

**GitHub:** https://github.com/chapaevv123/rome-compatibility-lab

**Hadrian evidence:** [LaneProbe deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x76d3a3383926b2d0e6c7953fd28c1a3472ef655a3d5ad9c046b383428ae58004), [observe()](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f), [CPI deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xac5555d6a67f9995b215ed0e473c6c2cc4bde61149acad239b0714a20a19e946), [invokeMemo()](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845).

**Solana settlement:** [Finalized Memo transaction](https://explorer.solana.com/tx/5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg?cluster=devnet).

No grant, award, Arena selection or Builder Program endorsement is claimed.
