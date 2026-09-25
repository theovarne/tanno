const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const resolved = path.resolve(root, `.${pathname}`);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }
  const file = resolved === root ? path.join(root, 'index.html') : resolved;
  const stream = fs.createReadStream(file);
  stream.on('open', () => {
    response.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream');
    stream.pipe(response);
  });
  stream.on('error', () => response.writeHead(404).end());
}).listen(4190, '127.0.0.1', () => console.log('TANNO preview: http://127.0.0.1:4190/'));
