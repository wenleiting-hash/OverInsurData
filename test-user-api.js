// Quick API Test Script for User Management
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/users/list?page=1&pageSize=20',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer AT-test-1234567890',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✓ API Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n✅ SUCCESS: User List API working!');
        console.log(`   Total users: ${parsed.data.length}`);
      } else {
        console.log('\n⚠️  Warning: API returned success=false');
      }
    } catch (e) {
      console.log('✗ Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('✗ Request failed:', e.message);
  console.log('Make sure backend is running on http://localhost:8080');
});

req.end();
