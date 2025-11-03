#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 ЛОКАЛЬНАЯ РАЗРАБОТКА БЕЗ DOCKER                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js не установлен"
  echo "Установите Node.js: https://nodejs.org/"
  exit 1
fi

echo "✅ Node.js: $(node --version)"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "⚠️  PostgreSQL не установлен"
  echo "Установите PostgreSQL: https://www.postgresql.org/download/"
  echo "Или используйте Docker для PostgreSQL"
fi

echo "📋 Настройка локального окружения..."
echo ""

# Backend
echo "📦 Настройка Backend..."
cd backend
if [ ! -d "node_modules" ]; then
  echo "Установка зависимостей backend..."
  npm install
fi

# Проверка .env
if [ ! -f ".env" ]; then
  echo "Создание .env для backend..."
  cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_dev
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3001
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
  echo "✅ .env создан"
fi

cd ..

# Frontend
echo ""
echo "📦 Настройка Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Установка зависимостей frontend..."
  npm install
fi

# Проверка .env.local
if [ ! -f ".env.local" ]; then
  echo "Создание .env.local для frontend..."
  echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local
  echo "✅ .env.local создан"
fi

cd ..

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ ЛОКАЛЬНОЕ ОКРУЖЕНИЕ ГОТОВО!                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Для запуска:"
echo ""
echo "1. Запустите PostgreSQL (если не запущен)"
echo "2. В первом терминале (Backend):"
echo "   cd backend && npm run start:dev"
echo ""
echo "3. Во втором терминале (Frontend):"
echo "   cd frontend && PORT=3001 npm run dev"
echo ""
echo "📍 Доступ:"
echo "   Frontend: http://localhost:3001"
echo "   Backend: http://localhost:3000/api"
echo "   Swagger: http://localhost:3000/api-docs"
echo ""

