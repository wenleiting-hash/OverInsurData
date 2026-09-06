const http = require('http');

const server = http.createServer((req, res) => {
  console.log("收到 HTTP 请求！", req.url);
  res.writeHead(200);
  res.end('ok');
});

server.listen(3000, '0.0.0.0', () => {
  console.log("原生 node http 服务启动成功，端口 3000");
});
