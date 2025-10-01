const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, '..', 'squid_farm.db');

// Создаем соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Создаем таблицы
db.serialize(() => {
  // Таблица пользователей
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    eggs DECIMAL(15,2) DEFAULT 0,
    squid_count INTEGER DEFAULT 0,
    ton_balance DECIMAL(15,6) DEFAULT 0,
    claimed_free_eggs BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists.');
    }
  });

  // Таблица для отслеживания производства яиц
  db.run(`CREATE TABLE IF NOT EXISTS egg_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    last_calculation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating egg_production table:', err.message);
    } else {
      console.log('Egg production table created or already exists.');
    }
  });

  // Проверяем структуру таблиц
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err.message);
    } else {
      console.log('Database tables:', tables.map(t => t.name));
    }
  });
});

// Закрываем соединение
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database initialization completed.');
  }
});