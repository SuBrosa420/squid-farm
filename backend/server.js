const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://web.telegram.org',
    'https://t.me'
  ],
  credentials: true
}));
app.use(express.json());

// Инициализация базы данных
const dbPath = path.join(__dirname, 'squid_farm.db');
const db = new sqlite3.Database(dbPath);

// Создаем таблицы если их нет
db.serialize(() => {
  console.log('🗃️ Creating database tables...');
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    eggs DECIMAL(15,2) DEFAULT 0,
    squid_count INTEGER DEFAULT 0,
    ton_balance DECIMAL(15,6) DEFAULT 0,
    claimed_free_eggs BOOLEAN DEFAULT FALSE,
    last_production_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table created successfully');
    }
  });
});

// Простая функция для получения пользователя
function getSimpleUser(telegramId, callback) {
  db.get(
    'SELECT * FROM users WHERE telegram_id = ?', 
    [telegramId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        callback(null, err);
      } else {
        callback(user, null);
      }
    }
  );
}

// Функция для создания нового пользователя
function createUser(telegramId, callback) {
  console.log(`👤 Creating new user: ${telegramId}`);
  db.run(
    'INSERT INTO users (telegram_id) VALUES (?)',
    [telegramId],
    function(err) {
      if (err) {
        console.error('Error creating user:', err);
        callback(null, err);
      } else {
        console.log(`✅ User created with ID: ${this.lastID}`);
        getSimpleUser(telegramId, callback);
      }
    }
  );
}

// Функция для обновления производства яиц
function updateEggProduction(userId, callback) {
  console.log(`🔄 Updating production for user ${userId}`);
  
  db.get(
    `SELECT eggs, squid_count, last_production_update, created_at 
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err || !user) {
        console.error('❌ Error fetching user for production:', err);
        return callback(0);
      }

      const now = new Date();
      const lastUpdate = new Date(user.last_production_update || user.created_at || now);
      const secondsPassed = Math.max(0, (now - lastUpdate) / 1000);
      
      let newEggs = parseFloat(user.eggs);
      let production = 0;
      
      if (secondsPassed > 0 && user.squid_count > 0) {
        // 40 яиц/час = 40/3600 = 0.011111 яиц/секунду за кальмара
        production = user.squid_count * 0.011111 * secondsPassed;
        newEggs += production;
        
        console.log(`🥚 Production: ${production.toFixed(4)} eggs`);
        
        // Обновляем в базе
        db.run(
          'UPDATE users SET eggs = ?, last_production_update = ? WHERE id = ?',
          [newEggs, now.toISOString(), userId],
          (updateErr) => {
            if (updateErr) {
              console.error('❌ Error updating eggs:', updateErr);
              callback(parseFloat(user.eggs));
            } else {
              console.log(`✅ Successfully updated eggs in database`);
              callback(newEggs);
            }
          }
        );
      } else {
        console.log('ℹ️ No production');
        callback(newEggs);
      }
    }
  );
}

// Маршруты API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Squid Farm API is running'
  });
});

// Получить данные пользователя
app.post('/api/user', (req, res) => {
  const { telegramId } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  console.log(`📥 GET /api/user for telegramId: ${telegramId}`);

  getSimpleUser(telegramId, (user, err) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      console.log('👤 User not found, creating new one');
      createUser(telegramId, (newUser, createErr) => {
        if (createErr) {
          return res.status(500).json({ error: 'Error creating user' });
        }
        res.json({
          success: true,
          eggs: parseFloat(newUser.eggs),
          squidCount: newUser.squid_count,
          tonBalance: parseFloat(newUser.ton_balance),
          claimedFreeEggs: Boolean(newUser.claimed_free_eggs)
        });
      });
    } else {
      // Обновляем производство
      updateEggProduction(user.id, (updatedEggs) => {
        // Получаем обновленные данные
        getSimpleUser(telegramId, (updatedUser, fetchErr) => {
          if (fetchErr || !updatedUser) {
            return res.status(500).json({ error: 'Error fetching updated user' });
          }
          
          res.json({
            success: true,
            eggs: parseFloat(updatedUser.eggs),
            squidCount: updatedUser.squid_count,
            tonBalance: parseFloat(updatedUser.ton_balance),
            claimedFreeEggs: Boolean(updatedUser.claimed_free_eggs)
          });
        });
      });
    }
  });
});

// Claim бесплатных кальмаров
app.post('/api/claim', (req, res) => {
  const { telegramId } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  console.log(`🎁 CLAIM for telegramId: ${telegramId}`);

  getSimpleUser(telegramId, (user, err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.claimed_free_eggs) {
      return res.status(400).json({ error: 'You have already claimed your free squids' });
    }

    // Проверяем количество пользователей
    db.get(
      'SELECT COUNT(*) as count FROM users WHERE claimed_free_eggs = 1',
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.count >= 1000) {
          return res.status(400).json({ error: 'Sorry, the free squids promotion has ended' });
        }

        // Дарим 30 кальмаров
        const freeSquids = 30;
        const newSquidCount = user.squid_count + freeSquids;
        const now = new Date().toISOString();
        
        db.run(
          'UPDATE users SET squid_count = ?, claimed_free_eggs = 1, last_production_update = ? WHERE id = ?',
          [newSquidCount, now, user.id],
          function(err) {
            if (err) {
              console.error('❌ Error claiming squids:', err);
              return res.status(500).json({ error: 'Error claiming squids' });
            }
            
            res.json({ 
              success: true, 
              newSquidCount: newSquidCount,
              message: `Successfully claimed ${freeSquids} squids! They will produce eggs automatically.`
            });
          }
        );
      }
    );
  });
});

// Вылупление кальмаров
app.post('/api/hatch', (req, res) => {
  const { telegramId, amount } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }
  
  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  console.log(`🐣 HATCH ${amount} squids for telegramId: ${telegramId}`);

  getSimpleUser(telegramId, (user, err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Сначала обновляем производство
    updateEggProduction(user.id, (currentEggs) => {
      const eggCost = amount * 100;

      if (currentEggs < eggCost) {
        return res.status(400).json({ 
          error: `Not enough eggs. You need ${eggCost} eggs, but have only ${Math.floor(currentEggs)}` 
        });
      }

      // Вылупляем кальмаров
      const newEggs = currentEggs - eggCost;
      const newSquidCount = user.squid_count + amount;
      const now = new Date().toISOString();
      
      db.run(
        'UPDATE users SET eggs = ?, squid_count = ?, last_production_update = ? WHERE id = ?',
        [newEggs, newSquidCount, now, user.id],
        function(err) {
          if (err) {
            console.error('❌ Error hatching squids:', err);
            return res.status(500).json({ error: 'Error hatching squids' });
          }
          
          res.json({ 
            success: true, 
            newEggs: newEggs,
            newSquidCount: newSquidCount,
            message: `Successfully hatched ${amount} squid(s)!`
          });
        }
      );
    });
  });
});

// Продажа яиц
app.post('/api/sell', (req, res) => {
  const { telegramId, amount } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }
  
  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  console.log(`💰 SELL ${amount} batches for telegramId: ${telegramId}`);

  getSimpleUser(telegramId, (user, err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Сначала обновляем производство
    updateEggProduction(user.id, (currentEggs) => {
      const eggAmount = amount * 100;
      const tonReward = amount * 0.01;
      const now = new Date().toISOString();

      if (currentEggs < eggAmount) {
        return res.status(400).json({ 
          error: `Not enough eggs. You need ${eggAmount} eggs, but have only ${Math.floor(currentEggs)}` 
        });
      }

      // Продаем яйца
      const newEggs = currentEggs - eggAmount;
      const newTonBalance = parseFloat(user.ton_balance) + tonReward;
      
      db.run(
        'UPDATE users SET eggs = ?, ton_balance = ?, last_production_update = ? WHERE id = ?',
        [newEggs, newTonBalance, now, user.id],
        function(err) {
          if (err) {
            console.error('❌ Error selling eggs:', err);
            return res.status(500).json({ error: 'Error selling eggs' });
          }
          
          res.json({ 
            success: true, 
            newEggs: newEggs,
            newTonBalance: newTonBalance,
            message: `Successfully sold ${eggAmount} eggs for ${tonReward.toFixed(6)} TON!`
          });
        }
      );
    });
  });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Squid Farm API Server', 
    version: '1.0.0',
    status: 'running'
  });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🎉 Squid Farm backend server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  db.close();
  process.exit(0);
});