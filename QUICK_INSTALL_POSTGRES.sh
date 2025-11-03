#!/bin/bash

# Скрипт для быстрой установки PostgreSQL
# Выполните в терминале: ./QUICK_INSTALL_POSTGRES.sh

set -e

echo "🔧 Установка PostgreSQL через Homebrew..."

# Исправление прав (потребуется пароль)
echo "🔐 Исправление прав доступа (потребуется ввод пароля)..."
sudo chown -R $(whoami) /usr/local/share/zsh /usr/local/share/zsh/site-functions
chmod u+w /usr/local/share/zsh /usr/local/share/zsh/site-functions

# Установка PostgreSQL
echo "📦 Установка PostgreSQL 15..."
brew install postgresql@15

# Запуск службы
echo "🚀 Запуск PostgreSQL..."
brew services start postgresql@15

# Добавление в PATH
echo "⚙️ Настройка PATH..."
if ! grep -q 'postgresql@15/bin' ~/.zshrc 2>/dev/null; then
    echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
fi
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

# Ожидание запуска PostgreSQL
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 5

# Создание пользователя
echo "👤 Создание пользователя saas_user..."
createuser -s saas_user 2>/dev/null || echo "Пользователь уже существует"

# Создание базы данных
echo "🗄️ Создание базы данных saas_db..."
createdb -O saas_user saas_db 2>/dev/null || echo "База данных уже существует"

# Установка пароля
echo "🔑 Установка пароля..."
psql -U saas_user -d saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';" 2>/dev/null || echo "Пароль уже установлен"

echo ""
echo "✅ PostgreSQL успешно установлен и настроен!"
echo ""
echo "📊 Проверка подключения:"
psql -U saas_user -d saas_db -c "SELECT version();" 2>/dev/null | head -3

echo ""
echo "🎯 Следующие шаги:"
echo "   cd backend"
echo "   npx prisma migrate dev"
echo "   npm run start:dev"
echo ""

