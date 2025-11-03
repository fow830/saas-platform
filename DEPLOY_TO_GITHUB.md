# Развертывание на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на https://github.com
2. Нажмите кнопку **"New repository"** (или **"+"** → **"New repository"**)
3. Заполните:
   - **Repository name:** `saas-platform` (или другое название)
   - **Description:** `SaaS Platform with modern admin dashboard`
   - **Visibility:** Выберите **Private** (для приватного репозитория) или **Public**
   - **НЕ** добавляйте README, .gitignore или лицензию (у нас уже есть)
4. Нажмите **"Create repository"**

## Шаг 2: Подключите локальный репозиторий к GitHub

После создания репозитория на GitHub, вы увидите инструкции. Выполните в терминале проекта:

```bash
cd /Users/alex/Downloads/saas-platform

# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/saas-platform.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/saas-platform.git

# Отправьте код на GitHub
git branch -M main
git push -u origin main
```

## Шаг 3: Настройте ветки для staging

```bash
# Создайте ветку staging
git checkout -b staging

# Отправьте staging ветку на GitHub
git push -u origin staging
```

## Шаг 4: Проверьте подключение

```bash
# Проверьте список remote репозиториев
git remote -v

# Должно показать:
# origin  https://github.com/YOUR_USERNAME/saas-platform.git (fetch)
# origin  https://github.com/YOUR_USERNAME/saas-platform.git (push)
```

## Дальнейшая работа с Git

### Создание нового коммита

```bash
# Добавить изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push origin main  # для основной ветки
git push origin staging  # для staging ветки
```

### Обновление с GitHub

```bash
# Получить изменения
git pull origin main
```

## Настройка GitHub Actions (опционально)

Для автоматического деплоя можно создать `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ staging ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          # Ваши команды деплоя
```

## Полезные команды

```bash
# Проверить статус
git status

# Посмотреть историю коммитов
git log --oneline

# Посмотреть различия
git diff

# Создать новую ветку
git checkout -b feature/название-функции

# Переключиться на ветку
git checkout main
git checkout staging
```

