import mysql2 from 'mysql2';
import fs from 'node:fs';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } from './config.js';

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
      res.writeHead(200, { 'Content-Type': 'application/json' });
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
    csv += element.id + ',' + element.nombres + ',' +
      element.apellidos + ',' + element.direccion + ',' +
      element.correo + ',' + element.dni + ',' + element.edad +
      ',' + element.fecha_creacion + ',' + element.telefono +
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
  let details = [];
  req.on('data', (chunk) => {
    fileData += chunk;
  });
  req.on('end', () => {
    const users = csvToJson(fileData);
    users.forEach(async (user, i) => {
      try {
        details.push(await addUser(user));
      } catch (err) {
        details.push(err);
      }
      if (i === users.length - 1) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(details));
      }
    })
  })
}

function addUser(user) {
  return new Promise((resolve, reject) => {
    // validate data
    const resValidate = validateUser(user);
    const checkQuery = 'SELECT * FROM user WHERE correo = ?';
    pool.query(checkQuery, [user.correo], (err, rows) => {
      if (err) {
        reject({
          status: 500, message: 'Error de acceso a la base de ' +
            'datos para verificar el correo ' + user.correo,
          details: 'id: ' + user.id + ' | nombres: ' +
            user.nombres + ' | apellidos: ' + user.apellidos,
          body: err
        });
      } else {
        if (rows.length === 0) {
          user.fecha_creacion = new Date(); // date created
          const query = 'INSERT INTO user (nombres, apellidos, direccion,' +
            ' correo, dni, edad, fecha_creacion, telefono) VALUES (?, ?, ?,' +
            '?, ?, ?, ?, ?)';
          pool.query(query, [user.nombres, user.apellidos, user.direccion,
          user.correo, user.dni, user.edad, user.fecha_creacion,
          user.telefono], (err, rows) => {
            if (err) {
              reject({
                status: 500, message: 'No se pudo insertar el usuario',
                body: err
              });
            }
            else {
              resolve({
                status: 200, message: 'OK', details: 'id: ' +
                  rows.insertId + ' nombres: ' + user.nombres +
                  ' | apellidos: ' + user.apellidos, body: rows
              });
            }
          });
        } else {
          reject({
            status: 500, message: 'El correo ' + user.correo +
              ' ya esta registrado', details: 'id: ' + user.id
                + ' | nombres: ' + user.nombres + ' | apellidos: ' +
                user.apellidos, body: err
          });
        }
      }
    })
  });
}

export function validateUser(user) {
  let error = false;
  let errorsList = [];
  let response = {};
  if (!user.id) { error = true; errorsList.push('id'); }
  if (!user.nombres) { error = true; errorsList.push('nombres'); }
  if (!user.apellidos) { error = true; errorsList.push('apellidos'); }
  if (!user.direccion) { error = true; errorsList.push('direccion'); }
  if (!user.correo) { error = true; errorsList.push('correo'); }
  if (!user.dni) { error = true; errorsList.push('dni'); }
  if (!user.edad) { error = true; errorsList.push('edad'); }
  if (!user.telefono) { error = true; errorsList.push('telefono'); }

  errorsList.forEach((error, i) => {
    response['Error-' + i + 1] = error;
    if (i === errorsList.length - 1) {
      console.log({Errors: response});
      return { Erroros: response }; 
    }
  })
}

function csvToJson(csv) {
  // get lines
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const result = [];
  lines.forEach((line, i) => {
    const obj = {};
    // get fields
    const fields = line.split(',');
    if (i === 0) return // skip header
    // build object
    fields.forEach((field, j) => {
      obj[headers[j]] = field
    });
    result.push(obj);
  })
  return result;
}