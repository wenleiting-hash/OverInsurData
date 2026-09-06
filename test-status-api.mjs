import http from 'http';

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/users/list?page=1&pageSize=10',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== API Response ===');
      console.log('Total users:', json.total);
      console.log('First user status:', json.data[0]?.status);
      console.log('User count with statuses:');
      json.data.forEach(u => console.log(`  - ${u.username}: status="${u.status}"`));
    } catch (e) {
      console.log('Invalid JSON:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.log('Connection error:', e.message);
});

req.end();
