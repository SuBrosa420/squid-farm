<template>
  <div class="wallet-section">
    <div class="wallet-card">
      <h3>🔗 TON Wallet</h3>
      
      <!-- Статус подключения -->
      <div v-if="!isConnected" class="wallet-status">
        <p>Connect your TON wallet to interact with the blockchain</p>
        <div id="ton-connect-button"></div>
        <button 
          @click="connectWallet" 
          :disabled="isConnecting"
          class="btn btn-wallet"
        >
          {{ isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet' }}
        </button>
      </div>
      
      <!-- Подключенный кошелек -->
      <div v-else class="wallet-connected">
        <div class="wallet-info">
          <div class="wallet-address">
            <span class="label">Address:</span>
            <span class="address">{{ formatAddress(account.address) }}</span>
          </div>
          <div class="wallet-balance">
            <span class="label">Balance:</span>
            <span class="balance">{{ formatBalance(account.balance) }} TON</span>
          </div>
        </div>
        
        <div class="wallet-actions">
          <button @click="depositBalance" class="btn btn-deposit">
            💰 Deposit 1 TON
          </button>
          <button @click="disconnectWallet" class="btn btn-disconnect">
            Disconnect
          </button>
        </div>
      </div>
      
      <!-- Ошибки -->
      <div v-if="error" class="wallet-error">
        {{ error }}
        <button @click="retryInitialization" class="btn-retry">
          🔄 Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { TonConnectUI } from '@tonconnect/ui';

export default {
  name: 'TonWallet',
  props: {
    userMemo: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      tonConnectUI: null,
      isConnected: false,
      isConnecting: false,
      account: null,
      error: null
    }
  },
  async mounted() {
    await this.initializeTonConnect();
  },
  methods: {
    async initializeTonConnect() {
      try {
        // Ждем, пока элемент будет доступен в DOM
        await this.$nextTick();
        
        // Проверяем, что элемент существует
        const buttonElement = document.getElementById('ton-connect-button');
        if (!buttonElement) {
          throw new Error('ton-connect-button element not found');
        }
        console.log('ton-connect-button element found:', buttonElement);
        
        // Инициализация TON Connect для продакшена
        console.log('Initializing TON Connect for production...');
        
        // Определяем URL манифеста в зависимости от окружения
        const isProduction = window.location.hostname !== 'localhost';
        const manifestUrl = isProduction 
          ? `${window.location.origin}/tonconnect-manifest-production.json`
          : 'https://ton-connect.github.io/demo-dapp-with-react/tonconnect-manifest.json';
        
        console.log('Using manifestUrl:', manifestUrl);
        
        this.tonConnectUI = new TonConnectUI({
          manifestUrl: manifestUrl,
          buttonRootId: 'ton-connect-button'
        });
        console.log('TON Connect initialized successfully');

        console.log('TON Connect UI initialized successfully');
        
        // Подписка на изменения состояния
        this.tonConnectUI.onStatusChange((wallet) => {
          console.log('TON Connect status changed:', wallet);
          
          if (wallet) {
            this.isConnected = true;
            this.account = {
              address: wallet.account.address,
              balance: wallet.account.balance || '0'
            };
            this.error = null;
            
            // Уведомляем родительский компонент
            this.$emit('wallet-connected', this.account);
          } else {
            this.isConnected = false;
            this.account = null;
            this.$emit('wallet-disconnected');
          }
        });

        // Проверяем, есть ли уже подключенный кошелек
        const wallet = this.tonConnectUI.wallet;
        if (wallet) {
          this.isConnected = true;
          this.account = {
            address: wallet.account.address,
            balance: wallet.account.balance || '0'
          };
          this.$emit('wallet-connected', this.account);
        }

      } catch (err) {
        console.error('TON Connect initialization error:', err);
        this.error = 'Failed to initialize TON Connect. Please refresh the page.';
        
        // Попробуем альтернативный способ инициализации
        try {
          console.log('Trying alternative TON Connect initialization with public manifest...');
          
          // Используем публичный манифест
          const publicManifestUrl = 'https://ton-connect.github.io/demo-dapp-with-react/tonconnect-manifest.json';
          
          this.tonConnectUI = new TonConnectUI({
            manifestUrl: publicManifestUrl,
            buttonRootId: 'ton-connect-button'
          });
          console.log('Alternative TON Connect initialization successful with public manifest');
          this.error = null;
        } catch (altErr) {
          console.error('Alternative initialization also failed:', altErr);
          this.error = 'TON Connect not available. Please check your network connection.';
        }
      }
    },

    async connectWallet() {
      this.isConnecting = true;
      this.error = null;
      
      try {
        if (!this.tonConnectUI) {
          throw new Error('TON Connect not initialized');
        }
        
        console.log('TON Connect UI instance:', this.tonConnectUI);
        console.log('Opening TON Connect modal...');
        
        // Проверяем доступные методы
        console.log('Available methods:', Object.getOwnPropertyNames(this.tonConnectUI));
        
        await this.tonConnectUI.openModal();
        console.log('TON Connect modal opened successfully');
      } catch (err) {
        console.error('Wallet connection error:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        this.error = 'Failed to connect wallet: ' + err.message;
      } finally {
        this.isConnecting = false;
      }
    },

    async disconnectWallet() {
      try {
        if (!this.tonConnectUI) {
          console.log('TON Connect not initialized, nothing to disconnect');
          return;
        }
        await this.tonConnectUI.disconnect();
      } catch (err) {
        console.error('Wallet disconnection error:', err);
        this.error = 'Failed to disconnect wallet';
      }
    },

    formatAddress(address) {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-6)}`;
    },

    formatBalance(balance) {
      if (!balance) return '0';
      const ton = parseFloat(balance) / 1000000000; // Convert from nanotons
      return ton.toFixed(2);
    },

    async depositBalance() {
      if (!this.tonConnectUI || !this.isConnected) {
        this.error = 'Wallet not connected';
        return;
      }

      if (!this.userMemo) {
        this.error = 'User memo not available';
        return;
      }

      try {
        // Адрес кошелька проекта (замените на ваш реальный адрес)
        const projectWalletAddress = 'EQD0vdSA_NedR9uvn89-F6awnYw6Qkci_G7FkSX91qQU-BI0';
        
        // Создаем транзакцию на 1 TON с мемо в комментарии
        const transaction = {
          messages: [
            {
              address: projectWalletAddress,
              amount: '1000000000', // 1 TON в nanotons
              payload: this.userMemo // Мемо-код пользователя
            }
          ]
        };

        // Отправляем транзакцию
        const result = await this.tonConnectUI.sendTransaction(transaction);
        
        console.log('Transaction sent:', result);
        this.$emit('deposit-initiated', {
          transaction: result,
          memo: this.userMemo,
          amount: 1
        });
        
        this.error = null;
        
      } catch (err) {
        console.error('Deposit error:', err);
        this.error = 'Failed to send deposit transaction';
      }
    },

    async retryInitialization() {
      this.error = null;
      this.tonConnectUI = null; // Сбрасываем предыдущую инициализацию
      await this.initializeTonConnect();
    }
  }
}
</script>

<style scoped>
.wallet-section {
  margin-bottom: 20px;
}

.wallet-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  border: 2px solid #e9ecef;
}

.wallet-card h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.wallet-status {
  text-align: center;
}

.wallet-status p {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.wallet-connected {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-address,
.wallet-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.label {
  color: #666;
  font-weight: 500;
}

.address {
  color: #333;
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.balance {
  color: #28a745;
  font-weight: bold;
}

.wallet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-wallet {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-wallet:hover:not(:disabled) {
  background: #0056b3;
}

.btn-wallet:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-disconnect {
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-disconnect:hover {
  background: #c82333;
}

.btn-deposit {
  background: #28a745;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-deposit:hover {
  background: #218838;
}

.wallet-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-retry {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: #c82333;
}
</style>
