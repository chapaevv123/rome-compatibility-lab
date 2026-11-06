# Rome Compatibility Lab 2.0 — отчёт для review

Дата: 6 ноября 2026. Ветка: `feat/rome-compatibility-lab-v2`. Baseline: `981f6f4799ea758c592f5eb7c2a95dbae68442be`.

## 1. Что реализовано

Сохранён существующий Next.js продукт и scanner/CLI. Обновлён registry до последнего обнаруженного Git tag `v0.3.0`. Добавлены узкие AST правила SELFDESTRUCT, literal modexp `0x05` и stipend review, построчный suppression с обоснованием, выбор нескольких Solidity файлов в браузере, четыре локальных EVM probe, JSON ledger, differential/regression logic, Hadrian/CPI screens и компиляция CPI probe через официальный MIT интерфейс Rome.

## 2. Что реально работает

Локальные сканирование, экспорт, CLI, компиляция и выполнение четырёх probe в EthereumJS VM. Local ledger: `evidence/local-execution.json`. Публичный `/api/scan` остаётся fail-closed. Hadrian RPC доступен read-only; финальная проверка вернула chain ID 200010, block 519412329, explorer HTTP 200 6 ноября.

## 3. Что проверено

Проверены официальные Rome docs, Rome EVM semantics, CPI guide, registry Git tags и лицензии. Rome EVM распространяется на условиях source-available proprietary; его код не копировался. Rome Solidity interface имеет MIT license, сохранён локально с SHA-256. Неполный source-level анализ не выдаётся за полную совместимость.

## 4. PASS / FAIL

Финальный повторный прогон: `npm ci` PASS; 35 unit/security/differential/regression/scanner/SDK-adapter тестов PASS; typecheck PASS; строгий TS lint PASS; production build PASS; 6 Playwright E2E PASS против production build; 4 локальных EVM probe PASS; оба unsigned compiler scripts PASS; CLI scan/compare/compare-run PASS; `npm audit` и `npm audit --omit=dev` — 0 vulnerabilities. Первый E2E прогон в ходе разработки дал 1 FAIL из-за неоднозначного selector после добавления nav; selector исправлен и повторный production E2E дал 6/6 PASS. Полные Rome Solidity и TypeScript SDK npm-пакеты дали advisory в peer dependency tree; оставлены только официальные MIT ABI header и неизменённый модуль `submitRomeTx` с SHA-256. Транзакционный CLI и verifier не проверялись на живой транзакции.

## 5. BLOCKED

Read-only RPC dry-run LaneProbe выполнен с явно тестовым адресом `0x1000…0001`, который не является burner владельца: block 519402785, `eth_estimateGas=4394041`, `eth_gasPrice=148555441800` wei и расчётная оценка `0.6527587020423138` test USDC по 18 decimals registry. Отдельный read-only dry-run CPI **deployment** дал block 519409552, `eth_estimateGas=17673161`, оценку `2.6254442403575298` test USDC. CPI invocation не оценивался. Баланс тестового адреса — 0; обе оценки зависят от времени и адреса и могут завышать фактическую стоимость Rome. Нет публичного адреса отдельного burner-кошелька для персональной оценки. Нет финансирования и разрешения на каждую группу testnet-транзакций. Поэтому deploy, receipt verification, Solana-side CPI proof, live differential и on-chain regression ещё не выполнены. Видео не записано.

## 6. Подтверждённые Hadrian transactions

**Ни одной.** Transaction hash, contract address, receipt status и explorer transaction URL отсутствуют.

## 7. Доказанная CPI-функциональность

Официальный Rome Solidity ABI компилируется вместе с `CpiMemoProbe.sol`. Артефакт содержит Memo program ID из registry v0.3.0 в base58 и bytes32, ABI constructor argument и хеши. Контракт использует `HELPER.pda(address(this))` как signer meta; это подготовленная гипотеза. Реальное исполнение CPI **не доказано**. Solana-side mapping, Memo logs и CU требуют одобренной testnet-транзакции и независимой проверки.

## 8. Риски

Статический анализ не отслеживает сложный data flow; относительные импорты проверяются по выбранным файлам, но внешние пакеты не разрешаются и браузер ничего не компилирует. Локальная EVM не моделирует Solana runtime и CU. Предположение о подходящем Memo account meta может оказаться неверным. Прямые low-level вызовы через переменные и assembly текущим правилом modexp не обнаруживаются. Транзакционный CLI и повторная RPC-проверка пока не валидированы реальным receipt. Данные публичного demo относятся к старой production-версии до отдельного разрешения на релиз.

## 9. Что нужно от владельца

Публичный адрес **отдельного** Hadrian burner wallet; приватный ключ не присылать. После read-only dry-run — отдельное разрешение и test USDC для подписания конкретной группы транзакций. Отдельное подтверждение для production Vercel и ручная подача Arena application. Для полного релиза нужна запись демонстрационного видео.

## 10. Готовность

Review branch показывает реальную локальную техническую ценность. **К полноценной builder/grant демонстрации версия пока не готова**: критерии настоящего Hadrian execution и CPI proof не выполнены. PREPARED и STATIC_ONLY не выдаются за VERIFIED.
