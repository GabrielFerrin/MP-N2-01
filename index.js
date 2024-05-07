import { createServer } from 'node:http';
import {
  getUsers,
  exportUsers,
  importUsers
} from './controllers/dbController.js';
import { homePage } from './controllers/htmlController.js';
import { PORT } from './config.js';

// variables para el servidor
const serverMessage = `Servidor levantado en http://localhost:${PORT}`;

// manejar peticiones al servidor
const server = createServer(async (req, res) => {
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/':
          homePage(res);
          break;
        case '/api/usuarios':
          getUsers(res);
          break;
        case '/api/usuarios/export':
          exportUsers(res);
          break;
        default:
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h2>No se ha implementado el metodo GET</h2>');
          break;
      }
      break;
    case 'POST':
      switch (req.url) {
        case '/api/usuarios/import':
          importUsers(res, req);
          // res.end('ok')
          break;
        default:
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h2>No se ha implementado el metodo POST</h2>');
          break;
      }
      break;
    default:
      console.log('Metodo no soportado');
      break;
  }
})

// levantar servidor
server.listen(PORT, () => console.log(serverMessage));