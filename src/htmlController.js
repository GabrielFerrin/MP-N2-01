import fs from 'node:fs';
import path from 'node:path';

export function homePage(res) {
  const filePath = path.resolve('./public/home.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h2>Error interno: No se pudo acceder al archivo html</h2>');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
}