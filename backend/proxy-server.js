const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Проксирование API запросов к бэкенду
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Обслуживание статических файлов фронтенда
app.use(express.static(path.join(__dirname, '..')));

// Все остальные запросы направляем на index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Proxy server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
  console.log(`🔄 Proxying /api requests to: http://localhost:3000`);
});
