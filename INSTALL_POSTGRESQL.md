# Установка PostgreSQL на macOS

## Текущая ситуация

Homebrew установлен, но есть проблема с правами доступа в некоторых директориях.

## Вариант 1: Исправить права и установить через Homebrew (РЕКОМЕНДУЕТСЯ)

Откройте Terminal и выполните (потребуется ввод пароля):

```bash
# Исправление прав доступа
sudo chown -R $(whoami) /usr/local/share/zsh /usr/local/share/zsh/site-functions
chmod u+w /usr/local/share/zsh /usr/local/share/zsh/site-functions

# Установка PostgreSQL
brew install postgresql@15

# Запуск PostgreSQL
brew services start postgresql@15

# Добавление в PATH (добавьте в ~/.zshrc или ~/.bash_profile)
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Создание пользователя и базы данных
createuser -s saas_user
createdb -O saas_user saas_db
psql -U saas_user -d saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';"
```

## Вариант 2: Официальный установщик PostgreSQL

1. **Скачайте установщик:**
   - Перейдите на https://www.postgresql.org/download/macosx/
   - Скачайте PostgreSQL 15+ для macOS
   - Запустите установщик и следуйте инструкциям

2. **После установки:**
   ```bash
   # Создание пользователя (потребуется ввод пароля postgres)
   createuser -s saas_user
   
   # Создание базы данных
   createdb -O saas_user saas_db
   
   # Установка пароля
   psql -U saas_user -d saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';"
   ```

## Вариант 3: Использовать Docker только для PostgreSQL

Если Docker установлен:

```bash
# Запустить только PostgreSQL в Docker
docker run -d --name saas_postgres \
  -e POSTGRES_USER=saas_user \
  -e POSTGRES_PASSWORD=saas_password \
  -e POSTGRES_DB=saas_db \
  -p 5432:5432 \
  postgres:15-alpine

# Проверка
docker ps | grep postgres
```

## Проверка установки

После установки любым способом проверьте:

```bash
# Проверка версии
psql --version

# Проверка подключения
psql -U saas_user -d saas_db -c "SELECT version();"
```

## После установки PostgreSQL

1. **Примените миграции:**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. **Заполните тестовыми данными (опционально):**
   ```bash
   npm run seed
   ```

3. **Запустите backend:**
   ```bash
   npm run start:dev
   ```

4. **В другом терминале - запустите frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Быстрая команда для исправления прав (скопируйте и выполните в терминале)

```bash
sudo chown -R $(whoami) /usr/local/share/zsh /usr/local/share/zsh/site-functions && \
chmod u+w /usr/local/share/zsh /usr/local/share/zsh/site-functions && \
brew install postgresql@15 && \
brew services start postgresql@15 && \
export PATH="/usr/local/opt/postgresql@15/bin:$PATH" && \
createuser -s saas_user && \
createdb -O saas_user saas_db && \
psql -U saas_user -d saas_db -c "ALTER USER saas_user WITH PASSWORD 'saas_password';" && \
echo "✅ PostgreSQL установлен и настроен!"
```

