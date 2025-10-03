# Руководство по деплою Squid Farm

## Подготовка к деплою

### 1. Обновите манифест для продакшена

Отредактируйте файл `frontend/public/tonconnect-manifest-production.json` и замените `your-domain.com` на ваш реальный домен:

```json
{
  "url": "https://ваш-домен.com",
  "name": "Squid Farm",
  "iconUrl": "https://ваш-домен.com/favicon.ico",
  "termsOfUseUrl": "https://ваш-домен.com/terms",
  "privacyPolicyUrl": "https://ваш-домен.com/privacy"
}
```

### 2. Соберите фронтенд для продакшена

```bash
cd frontend
npm run build
```

### 3. Настройте бэкенд для продакшена

В файле `backend/server.js` обновите CORS настройки:

```javascript
app.use(cors({
  origin: ['https://ваш-домен.com', 'http://localhost:5173'],
  credentials: true
}));
```

## Варианты хостинга

### Вариант 1: Vercel (рекомендуется)

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Настройте:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Вариант 2: Netlify

1. Зарегистрируйтесь на [netlify.com](https://netlify.com)
2. Подключите ваш GitHub репозиторий
3. Настройте:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Вариант 3: GitHub Pages

1. Создайте файл `frontend/.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm install
        
    - name: Build
      run: |
        cd frontend
        npm run build
        
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/dist
```

## Настройка бэкенда

### Вариант 1: Railway

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Подключите ваш GitHub репозиторий
3. Выберите папку `backend`
4. Railway автоматически определит Node.js проект

### Вариант 2: Heroku

1. Создайте файл `backend/Procfile`:
```
web: node server.js
```

2. Зарегистрируйтесь на [heroku.com](https://heroku.com)
3. Создайте новое приложение
4. Подключите GitHub репозиторий
5. Выберите папку `backend`

### Вариант 3: VPS/Сервер

1. Загрузите код на сервер
2. Установите Node.js
3. Установите зависимости:
```bash
cd backend
npm install
```

4. Запустите с PM2:
```bash
npm install -g pm2
pm2 start server.js --name "squid-farm-backend"
pm2 startup
pm2 save
```

## Настройка домена

1. Купите домен (например, на Namecheap, GoDaddy)
2. Настройте DNS записи:
   - A запись: `@` → IP адрес сервера
   - CNAME запись: `www` → ваш-домен.com

## SSL сертификат

Большинство хостингов (Vercel, Netlify, Railway) автоматически предоставляют SSL сертификаты.

## Проверка после деплоя

1. Откройте ваш сайт в браузере
2. Проверьте, что TON Connect работает
3. Попробуйте подключить кошелек
4. Проверьте, что транзакции проходят

## Полезные команды

```bash
# Сборка фронтенда
cd frontend && npm run build

# Запуск бэкенда локально
cd backend && npm start

# Проверка статуса
curl https://ваш-домен.com/api/health
```
