# Rome Compatibility Lab 2.0 — release checklist

## Уже подтверждено

- [x] Production `https://rome-compatibility-lab.vercel.app` выпущен из `1abb4ee9b9c791004d243d1069ff9fd6bf87be0c`; предыдущий CI PASS.
- [x] Публичные страницы и `/api/evidence/live` отвечали `200`; четыре Hadrian receipts и Solana Memo CPI — `LIVE_VERIFIED` на момент проверки 7 ноября 2026 года.
- [x] Публичный `POST /api/scan` возвращает `503` до настройки quota и WAF; сканирование в браузере работает без него.
- [x] Четыре локальных EVM probe воспроизводятся; исторический ledger сохраняет `NOT_EXECUTED` для Hadrian.
- [x] Для LaneProbe свежий read-only RPC и нормализованное сравнение дают `COMPATIBLE`; источник и bytecode сверены с проверенным deployment.
- [x] Для Clean, OriginHint и Counter статус `BLOCKED`, с unsigned планом; результатов Hadrian для них нет.

## Перед новым production release

- [x] Целевые unit, differential/regression, typecheck, lint, build, E2E, оба npm audit, probe/CPI preparation и CLI прошли локально: unit 54/54, E2E 9/9 с exit code 0 против локального production build, свежий RPC differential и regression без новых расхождений.
- [ ] Полная обязательная CI-матрица проходит на новом commit в релизной ветке.
- [ ] Владелец подтверждает новый production deployment изменённой функциональности.
- [ ] После публикации проверены фактический production SHA, страницы, browser journey, API и live evidence.

## Конкурсный пробел

- [ ] Владелец отдельно разрешает три группы новых testnet транзакций и бюджет после свежего MetaMask quote. Текущий unsigned plan **не разрешает отправку**.
- [ ] Clean, OriginHint и Counter имеют реальные Hadrian deploy/call receipts, code/readback, нормализованное сравнение и regression; до этого они `BLOCKED`.
- [ ] Готовое видео записано, проверено и опубликовано владельцем; его URL внесён в Arena draft.
- [ ] Владелец сверил поля Arena, связал контракты и лично отправил заявку. Грант или отбор не гарантированы.

План: [`evidence/unsigned-differential-plan.json`](evidence/unsigned-differential-plan.json). В нём точные creation bytecode и calldata, но predicted addresses зависят от nonce. Read-only оценка на блоке 519626471: только верхние лимиты трёх deployment — `2.009454951568260600` test USDC при балансе `1.734611224783532832` test USDC; дефицит уже `0.274843726784727768` test USDC без трёх вызовов. Всего нужны шесть отдельных MetaMask подтверждений: deploy + call для Clean, OriginHint и Counter. Вызовы и изменение цены газа в оценку не включены. Перед любой отправкой нужны новые оценки, достаточный баланс и отдельное ручное подтверждение MetaMask. Приватные ключи в приложение или чат не вводить.
