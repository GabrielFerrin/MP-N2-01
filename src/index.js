import { createServer } from 'node:http';
import { getUsers, exportUsers, importUsers, addUser }
  from './dbController.js';
import { homePage } from './htmlController.js';
import { PORT } from './config.js';

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

const testUser = [
  {
    "id": 1,
    "nombres": "Gabriel",
    "apellidos": "Ferrin",
    "direccion": "Mi casa",
    "correo": "agferrin@gmail.com",
    "dni": 1234746387,
    "edad": 15,
    "fecha_creacion": "2024-05-06 09:50:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 2,
    "nombres": "David",
    "apellidos": "Parrales",
    "direccion": "Su casa",
    "correo": "david@gmail.com",
    "dni": 123474634,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 3,
    "nombres": "Juan",
    "apellidos": "Parrales",
    "direccion": "Su casa",
    "correo": "juan@gmail.com",
    "dni": 123474634,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 4,
    "nombres": "Pedro",
    "apellidos": "Ferrin",
    "direccion": "Mi casa",
    "correo": "pedro@gmail.com",
    "dni": 1234746387,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 5,
    "nombres": "Daniel",
    "apellidos": "Ferrin",
    "direccion": "Mi casa",
    "correo": "daniel@gmail.com",
    "dni": 1234746387,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 6,
    "nombres": "Sergio",
    "apellidos": "Parrales",
    "direccion": "Su casa",
    "correo": "sergio@gmail.com",
    "dni": 123474634,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 7,
    "nombres": "Ramiro",
    "apellidos": "Parrales",
    "direccion": "Su casa",
    "correo": "ramiro@gmail.com",
    "dni": 123474634,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  },
  {
    "id": 7,
    "nombres": "Paul",
    "apellidos": "Ferrin",
    "direccion": "Mi casa",
    "correo": "agferrin@gmail.com",
    "dni": 1234746387,
    "edad": 15,
    "fecha_creacion": "2024-05-06 00:00:00",
    "telefono": "+593-98-341-1576"
  }
]

testUser.forEach(async (element) => {
  try {
    console.log(await addUser(element));
  } catch (error) {
    console.log(error);
  }
})