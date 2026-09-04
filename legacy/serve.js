/* Minimal static file server for local preview.
   Usage: node serve.js [port]   (default 5173) */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (rel.endsWith('/')) rel += 'index.html';

    const file = path.join(ROOT, rel);
    // Never serve outside the project directory.
    if (!path.resolve(file).startsWith(path.resolve(ROOT))) {
      res.writeHead(403).end('403 Forbidden');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + rel);
        console.log('404 ' + rel);
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
      console.log('200 ' + rel);
    });
  })
  .listen(PORT, () => {
    console.log('Innovgeist site running at  http://localhost:' + PORT + '/');
    console.log('Serving ' + ROOT);
    console.log('Press Ctrl+C to stop.');
  });
