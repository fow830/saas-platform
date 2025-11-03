# Руководство по тестированию

## Установка зависимостей

Убедитесь, что все зависимости установлены:

```bash
cd backend
npm install
```

## Запуск тестов

### Unit тесты

Запуск всех unit тестов:
```bash
npm test
```

Запуск в watch режиме:
```bash
npm run test:watch
```

Запуск с покрытием кода:
```bash
npm run test:cov
```

Запуск конкретного файла:
```bash
npm test -- services.service.spec.ts
```

### E2E тесты

Запуск e2e тестов:
```bash
npm run test:e2e
```

**Важно:** E2E тесты требуют запущенной базы данных. Убедитесь, что:
1. База данных настроена в `.env`
2. Миграции применены: `npx prisma migrate dev`
3. Prisma Client сгенерирован: `npx prisma generate`

## Структура тестов

### Unit тесты

Unit тесты находятся рядом с исходными файлами с расширением `.spec.ts`:

- `analytics.service.spec.ts` - тесты для AnalyticsService
- `services.service.spec.ts` - тесты для ServicesService
- `subscriptions.service.spec.ts` - тесты для SubscriptionsService
- `payments.service.spec.ts` - тесты для PaymentsService

### E2E тесты

E2E тесты находятся в директории `test/`:
- `app.e2e-spec.ts` - основные интеграционные тесты

## Покрытие тестами

Текущее покрытие:
- ✅ AnalyticsService - статистика пользователей, использование сервисов, доходы
- ✅ ServicesService - получение услуг, использование с проверкой лимитов
- ✅ SubscriptionsService - создание подписок, автоматическое создание UserService
- ✅ PaymentsService - создание платежей, обработка webhooks

## Что тестируется

### AnalyticsService
- Получение статистики пользователя
- Получение статистики использования сервисов
- Получение статистики доходов
- Получение платформенной статистики

### ServicesService
- Получение услуг пользователя
- Использование сервиса (с проверкой лимитов)
- Создание UserService
- Проверка дневных лимитов использования

### SubscriptionsService
- Создание подписки
- Автоматическое создание UserService при подписке
- Смена плана
- Отмена подписки
- Обработка пробного периода

### PaymentsService
- Создание платежей через YooKassa
- Создание платежей через CloudPayments
- Создание платежей через Robokassa
- Обработка webhooks от всех провайдеров
- Верификация подписей webhooks

## Добавление новых тестов

При добавлении нового функционала:

1. Создайте `.spec.ts` файл рядом с исходным файлом
2. Используйте моки для внешних зависимостей (Prisma, внешние API)
3. Тестируйте как успешные сценарии, так и ошибки
4. Убедитесь, что тесты проходят перед коммитом

Пример структуры теста:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService, /* моки */],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('yourMethod', () => {
    it('should do something', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Troubleshooting

### Тесты не находят модули
Убедитесь, что Prisma Client сгенерирован:
```bash
npx prisma generate
```

### E2E тесты не подключаются к БД
Проверьте переменные окружения в `.env` и убедитесь, что база данных доступна.

### Проблемы с путями импорта
Убедитесь, что `tsconfig.json` настроен правильно и пути указаны корректно.

