# Rome Compatibility Lab — контрольный список релиза

Статус на 6 ноября 2026 года: **локальное read-only demo подготовлено; публичного релиза и live Hadrian proof нет**. Отметки ниже ставятся только по фактическим логам и публичным ответам.

## Локальная проверка перед публикацией

- [ ] На окончательном `package-lock.json` выполнить `npm ci`, `npm audit --audit-level=low`, `npm audit --omit=dev --audit-level=low`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run probe:prepare`, CLI `scan` и `compare`, `npm run build`, `npm run test:e2e` (production server). Сохранить команды, выходные коды и логи.
- [ ] Убедиться, что `npm audit` получил ответ audit endpoint, а не сетевую ошибку. Подтверждение владельца о нулевых findings относится к предыдущему состоянию; финальный lockfile проверяется заново.
- [ ] Проверить демонстрационные примеры по `examples/README.md`: CPI с пустыми accounts — high; block context — два info; комментарии — ноль findings. Это узкий анализ совместимости, **не аудит безопасности**.
- [ ] Проверить исходники, историю и staged files на ключи, токены, cookies, `.env`, абсолютные локальные пути, резервные копии и приватные логи. Локальные подробные отчёты исключены `.gitignore`.
- [ ] Подтвердить право выпуска собственного кода под MIT; сохранить `vendor/solc-0.8.24/LICENSE` и `THIRD_PARTY_NOTICES.md`.

## Публичный read-only demo

- [ ] Получить явное разрешение владельца на создание **отдельного** публичного репозитория `chapaevv123/rome-compatibility-lab` и GitHub push. Перед созданием независимо проверить, существует ли он и кому принадлежит. Не переносить историю/файлы основного Pulse.
- [ ] Получить отдельное разрешение на production deployment. В Vercel импортировать только этот репозиторий, framework Next.js, Node.js 22. В environment установить `ROME_SCAN_API_ENABLED=0` и `NEXT_PUBLIC_SCAN_API_ENABLED=0`; не добавлять API токены. Сборка должна показывать Next.js 15.5.29. Проверить условия [Hobby](https://vercel.com/docs/plans/hobby): план предназначен для личного, некоммерческого использования; при коммерческом использовании выбрать подходящий платный план.
- [ ] После deploy открыть реальный URL в HTTP и браузере: landing, локальная вставка и загрузка Solidity, JSON/Markdown export, сравнение, `POST /api/scan` → 503. Записать URL, HTTP status и скриншоты. До проверки URL нельзя вписывать его в заявку Arena.

## Включение GitHub importer и публичного API (отдельный этап)

Без этих действий API остаётся выключенным. Локальный счётчик не является распределённой защитой.

1. Создать отдельную [Upstash Redis](https://upstash.com/pricing/redis) database. На 6 ноября 2026 года free tier указан как $0 с лимитом 500 тыс. команд/месяц, 256 MB данных и 10 GB bandwidth; превышение квоты может привести к ограничению сервиса. Включить HTTPS REST URL и серверный REST token только в Vercel env. Глобальная квота приложения — 120 scan/час и 8 одновременных scan через атомарный Redis EVAL; отказ Redis закрывает API с 503. Проверить реальные лимиты и биллинг в аккаунте владельца перед включением.
2. В Vercel Firewall → WAF → Rate Limiting создать правило: **request path exactly `/api/scan` AND method `POST`**, key **IP address**, fixed window **10 minutes**, threshold **10 requests**, action **Block / HTTP 429**. Проверить правило в dashboard и опубликовать его. [Vercel docs](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) указывают rate limiting на Hobby (одно правило на проект) и окна 10 секунд–10 минут; [pricing](https://vercel.com/pricing) указывает 1 млн allowed requests включённых и тариф сверх лимита. Конкретный лимит, доступность действия и возможные расходы подтвердить в аккаунте до активации. WAF quota по IP дополняет глобальный Redis cap.
3. Установить `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ROME_SCAN_API_ENABLED=1`, `NEXT_PUBLIC_SCAN_API_ENABLED=1` в **production** env Vercel и выполнить новый deployment. Публичная переменная содержит только флаг, **никогда** не токен.
4. Проверить с двух клиентов: корректный scan и публичный GitHub import; 11-й запрос за окно получает 429; превышение глобальной квоты получает 429; потеря Redis получает 503; malformed UTF-8, JSON, traversal, binary, oversized payload, private/redirect GitHub URL отклоняются. Проверить Function logs на отсутствие исходников, токенов и stack traces. Проверить расход Upstash/Vercel под нагрузкой в dashboard.

## Hadrian и контракты

- [ ] Обновить закреплённый Rome registry после проверки [официального репозитория](https://github.com/rome-protocol/rome-registry). Локально закреплён `v0.1.0`; upstream README рекомендует `v0.3.0`. До обновления и проверки адреса считать устаревшими.
- [ ] В обычном Windows PowerShell запустить `powershell -File scripts/diagnose-hadrian.ps1`; прочитать `hadrian-diagnostic.json`, сверить chain ID 200010, текущую высоту, RPC, explorer и registry. Скрипт выполняет только чтение.
- [ ] Использовать отдельный burner wallet и только тестовые средства. Публичный адрес передать как `ROME_BURNER_ADDRESS`, выполнить `npm run probe:prepare`, затем `npm run hadrian:dry-run`. Зафиксировать bytecode hash, текущий баланс, gas price, estimate и предполагаемые расходы. Не хранить приватный ключ в проекте или Vercel.
- [ ] Сверить официальные ABI, EVM program ID и CPI precompile по [Rome docs](https://docs.rome.builders/developer-guides/call-solana-from-evm) и registry. Для CPI указывать реальные account metas и проверять ограничения [Hadrian](https://docs.rome.builders/core-concepts/constraints).
- [ ] **Перед отправкой любой транзакции получить отдельное явное разрешение владельца.** После него записать настоящие tx hashes, contract addresses, explorer URLs, receipt, gas, результаты `eth_call` и фактическое соответствие Solana settlement. Не подменять эти данные локальными тестами.

## Rome Arena и дальнейшие действия

- [ ] После независимой проверки публичного URL и GitHub repo заполнить `ROME_ARENA_SUBMISSION.md` реальными ссылками. Текущий App type: **Other / developer tooling**; если форма не предлагает Other, выбрать EVM и объяснить, что инструмент анализирует Solidity, но сам пока не имеет Rome deployment.
- [ ] Подать builder profile/app в [Rome Arena](https://www.rome.builders/arena). Привязать только реально развёрнутые контракты с проверенными адресами и транзакциями.
- [ ] Сверять Builder milestones и Laurels с актуальными правилами Arena; заявку на грант подавать отдельно с фактическими результатами. Роль, Laurel, награда или грант не гарантированы.

**Публичное размещение API с `ROME_SCAN_API_ENABLED=1` блокируется до рабочей Redis quota, опубликованного WAF правила и live негативных тестов.** Read-only demo может быть размещено после финальной локальной проверки и разрешения владельца на GitHub/Vercel.
