#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКИЙ ДЕПЛОЙ НА GITHUB               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Константы
GITHUB_USER="fow830"
REPO_NAME="saas-platform"
SSH_KEY_PATH="$HOME/.ssh/id_ed25519_saas"

echo "📋 Шаг 1: Проверка настроек..."
git remote set-url origin git@github.com:$GITHUB_USER/$REPO_NAME.git 2>/dev/null || true
git branch -M main 2>/dev/null || true

echo "✅ Remote настроен: $(git remote get-url origin)"
echo ""

echo "📋 Шаг 2: Проверка SSH ключа..."
if [ ! -f "$SSH_KEY_PATH" ]; then
  echo "❌ SSH ключ не найден. Создаю..."
  ssh-keygen -t ed25519 -C "saas-platform-deploy" -f "$SSH_KEY_PATH" -N "" -q
  ssh-add "$SSH_KEY_PATH" 2>/dev/null || true
  echo "✅ SSH ключ создан"
else
  echo "✅ SSH ключ найден"
  ssh-add "$SSH_KEY_PATH" 2>/dev/null || true
fi

PUBLIC_KEY=$(cat "$SSH_KEY_PATH.pub")
echo ""

echo "📋 Шаг 3: Попытка автоматического добавления SSH ключа на GitHub..."
if command -v gh &> /dev/null; then
  if gh auth status &> /dev/null; then
    echo "✅ GitHub CLI авторизован, добавляю ключ..."
    if gh ssh-key add "$SSH_KEY_PATH.pub" --title "saas-platform-auto-$(date +%s)" &> /dev/null; then
      echo "✅ SSH ключ добавлен на GitHub через GitHub CLI"
      SSH_ADDED=true
    else
      echo "⚠️  Не удалось добавить через GitHub CLI"
      SSH_ADDED=false
    fi
  else
    echo "⚠️  GitHub CLI не авторизован"
    SSH_ADDED=false
  fi
else
  echo "⚠️  GitHub CLI не установлен"
  SSH_ADDED=false
fi

echo ""

if [ "$SSH_ADDED" != "true" ]; then
  echo "📋 Шаг 4: Ручное добавление SSH ключа"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Для автоматического деплоя нужно добавить SSH ключ на GitHub:"
  echo ""
  echo "1. Откройте в браузере:"
  echo "   👉 https://github.com/settings/keys"
  echo ""
  echo "2. Нажмите 'New SSH key'"
  echo ""
  echo "3. Заполните:"
  echo "   Title: saas-platform-auto"
  echo "   Key type: Authentication Key"
  echo "   Key: (скопируйте ключ ниже)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$PUBLIC_KEY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "4. Нажмите 'Add SSH key'"
  echo ""
  read -p "После добавления SSH ключа нажмите Enter для продолжения..."
  echo ""
fi

echo "📋 Шаг 5: Проверка существования репозитория..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "✅ SSH подключение работает"
  
  echo ""
  echo "📋 Шаг 6: Создание репозитория (если не существует)..."
  
  # Пытаемся создать через GitHub CLI если доступно
  if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    if gh repo view "$GITHUB_USER/$REPO_NAME" &> /dev/null; then
      echo "✅ Репозиторий уже существует"
    else
      echo "📦 Создаю репозиторий..."
      gh repo create "$REPO_NAME" --private --source=. --remote=origin --description "SaaS Platform with modern admin dashboard" 2>&1 | grep -v "^✓" || true
      echo "✅ Репозиторий создан"
    fi
  else
    echo "⚠️  GitHub CLI не доступен, проверяю репозиторий вручную..."
    if git ls-remote origin &> /dev/null; then
      echo "✅ Репозиторий существует"
    else
      echo ""
      echo "❌ Репозиторий не найден. Создайте его:"
      echo "   👉 https://github.com/new"
      echo "   Название: $REPO_NAME"
      echo "   ❌ Не добавляйте README, .gitignore или лицензию"
      echo ""
      read -p "После создания репозитория нажмите Enter..."
    fi
  fi
  
  echo ""
  echo "📤 Шаг 7: Отправка кода на GitHub..."
  if git push -u origin main 2>&1; then
    echo "✅ Код успешно отправлен на GitHub!"
    
    echo ""
    echo "🌿 Шаг 8: Создание ветки staging..."
    git checkout -b staging 2>/dev/null || git checkout staging
    if git push -u origin staging 2>&1; then
      echo "✅ Ветка staging создана и отправлена!"
    else
      echo "⚠️  Ветка staging может уже существовать"
    fi
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  🎉 УСПЕХ! Проект загружен на GitHub                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📦 Репозиторий: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "🌿 Main: https://github.com/$GITHUB_USER/$REPO_NAME/tree/main"
    echo "🌿 Staging: https://github.com/$GITHUB_USER/$REPO_NAME/tree/staging"
    echo ""
  else
    echo "❌ Ошибка при отправке кода"
    exit 1
  fi
else
  echo "❌ SSH подключение не работает"
  echo ""
  echo "Убедитесь, что:"
  echo "1. SSH ключ добавлен на GitHub"
  echo "2. Репозиторий создан: https://github.com/new"
  echo ""
  exit 1
fi

