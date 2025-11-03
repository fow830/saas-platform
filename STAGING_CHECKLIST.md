# Чеклист развертывания на Staging

## Перед развертыванием

### ✅ Подготовка файлов
- [ ] Создан `.env.staging` на основе `.env.staging.example`
- [ ] Все переменные окружения заполнены
- [ ] Проверены критические секреты (JWT_SECRET, DB_PASSWORD)

### ✅ Переменные окружения

#### Обязательные:
- [ ] `JWT_SECRET` - случайная строка минимум 32 символа
- [ ] `DB_PASSWORD` - надежный пароль для БД
- [ ] `APP_URL` - URL приложения (например, http://localhost или https://staging.example.com)
- [ ] `API_URL` - URL API
- [ ] `NEXT_PUBLIC_API_URL` - публичный URL API для frontend

#### Опциональные (для полной функциональности):
- [ ] YooKassa credentials (для платежей)
- [ ] CloudPayments credentials (для платежей)
- [ ] Robokassa credentials (для платежей)
- [ ] SMTP настройки (для email)

### ✅ Проверка зависимостей
- [ ] Docker установлен и запущен
- [ ] Docker Compose установлен
- [ ] Порты 3000, 3001, 5432, 6379 свободны (или изменены в .env.staging)

## Развертывание

### ✅ Запуск
- [ ] Выполнен `./deploy-staging.sh` или команды вручную
- [ ] Контейнеры запущены (`docker-compose -f docker-compose.staging.yml ps`)
- [ ] Все контейнеры в статусе "Up" и "healthy"

### ✅ База данных
- [ ] Миграции применены (`npx prisma migrate deploy`)
- [ ] Prisma Client сгенерирован (`npx prisma generate`)
- [ ] Тестовые данные загружены (опционально, `npm run seed`)

## Проверка после развертывания

### ✅ Health Checks
- [ ] Backend health: `curl http://localhost:3000/api/health`
- [ ] Frontend доступен: `curl http://localhost:3001`
- [ ] Nginx проксирует запросы: `curl http://localhost/api/health`

### ✅ API Endpoints
- [ ] Swagger доступен: http://localhost:3000/api-docs
- [ ] Регистрация работает: `POST /api/auth/register`
- [ ] Авторизация работает: `POST /api/auth/login`
- [ ] Получение планов: `GET /api/plans`

### ✅ Frontend
- [ ] Главная страница загружается
- [ ] Страница регистрации работает
- [ ] Страница входа работает
- [ ] Dashboard доступен после авторизации

### ✅ База данных
- [ ] Подключение к БД работает
- [ ] Можно выполнить запросы через Prisma
- [ ] Миграции применены корректно

## Безопасность

### ✅ Проверки безопасности
- [ ] JWT_SECRET установлен и не является дефолтным
- [ ] DB_PASSWORD установлен и надежный
- [ ] `.env.staging` не закоммичен в git (должен быть в .gitignore)
- [ ] SSL сертификаты настроены (если используется HTTPS)
- [ ] Rate limiting работает (проверить через nginx)

## Мониторинг

### ✅ Логи
- [ ] Логи backend проверены: `docker-compose -f docker-compose.staging.yml logs backend`
- [ ] Логи frontend проверены: `docker-compose -f docker-compose.staging.yml logs frontend`
- [ ] Логи nginx проверены: `docker-compose -f docker-compose.staging.yml logs nginx`
- [ ] Нет критических ошибок в логах

### ✅ Ресурсы
- [ ] Использование памяти в норме: `docker stats`
- [ ] Использование CPU в норме
- [ ] Дисковое пространство достаточно

## Функциональное тестирование

### ✅ Основные функции
- [ ] Регистрация нового пользователя
- [ ] Вход в систему
- [ ] Просмотр планов подписки
- [ ] Создание подписки
- [ ] Просмотр услуг
- [ ] Использование услуги
- [ ] Просмотр аналитики

### ✅ Платежи (если настроены)
- [ ] Создание платежа через YooKassa
- [ ] Создание платежа через CloudPayments
- [ ] Создание платежа через Robokassa
- [ ] Обработка webhooks

## После развертывания

### ✅ Документация
- [ ] URL приложения задокументирован
- [ ] Учетные данные для тестирования созданы и задокументированы
- [ ] Команда проинформирована о развертывании

### ✅ Резервное копирование
- [ ] Настроено автоматическое резервное копирование БД (если нужно)
- [ ] Проверена процедура восстановления из бэкапа

## Устранение неполадок

Если что-то не работает:
1. Проверьте логи: `docker-compose -f docker-compose.staging.yml logs -f`
2. Проверьте статус контейнеров: `docker-compose -f docker-compose.staging.yml ps`
3. Проверьте health checks: `curl http://localhost:3000/api/health`
4. Проверьте переменные окружения: `docker-compose -f docker-compose.staging.yml config`
5. Смотрите раздел Troubleshooting в `DEPLOY_STAGING.md`

