# 🚀 Автоматический деплой на Staging

## Вариант 1: Локальный деплой (для тестирования)

Если у вас установлен Docker локально:

```bash
cd /Users/alex/Downloads/saas-platform
./auto-deploy-staging.sh
```

Скрипт автоматически:
- ✅ Проверит наличие Docker
- ✅ Создаст .env.staging из примера (если нет)
- ✅ Сгенерирует JWT_SECRET и DB_PASSWORD (если не заполнены)
- ✅ Соберет и запустит все контейнеры
- ✅ Применит миграции базы данных
- ✅ Создаст тестового администратора
- ✅ Проверит health checks

## Вариант 2: Деплой на удаленный сервер

### Подготовка сервера

1. **Подключитесь к серверу:**
   ```bash
   ssh user@your-staging-server.com
   ```

2. **Установите зависимости:**
   ```bash
   # Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/fow830/saas-platform.git
   cd saas-platform
   git checkout staging
   ```

4. **Настройте переменные окружения:**
   ```bash
   cp .env.staging.example .env.staging
   nano .env.staging  # Заполните все переменные
   ```

5. **Запустите деплой:**
   ```bash
   ./auto-deploy-staging.sh
   ```

### Важные переменные для .env.staging

```bash
# Обязательные
DB_PASSWORD=<надежный_пароль>
JWT_SECRET=<случайная_строка_32_символа>
APP_URL=https://staging.yourdomain.com
API_URL=https://staging-api.yourdomain.com
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com/api

# Опциональные (можно оставить пустыми для staging)
YUKASSA_SHOP_ID=
YUKASSA_SECRET_KEY=
CLOUDPAYMENTS_PUBLIC_ID=
CLOUDPAYMENTS_API_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
```

## Вариант 3: Автоматический деплой через GitHub Actions

Создан workflow `.github/workflows/deploy-staging.yml` для автоматического деплоя.

### Настройка GitHub Secrets

1. Перейдите: https://github.com/fow830/saas-platform/settings/secrets/actions
2. Добавьте следующие secrets:

**Обязательные:**
- `STAGING_HOST` - IP или домен вашего staging сервера
- `STAGING_USER` - пользователь для SSH
- `STAGING_SSH_KEY` - приватный SSH ключ для подключения
- `STAGING_DIR` - путь к проекту на сервере (например: `/home/user/saas-platform`)
- `STAGING_DB_PASSWORD` - пароль для базы данных
- `STAGING_JWT_SECRET` - секретный ключ JWT
- `STAGING_APP_URL` - URL приложения (например: `https://staging.yourdomain.com`)
- `STAGING_API_URL` - URL API (например: `https://staging-api.yourdomain.com`)

**Опциональные:**
- `YUKASSA_SHOP_ID`, `YUKASSA_SECRET_KEY`
- `CLOUDPAYMENTS_PUBLIC_ID`, `CLOUDPAYMENTS_API_SECRET`
- `ROBOKASSA_MERCHANT_LOGIN`, `ROBOKASSA_PASSWORD_1`, `ROBOKASSA_PASSWORD_2`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`

### Как это работает

При каждом push в ветку `staging`:
1. GitHub Actions автоматически запустится
2. Подключится к вашему серверу по SSH
3. Обновит код из репозитория
4. Пересоберет и перезапустит контейнеры
5. Применит миграции базы данных

Также можно запустить вручную:
- Перейдите: https://github.com/fow830/saas-platform/actions
- Выберите "Deploy to Staging"
- Нажмите "Run workflow"

## Проверка деплоя

После деплоя проверьте:

```bash
# Статус контейнеров
docker-compose -f docker-compose.staging.yml ps

# Логи
docker-compose -f docker-compose.staging.yml logs -f

# Health checks
curl http://localhost:3000/api/health
curl http://localhost:3001
```

## Доступные сервисы

- **Frontend:** http://staging.yourdomain.com (или http://localhost:3001 локально)
- **Backend API:** http://staging-api.yourdomain.com/api (или http://localhost:3000/api локально)
- **Swagger:** http://staging-api.yourdomain.com/api-docs
- **Health:** http://staging-api.yourdomain.com/api/health

## Тестовый администратор

После первого деплоя создается тестовый администратор:
- **Email:** admin@example.com
- **Пароль:** admin123456

## Обновление staging

### Вручную:

```bash
cd /path/to/saas-platform
git pull origin staging
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy
```

### Автоматически:

Просто сделайте push в ветку `staging`:
```bash
git push origin staging
```

GitHub Actions автоматически выполнит деплой.

## Troubleshooting

### Контейнеры не запускаются

```bash
docker-compose -f docker-compose.staging.yml logs
```

### База данных не подключается

```bash
docker-compose -f docker-compose.staging.yml exec postgres psql -U saas_staging_user -d saas_staging_db
```

### Миграции не применяются

```bash
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate status
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

