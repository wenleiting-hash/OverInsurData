const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/users/list',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log('Response status:', res.statusCode);
  
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
    process.stdout.write(chunk); // Real-time output
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n\n=== Parsed Response ===');
      console.log('Success:', parsed.success);
      console.log('Total users:', parsed.total);
      console.log('Data:', JSON.stringify(parsed.data, null, 2));
    } catch (e) {
      console.log('\nInvalid JSON');
    }
  });
});

req.on('error', error => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

req.end();
