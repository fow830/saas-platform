# Быстрый старт - Staging окружение

## Минимальные шаги для развертывания

### 1. Подготовка переменных окружения

```bash
# Скопируйте пример файла
cp .env.staging.example .env.staging

# Отредактируйте и заполните минимум:
nano .env.staging  # или используйте любой редактор
```

**Минимально необходимые переменные:**
```env
JWT_SECRET=<любая_случайная_строка_минимум_32_символа>
DB_PASSWORD=<надежный_пароль>
APP_URL=http://localhost
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Запуск развертывания

**Вариант A: Автоматический скрипт**
```bash
./deploy-staging.sh
```

**Вариант B: Вручную**
```bash
# 1. Остановка существующих контейнеров
docker-compose -f docker-compose.staging.yml down

# 2. Сборка и запуск
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# 3. Применение миграций
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy

# 4. Генерация Prisma Client
docker-compose -f docker-compose.staging.yml exec backend npx prisma generate

# 5. Заполнение тестовыми данными (опционально)
docker-compose -f docker-compose.staging.yml exec backend npm run seed
```

### 3. Проверка

```bash
# Проверка статуса
docker-compose -f docker-compose.staging.yml ps

# Проверка логов
docker-compose -f docker-compose.staging.yml logs -f

# Проверка health
curl http://localhost:3000/api/health
```

## Доступ к сервисам

После успешного развертывания:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Swagger документация**: http://localhost:3000/api-docs
- **Health check**: http://localhost:3000/api/health

## Остановка

```bash
docker-compose -f docker-compose.staging.yml down
```

## Полная очистка (удаление всех данных)

```bash
docker-compose -f docker-compose.staging.yml down -v
```

## Полезные команды

```bash
# Перезапуск сервиса
docker-compose -f docker-compose.staging.yml restart <service_name>

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.staging.yml logs -f backend

# Выполнение команды в контейнере
docker-compose -f docker-compose.staging.yml exec backend <command>

# Подключение к базе данных
docker-compose -f docker-compose.staging.yml exec postgres psql -U saas_staging_user -d saas_staging_db
```

## Решение проблем

### Контейнер не запускается

```bash
# Смотрите логи
docker-compose -f docker-compose.staging.yml logs <service_name>

# Проверьте конфигурацию
docker-compose -f docker-compose.staging.yml config
```

### База данных недоступна

```bash
# Проверьте, что postgres запущен
docker-compose -f docker-compose.staging.yml ps postgres

# Проверьте логи postgres
docker-compose -f docker-compose.staging.yml logs postgres
```

### Порты заняты

Измените порты в `.env.staging`:
```env
BACKEND_PORT=3002
FRONTEND_PORT=3003
```

## Дополнительная информация

Полная документация: см. `DEPLOY_STAGING.md`

