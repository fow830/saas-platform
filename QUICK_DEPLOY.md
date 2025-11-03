# Быстрый деплой на GitHub и Staging

## 🚀 Быстрая загрузка на GitHub

### 1. Создайте репозиторий на GitHub
- Перейдите: https://github.com/new
- Название: `saas-platform`
- Не добавляйте README, .gitignore или лицензию
- Нажмите "Create repository"

### 2. Выполните в терминале:

```bash
cd /Users/alex/Downloads/saas-platform

# Добавьте ваш GitHub username вместо YOUR_USERNAME
git remote add origin https://github.com/YOUR_USERNAME/saas-platform.git

# Отправьте код
git push -u origin main

# Создайте ветку staging
git checkout -b staging
git push -u origin staging
```

## 📦 Деплой на Staging сервер

### Вариант 1: Если у вас есть сервер с Docker

1. **Подключитесь к серверу:**
   ```bash
   ssh user@your-staging-server.com
   ```

2. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/saas-platform.git
   cd saas-platform
   git checkout staging
   ```

3. **Настройте переменные окружения:**
   ```bash
   cp .env.staging.example .env.staging
   nano .env.staging  # Заполните все переменные
   ```

4. **Запустите деплой:**
   ```bash
   docker-compose -f docker-compose.staging.yml build --no-cache
   docker-compose -f docker-compose.staging.yml up -d
   docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
   ```

### Вариант 2: Использование Vercel (для frontend) + Railway/Render (для backend)

#### Frontend на Vercel:
1. Перейдите: https://vercel.com
2. Import проект с GitHub
3. Настройте:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Environment Variables: `NEXT_PUBLIC_API_URL=https://your-backend-url/api`

#### Backend на Railway/Render:
1. Создайте проект на Railway.app или Render.com
2. Подключите GitHub репозиторий
3. Настройте:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables: скопируйте из `.env.staging.example`

### Вариант 3: Docker Hub + Ваш сервер

1. **Соберите образы:**
   ```bash
   docker build -t your-username/saas-backend:staging ./backend
   docker build -t your-username/saas-frontend:staging ./frontend
   ```

2. **Загрузите на Docker Hub:**
   ```bash
   docker push your-username/saas-backend:staging
   docker push your-username/saas-frontend:staging
   ```

3. **На сервере используйте образы из Docker Hub**

## ✅ Проверка деплоя

После деплоя проверьте:

```bash
# Health check backend
curl https://your-backend-url/api/health

# Health check frontend
curl https://your-frontend-url

# Swagger документация
curl https://your-backend-url/api-docs
```

## 🔄 Обновление staging

```bash
# На сервере
cd saas-platform
git pull origin staging
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

## 📝 Важные переменные окружения

Убедитесь, что заполнены:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT (сгенерируйте случайную строку)
- `NEXT_PUBLIC_API_URL` - URL вашего backend API (для frontend)
- `APP_URL` - URL вашего приложения

## 🆘 Если что-то пошло не так

1. **Проверьте логи:**
   ```bash
   docker-compose -f docker-compose.staging.yml logs
   ```

2. **Проверьте статус контейнеров:**
   ```bash
   docker-compose -f docker-compose.staging.yml ps
   ```

3. **Перезапустите сервисы:**
   ```bash
   docker-compose -f docker-compose.staging.yml restart
   ```

