const https = require('https');
const fs = require('fs');
const path = require('path');

// Создаем самоподписанный сертификат для локальной разработки
const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const options = {
  key: pems.private,
  cert: pems.cert
};

const manifest = {
  url: "https://localhost:5174",
  name: "Squid Farm",
  iconUrl: "https://localhost:5174/favicon.ico",
  termsOfUseUrl: "https://localhost:5174/terms",
  privacyPolicyUrl: "https://localhost:5174/privacy"
};

const server = https.createServer(options, (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/tonconnect-manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 5174;
server.listen(PORT, () => {
  console.log(`🔒 HTTPS Manifest server running on https://localhost:${PORT}`);
  console.log(`📄 Manifest available at: https://localhost:${PORT}/tonconnect-manifest.json`);
  console.log('⚠️  You may need to accept the self-signed certificate in your browser');
});
