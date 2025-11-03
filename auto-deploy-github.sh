#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🚀 Автоматическая загрузка на GitHub"
echo ""

# Проверка Git
if ! command -v git &> /dev/null; then
  echo "❌ Git не установлен"
  exit 1
fi

# Проверка что мы в git репозитории
if [ ! -d ".git" ]; then
  echo "❌ Не найден .git каталог"
  exit 1
fi

echo "📋 Текущий статус:"
git status --short | head -5
echo ""

# Настройка remote
GITHUB_USER="fow830"
REPO_NAME="saas-platform"

if ! git remote get-url origin &> /dev/null; then
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
  echo "✅ Remote origin добавлен"
else
  CURRENT_URL=$(git remote get-url origin)
  if [[ ! "$CURRENT_URL" =~ "$GITHUB_USER/$REPO_NAME" ]]; then
    git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "✅ Remote origin обновлен"
  fi
fi

echo "🔗 Remote: $(git remote get-url origin)"
echo ""

# Переименовываем ветку в main если нужно
git branch -M main 2>/dev/null || true

echo "📤 Отправка кода на GitHub..."
echo ""
echo "⚠️  Git запросит авторизацию:"
echo "   Username: $GITHUB_USER"
echo "   Password: используйте Personal Access Token (НЕ ваш пароль!)"
echo ""
echo "💡 Если у вас нет токена, создайте его здесь:"
echo "   https://github.com/settings/tokens"
echo "   (нужны права 'repo')"
echo ""

# Пытаемся выполнить push
if git push -u origin main; then
  echo ""
  echo "✅ Код успешно отправлен на GitHub!"
  
  echo ""
  echo "🌿 Создание ветки staging..."
  git checkout -b staging 2>/dev/null || git checkout staging
  git push -u origin staging 2>/dev/null || echo "⚠️  Не удалось создать staging (может быть уже существует)"
  
  echo ""
  echo "🎉 Готово!"
  echo ""
  echo "📦 Репозиторий: https://github.com/$GITHUB_USER/$REPO_NAME"
  echo "🌿 Ветка main: https://github.com/$GITHUB_USER/$REPO_NAME/tree/main"
  echo "🌿 Ветка staging: https://github.com/$GITHUB_USER/$REPO_NAME/tree/staging"
else
  echo ""
  echo "❌ Ошибка при отправке на GitHub"
  echo ""
  echo "Возможные причины:"
  echo "1. Репозиторий не создан на GitHub"
  echo "   → Создайте здесь: https://github.com/new"
  echo "   → Название: $REPO_NAME"
  echo ""
  echo "2. Нет прав доступа"
  echo "   → Проверьте username: $GITHUB_USER"
  echo "   → Используйте Personal Access Token вместо пароля"
  echo ""
  echo "3. Репозиторий уже существует и не пустой"
  echo "   → Попробуйте: git push -u origin main --force"
  exit 1
fi

