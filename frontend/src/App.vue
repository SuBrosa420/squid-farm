<template>
  <div id="app">
    <div class="container">
      <!-- Заголовок -->
      <header class="header">
        <h1>🦑 Squid Farm</h1>
        <p class="subtitle">Farm eggs and grow your squid army!</p>
      </header>

      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🥚</div>
          <div class="stat-info">
            <div class="stat-label">Eggs</div>
            <div class="stat-value">{{ Math.floor(eggs) }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🦑</div>
          <div class="stat-info">
            <div class="stat-label">Squids</div>
            <div class="stat-value">{{ squidCount }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💎</div>
          <div class="stat-info">
            <div class="stat-label">TON Balance</div>
            <div class="stat-value">{{ tonBalance.toFixed(6) }}</div>
          </div>
        </div>
      </div>

      <!-- Статус подключения -->
      <div v-if="connectionMessage" class="connection-status">
        {{ connectionMessage }}
      </div>

      <!-- Действия -->
      <div class="actions-section">
        <!-- Claim бесплатных яиц -->
        <div class="action-card">
          <h3>🎁 Free Starter Pack</h3>
          <p>Get 3000 eggs to start your farm! (First 1000 users only)</p>
          <button 
            @click="claimFreeEggs" 
            :disabled="claimedFreeEggs || isLoading"
            class="btn btn-success"
          >
            {{ claimedFreeEggs ? '✅ Already Claimed' : '🎁 Claim 3000 Eggs' }}
          </button>
        </div>

        <!-- Вылупление кальмаров -->
        <div class="action-card">
          <h3>🐣 Hatch Squids</h3>
          <p>100 eggs = 1 squid (produces 40 eggs/hour)</p>
          <div class="input-group">
            <input 
              v-model.number="hatchAmount" 
              type="number" 
              min="1" 
              :max="maxHatchAmount"
              class="input"
              :disabled="isLoading"
            >
            <button 
              @click="hatchSquids" 
              :disabled="!hatchAmount || hatchAmount < 1 || isLoading"
              class="btn btn-primary"
            >
              Hatch
            </button>
          </div>
          <div class="cost-info">
            Cost: {{ (hatchAmount * 100).toLocaleString() }} eggs
          </div>
        </div>

        <!-- Продажа яиц -->
        <div class="action-card">
          <h3>💰 Sell Eggs</h3>
          <p>100 eggs = 0.01 TON</p>
          <div class="input-group">
            <input 
              v-model.number="sellAmount" 
              type="number" 
              min="1" 
              :max="maxSellAmount"
              class="input"
              :disabled="isLoading"
            >
            <button 
              @click="sellEggs" 
              :disabled="!sellAmount || sellAmount < 1 || isLoading"
              class="btn btn-warning"
            >
              Sell
            </button>
          </div>
          <div class="cost-info">
            Reward: {{ (sellAmount * 0.01).toFixed(6) }} TON
          </div>
        </div>
      </div>

      <!-- Информация -->
<div class="info-section">
  <h3>📊 Farm Information</h3>
  <div class="info-grid">
    <div class="info-item">
      <span>Eggs per squid per hour:</span>
      <span>40</span>
    </div>
    <div class="info-item">
      <span>Eggs per squid per second:</span>
      <span>0.0111</span>
    </div>
    <div class="info-item">
      <span>Total eggs production rate:</span>
      <span>{{ productionPerSecond }} eggs/sec</span>
    </div>
    <div class="info-item">
      <span>Next egg production update:</span>
      <span>Every second</span>
    </div>
  </div>
</div>

      <!-- Уведомления -->
      <div v-if="notification.message" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner">⏳</div>
        <div>Loading...</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export default {
  name: 'App',
  data() {
    return {
      // Данные пользователя
      telegramId: null,
      eggs: 0,
      squidCount: 0,
      tonBalance: 0,
      claimedFreeEggs: false,
      
      // Ввод пользователя
      hatchAmount: 1,
      sellAmount: 1,
      
      // Состояние UI
      isLoading: false,
      connectionMessage: '🔄 Connecting...',
      
      // Уведомления
      notification: {
        message: '',
        type: 'info'
      },
      
      // Таймер
      updateTimer: null
    }
  },
  computed: {
  maxHatchAmount() {
    return Math.floor(this.eggs / 100);
  },
  maxSellAmount() {
    return Math.floor(this.eggs / 100);
  },
  // Добавляем вычисляемое свойство для производства в секунду
  productionPerSecond() {
    return (this.squidCount * 0.011111).toFixed(4);
  },
  productionPerMinute() {
    return (this.squidCount * 0.667).toFixed(2);
  }
},
async mounted() {
  console.log('🚀 App mounted - initializing...');
  
  // Инициализация Telegram
  this.initializeTelegram();
  
  // Загружаем данные пользователя
  await this.loadUserData();
  
  // Запускаем автоматическое обновление КАЖДУЮ СЕКУНДУ
  this.updateTimer = setInterval(() => {
    this.loadUserData();
  }, 1000); // 1000ms = 1 секунда
},
  beforeUnmount() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  },
  methods: {
    // Инициализация Telegram WebApp
    initializeTelegram() {
      if (window.Telegram?.WebApp) {
        console.log('📱 Telegram WebApp detected');
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        this.telegramId = tg.initDataUnsafe?.user?.id;
        console.log('👤 Telegram User ID:', this.telegramId);
      }
      
      if (!this.telegramId) {
        // Режим разработки
        this.telegramId = Math.floor(Math.random() * 1000000);
        console.log('💻 Development mode, test ID:', this.telegramId);
      }
    },
    
    // Простая загрузка данных пользователя
    async loadUserData() {
      if (!this.telegramId) return;
      
      try {
        const response = await axios.post(`${API_BASE}/user`, {
          telegramId: this.telegramId
        });
        
        this.eggs = response.data.eggs;
        this.squidCount = response.data.squidCount;
        this.tonBalance = response.data.tonBalance;
        this.claimedFreeEggs = response.data.claimedFreeEggs;
        
        this.connectionMessage = '✅ Connected';
        
      } catch (error) {
        console.error('Error loading user data:', error);
        this.connectionMessage = '❌ Disconnected - Backend not running?';
      }
    },
    
    // Claim бесплатных яиц
    async claimFreeEggs() {
      this.isLoading = true;
      try {
        const response = await axios.post(`${API_BASE}/claim`, {
          telegramId: this.telegramId
        });
        
        this.eggs = response.data.eggs;
        this.claimedFreeEggs = true;
        this.showNotification('🎉 Successfully claimed 3000 eggs!', 'success');
      } catch (error) {
        this.showNotification(error.response?.data?.error || 'Claim failed', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Вылупление кальмаров
    async hatchSquids() {
      if (!this.hatchAmount || this.hatchAmount < 1) return;
      
      this.isLoading = true;
      try {
        const response = await axios.post(`${API_BASE}/hatch`, {
          telegramId: this.telegramId,
          amount: this.hatchAmount
        });
        
        this.eggs = response.data.newEggs;
        this.squidCount = response.data.newSquidCount;
        this.hatchAmount = 1;
        this.showNotification(`✅ Hatched ${this.hatchAmount} squid(s)!`, 'success');
      } catch (error) {
        this.showNotification(error.response?.data?.error || 'Hatching failed', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Продажа яиц
    async sellEggs() {
      if (!this.sellAmount || this.sellAmount < 1) return;
      
      this.isLoading = true;
      try {
        const response = await axios.post(`${API_BASE}/sell`, {
          telegramId: this.telegramId,
          amount: this.sellAmount
        });
        
        this.eggs = response.data.newEggs;
        this.tonBalance = response.data.newTonBalance;
        this.sellAmount = 1;
        this.showNotification('💰 Eggs sold successfully!', 'success');
      } catch (error) {
        this.showNotification(error.response?.data?.error || 'Selling failed', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Показать уведомление
    showNotification(message, type = 'info') {
      this.notification = { message, type };
      setTimeout(() => {
        this.notification.message = '';
      }, 4000);
    }
  }
}
</script>

<style>
/* Стили остаются такими же как в предыдущей версии */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

#app {
  max-width: 400px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  border: 2px solid #e9ecef;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.action-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  border: 2px solid #e9ecef;
}

.action-card h3 {
  margin-bottom: 8px;
  color: #333;
  font-size: 16px;
}

.action-card p {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.input {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.cost-info {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.info-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

.info-section h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.connection-status {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.notification {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 500;
}

.notification.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.notification.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.notification.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #666;
}

.loading-spinner {
  font-size: 30px;
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  body {
    padding: 10px;
  }
  .container {
    padding: 15px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>