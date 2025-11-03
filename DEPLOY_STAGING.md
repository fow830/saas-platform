# Развертывание на Staging

## Подготовка

### 1. Создайте файл с переменными окружения

```bash
cp .env.staging.example .env.staging
```

Отредактируйте `.env.staging` и заполните все необходимые переменные.

### 2. Обязательные переменные

Убедитесь, что следующие переменные заполнены:

```bash
# Критически важные
JWT_SECRET=<сгенерируйте_случайную_строку>
DB_PASSWORD=<надежный_пароль>
APP_URL=https://staging.yourapp.com
API_URL=https://staging-api.yourapp.com
NEXT_PUBLIC_API_URL=https://staging-api.yourapp.com/api

# Платежные провайдеры (можно использовать тестовые ключи)
YUKASSA_SHOP_ID=<ваш_shop_id>
YUKASSA_SECRET_KEY=<ваш_secret_key>
CLOUDPAYMENTS_PUBLIC_ID=<ваш_public_id>
CLOUDPAYMENTS_API_SECRET=<ваш_api_secret>
ROBOKASSA_MERCHANT_LOGIN=<ваш_merchant_login>
ROBOKASSA_PASSWORD_1=<password1>
ROBOKASSA_PASSWORD_2=<password2>
ROBOKASSA_TEST_MODE=true

# Email (можно использовать тестовый SMTP)
SMTP_HOST=<smtp_host>
SMTP_PORT=587
SMTP_USER=<smtp_user>
SMTP_PASSWORD=<smtp_password>
SMTP_FROM=noreply@yourapp.com
```

## Развертывание

### Шаг 1: Остановите существующие контейнеры (если есть)

```bash
docker-compose -f docker-compose.staging.yml down
```

### Шаг 2: Соберите образы

```bash
docker-compose -f docker-compose.staging.yml build --no-cache
```

### Шаг 3: Запустите контейнеры

```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Шаг 4: Примените миграции базы данных

```bash
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

Или если нужны новые миграции:

```bash
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate dev
```

### Шаг 5: Заполните базу тестовыми данными (опционально)

```bash
docker-compose -f docker-compose.staging.yml exec backend npm run seed
```

### Шаг 6: Сгенерируйте Prisma Client (если нужно)

```bash
docker-compose -f docker-compose.staging.yml exec backend npx prisma generate
```

## Проверка развертывания

### Проверьте статус контейнеров

```bash
docker-compose -f docker-compose.staging.yml ps
```

Все контейнеры должны быть в статусе "Up" и "healthy".

### Проверьте логи

```bash
# Логи backend
docker-compose -f docker-compose.staging.yml logs backend

# Логи frontend
docker-compose -f docker-compose.staging.yml logs frontend

# Логи всех сервисов
docker-compose -f docker-compose.staging.yml logs -f
```

### Проверьте health checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:3001

# Через nginx
curl http://localhost/health
```

### Проверьте доступность API

```bash
# Swagger документация
curl http://localhost/api-docs

# Health endpoint
curl http://localhost/health
```

## Обновление staging окружения

### 1. Остановите контейнеры

```bash
docker-compose -f docker-compose.staging.yml down
```

### 2. Обновите код (если используете git)

```bash
git pull origin staging
```

### 3. Пересоберите и запустите

```bash
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d
```

### 4. Примените новые миграции

```bash
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

## Мониторинг

### Просмотр логов в реальном времени

```bash
docker-compose -f docker-compose.staging.yml logs -f backend
```

### Проверка использования ресурсов

```bash
docker stats
```

### Проверка состояния базы данных

```bash
docker-compose -f docker-compose.staging.yml exec postgres psql -U saas_staging_user -d saas_staging_db
```

## Резервное копирование

### Создать бэкап базы данных

```bash
docker-compose -f docker-compose.staging.yml exec postgres pg_dump -U saas_staging_user saas_staging_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановить из бэкапа

```bash
docker-compose -f docker-compose.staging.yml exec -T postgres psql -U saas_staging_user saas_staging_db < backup.sql
```

## Troubleshooting

### Контейнер не запускается

```bash
# Проверьте логи
docker-compose -f docker-compose.staging.yml logs <service_name>

# Проверьте переменные окружения
docker-compose -f docker-compose.staging.yml config
```

### База данных не подключается

```bash
# Проверьте, что postgres контейнер работает
docker-compose -f docker-compose.staging.yml ps postgres

# Проверьте логи postgres
docker-compose -f docker-compose.staging.yml logs postgres

# Попробуйте подключиться вручную
docker-compose -f docker-compose.staging.yml exec postgres psql -U saas_staging_user -d saas_staging_db
```

### Миграции не применяются

```bash
# Проверьте статус миграций
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate status

# Примените миграции принудительно
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

### Nginx не проксирует запросы

```bash
# Проверьте конфигурацию nginx
docker-compose -f docker-compose.staging.yml exec nginx nginx -t

# Перезагрузите nginx
docker-compose -f docker-compose.staging.yml exec nginx nginx -s reload
```

## Остановка staging окружения

```bash
docker-compose -f docker-compose.staging.yml down
```

Для полной очистки (включая volumes):

```bash
docker-compose -f docker-compose.staging.yml down -v
```

**Внимание:** Это удалит все данные из базы данных!

## SSL сертификаты (опционально)

Если у вас есть SSL сертификаты, поместите их в `nginx/ssl/`:

```bash
nginx/ssl/
  ├── cert.pem
  └── key.pem
```

Затем обновите `nginx/staging.conf` с правильным доменом.

## Дополнительные команды

### Перезапустить сервис

```bash
docker-compose -f docker-compose.staging.yml restart <service_name>
```

### Выполнить команду в контейнере

```bash
docker-compose -f docker-compose.staging.yml exec backend <command>
```

### Просмотр переменных окружения

```bash
docker-compose -f docker-compose.staging.yml config
```

