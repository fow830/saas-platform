#!/bin/bash

# Скрипт для развертывания на staging окружение
# Использование: ./deploy-staging.sh

set -e

echo "🚀 Начинаем развертывание на staging..."

# Проверка наличия .env.staging
if [ ! -f .env.staging ]; then
    echo "❌ Файл .env.staging не найден!"
    echo "📝 Создайте его на основе .env.staging.example:"
    echo "   cp .env.staging.example .env.staging"
    exit 1
fi

echo "✅ Файл .env.staging найден"

# Остановка существующих контейнеров
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose -f docker-compose.staging.yml down || true

# Сборка образов
echo "🔨 Собираем образы..."
docker-compose -f docker-compose.staging.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запускаем контейнеры..."
docker-compose -f docker-compose.staging.yml up -d

# Ожидание готовности базы данных
echo "⏳ Ожидаем готовности базы данных..."
sleep 10

# Применение миграций
echo "📊 Применяем миграции базы данных..."
docker-compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy || \
docker-compose -f docker-compose.staging.yml exec -T backend npx prisma migrate dev --name staging_init

# Генерация Prisma Client
echo "⚙️ Генерируем Prisma Client..."
docker-compose -f docker-compose.staging.yml exec -T backend npx prisma generate

# Заполнение тестовыми данными (опционально)
read -p "Заполнить базу тестовыми данными? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Заполняем базу тестовыми данными..."
    docker-compose -f docker-compose.staging.yml exec -T backend npm run seed
fi

# Проверка статуса
echo "📋 Проверяем статус контейнеров..."
docker-compose -f docker-compose.staging.yml ps

# Проверка health checks
echo "🏥 Проверяем health checks..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check пройден"
else
    echo "⚠️ Backend health check не пройден - проверьте логи"
fi

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "📍 Доступные сервисы:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:3000/api"
echo "   - Swagger: http://localhost:3000/api-docs"
echo "   - Health: http://localhost:3000/api/health"
echo ""
echo "📊 Просмотр логов:"
echo "   docker-compose -f docker-compose.staging.yml logs -f"
echo ""

