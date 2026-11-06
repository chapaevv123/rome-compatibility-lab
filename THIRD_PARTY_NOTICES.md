# Third-party notices

The project code is MIT licensed. Dependency licenses remain their authors' licenses.

| Component | Version | License | Use |
| --- | --- | --- | --- |
| Rome registry | pinned `v0.1.0` | MIT | public chain metadata; upstream `v0.3.0` must be reconciled before live deployment |
| Solidity parser | `0.20.2` | MIT | AST preflight |
| Next.js | `15.5.29` | MIT | website and API |
| React / React DOM | `19.1.2` | MIT | user interface |
| Playwright | `1.55.1` | Apache-2.0 | E2E tests only |
| TypeScript | `5.9.3` | Apache-2.0 | development only |
| Tailwind CSS | `4.1.13` | MIT | styles |
| `soljson.js` from official `solc@0.8.24` npm archive | `0.8.24` | MIT | exact local probe compiler; original license at `vendor/solc-0.8.24/LICENSE` |

The lockfile also includes optional platform packages under LGPL-3.0-or-later (libvips), MPL-2.0 (Lightning CSS), and a CC-BY-4.0 data package (`caniuse-lite`). They keep their upstream license terms. Their binaries and license files are not copied into this repository. Before redistributing a packaged binary or vendored `node_modules`, review and include the applicable notices and source obligations. This project does not publish `node_modules`.

The vendored compiler was extracted from `https://registry.npmjs.org/solc/-/solc-0.8.24.tgz`. The npm tarball matched the official npm metadata integrity `sha512-G5yUqjTUPc8Np74sCFwfsevhBPlUifUOfhYrgyu6CmYlC6feSw0YS6eZW47XDT23k3JYdKx5nJ+Q7whCEmNcoA==`; its `soljson.js` and `LICENSE` matched the vendored files byte for byte. Compiler SHA-256: `FB59B825B7D57F9DE89CD9DE2415B12AAB1FCC7EB2573FD2BF5C9B969EACF4D9`.
