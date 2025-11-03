# Установка и запуск тестов

## Требования

Для запуска тестов необходимо установить:

1. **Node.js** (версия 18 или выше)
2. **npm** (обычно устанавливается вместе с Node.js)

## Установка Node.js

### macOS (через Homebrew)
```bash
brew install node
```

### macOS (через официальный сайт)
1. Скачайте установщик с https://nodejs.org/
2. Установите LTS версию
3. Проверьте установку: `node --version` и `npm --version`

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Linux (через nvm - рекомендуется)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

## Установка зависимостей

После установки Node.js выполните:

```bash
cd backend
npm install
```

Это установит все необходимые зависимости, включая Jest и тестовые библиотеки.

## Генерация Prisma Client

Перед запуском тестов необходимо сгенерировать Prisma Client:

```bash
cd backend
npx prisma generate
```

## Запуск тестов

### 1. Unit тесты (быстрые, не требуют БД)

```bash
npm test
```

Ожидаемый вывод:
```
 PASS  src/modules/analytics/analytics.service.spec.ts
 PASS  src/modules/services/services.service.spec.ts
 PASS  src/modules/subscriptions/subscriptions.service.spec.ts
 PASS  src/modules/payments/payments.service.spec.ts

Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
```

### 2. Unit тесты с покрытием кода

```bash
npm run test:cov
```

Это создаст отчет о покрытии в директории `coverage/`

### 3. Unit тесты в watch режиме

```bash
npm run test:watch
```

Тесты будут перезапускаться при изменении файлов.

### 4. E2E тесты (требуют настроенную БД)

Сначала настройте тестовую базу данных в `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_test"
```

Затем примените миграции:
```bash
npx prisma migrate dev
```

И запустите e2e тесты:
```bash
npm run test:e2e
```

## Быстрая проверка установки

Выполните команды для проверки:

```bash
# Проверка версии Node.js
node --version
# Должно быть: v18.x.x или выше

# Проверка версии npm
npm --version
# Должно быть: 9.x.x или выше

# Проверка установленных зависимостей
cd backend
ls node_modules | head -5
```

## Возможные проблемы

### Проблема: "Cannot find module '@nestjs/testing'"
**Решение:** Выполните `npm install` в директории backend

### Проблема: "PrismaClient is not initialized"
**Решение:** Выполните `npx prisma generate`

### Проблема: "Jest did not exit one second after the test run"
**Решение:** Добавьте в `package.json` в секцию jest:
```json
"forceExit": true
```

### Проблема: Тесты не находят модули
**Решение:** Убедитесь, что выполнили `npm install` и `npx prisma generate`

## Альтернативный способ запуска

Если npm недоступен, но Node.js установлен через другой менеджер:

```bash
# Для yarn
yarn test

# Для pnpm
pnpm test
```

## Результаты тестирования

После успешного запуска `npm test` вы должны увидеть:

```
Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        2.345 s
Ran all test suites.
```

## Следующие шаги

1. ✅ Установить Node.js и npm
2. ✅ Установить зависимости: `npm install`
3. ✅ Сгенерировать Prisma Client: `npx prisma generate`
4. ✅ Запустить тесты: `npm test`

