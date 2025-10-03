#!/bin/bash

echo "🚀 Preparing Squid Farm for FTP deployment..."

# Создаем папку для FTP загрузки
mkdir -p ftp-upload
cd ftp-upload

# Собираем фронтенд
echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build
echo "✅ Frontend built successfully"

# Копируем файлы фронтенда
echo "📁 Copying frontend files..."
cp -r dist/* ../ftp-upload/
echo "✅ Frontend files copied"

# Копируем файлы бэкенда
echo "📁 Copying backend files..."
cd ../backend
cp -r . ../ftp-upload/backend/
echo "✅ Backend files copied"

# Создаем манифест для продакшена
echo "📄 Creating production manifest..."
cd ../ftp-upload
cat > tonconnect-manifest-production.json << EOF
{
  "url": "https://your-domain.com",
  "name": "Squid Farm",
  "iconUrl": "https://your-domain.com/favicon.ico",
  "termsOfUseUrl": "https://your-domain.com/terms",
  "privacyPolicyUrl": "https://your-domain.com/privacy"
}
EOF

# Создаем файлы terms и privacy
echo "📄 Creating terms and privacy files..."
cat > terms << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Terms of Use - Squid Farm</title>
</head>
<body>
    <h1>Terms of Use</h1>
    <p>Terms of use for Squid Farm application.</p>
</body>
</html>
EOF

cat > privacy << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Policy - Squid Farm</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>Privacy policy for Squid Farm application.</p>
</body>
</html>
EOF

echo "✅ Terms and privacy files created"

# Создаем инструкции
cat > README-FTP.txt << EOF
FTP DEPLOYMENT INSTRUCTIONS
===========================

1. Upload all files from this folder to your public_html/ directory
2. Update tonconnect-manifest-production.json with your domain
3. If your hosting supports Node.js:
   - Go to backend/ folder
   - Run: npm install
   - Start the server
4. If your hosting doesn't support Node.js:
   - Use only the frontend files
   - Deploy backend separately (Railway, Heroku, etc.)

Files to upload:
- All files from this folder to public_html/
- backend/ folder contents to public_html/backend/

Don't forget to:
- Enable SSL certificate
- Update CORS settings in backend/server.js
- Test TON Connect functionality
EOF

echo "✅ Instructions created"

cd ..

echo "🎉 FTP preparation complete!"
echo ""
echo "Files ready for upload in: ftp-upload/"
echo ""
echo "Next steps:"
echo "1. Connect to your FTP server"
echo "2. Upload all files from ftp-upload/ to public_html/"
echo "3. Update tonconnect-manifest-production.json with your domain"
echo "4. Enable SSL certificate in ICPmanager"
echo "5. Test the application"
echo ""
echo "See FTP_DEPLOYMENT_GUIDE.md for detailed instructions"
