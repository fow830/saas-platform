# Инструкция по установке Node.js на macOS

## Ситуация

На вашей системе отсутствуют Xcode Command Line Tools, которые необходимы для установки Node.js через nvm.

## Варианты установки

### Вариант 1: Установка через официальный установщик (РЕКОМЕНДУЕТСЯ)

Самый простой способ - скачать готовый установщик:

1. **Откройте браузер** и перейдите на:
   ```
   https://nodejs.org/
   ```

2. **Скачайте LTS версию** (Long Term Support) - рекомендуется
   - Нажмите кнопку "Download LTS"
   - Выберите версию для macOS (.pkg файл)

3. **Запустите установщик**:
   - Откройте скачанный .pkg файл
   - Следуйте инструкциям установщика
   - Примите лицензию и завершите установку

4. **Проверьте установку**:
   ```bash
   node --version
   npm --version
   ```

### Вариант 2: Установка через Homebrew

1. **Установите Homebrew** (если еще не установлен):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Установите Node.js**:
   ```bash
   brew install node
   ```

### Вариант 3: Установка через nvm (после установки Command Line Tools)

1. **Установите Xcode Command Line Tools**:
   - Откройте Terminal
   - Выполните: `xcode-select --install`
   - Следуйте инструкциям в открывшемся окне
   - Дождитесь завершения установки (может занять 10-15 минут)

2. **Установите nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

3. **Перезагрузите терминал** или выполните:
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

4. **Установите Node.js 18**:
   ```bash
   nvm install 18
   nvm use 18
   nvm alias default 18
   ```

5. **Проверьте установку**:
   ```bash
   node --version
   npm --version
   ```

## После установки Node.js

1. **Перейдите в директорию backend**:
   ```bash
   cd /Users/alex/Downloads/saas-platform/backend
   ```

2. **Установите зависимости**:
   ```bash
   npm install
   ```

3. **Сгенерируйте Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Запустите тесты**:
   ```bash
   npm test
   ```

## Проверка установки

После установки проверьте:

```bash
# Версия Node.js (должна быть 18.x.x или выше)
node --version

# Версия npm (должна быть 9.x.x или выше)
npm --version

# Проверка что nvm работает (если использовали nvm)
nvm --version
```

## Рекомендация

**Самый быстрый способ**: Скачайте официальный установщик с nodejs.org - это займет около 5 минут и не требует дополнительных инструментов.

После установки Node.js вы сразу сможете:
- Установить зависимости проекта: `npm install`
- Запустить тесты: `npm test`
- Разрабатывать проект локально

