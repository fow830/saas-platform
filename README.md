# SaaS Platform

Полнофункциональная SaaS платформа с множественными сервисами, подписками и платежными системами.

## Технологический стек

### Backend
- Node.js 18+ с TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT аутентификация

### Frontend
- Next.js 14 (App Router)
- React 18+ с TypeScript
- Tailwind CSS
- Axios

## Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### Запуск через Docker

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd saas-platform
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Запустите контейнеры:
```bash
docker-compose up -d
```

4. Примените миграции базы данных:
```bash
docker-compose exec backend npx prisma migrate dev
```

5. Заполните начальными данными:
```bash
docker-compose exec backend npm run seed
```

6. Приложение будет доступно:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger документация: http://localhost:3000/api-docs

### Локальная разработка

#### Backend

1. Перейдите в директорию backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте `.env` файл (см. `.env.example`)

4. Запустите миграции:
```bash
npx prisma migrate dev
```

5. Запустите сервер:
```bash
npm run start:dev
```

#### Frontend

1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. Запустите сервер разработки:
```bash
npm run dev
```

## Структура проекта

```
saas-platform/
├── backend/          # NestJS backend
│   ├── src/
│   │   ├── modules/  # Модули приложения
│   │   ├── database/ # Prisma service
│   │   └── health/   # Health checks
│   └── prisma/       # Prisma schema и миграции
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # App Router страницы
│       ├── components/
│       └── lib/      # Утилиты
├── nginx/            # Nginx конфигурация
└── docker-compose.yml
```

## API Endpoints

Основные endpoints:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/profile` - Профиль пользователя
- `GET /api/plans` - Список планов
- `POST /api/subscriptions` - Создать подписку
- `GET /api/subscriptions/me` - Моя подписка

Полная документация доступна в Swagger: http://localhost:3000/api-docs

## Команды разработки

### Backend
- `npm run start:dev` - Запуск в режиме разработки
- `npm run build` - Сборка
- `npm run test` - Запуск тестов
- `npx prisma studio` - Открыть Prisma Studio
- `npm run seed` - Заполнить БД тестовыми данными

### Frontend
- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка для production
- `npm run start` - Запуск production сервера

## База данных

Схема базы данных определяется в `backend/prisma/schema.prisma`.

Для применения изменений:
```bash
npx prisma migrate dev --name description_of_changes
```

## Docker

### Development
```bash
docker-compose up
```

### Staging
```bash
# 1. Создайте .env.staging на основе .env.staging.example
cp .env.staging.example .env.staging

# 2. Заполните переменные окружения в .env.staging

# 3. Запустите развертывание
./deploy-staging.sh

# Или вручную:
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

Подробнее см. [QUICK_START_STAGING.md](./QUICK_START_STAGING.md) или [DEPLOY_STAGING.md](./DEPLOY_STAGING.md)

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Развертывание

### Staging окружение

Быстрый старт:
```bash
./deploy-staging.sh
```

Подробная документация:
- [QUICK_START_STAGING.md](./QUICK_START_STAGING.md) - быстрый старт
- [DEPLOY_STAGING.md](./DEPLOY_STAGING.md) - полная документация

## Лицензия

MIT

