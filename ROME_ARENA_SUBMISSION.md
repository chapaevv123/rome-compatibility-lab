# Rome Arena submission text

Status: v2 review draft; **not submitted**. The public production demo is the previously approved v1 release. The v2 branch has local EVM evidence but no Hadrian transaction or CPI receipt.

**Name:** Rome Compatibility Lab

**One line:** A source-level Rome compatibility preflight for Solidity teams, with explainable findings and portable reports.

**What are you building:** Rome Compatibility Lab helps EVM developers review Solidity source before testing on Rome. Its AST scanner identifies documented Rome constraints with file/line references, confidence and remediation. Four checked-in probes execute in a local EVM and yield a hash-based evidence ledger. Differential and regression comparisons distinguish local success from missing chain evidence. The public API stays disabled pending shared rate limiting. A Hadrian deployment and CPI proof remain prepared but unverified. This is not a professional security audit.

**App type:** Other / developer tooling. If the form only offers EVM or Both, choose EVM and explain that the tool analyzes Solidity but has no verified Solana integration.

**Website:** https://rome-compatibility-lab.vercel.app

**GitHub:** https://github.com/chapaevv123/rome-compatibility-lab

The builder must submit this manually after checking the published app. Do not list a contract address or transaction until real on-chain evidence exists.
