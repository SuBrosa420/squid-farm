# Squid Farm - TON Blockchain Game

Игра-ферма кальмаров на блокчейне TON с интеграцией TON Connect для кошельков.

## Возможности

- 🦑 Разведение кальмаров
- 💰 Пополнение баланса через TON транзакции
- 🔗 Подключение кошелька TON Connect
- 📱 Адаптивный дизайн
- 🎮 Игровая механика с производством яиц

## Технологии

- **Frontend**: Vue.js, Vite
- **Backend**: Node.js, Express, SQLite
- **Blockchain**: TON Connect, TON SDK
- **UI**: Современный адаптивный дизайн

## Установка

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/squid-farm.git
cd squid-farm
```

2. Установите зависимости:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Запустите серверы:
```bash
# Backend (в одном терминале)
cd backend
npm start

# Frontend (в другом терминале)
cd frontend
npm run dev
```

### Деплой на хостинг

1. Загрузите файлы на сервер
2. Установите зависимости:
```bash
cd backend
npm install
```
3. Настройте SSL сертификат
4. Обновите манифест TON Connect с вашим доменом

## API Endpoints

- `GET /api/health` - Проверка здоровья сервера
- `POST /api/user` - Создание/получение пользователя
- `POST /api/claim` - Сбор яиц
- `POST /api/hatch` - Вылупление кальмаров
- `POST /api/sell` - Продажа кальмаров
- `POST /api/withdraw` - Вывод TON
- `POST /api/deposit` - Пополнение баланса

## TON Connect

Проект использует TON Connect для интеграции с кошельками TON. Каждый пользователь получает уникальный мемо-код для пополнения баланса.

## Лицензия

MIT License
