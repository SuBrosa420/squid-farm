#!/bin/bash

echo "🔄 Updating Squid Farm from GitHub..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Настройки сервера
SERVER="u3283310@server37.hosting.reg.ru"
SERVER_PATH="/var/www/u3283310/data/www/testdomenwork.online"

echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
ssh $SERVER << EOF
cd $SERVER_PATH
echo "Stopping application..."
pkill -f "node server.js" || true
echo "Pulling from GitHub..."
git pull origin main
if [ \$? -ne 0 ]; then
    echo "Git pull failed, trying to reset..."
    git fetch origin
    git reset --hard origin/main
fi
echo "Installing dependencies..."
cd backend
npm install --production
echo "Building frontend..."
cd ../frontend
npm install
npm run build
echo "Starting application..."
cd ../backend
nohup node server.js > ../logs/app.log 2>&1 &
echo "Update completed!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Update successful!${NC}"
    echo -e "${GREEN}🌐 Your app is available at: https://testdomenwork.online${NC}"
    echo -e "${YELLOW}📋 Check logs: ssh $SERVER 'tail -f $SERVER_PATH/logs/app.log'${NC}"
else
    echo -e "${RED}❌ Update failed${NC}"
    exit 1
fi
