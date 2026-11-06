# Rome Compatibility Lab v2 — release checklist

- [x] Baseline `981f6f4` сохранён в main; работа в отдельной ветке.
- [x] Официальный registry обновлён до `v0.3.0`; Git tags проверены.
- [x] Публичный web API остаётся выключенным без распределённого quota и WAF.
- [x] Четыре локальных EVM probe выполнены; Hadrian явно NOT_EXECUTED.
- [x] CPI probe компилируется с официальным MIT interface.
- [x] Read-only RPC dry-run выполнен с тестовым адресом, без подписи и отправки.
- [x] CPI constructor содержит реальный Memo program ID из registry; deployment dry-run выполнен read-only.
- [x] Hadrian CLI использует неизменённый MIT модуль `submitRomeTx` официального SDK v0.4.0 и локальный лимит стоимости, покрытый unit-тестом.
- [ ] CLI подписания и verifier подтверждены реальными receipt и Solana settlement; сейчас только подготовлены.
- [ ] Адрес отдельного burner wallet для read-only `hadrian:dry-run`.
- [ ] Отдельное разрешение владельца на каждую группу testnet транзакций.
- [ ] Receipt, code, state, event и Solana-side signature перепроверены по публичным RPC.
- [ ] Live differential и regression повторены на реальных receipts.
- [ ] Видео 2–3 минуты записано и проверено.
- [ ] PR просмотрен владельцем; production Vercel отдельно одобрен.

Windows PowerShell подготовка без подписи:

```powershell
npm.cmd ci
npm.cmd run network:check
npm.cmd run probe:prepare
npm.cmd run cpi:prepare
$env:ROME_BURNER_ADDRESS = '0xPUBLIC_BURNER_ADDRESS'
npm.cmd run hadrian:dry-run
npm.cmd run hadrian:dry-run -- --cpi
```

После отдельного разрешения владельца только в локальном PowerShell: задать `ROME_BURNER_PRIVATE_KEY` в переменной среды (не в репозитории и не в браузере), затем `npm.cmd run hadrian:deploy -- --send` для LaneProbe. CLI проверит chain ID 200010, совпадение ключа с публичным адресом, стоимость и запросит ввод `APPROVE DEPLOY`, затем отдельно `APPROVE OBSERVE`. Для CPI нужен **отдельный** запуск `npm.cmd run hadrian:deploy -- --send --cpi` и отдельные подтверждения `APPROVE DEPLOY`, `APPROVE CPI_INVOKE`. На каждом шаге подтверждённый receipt сохраняется в игнорируемом Git JSON. Команды отправки **не запускались**. После отправки выполнить `npm.cmd run hadrian:verify` и `npm.cmd run hadrian:verify -- --cpi`; CPI остаётся `PENDING_SOLANA_VERIFICATION`, пока Solana settlement и Memo logs не проверены.

Газ на Hadrian оплачивается test USDC. [Официальный Rome faucet guide](https://docs.rome.builders/resources/faucets) уточняет: **Rome faucet нет**. Получить test USDC в Circle faucet на Solana Devnet или EVM testnet, затем перевести его через Rome Bridge на отдельный EVM burner; также понадобится SOL/нативный газ исходной сети для bridge. Точная стоимость зависит от текущего `eth_estimateGas`, fee context и burner адреса и выводится dry-run в native units/wei. Не отправлять средства и не подписывать транзакцию по старой оценке.
