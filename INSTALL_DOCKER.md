# 🐳 Установка Docker для локального деплоя

## Вариант 1: Docker Desktop (рекомендуется)

### macOS

1. **Скачайте Docker Desktop:**
   - Перейдите: https://docs.docker.com/desktop/install/mac-install/
   - Скачайте версию для вашего процессора (Intel или Apple Silicon)

2. **Установите:**
   - Откройте скачанный `.dmg` файл
   - Перетащите Docker в папку Applications
   - Запустите Docker Desktop из Applications

3. **Проверьте установку:**
   ```bash
   docker --version
   docker-compose --version
   ```

### Через Homebrew (если версия macOS поддерживает):
```bash
brew install --cask docker
```

## Вариант 2: Локальная разработка без Docker

Если Docker не установлен, используйте локальную разработку:

```bash
cd /Users/alex/Downloads/saas-platform
./local-dev-setup.sh
```

Это запустит:
- Backend на Node.js (порт 3000)
- Frontend на Next.js (порт 3001)
- Требуется PostgreSQL (можно установить отдельно или через Docker только для БД)

## После установки Docker

1. **Запустите Docker Desktop**
2. **Выполните деплой:**
   ```bash
   cd /Users/alex/Downloads/saas-platform
   ./auto-deploy-staging.sh
   ```

## Проверка

После установки Docker:
```bash
docker ps
```

Должно показать список контейнеров (может быть пустым, это нормально).

