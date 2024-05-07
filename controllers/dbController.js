import mysql2 from 'mysql2';
import fs from 'node:fs';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } from '../config.js';
  
// DB
const pool = mysql2.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  dateStrings: 'date'
});

// GET
export function getUsers(res) {
  pool.query('SELECT * FROM user', (err, rows) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(JSON.stringify(err));
    } else {

      // res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    }
  })
}

export async function exportUsers(res) {
  let users = null;
  try { users = await getUsersInternal(); }
  catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(err));
  }
  let csv = 'nombres,apellidos,direccion,correo,dni,edad,' +
    'fecha_creacion,telefono\n';
  users.forEach((element, index) => {
    csv += element.nombres + ',' + element.apellidos + ',' +
      element.direccion + ',' + element.correo + ',' +
      element.dni + ',' + element.edad + ',' +
      element.fecha_creacion + ',' + element.telefono +
      (index !== users.length - 1 ? '\n' : '');
  });
  fs.writeFile('./assets/temp/usuarios.csv', csv, (err) => {
    if (err) {
      reject({ status: 500, message: 'No se pudo exportar el archivo', body: err });
    } else {
      fs.readFile('./assets/temp/usuarios.csv', 'utf-8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(JSON.stringify(err));
        } else {
          res.writeHead(200, { 'Content-Type': 'text/csv' });
          res.end(data);
        }
      })
    }
  })
}

export async function getUsersInternal() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM user', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    })
  })
}

// POST
export function importUsers(res, req) {
  let fileData = '';
  req.on('data', (chunk) => {
    fileData += chunk;
  });
  req.on('end', () => {
    const users = csvToJson(fileData);
    users.forEach(async (user) => {
      await addUser(user);
      console.log(user);
    })
  })
  res.end('ok');
}

function addUser(user) {
  const query = 'INSERT INTO user (nombres, apellidos, direccion,' +
    ' correo, dni, edad, fecha_creacion, telefono) VALUES (?, ?, ?,' +
    '?, ?, ?, ?, ?)';
  return new Promise((resolve, reject) => {
    pool.query(query, [user.nombres, user.apellidos, user.direccion,
    user.correo, user.dni, user.edad, user.fecha_creacion,
    user.telefono], (err, rows) => {
      if (err) reject({
        status: 500, message: 'No se pudo insertar el usuario', body: err
      });
      else resolve({ status: 200, message: 'OK', body: rows });
    });
  });
}

function csvToJson(csv) {
  // get lines
  const lines = csv.split('\n');
  const result = [];
  const headers = lines[0].split(',');
  lines.forEach((line, i) => {
    const obj = {};
    // get fields
    const fields = line.split(',');
    if (i === 0) return // skip header
    // create object
    fields.forEach((field, j) => obj[headers[j]] = field)
    result.push(obj);
  })
  console.log(result);
  return result
}