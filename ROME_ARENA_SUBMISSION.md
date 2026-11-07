# Rome Arena — release-ready English description

Status: production verified on 7 November 2026 at commit `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c`; **not submitted**. The owner still needs to record and review the video, check Arena form requirements, and submit the application.

**Name:** Rome Compatibility Lab

**Short description:** A Rome-specific Solidity compatibility preflight with explainable source findings, reproducible local EVM runs and independently checked Hadrian/Solana execution evidence.

**Project description:** Rome Compatibility Lab helps Solidity teams identify documented Rome-specific constraints before deployment. The browser scanner reports exact file and line references, confidence, source links and remediation. Four checked-in probes provide historical local EVM evidence. A separate public ledger verifies LaneProbe deployment and `observe()`, CpiMemoProbe deployment and `invokeMemo()` on Rome Hadrian (chain ID 200010). Hadrian RPC maps the Memo call to a finalized Solana Devnet transaction whose inner Memo instruction contains the expected payload and success logs. Evidence Explorer displays the public receipts and rechecks them through RPC on reload. The next version compares LaneProbe's local execution with the matching Hadrian receipt after normalizing sender and block context; the other three probes are explicitly BLOCKED until their own Hadrian receipts exist. This is a compatibility tool, not a professional security audit.

**Website:** https://rome-compatibility-lab.vercel.app

**GitHub (released source branch):** https://github.com/chapaevv123/rome-compatibility-lab/tree/feat/rome-compatibility-lab-v2

**Differential status:** LaneProbe `COMPATIBLE` in the local release candidate; Clean, OriginHint and Counter `BLOCKED`. Do not describe this as a production feature until the new commit passes CI and is separately deployed.

**Hadrian evidence:** [LaneProbe deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x76d3a3383926b2d0e6c7953fd28c1a3472ef655a3d5ad9c046b383428ae58004), [observe()](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f), [CPI deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xac5555d6a67f9995b215ed0e473c6c2cc4bde61149acad239b0714a20a19e946), [invokeMemo()](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845).

**Solana settlement:** [Finalized Memo transaction](https://explorer.solana.com/tx/5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg?cluster=devnet).

No grant, award, Arena selection or Builder Program endorsement is claimed.

Rome Arena's public page describes app registration, linked contracts and milestone-based Laurels; grants are discretionary. The authenticated registration form's required fields and complete milestone list were not independently confirmed. The owner must verify them before submission.

**Positioning:** [Slither](https://github.com/crytic/slither) provides broad Solidity/Vyper static analysis and [Solhint](https://github.com/protofire/solhint) provides Solidity linting. This project focuses on documented Rome behavior and pairs narrow source checks with independently rechecked Hadrian/Solana execution evidence. Its four-case differential is still incomplete; only LaneProbe has matching local and Hadrian execution.

**Owner submission steps:** Record and review the 2:40 demo from `ROME_V2_DEMO_SCRIPT_EN.md`; provide its public video link. In the Rome Arena app registration form, enter the website, released source branch, video link and the two Hadrian contract addresses (`0x1607af4e1da1c06362871443d2e95c367b984efa` and `0x501dc0eb3c7542561d92870943fda993691833e6`) if the form requests contract links. Confirm the account, team, rights and any current form requirements before submitting personally. No Arena submission has been made here.
