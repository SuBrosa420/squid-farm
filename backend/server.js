const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для продакшена
app.use(cors({
  origin: [
    'https://web.telegram.org',
    'https://t.me',
    'http://localhost:5173' // Для разработки
  ],
  credentials: true
}));
app.use(express.json());

// Инициализация базы данных
const dbPath = path.join(__dirname, 'squid_farm.db');
const db = new sqlite3.Database(dbPath);

// СОЗДАЕМ ТАБЛИЦЫ С ПРАВИЛЬНОЙ СТРУКТУРОЙ
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

      console.log(`📊 User data: eggs=${user.eggs}, squids=${user.squid_count}, last_update=${user.last_production_update}`);
      
      const now = new Date();
      const lastUpdate = new Date(user.last_production_update || user.created_at || now);
      const secondsPassed = Math.max(0, (now - lastUpdate) / 1000);
      
      console.log(`⏰ Time passed: ${secondsPassed.toFixed(1)} seconds`);
      
      let newEggs = parseFloat(user.eggs);
      let production = 0;
      
      if (secondsPassed > 0 && user.squid_count > 0) {
        // 40 яиц/час = 40/3600 = 0.011111 яиц/секунду за кальмара
        production = user.squid_count * 0.011111 * secondsPassed;
        newEggs += production;
        
        console.log(`🥚 Production: ${production.toFixed(4)} eggs (${user.squid_count} squids × ${secondsPassed.toFixed(1)}s)`);
        console.log(`💰 New total: ${user.eggs} -> ${newEggs.toFixed(4)} eggs`);
        
        // Обновляем в базе ТОЛЬКО если есть производство
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
        console.log('ℹ️ No production: no squids or no time passed');
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

  console.log(`\n📥 GET /api/user for telegramId: ${telegramId}`);

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
        console.log(`✅ New user created, sending data`);
        res.json({
          success: true,
          eggs: parseFloat(newUser.eggs),
          squidCount: newUser.squid_count,
          tonBalance: parseFloat(newUser.ton_balance),
          claimedFreeEggs: Boolean(newUser.claimed_free_eggs)
        });
      });
    } else {
      console.log(`👤 Found existing user: ID=${user.id}, eggs=${user.eggs}, squids=${user.squid_count}`);
      
      // Обновляем производство
      updateEggProduction(user.id, (updatedEggs) => {
        // Получаем полные обновленные данные
        getSimpleUser(telegramId, (updatedUser, fetchErr) => {
          if (fetchErr || !updatedUser) {
            return res.status(500).json({ error: 'Error fetching updated user' });
          }
          
          console.log(`📤 Sending updated data: eggs=${updatedUser.eggs}, squids=${updatedUser.squid_count}`);
          
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

// Claim бесплатных яиц
app.post('/api/claim', (req, res) => {
  const { telegramId } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  console.log(`\n🎁 CLAIM for telegramId: ${telegramId}`);

  getSimpleUser(telegramId, (user, err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.claimed_free_eggs) {
      return res.status(400).json({ error: 'You have already claimed your free eggs' });
    }

    // Выдаем 3000 яиц
    const newEggs = parseFloat(user.eggs) + 3000;
    const now = new Date().toISOString();
    
    console.log(`💰 Giving 3000 eggs: ${user.eggs} -> ${newEggs}`);
    
    db.run(
      'UPDATE users SET eggs = ?, claimed_free_eggs = 1, last_production_update = ? WHERE id = ?',
      [newEggs, now, user.id],
      function(err) {
        if (err) {
          console.error('❌ Error claiming eggs:', err);
          return res.status(500).json({ error: 'Error claiming eggs' });
        }
        
        console.log(`✅ Successfully claimed 3000 eggs`);
        
        res.json({ 
          success: true, 
          eggs: newEggs,
          message: 'Successfully claimed 3000 eggs!'
        });
      }
    );
  });
});

// Вылупление кальмаров - ИСПРАВЛЕННАЯ ВЕРСИЯ
app.post('/api/hatch', (req, res) => {
  const { telegramId, amount } = req.body;
  
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }
  
  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  console.log(`\n🐣 HATCH ${amount} squids for telegramId: ${telegramId}`);

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

      console.log(`💳 Hatching check: ${currentEggs.toFixed(2)} eggs available, need ${eggCost} eggs`);

      if (currentEggs < eggCost) {
        console.log(`❌ Not enough eggs for hatching`);
        return res.status(400).json({ 
          error: `Not enough eggs. You need ${eggCost} eggs, but have only ${Math.floor(currentEggs)}` 
        });
      }

      // Вылупляем кальмаров
      const newEggs = currentEggs - eggCost;
      const newSquidCount = user.squid_count + amount;
      const now = new Date().toISOString();
      
      console.log(`✅ Hatching: eggs ${currentEggs.toFixed(2)} -> ${newEggs.toFixed(2)}, squids ${user.squid_count} -> ${newSquidCount}`);
      
      // ОБНОВЛЯЕМ С last_production_update чтобы сбросить таймер
      db.run(
        'UPDATE users SET eggs = ?, squid_count = ?, last_production_update = ? WHERE id = ?',
        [newEggs, newSquidCount, now, user.id],
        function(err) {
          if (err) {
            console.error('❌ Error hatching squids:', err);
            return res.status(500).json({ error: 'Error hatching squids' });
          }
          
          console.log(`🎉 Successfully hatched ${amount} squids`);
          
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

  console.log(`\n💰 SELL ${amount} batches for telegramId: ${telegramId}`);

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

      console.log(`💳 Selling check: ${currentEggs.toFixed(2)} eggs available, need ${eggAmount} eggs`);

      if (currentEggs < eggAmount) {
        console.log(`❌ Not enough eggs for selling`);
        return res.status(400).json({ 
          error: `Not enough eggs. You need ${eggAmount} eggs, but have only ${Math.floor(currentEggs)}` 
        });
      }

      // Продаем яйца
      const newEggs = currentEggs - eggAmount;
      const newTonBalance = parseFloat(user.ton_balance) + tonReward;
      
      console.log(`✅ Selling: eggs ${currentEggs.toFixed(2)} -> ${newEggs.toFixed(2)}, TON ${user.ton_balance} -> ${newTonBalance.toFixed(6)}`);
      
      // ОБНОВЛЯЕМ С last_production_update
      db.run(
        'UPDATE users SET eggs = ?, ton_balance = ?, last_production_update = ? WHERE id = ?',
        [newEggs, newTonBalance, now, user.id],
        function(err) {
          if (err) {
            console.error('❌ Error selling eggs:', err);
            return res.status(500).json({ error: 'Error selling eggs' });
          }
          
          console.log(`🎉 Successfully sold ${eggAmount} eggs for ${tonReward} TON`);
          
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
  console.log(`\n🎉 Squid Farm backend server running on http://localhost:${PORT}`);
  console.log(`🔧 Debug mode: Detailed logging enabled`);
  console.log(`🗃️ Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});