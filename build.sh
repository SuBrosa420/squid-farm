#!/bin/bash

echo "🚀 Building Squid Farm for production..."

# Сборка фронтенда
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
echo "✅ Frontend built successfully"

# Создание архива для деплоя
echo "📁 Creating deployment archive..."
cd ..
tar -czf squid-farm-deploy.tar.gz frontend/dist backend/ DEPLOYMENT_GUIDE.md
echo "✅ Deployment archive created: squid-farm-deploy.tar.gz"

echo "🎉 Build complete! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Upload squid-farm-deploy.tar.gz to your hosting"
echo "2. Extract the archive"
echo "3. Update tonconnect-manifest-production.json with your domain"
echo "4. Deploy backend and frontend according to DEPLOYMENT_GUIDE.md"
