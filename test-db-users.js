const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/users/list',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('Status:', response.success ? 'SUCCESS' : 'FAILED');
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('Total:', response.total);
  });
});

req.on('error', error => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

req.end();
