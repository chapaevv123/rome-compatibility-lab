# Security and disclosure

Rome Compatibility Lab performs narrow AST compatibility checks. It is not a smart-contract security audit or a proof of deployment on Rome.

The hosted scan API is disabled by default. It must stay disabled until shared Redis quotas and the Vercel WAF rate-limit rule are configured and tested. When enabled, it accepts bounded JSON requests and public GitHub URLs only; it does not compile or execute submitted Solidity. If the quota service fails, requests are denied.

For a private vulnerability report after the repository is published, use GitHub's private vulnerability reporting feature for this repository. Do not include private keys, tokens or sensitive contract source in a public issue. For a suspected active leak, rotate the credential at its provider before opening a report.

Before each production release, run `npm ci`, `npm audit`, `npm audit --omit=dev`, the full test suite, the production build, and E2E. A successful local build does not establish the status of the public deployment.

## v2 review boundary

The v2 browser scanner parses Solidity only. It does not compile or execute uploaded source on the server. The public scan API remains disabled without distributed quota and WAF. Local EVM execution is restricted to checked-in probe contracts in the CLI script. No private keys are accepted by the website, and no signing code runs in the public build. Hadrian checks accept only a public burner address for gas estimation. The optional deploy CLI requires a local key and interactive approval before each transaction.
