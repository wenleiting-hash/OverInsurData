const https = require('https');
const http = require('http');

async function testLogin() {
  try {
    console.log('[TEST] Starting login test...\n');
    
    const postData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Login response received!\n');
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
    });
    
    req.on('timeout', () => {
      console.error('❌ Request timeout!');
      req.destroy();
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();
