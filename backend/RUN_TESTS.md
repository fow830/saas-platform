# Инструкция по запуску тестов

## Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка базы данных (для e2e тестов)

Убедитесь, что в `.env` указаны корректные данные для тестовой базы данных:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_test"
```

### 3. Запуск тестов

#### Unit тесты (быстрые, без БД)
```bash
npm test
```

#### Unit тесты с покрытием кода
```bash
npm run test:cov
```

#### Unit тесты в watch режиме (для разработки)
```bash
npm run test:watch
```

#### E2E тесты (требуют БД)
```bash
# Сначала примените миграции
npx prisma migrate dev

# Затем запустите тесты
npm run test:e2e
```

## Что тестируется

### ✅ Созданные тесты

1. **AnalyticsService** (`analytics.service.spec.ts`)
   - Статистика пользователей
   - Использование сервисов
   - Статистика доходов
   - Платформенная статистика

2. **ServicesService** (`services.service.spec.ts`)
   - Получение услуг пользователя
   - Использование сервисов
   - Проверка лимитов
   - Создание UserService

3. **SubscriptionsService** (`subscriptions.service.spec.ts`)
   - Создание подписки
   - Автоматическое создание UserService
   - Смена плана
   - Отмена подписки

4. **PaymentsService** (`payments.service.spec.ts`)
   - Создание платежей (YooKassa, CloudPayments, Robokassa)
   - Обработка webhooks
   - Верификация подписей

5. **E2E тесты** (`test/app.e2e-spec.ts`)
   - Health check
   - Регистрация и авторизация
   - Работа с планами
   - Работа с услугами
   - Аналитика

## Результаты тестирования

После запуска `npm test` вы увидите:

```
Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.345 s
```

## Покрытие кода

Запустите `npm run test:cov` для просмотра покрытия:

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.2  |   78.5   |   82.1  |   84.9  |
----------|---------|----------|---------|---------|
```

## Troubleshooting

### Ошибка: "Cannot find module '@nestjs/testing'"
Выполните:
```bash
npm install --save-dev @nestjs/testing
```

### Ошибка: "PrismaClient is not initialized"
Выполните:
```bash
npx prisma generate
```

### E2E тесты не подключаются к БД
1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь, что PostgreSQL запущен
3. Примените миграции: `npx prisma migrate dev`

### Тесты падают из-за таймаутов
Увеличьте таймаут в тестах:
```typescript
jest.setTimeout(10000); // 10 секунд
```

## Следующие шаги

1. ✅ Базовые unit-тесты созданы
2. ✅ E2E тесты созданы
3. ⏭ Добавить интеграционные тесты для webhooks
4. ⏭ Добавить тесты для email сервиса
5. ⏭ Добавить тесты для admin endpoints

## CI/CD

Для автоматического запуска тестов в CI/CD добавьте:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd backend
    npm test
    npm run test:cov
```

