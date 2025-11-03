# 🚀 Запуск Dev версии локально

## Текущая ситуация

✅ Node.js установлен (v24.11.0)  
✅ npm установлен (v11.6.1)  
✅ Зависимости backend установлены  
✅ Prisma Client сгенерирован  
✅ Файлы .env созданы  
⚠️ PostgreSQL не установлен  
⚠️ Docker не установлен  

## Варианты запуска

### Вариант 1: Установить PostgreSQL через Homebrew (РЕКОМЕНДУЕТСЯ)

Если Homebrew установлен:
```bash
brew install postgresql@15
brew services start postgresql@15

# Создать базу и пользователя
createuser -s saas_user
createdb -O saas_user saas_db
psql -U saas_user -d saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';"
```

Затем:
```bash
cd backend
npm run start:dev
```

### Вариант 2: Запуск без БД (для проверки компиляции)

Можно запустить backend и frontend без БД для проверки, что все компилируется:

```bash
# Терминал 1 - Backend (будет ошибка подключения к БД, но запустится)
cd backend
npm run start:dev

# Терминал 2 - Frontend
cd frontend
npm run dev
```

Backend запустится, но будет ошибка при подключении к БД. Это нормально - можно проверить компиляцию.

### Вариант 3: Установить PostgreSQL вручную

1. Скачайте с https://www.postgresql.org/download/macosx/
2. Установите
3. Создайте базу данных:
```bash
createdb saas_db
createuser saas_user
psql saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';"
```

## Быстрый запуск (после установки PostgreSQL)

### 1. Применить миграции
```bash
cd backend
npx prisma migrate dev
```

### 2. Заполнить тестовыми данными (опционально)
```bash
npm run seed
```

### 3. Запустить Backend
```bash
npm run start:dev
```

Backend будет на: http://localhost:3000

### 4. В новом терминале - запустить Frontend
```bash
cd frontend
npm run dev
```

Frontend будет на: http://localhost:3001

## Проверка работы

```bash
# Health check
curl http://localhost:3000/api/health

# Swagger
open http://localhost:3000/api-docs

# Frontend
open http://localhost:3001
```

## Что уже готово

✅ `.env` файл создан в backend  
✅ `.env.local` файл создан в frontend  
✅ Prisma Client сгенерирован  
✅ Порты 3000 и 3001 свободны  
✅ Зависимости установлены  

## Следующий шаг

Установите PostgreSQL одним из способов выше, затем выполните:

```bash
cd backend
npx prisma migrate dev
npm run start:dev
```

В другом терминале:
```bash
cd frontend
npm run dev
```

