# Rome Compatibility Lab 2.0 — release checklist

## Judge Experience RC — 7 ноября 2026

- [x] Первый экран: назначение для Rome/Solidity, ограничение статического scan, 4/4 tested, Hadrian receipts и Solana Memo CPI; время и provenance RPC показаны.
- [x] Четыре шага Judge Walkthrough ведут к действующим страницам. Exact LaneProbe source SHA-256 проверяется перед показом связанного runtime example; изменённый код не получает proof.
- [x] Live Differential — основной результат; исторический `NOT_EXECUTED` раскрывается отдельно. CPI Lab показывает Hadrian invokeMemo, Solana signature, Memo payload и finalization. Hadrian Lab показывает четыре операции.
- [x] Evidence Explorer: summary, отдельные evidence sections, stale/recorded/fresh labels, перенос hash/address и copy actions. History: fixture demo и ошибки файлов. Docs: browser-first quickstart.
- [x] `npm test`: 68 PASS, exit 0; typecheck/lint/build: exit 0; `npm audit` и `npm audit --omit=dev`: 0 vulnerabilities, exit 0; production-build E2E: 12 PASS, 2 SKIP, exit 0.
- [x] Read-only Hadrian differential: 4 compatible, 0 divergent, 0 blocked; read-only Solana CPI: `LIVE_VERIFIED`. Точные timestamps в `PROJECT_STATUS.md`.
- [ ] После разрешённого release проверить CI, production SHA, браузерный маршрут и fresh RPC на публичном домене.


## Подтверждено локально

- [x] Шесть новых Hadrian deploy/call receipts проверены read-only RPC; Clean, OriginHint, LaneProbe, Counter — COMPATIBLE (4/4), divergence 0, blocked 0. Снимок: [live differential](evidence/live-differential.json).
- [x] CPI: Hadrian invokeMemo и finalized Solana Devnet Memo, точный payload, `LIVE_VERIFIED`. Снимок: [Hadrian evidence](evidence/hadrian-live.json).
- [x] Публичный UI различает recorded и fresh RPC, отображает контракты, хеши, readback и Explorer. Production transaction console отключён.
- [x] Unit/integration 66/66, differential regression, typecheck, lint, build, оба npm audit — exit 0; E2E: 11 PASS, 1 явно пропущенный live-RPC wallet test, exit 0. Матрица: [release verification](docs/RELEASE_VERIFICATION_2026-11-07.md). Финальный commit проверяется отдельно.

## Перед публикацией

- [ ] Владелец разрешает GitHub push, merge main и Vercel production deployment проверенного commit.
- [ ] GitHub CI на опубликованном commit PASS; проверить SHA production, страницы, API и fresh RPC.
- [ ] Владелец записывает и проверяет настоящее 2–3 минутное видео; добавляет URL в Arena.
- [ ] Владелец проверяет требования authenticated Arena form, регистрирует app и привязывает контракты; отправляет заявку лично.

Никаких новых on-chain транзакций, private key, force push или нового contract deployment. Laurels не равны денежной награде; grants решаются командой Rome индивидуально.
