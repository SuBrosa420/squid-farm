#!/bin/bash

echo "🚀 Deploying Squid Farm to testdomenwork.online..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Настройки сервера
SERVER="u3283310@server37.hosting.reg.ru"
SERVER_PATH="/var/www/u3283310/data/www/testdomenwork.online"
DOMAIN="testdomenwork.online"

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"

cd ..

echo -e "${YELLOW}📁 Creating deployment package...${NC}"
tar -czf deploy-package.tar.gz frontend/dist/ backend/ --exclude=backend/node_modules
echo -e "${GREEN}✅ Package created${NC}"

echo -e "${YELLOW}📤 Uploading to server...${NC}"
scp deploy-package.tar.gz $SERVER:$SERVER_PATH/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Upload successful${NC}"

echo -e "${YELLOW}🔧 Deploying on server...${NC}"
ssh $SERVER << EOF
cd $SERVER_PATH
echo "Extracting files..."
tar -xzf deploy-package.tar.gz
echo "Installing backend dependencies..."
cd backend
npm install --production
echo "Restarting application..."
pkill -f "node server.js" || true
nohup node server.js > ../logs/app.log 2>&1 &
echo "Deployment completed!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your app is available at: https://$DOMAIN${NC}"
    echo -e "${YELLOW}📋 Check logs: ssh $SERVER 'tail -f $SERVER_PATH/logs/app.log'${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Очистка
rm -f deploy-package.tar.gz
echo -e "${GREEN}🧹 Cleanup completed${NC}"
