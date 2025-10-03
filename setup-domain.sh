#!/bin/bash

echo "🌐 Setting up testdomenwork.online domain..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Настройки сервера
SERVER="u3283310@server37.hosting.reg.ru"
SERVER_PATH="/var/www/u3283310/data/www/testdomenwork.online"

echo -e "${YELLOW}📁 Creating domain directory...${NC}"
ssh $SERVER << EOF
# Создаем папку для домена
mkdir -p $SERVER_PATH
cd $SERVER_PATH

# Клонируем проект с GitHub
echo "Cloning project from GitHub..."
git clone https://github.com/SuBrosa420/squid-farm.git .

# Создаем папку для логов
mkdir -p logs

# Устанавливаем зависимости бэкенда
echo "Installing backend dependencies..."
cd backend
npm install --production

# Собираем фронтенд
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Создаем символическую ссылку для статических файлов
cd ..
ln -sf frontend/dist/* . 2>/dev/null || true

echo "Domain setup completed!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Domain setup successful!${NC}"
    echo -e "${GREEN}🌐 Your app is available at: https://testdomenwork.online${NC}"
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo -e "${YELLOW}1. Configure domain in ICPmanager${NC}"
    echo -e "${YELLOW}2. Enable SSL certificate${NC}"
    echo -e "${YELLOW}3. Test the application${NC}"
else
    echo -e "${RED}❌ Domain setup failed${NC}"
    exit 1
fi
