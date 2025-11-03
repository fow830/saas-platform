# 📝 Добавление GitHub Actions Workflow

GitHub требует дополнительные права для создания workflow файлов через API.

## Вариант 1: Добавить workflow вручную

1. **Перейдите на GitHub:**
   https://github.com/fow830/saas-platform/tree/staging

2. **Создайте файл:**
   - Нажмите "Add file" → "Create new file"
   - Путь: `.github/workflows/deploy-staging.yml`
   - Скопируйте содержимое из файла `.github/workflows/deploy-staging.yml` в локальной версии

3. **Сохраните:**
   - Нажмите "Commit new file"
   - Ветка: `staging`

## Вариант 2: Обновить токен GitHub CLI

```bash
gh auth refresh -h github.com -s workflow
```

Затем повторите push:
```bash
git add .github/workflows/deploy-staging.yml
git commit -m "Add GitHub Actions workflow"
git push origin staging
```

## Вариант 3: Использовать Personal Access Token с правами workflow

1. Создайте токен: https://github.com/settings/tokens
2. Права: `workflow`
3. Используйте токен для push

## Текущий workflow файл

Файл `.github/workflows/deploy-staging.yml` уже создан локально и готов к использованию.

После добавления workflow на GitHub, он будет автоматически запускаться при каждом push в ветку `staging`.

