# Руководство по деплою через FTP (ICPmanager)

## Подготовка файлов

### 1. Соберите фронтенд
```bash
cd frontend
npm run build
```

### 2. Подготовьте файлы для загрузки

Создайте структуру папок:
```
public_html/
├── index.html (из frontend/dist/)
├── assets/ (из frontend/dist/assets/)
├── favicon.ico
├── tonconnect-manifest-production.json
├── terms
├── privacy
└── backend/ (папка с бэкендом)
    ├── server.js
    ├── package.json
    ├── database.sqlite
    └── node_modules/ (после npm install)
```

## Настройка в ICPmanager

### 1. Создайте поддомен для API
- Зайдите в ICPmanager
- Создайте поддомен: `api.ваш-домен.com`
- Направьте его на папку `backend/`

### 2. Настройте SSL сертификат
- В ICPmanager найдите раздел "SSL"
- Включите SSL для основного домена и поддомена
- ICPmanager обычно предоставляет бесплатный Let's Encrypt

### 3. Настройте Node.js (если поддерживается)
- В ICPmanager найдите раздел "Node.js"
- Укажите:
  - **App Root**: `/backend`
  - **Startup File**: `server.js`
  - **Node.js Version**: 18.x

## Загрузка файлов через FTP

### 1. Получите FTP данные
В ICPmanager найдите:
- FTP хост (обычно `ftp.ваш-домен.com`)
- FTP пользователь
- FTP пароль
- Порт (обычно 21)

### 2. Используйте FTP клиент
Рекомендуемые клиенты:
- **FileZilla** (бесплатный)
- **WinSCP** (Windows)
- **Cyberduck** (Mac)

### 3. Загрузите файлы
1. Подключитесь к FTP
2. Перейдите в папку `public_html/`
3. Загрузите все файлы из `frontend/dist/`
4. Создайте папку `backend/` и загрузите туда файлы бэкенда

## Альтернативный способ - через веб-интерфейс ICPmanager

### 1. Файловый менеджер
- Зайдите в ICPmanager
- Найдите "Файловый менеджер" или "File Manager"
- Загрузите файлы через веб-интерфейс

### 2. Архивирование
- Создайте ZIP архив с файлами
- Загрузите через веб-интерфейс
- Распакуйте на сервере

## Настройка после загрузки

### 1. Обновите манифест
Отредактируйте `tonconnect-manifest-production.json`:
```json
{
  "url": "https://ваш-домен.com",
  "name": "Squid Farm",
  "iconUrl": "https://ваш-домен.com/favicon.ico",
  "termsOfUseUrl": "https://ваш-домен.com/terms",
  "privacyPolicyUrl": "https://ваш-домен.com/privacy"
}
```

### 2. Настройте CORS в бэкенде
В `backend/server.js` обновите:
```javascript
app.use(cors({
  origin: ['https://ваш-домен.com', 'http://localhost:5173'],
  credentials: true
}));
```

### 3. Установите зависимости Node.js
Если у вас есть доступ к терминалу в ICPmanager:
```bash
cd backend
npm install
```

## Проверка работы

### 1. Проверьте фронтенд
- Откройте `https://ваш-домен.com`
- Проверьте, что сайт загружается

### 2. Проверьте API
- Откройте `https://ваш-домен.com/api/health`
- Должен вернуться `{"status":"ok"}`

### 3. Проверьте TON Connect
- Попробуйте подключить кошелек
- Проверьте, что манифест загружается: `https://ваш-домен.com/tonconnect-manifest-production.json`

## Возможные проблемы

### 1. Node.js не поддерживается
Если хостинг не поддерживает Node.js:
- Используйте только статический фронтенд
- API разместите на другом хостинге (Railway, Heroku)

### 2. Проблемы с SSL
- Убедитесь, что SSL включен для всех доменов
- Проверьте, что манифест доступен по HTTPS

### 3. Проблемы с CORS
- Обновите настройки CORS в бэкенде
- Убедитесь, что домены указаны правильно

## Полезные команды для ICPmanager

Если есть доступ к терминалу:
```bash
# Проверка статуса Node.js
pm2 status

# Перезапуск приложения
pm2 restart server

# Просмотр логов
pm2 logs server

# Установка зависимостей
cd backend && npm install
```
