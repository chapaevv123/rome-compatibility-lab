# Rome Arena submission text

Status: ready for owner review; **not submitted**. The public repository and HTTPS demo have been independently verified.

**Name:** Rome Compatibility Lab

**One line:** A source-level Rome compatibility preflight for Solidity teams, with explainable findings and portable reports.

**What are you building:** Rome Compatibility Lab helps EVM developers review Solidity source before testing on Rome. Its AST scanner identifies specific Rome constraints and CPI patterns, with file and line references, severity, confidence, explanations, and suggested actions. Users can scan pasted or uploaded Solidity in their browser, export JSON or Markdown reports, compare reports, and use a CLI. The public demo keeps the server scan API and GitHub importer disabled until distributed rate limiting is verified. This is a compatibility preflight, not a security audit or proof of cross-VM execution. No Hadrian contract has been deployed and no on-chain transaction is claimed.

**App type:** Other / developer tooling. If the form only offers EVM or Both, choose EVM and explain that the tool analyzes Solidity but has no verified Solana integration.

**Website:** https://rome-compatibility-lab.vercel.app

**GitHub:** https://github.com/chapaevv123/rome-compatibility-lab

The builder must submit this manually after checking the published app. Do not list a contract address or transaction until real on-chain evidence exists.
