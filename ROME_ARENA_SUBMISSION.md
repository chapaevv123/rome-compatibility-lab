# Rome Arena — submission draft (not submitted)

**Local Judge Experience RC (unpublished):** The first screen now explains the Rome developer use case, shows four tested compatible scenarios with RPC provenance, and offers a four-step walkthrough. An exact SHA-256 match links the built-in LaneProbe scan to its pinned runtime example; arbitrary code is never assigned that proof. Hadrian Lab lists four verified operations, CPI Lab shows the finalized Memo settlement directly, and the earlier local-only `NOT_EXECUTED` ledger is archived separately. Push, production deployment and Arena submission still require owner authorization. Latest local read-only verification timestamps are recorded in [PROJECT_STATUS.md](PROJECT_STATUS.md).

**Name:** Rome Compatibility Lab

**Short description:** A Rome-specific Solidity preflight that pairs explainable source findings with reproducible local EVM execution, four RPC-verified Hadrian comparisons and a separate EVM → Solana Memo CPI proof.

**Website:** https://rome-compatibility-lab.vercel.app — last confirmed at SHA `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c` (current SHA not exposed by HTTP check); update this statement only after the owner-approved release and public SHA check.

**Source:** https://github.com/chapaevv123/rome-compatibility-lab/tree/feat/rome-compatibility-lab-v2 — link the verified release commit after push.

**Description:** The browser scanner identifies documented Rome constraints with source location, confidence, references and remediation. Four probes run in local EthereumJS EVM. A separate Live Differential independently verifies corresponding Hadrian deployment and call transactions, bytecode, sender, nonce, calldata, receipt, events and readback. Clean, OriginHint, LaneProbe and Counter are COMPATIBLE in the latest recorded RPC check; the UI requests fresh RPC verification on load and labels recorded results when unavailable. Sender roles and LaneProbe block context are normalized; gas parity is not claimed. A separate CpiMemoProbe call maps to a finalized Solana Devnet inner Memo instruction with exact payload `Rome Compatibility Lab CPI-MEMO-01`. This tool is a narrow compatibility preflight, not a general security audit or proof for arbitrary contracts.

**Differential contracts:** Clean `0x926Ea7d5BC282866fD876826ae0408871D9A2610`; OriginHint `0x02c28c53356D315C6cB526FdDcB5f9eb88065453`; LaneProbe `0x1607af4e1da1c06362871443d2e95c367b984efa`; Counter `0xD8c9c6afa24c2Ef6e15F72206d3bEa9980E56b4c`. CPI contract: `0x501dc0eb3c7542561d92870943fda993691833e6`. Chain ID 200010.

**Differential call proof:** [Clean](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x39a9e0664b7d23b41d870d6ee12d29024f2e7ee7e357af89cafe96e8909d3d68), [OriginHint](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xbd1d9d0504ad17addb81755108741e600743df166f40ca4a0286ff59987a77e3), [LaneProbe](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xdcf513ed4e530c8eeb21b6d86157b7e2066f0905d8ffe16504d6feef05b6467f), [Counter](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x5f8fbbdaeb2d6548c07997ce5ab2f52c09d30594f9f9b58530e09af1f8c5cc11). All six new deploy/call hashes: [record](evidence/differential-transactions.json).

**CPI proof:** [Hadrian deployment](https://via-hadrian.testnet.romeprotocol.xyz/tx/0xac5555d6a67f9995b215ed0e473c6c2cc4bde61149acad239b0714a20a19e946), [invokeMemo](https://via-hadrian.testnet.romeprotocol.xyz/tx/0x89c4c377b49d24d2aeb9753747505bd3d452703eab305d715da490b297e41845), [Solana finalized transaction](https://explorer.solana.com/tx/5csdQGcbiKbRYpjyn14uaTLHanmZk6jLNdUjaPVdmTHiPWK14dMKWFqyT5AoLqj2i2jfQuf3F1WcZvzQNm7pwiCg?cluster=devnet).

**Reproduce:** Node 22, `npm ci`, `npm run evm:local -- .tmp/local-execution-current.json`, `npm run differential:verify`, `npm run evidence:verify`. The last two use read-only public RPC.

**Video:** pending authentic owner recording using [script](ROME_V2_DEMO_SCRIPT_EN.md); insert reviewed public URL after production release.

**Arena rules and limits:** [Official Arena page](https://www.rome.builders/arena) says builders register an app, link contracts and complete milestones for Laurels. Grants are discretionary after an app is built on testnet, with amount decided case by case. No full public judging rubric was found. Authenticated form fields, team eligibility and exact milestone list must be checked by the owner. No selection, Laurel, grant or endorsement is claimed.

**Owner action:** After verified GitHub CI and approved production deployment, record/review video, check authenticated Arena form, link the LaneProbe/CPI contracts (and four differential contracts if requested), and submit personally.
