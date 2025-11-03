#!/bin/bash

echo "Проверка установки PostgreSQL..."

# Проверяем, установлен ли PostgreSQL через Homebrew
if [ -d "/usr/local/opt/postgresql@15" ]; then
    echo "✓ PostgreSQL@15 найден в /usr/local/opt/postgresql@15"
    export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
elif [ -d "/opt/homebrew/opt/postgresql@15" ]; then
    echo "✓ PostgreSQL@15 найден в /opt/homebrew/opt/postgresql@15"
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
else
    echo "✗ PostgreSQL не найден. Запустите: brew install postgresql@15"
    exit 1
fi

# Проверяем, запущен ли PostgreSQL
if lsof -i :5432 > /dev/null 2>&1; then
    echo "✓ PostgreSQL уже запущен на порту 5432"
else
    echo "Запускаю PostgreSQL..."
    if [ -d "/usr/local/opt/postgresql@15" ]; then
        brew services start postgresql@15 || /usr/local/opt/postgresql@15/bin/pg_ctl -D /usr/local/var/postgresql@15 start
    elif [ -d "/opt/homebrew/opt/postgresql@15" ]; then
        brew services start postgresql@15 || /opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /opt/homebrew/var/postgresql@15 start
    fi
    sleep 3
    
    if lsof -i :5432 > /dev/null 2>&1; then
        echo "✓ PostgreSQL успешно запущен"
    else
        echo "✗ Не удалось запустить PostgreSQL"
        exit 1
    fi
fi

# Проверяем/создаем базу данных и пользователя
echo "Проверяю базу данных..."

# Создаем пользователя если не существует (игнорируем ошибку если уже есть)
psql postgres -c "CREATE USER saas_user WITH PASSWORD 'saas_password';" 2>/dev/null || true
psql postgres -c "ALTER USER saas_user WITH SUPERUSER;" 2>/dev/null || true

# Создаем базу данных если не существует
psql postgres -c "CREATE DATABASE saas_db OWNER saas_user;" 2>/dev/null || true

# Проверяем подключение
if psql -U saas_user -d saas_db -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ База данных saas_db доступна"
    psql -U saas_user -d saas_db -c "SELECT version();" | head -3
else
    echo "✗ Не удалось подключиться к базе данных"
    exit 1
fi

echo ""
echo "✓ PostgreSQL готов к работе!"
echo ""
echo "Теперь можно запустить миграции:"
echo "  cd backend && npx prisma migrate dev"
echo ""

