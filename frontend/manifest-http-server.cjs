const http = require('http');
const fs = require('fs');
const path = require('path');

const manifest = {
  url: "http://localhost:5173",
  name: "Squid Farm",
  iconUrl: "http://localhost:5173/favicon.ico",
  termsOfUseUrl: "http://localhost:5173/terms",
  privacyPolicyUrl: "http://localhost:5173/privacy"
};

const server = http.createServer((req, res) => {
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
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(manifest, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`📄 HTTP Manifest server running on http://localhost:${PORT}`);
  console.log(`📄 Manifest available at: http://localhost:${PORT}/tonconnect-manifest.json`);
});
