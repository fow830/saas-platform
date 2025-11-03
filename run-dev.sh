#!/bin/bash

# Скрипт для запуска dev версии локально

set -e

echo "🚀 Запуск dev версии локально..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

echo "✅ Node.js установлен: $(node --version)"

# Проверка PostgreSQL
POSTGRES_RUNNING=false
if command -v psql &> /dev/null; then
    if psql -h localhost -U saas_user -d saas_db -c "SELECT 1;" > /dev/null 2>&1; then
        POSTGRES_RUNNING=true
        echo "✅ PostgreSQL запущен локально"
    fi
fi

if [ "$POSTGRES_RUNNING" = false ]; then
    echo "⚠️ PostgreSQL не запущен"
    echo "📝 Варианты запуска PostgreSQL:"
    echo ""
    echo "Вариант 1: Через Docker (только PostgreSQL)"
    echo "  docker run -d --name saas_postgres \\"
    echo "    -e POSTGRES_USER=saas_user \\"
    echo "    -e POSTGRES_PASSWORD=saas_password \\"
    echo "    -e POSTGRES_DB=saas_db \\"
    echo "    -p 5432:5432 \\"
    echo "    postgres:15-alpine"
    echo ""
    echo "Вариант 2: Установить локально"
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    echo ""
    read -p "Продолжить без PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Backend
echo ""
echo "📦 Настройка Backend..."

cd backend

# Проверка зависимостей
if [ ! -d "node_modules" ]; then
    echo "📥 Установка зависимостей backend..."
    npm install
fi

# Генерация Prisma Client
echo "⚙️ Генерация Prisma Client..."
npx prisma generate

# Применение миграций (если PostgreSQL доступен)
if [ "$POSTGRES_RUNNING" = true ] || docker ps | grep -q saas_postgres; then
    echo "📊 Применение миграций..."
    npx prisma migrate dev --name dev_init || echo "⚠️ Миграции не применены (возможно БД недоступна)"
else
    echo "⚠️ Пропуск миграций (PostgreSQL недоступен)"
fi

echo ""
echo "✅ Backend готов!"
echo ""

# Frontend
echo "📦 Настройка Frontend..."

cd ../frontend

# Проверка зависимостей
if [ ! -d "node_modules" ]; then
    echo "📥 Установка зависимостей frontend..."
    npm install
fi

echo ""
echo "✅ Frontend готов!"
echo ""
echo "🚀 Для запуска откройте 2 терминала:"
echo ""
echo "Терминал 1 - Backend:"
echo "  cd backend"
echo "  npm run start:dev"
echo ""
echo "Терминал 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "📍 После запуска:"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend API: http://localhost:3000/api"
echo "  - Swagger: http://localhost:3000/api-docs"
echo ""

