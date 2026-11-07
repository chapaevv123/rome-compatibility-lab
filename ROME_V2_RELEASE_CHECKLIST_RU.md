# Rome Compatibility Lab 2.0 — release checklist

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
