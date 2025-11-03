# ⚡ Быстрый деплой на Staging

## 🎯 Самый простой способ (локально для теста)

```bash
cd /Users/alex/Downloads/saas-platform
./auto-deploy-staging.sh
```

Скрипт автоматически:
- ✅ Проверит Docker
- ✅ Создаст .env.staging
- ✅ Сгенерирует пароли и секреты
- ✅ Запустит все сервисы
- ✅ Применит миграции
- ✅ Создаст тестового админа

**Результат:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000/api
- Swagger: http://localhost:3000/api-docs
- Admin: admin@example.com / admin123456

## 🌐 Деплой на удаленный сервер

### Шаг 1: Подготовка сервера

```bash
# На вашем сервере
ssh user@your-server.com

# Установите Docker (если нет)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Шаг 2: Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone https://github.com/fow830/saas-platform.git
cd saas-platform
git checkout staging

# Создайте .env.staging
cp .env.staging.example .env.staging

# Отредактируйте .env.staging
nano .env.staging
```

**Минимальные настройки в .env.staging:**
```bash
APP_URL=https://staging.yourdomain.com
API_URL=https://staging-api.yourdomain.com
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com/api
DB_PASSWORD=<надежный_пароль>
JWT_SECRET=<случайная_строка_32_символа>
```

### Шаг 3: Запуск деплоя

```bash
./auto-deploy-staging.sh
```

## 🤖 Автоматический деплой через GitHub Actions

### Настройка (один раз)

1. **Перейдите:** https://github.com/fow830/saas-platform/settings/secrets/actions
2. **Добавьте secrets:**

```
STAGING_HOST=your-server.com
STAGING_USER=your-ssh-user
STAGING_SSH_KEY=<ваш_приватный_ssh_ключ>
STAGING_DIR=/path/to/saas-platform
STAGING_DB_PASSWORD=<пароль>
STAGING_JWT_SECRET=<секрет>
STAGING_APP_URL=https://staging.yourdomain.com
STAGING_API_URL=https://staging-api.yourdomain.com
```

3. **Готово!** Теперь каждый push в ветку `staging` автоматически деплоится.

## 📋 Команды для управления

```bash
# Просмотр логов
docker-compose -f docker-compose.staging.yml logs -f

# Перезапуск
docker-compose -f docker-compose.staging.yml restart

# Остановка
docker-compose -f docker-compose.staging.yml down

# Обновление
git pull origin staging
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy
```

## ✅ Проверка работы

```bash
# Health check
curl http://localhost:3000/api/health

# Статус контейнеров
docker-compose -f docker-compose.staging.yml ps
```

## 🆘 Если что-то не работает

1. **Проверьте логи:**
   ```bash
   docker-compose -f docker-compose.staging.yml logs
   ```

2. **Проверьте переменные окружения:**
   ```bash
   cat .env.staging
   ```

3. **Перезапустите контейнеры:**
   ```bash
   docker-compose -f docker-compose.staging.yml down
   docker-compose -f docker-compose.staging.yml up -d
   ```

