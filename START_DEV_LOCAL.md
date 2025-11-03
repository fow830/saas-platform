# Запуск dev версии локально (без Docker)

## Требования

- ✅ Node.js 18+ (уже установлен: v24.11.0)
- ✅ npm (уже установлен: v11.6.1)
- PostgreSQL (нужно установить или использовать Docker только для БД)
- Redis (опционально, можно запустить без него)

## Вариант 1: Полностью локально (рекомендуется для разработки)

### Шаг 1: Установите PostgreSQL

**macOS (через Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Или используйте Docker только для БД:**
```bash
docker run -d --name saas_postgres \
  -e POSTGRES_USER=saas_user \
  -e POSTGRES_PASSWORD=saas_password \
  -e POSTGRES_DB=saas_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### Шаг 2: Настройте Backend

```bash
cd backend

# Создайте .env файл
cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3000
API_URL=http://localhost:3000/api
EOF

# Установите зависимости (если еще не установлены)
npm install

# Сгенерируйте Prisma Client
npx prisma generate

# Примените миграции
npx prisma migrate dev

# Заполните тестовыми данными (опционально)
npm run seed
```

### Шаг 3: Запустите Backend

```bash
# В директории backend
npm run start:dev
```

Backend будет доступен на: http://localhost:3000

### Шаг 4: Настройте и запустите Frontend

```bash
# В новом терминале
cd frontend

# Создайте .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local

# Установите зависимости (если еще не установлены)
npm install

# Запустите frontend
npm run dev
```

Frontend будет доступен на: http://localhost:3001

## Вариант 2: Только БД через Docker, остальное локально

Если хотите избежать установки PostgreSQL, можно запустить только БД в Docker:

```bash
# Запустите только PostgreSQL
docker run -d --name saas_postgres \
  -e POSTGRES_USER=saas_user \
  -e POSTGRES_PASSWORD=saas_password \
  -e POSTGRES_DB=saas_db \
  -p 5432:5432 \
  postgres:15-alpine

# Или Redis (опционально)
docker run -d --name saas_redis \
  -p 6379:6379 \
  redis:7-alpine
```

Затем следуйте Шагам 2-4 из Варианта 1.

## Проверка работы

### Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Swagger документация
open http://localhost:3000/api-docs
```

### Frontend
```bash
# Откройте в браузере
open http://localhost:3001
```

## Структура командов

Для удобной разработки откройте 2 терминала:

**Терминал 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Порт 5432 занят
Измените порт PostgreSQL или остановите существующий:
```bash
# Найти процесс на порту 5432
lsof -i :5432

# Остановить процесс
kill <PID>
```

### Prisma не подключается к БД
```bash
# Проверьте подключение
cd backend
npx prisma db pull

# Пересоздайте базу
npx prisma migrate reset
```

### Frontend не подключается к API
Проверьте `.env.local` в frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Порт 3000 или 3001 занят
Измените порты в:
- Backend: `backend/src/main.ts` (или через переменные окружения)
- Frontend: `frontend/package.json` или создайте файл `next.config.js`

