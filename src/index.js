import { createServer } from 'node:http';
import { getUsers, exportUsers, importUsers, addUser }
  from './dbController.js';
import { homePage } from './htmlController.js';
import { PORT } from './config.js';
import { testUsers, test } from './test.js';

// manejar peticiones al servidor
const server = createServer(async (req, res) => {
  console.clear();
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        // GET
        case '/': homePage(res); break;
        case '/api/usuarios': getUsers(res); break;
        case '/api/usuarios/export': exportUsers(res); break;
        default:
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h2>No se ha implementado ese metodo GET</h2>');
          break;
      }
      break;
    case 'POST':
      switch (req.url) {
        // POST
        case '/api/usuarios/import': importUsers(res, req); break;
        default:
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h2>No se ha implementado ese metodo POST</h2>');
          break;
      }
      break;
  }
})

// levantar servidor
const serverMessage = `Servidor levantado en http://localhost:${PORT}`;
server.listen(PORT, () => console.log(serverMessage));

// ejecutar test
if (test)
  testUsers.forEach(async (user) => {
    try {
      console.log(await addUser(user))
    } catch (err) {
      console.log(err)
    }
  });