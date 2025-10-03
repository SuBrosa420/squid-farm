# 🚀 Рабочий процесс разработки Squid Farm

## Быстрый старт

### 1. **Внесение изменений:**
```bash
# Редактируйте файлы в Cursor
# Тестируйте локально
npm run dev  # frontend
npm start    # backend
```

### 2. **Отправка на GitHub:**
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

### 3. **Деплой на сервер:**
```bash
# Автоматический деплой
./deploy.sh

# Или обновление с GitHub
./update-from-github.sh
```

## Детальное описание

### 🔧 Локальная разработка

1. **Запуск фронтенда:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Запуск бэкенда:**
   ```bash
   cd backend
   npm start
   ```

3. **Тестирование TON Connect:**
   - Откройте http://localhost:5173
   - Проверьте подключение кошелька
   - Протестируйте транзакции

### 📤 Отправка на GitHub

1. **Проверка изменений:**
   ```bash
   git status
   git diff
   ```

2. **Добавление файлов:**
   ```bash
   git add .
   # или конкретные файлы
   git add frontend/src/components/TonWallet.vue
   ```

3. **Коммит:**
   ```bash
   git commit -m "Fix TON Connect initialization"
   ```

4. **Отправка:**
   ```bash
   git push origin main
   ```

### 🚀 Деплой на сервер

#### Вариант 1: Автоматический деплой
```bash
./deploy.sh
```
**Что делает:**
- Собирает фронтенд
- Создает архив
- Загружает на сервер
- Устанавливает зависимости
- Запускает приложение

#### Вариант 2: Обновление с GitHub
```bash
./update-from-github.sh
```
**Что делает:**
- Останавливает приложение
- Обновляет код с GitHub
- Устанавливает зависимости
- Собирает фронтенд
- Запускает приложение

### 🔍 Проверка работы

1. **Проверка сайта:**
   - Откройте https://testdomenwork.online
   - Проверьте загрузку страницы

2. **Проверка API:**
   - https://testdomenwork.online/api/health
   - Должен вернуть `{"status":"ok"}`

3. **Проверка TON Connect:**
   - Попробуйте подключить кошелек
   - Проверьте манифест: https://testdomenwork.online/tonconnect-manifest-production.json

4. **Проверка логов:**
   ```bash
   ssh u3283310@server37.hosting.reg.ru 'tail -f /var/www/u3283310/data/www/testdomenwork.online/logs/app.log'
   ```

## 🛠 Полезные команды

### Локально:
```bash
# Сборка фронтенда
cd frontend && npm run build

# Запуск бэкенда
cd backend && npm start

# Проверка зависимостей
npm audit
npm update
```

### На сервере:
```bash
# Подключение к серверу
ssh u3283310@server37.hosting.reg.ru

# Переход в папку проекта
cd /var/www/u3283310/data/www/testdomenwork.online

# Просмотр логов
tail -f logs/app.log

# Перезапуск приложения
pkill -f "node server.js"
cd backend && nohup node server.js > ../logs/app.log 2>&1 &

# Проверка процессов
ps aux | grep node
```

## 🚨 Решение проблем

### Проблема: TON Connect не работает
1. Проверьте манифест: https://testdomenwork.online/tonconnect-manifest-production.json
2. Убедитесь, что SSL сертификат активен
3. Проверьте CORS настройки в backend/server.js

### Проблема: Сайт не загружается
1. Проверьте логи: `tail -f logs/app.log`
2. Убедитесь, что бэкенд запущен: `ps aux | grep node`
3. Проверьте настройки домена в ICPmanager

### Проблема: Ошибки при деплое
1. Проверьте подключение к серверу: `ssh u3283310@server37.hosting.reg.ru`
2. Убедитесь, что Node.js установлен: `node --version`
3. Проверьте права доступа к папкам

## 📋 Чек-лист перед деплоем

- [ ] Код протестирован локально
- [ ] TON Connect работает
- [ ] Все изменения закоммичены
- [ ] Код отправлен на GitHub
- [ ] SSL сертификат активен
- [ ] Домен настроен в ICPmanager

## 🎯 Рекомендации

1. **Всегда тестируйте локально** перед деплоем
2. **Используйте описательные коммиты** для истории изменений
3. **Проверяйте логи** после каждого деплоя
4. **Делайте бэкапы** перед крупными изменениями
5. **Мониторьте производительность** сайта
