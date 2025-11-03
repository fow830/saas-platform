#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ НА STAGING                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker не установлен"
  echo ""
  echo "Установите Docker:"
  echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
  echo "  Linux: https://docs.docker.com/engine/install/"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "❌ Docker Compose не установлен"
  exit 1
fi

# Используем docker compose (новая версия) или docker-compose (старая)
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
fi

echo "✅ Docker установлен"
echo ""

# Проверка .env.staging
if [ ! -f ".env.staging" ]; then
  echo "📝 Создание .env.staging из примера..."
  if [ -f ".env.staging.example" ]; then
    cp .env.staging.example .env.staging
    echo "✅ Файл .env.staging создан"
    echo ""
    echo "⚠️  ВАЖНО: Отредактируйте .env.staging и заполните все переменные!"
    echo "   Особенно важны:"
    echo "   - DB_PASSWORD (надежный пароль для БД)"
    echo "   - JWT_SECRET (случайная строка)"
    echo "   - APP_URL (URL вашего staging сервера)"
    echo "   - API_URL (URL API)"
    echo "   - NEXT_PUBLIC_API_URL (URL API для frontend)"
    echo ""
    read -p "Нажмите Enter после заполнения .env.staging или Ctrl+C для отмены..."
  else
    echo "❌ Файл .env.staging.example не найден"
    exit 1
  fi
fi

echo "✅ Файл .env.staging найден"
echo ""

# Генерация JWT_SECRET если не заполнен
if grep -q "JWT_SECRET=$" .env.staging || grep -q "^# JWT_SECRET=" .env.staging; then
  echo "🔐 Генерация JWT_SECRET..."
  JWT_SECRET=$(openssl rand -hex 32)
  if grep -q "^JWT_SECRET=" .env.staging; then
    sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.staging
  else
    echo "JWT_SECRET=$JWT_SECRET" >> .env.staging
  fi
  echo "✅ JWT_SECRET сгенерирован"
  echo ""
fi

# Генерация DB_PASSWORD если не заполнен
if grep -q "DB_PASSWORD=$" .env.staging || grep -q "^# DB_PASSWORD=" .env.staging; then
  echo "🔐 Генерация DB_PASSWORD..."
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
  if grep -q "^DB_PASSWORD=" .env.staging; then
    sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env.staging
  else
    echo "DB_PASSWORD=$DB_PASSWORD" >> .env.staging
  fi
  echo "✅ DB_PASSWORD сгенерирован"
  echo ""
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
$COMPOSE_CMD -f docker-compose.staging.yml down 2>/dev/null || true

# Сборка образов
echo "🔨 Сборка Docker образов..."
$COMPOSE_CMD -f docker-compose.staging.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
$COMPOSE_CMD -f docker-compose.staging.yml up -d

# Ожидание готовности базы данных
echo "⏳ Ожидание готовности базы данных..."
for i in {1..30}; do
  if $COMPOSE_CMD -f docker-compose.staging.yml exec -T postgres pg_isready -U saas_staging_user &> /dev/null; then
    echo "✅ База данных готова"
    break
  fi
  sleep 2
done

# Применение миграций
echo "📊 Применение миграций базы данных..."
$COMPOSE_CMD -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy || \
$COMPOSE_CMD -f docker-compose.staging.yml exec -T backend npx prisma migrate dev --name staging_init || true

# Генерация Prisma Client
echo "⚙️  Генерация Prisma Client..."
$COMPOSE_CMD -f docker-compose.staging.yml exec -T backend npx prisma generate || true

# Создание тестового администратора
echo "👤 Создание тестового администратора..."
$COMPOSE_CMD -f docker-compose.staging.yml exec -T backend node create-test-user.js || true

# Проверка статуса
echo ""
echo "📋 Статус контейнеров:"
$COMPOSE_CMD -f docker-compose.staging.yml ps

# Проверка health checks
echo ""
echo "🏥 Проверка health checks..."
sleep 10

# Проверка backend
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ Backend health check пройден"
else
  echo "⚠️  Backend health check не пройден - проверьте логи:"
  echo "   $COMPOSE_CMD -f docker-compose.staging.yml logs backend"
fi

# Проверка frontend
if curl -f http://localhost:3001 > /dev/null 2>&1; then
  echo "✅ Frontend health check пройден"
else
  echo "⚠️  Frontend health check не пройден - проверьте логи:"
  echo "   $COMPOSE_CMD -f docker-compose.staging.yml logs frontend"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🎉 ДЕПЛОЙ НА STAGING ЗАВЕРШЕН!                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Доступные сервисы:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔌 Backend API: http://localhost:3000/api"
echo "   📚 Swagger: http://localhost:3000/api-docs"
echo "   💚 Health: http://localhost:3000/api/health"
echo ""
echo "👤 Тестовый администратор:"
echo "   Email: admin@example.com"
echo "   Пароль: admin123456"
echo ""
echo "📊 Просмотр логов:"
echo "   $COMPOSE_CMD -f docker-compose.staging.yml logs -f"
echo ""
echo "🛑 Остановка:"
echo "   $COMPOSE_CMD -f docker-compose.staging.yml down"
echo ""

