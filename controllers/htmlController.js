import fs from 'node:fs';

export function homePage(res) {
  fs.readFile('views/home.html', 'utf-8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h2>Error interno: No se pudo acceder al archivo html</h2>');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
}