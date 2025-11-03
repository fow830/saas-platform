# Инструкция по загрузке на GitHub

## ✅ Шаг 1: Создайте репозиторий на GitHub

1. Откройте в браузере: **https://github.com/new**
2. Заполните форму:
   - **Repository name:** `saas-platform`
   - **Description:** `SaaS Platform with modern admin dashboard`
   - **Visibility:** Выберите **Private** или **Public**
   - ❌ **НЕ** ставьте галочки на:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
3. Нажмите кнопку **"Create repository"**

## ✅ Шаг 2: Выберите способ аутентификации

### Способ A: Personal Access Token (рекомендуется)

1. Создайте токен:
   - Перейдите: https://github.com/settings/tokens
   - Нажмите **"Generate new token"** → **"Generate new token (classic)"**
   - Название: `saas-platform-deploy`
   - Срок действия: **No expiration** (или выберите срок)
   - Права: отметьте **`repo`** (полный доступ к репозиториям)
   - Нажмите **"Generate token"**
   - **Скопируйте токен** (он показывается только один раз!)

2. Выполните команды:
   ```bash
   cd /Users/alex/Downloads/saas-platform
   
   # Git запросит username и password
   # Username: fow830
   # Password: вставьте токен (не ваш пароль!)
   git push -u origin main
   ```

### Способ B: GitHub CLI (gh)

```bash
# Установите GitHub CLI (если не установлен)
brew install gh

# Авторизуйтесь
gh auth login

# Создайте репозиторий автоматически
gh repo create saas-platform --private --source=. --remote=origin --push
```

### Способ C: SSH ключ

1. Проверьте наличие SSH ключа:
   ```bash
   ls -la ~/.ssh/id_rsa.pub
   ```

2. Если нет - создайте:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. Добавьте ключ на GitHub:
   - Скопируйте ключ: `cat ~/.ssh/id_rsa.pub | pbcopy`
   - Перейдите: https://github.com/settings/keys
   - Нажмите **"New SSH key"**
   - Вставьте ключ и сохраните

4. Измените remote на SSH:
   ```bash
   cd /Users/alex/Downloads/saas-platform
   git remote set-url origin git@github.com:fow830/saas-platform.git
   git push -u origin main
   ```

## ✅ Шаг 3: Создайте ветку staging

После успешной отправки main ветки:

```bash
cd /Users/alex/Downloads/saas-platform
git checkout -b staging
git push -u origin staging
```

## 🔍 Проверка

После выполнения команд проверьте:
- https://github.com/fow830/saas-platform
- Должны быть видны все файлы проекта
- Должна быть ветка `main` и `staging`

