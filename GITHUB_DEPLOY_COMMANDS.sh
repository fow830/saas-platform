#!/bin/bash
# Скрипт для быстрого деплоя на GitHub

echo "🚀 Деплой на GitHub"
echo ""

# Проверка, что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ Ошибка: Запустите скрипт из корневой директории проекта"
  exit 1
fi

# Проверка наличия git
if ! command -v git &> /dev/null; then
  echo "❌ Git не установлен"
  exit 1
fi

echo "📋 Текущий статус Git:"
git status --short | head -10
echo ""

read -p "Введите ваш GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ Username не может быть пустым"
  exit 1
fi

read -p "Название репозитория (по умолчанию: saas-platform): " REPO_NAME
REPO_NAME=${REPO_NAME:-saas-platform}

echo ""
echo "📝 Инструкции:"
echo "1. Создайте репозиторий на GitHub: https://github.com/new"
echo "   - Название: $REPO_NAME"
echo "   - НЕ добавляйте README, .gitignore или лицензию"
echo ""
read -p "После создания репозитория нажмите Enter..."

echo ""
echo "🔗 Подключение к GitHub..."

# Проверка, есть ли уже remote
if git remote get-url origin &> /dev/null; then
  echo "⚠️  Remote 'origin' уже существует"
  read -p "Заменить? (y/n): " REPLACE
  if [ "$REPLACE" = "y" ]; then
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
  fi
else
  git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo "✅ Remote добавлен: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo ""
echo "📤 Отправка кода на GitHub..."

# Переименовываем ветку в main если нужно
git branch -M main 2>/dev/null || true

# Отправляем код
if git push -u origin main; then
  echo "✅ Код отправлен на GitHub!"
  echo ""
  echo "🌿 Создание ветки staging..."
  git checkout -b staging 2>/dev/null || git checkout staging
  git push -u origin staging
  echo "✅ Ветка staging создана и отправлена!"
  echo ""
  echo "🎉 Готово! Репозиторий: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
  echo "❌ Ошибка при отправке на GitHub"
  echo "Проверьте:"
  echo "1. Репозиторий создан на GitHub"
  echo "2. У вас есть права для записи"
  echo "3. Интернет подключение"
  exit 1
fi
