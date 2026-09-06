import http from 'http';

http.get({
  hostname: 'localhost',
  port: 8080,
  path: '/api/users/list?page=1&pageSize=20',
  method: 'GET'
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('API Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Invalid JSON:', data.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.log('Connection error:', e.message);
});
