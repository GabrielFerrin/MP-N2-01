import { createServer } from 'node:http';
import { getUsers, exportUsers, importUsers, validateUser } from './dbController.js';
import { homePage } from './htmlController.js';
import { PORT } from './config.js';

//  test 
const user = { 
  // id: 1,
  nombres: 'Gabriel',
  apellidos: 'Ferrin',
  direccion: 'Calle 10 # 10-10',
  correo: 'gabriel.ferrin',
  dni: '12345678',
  edad: 20,
  telefono: '3124567890'
};

const result = validateUser(user);
// console.log(result);

// manejar peticiones al servidor
const server = createServer(async (req, res) => {
  console.clear();
  switch (req.method) {
    case 'GET':
      switch (req.url) {
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