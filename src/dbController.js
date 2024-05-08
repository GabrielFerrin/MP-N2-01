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
  // get file chunks
  req.on('data', (chunk) => {
    fileData += chunk;
  });
  // validate and save files
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
        res.end(JSON.
          stringify({ id: user.id, name: user.nombres, details }));
      }
    })
  })
}

function addUser(user) {
  return new Promise((resolve, reject) => {
    // validate data
    const resValidate = validateUser(user);
    if (resValidate.error) reject(resValidate);
    // add user
    else {
      const query = 'INSERT INTO user (nombres, apellidos, ' +
        'direccion, correo, dni, edad, fecha_creacion, ' +
        'telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      pool.query(query, [user.nombres, user.apellidos, user.direccion,
      user.correo, user.dni, user.edad, user.fecha_creacion,
      user.telefono], (err, result) => {
        // handle errors
        if (err)
          reject({
            status: 500, message: 'Error de acceso a la base de ' +
              'datos para agregar al usuario ' + user.nombres,
            details: 'id: ' + user.id + ' | apellidos: ' + user.apellidos,
            body: err
          });
        // notify success adding user
        else {
          resolve({
            status: 200, message: 'OK', details: 'id: ' +
              rows.insertId + ' nombres: ' + user.nombres +
              ' | apellidos: ' + user.apellidos, body: rows
          });
        }
      })
    }
  });
}

export async function validateUser(user) {
  let error = false;
  let errorsList = [];
  let response = {};
  // missing fields
  if (!user.nombres) { error = true; errorsList.push('falta el campo \"nombres\"'); }
  if (!user.apellidos) { error = true; errorsList.push('Falta el campo \"apellidos\"'); }
  if (!user.direccion) { error = true; errorsList.push('Falta el campo \"direccion\"'); }
  if (!user.correo) { error = true; errorsList.push('Falta el campo \"correo\"'); }
  if (!user.dni) { error = true; errorsList.push('Falta el campo \"dni\"'); }
  if (!user.edad) { error = true; errorsList.push('Falta el campo \"edad\"'); }
  if (!user.telefono) { error = true; errorsList.push('Falta el campo \"telefono\"'); }
  // email format
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user.correo)) {
    error = true;
    errorsList.push('El correo ' + user.correo + ' no es valido');
  }
  // valid age
  if (user.edad < 0 || user.edad > 150) {
    error = true;
    errorsList.push('La edad ' + user.edad + ' no es valida');
  }
  // id is not already in the database
  try {
    const idCheck = await chekcId(user.id, user.correo);
    if (idCheck.error) {
      error = true;
      errorsList.push(idCheck.detail);
    }
  } catch (err) {
    error = true;
    errorsList.push(err.detail);
  }
  // email is not already in the database
  try {
    const emailCheck = await chekcEmail(user.correo);
    if (emailCheck.error) {
      error = true;
      errorsList.push(emailCheck.detail);
    }
  } catch (err) {
    error = true;
    errorsList.push(err.detail);
  }
  // prepare and return error messages
  errorsList.forEach((error, i) => {
    response['Error-' + (i + 1)] = error;
  })
  return errorsList.length ? { ErrorsList: response } : 'OK';
}

export async function chekcId(id) {
  return new Promise((resolve, reject) => {
    // check if id is already in the database
    const idQuery = 'SELECT * FROM user WHERE id = ?';
    pool.query(idQuery, [id], (err, rows) => {
      if (err) {
        reject({
          error: true, detail: 'No se pudo acceder a la ' +
            'base de datos para verificar el id ' + id
        });
      } else {
        if (rows.length === 0) resolve({ error: false })
        else {
          reject({
            error: true, detail: 'El id ' + id +
              ' ya esta registrado'
          });
        }
      }
    })
  });
}

function chekcEmail(email) {
  return new Promise((resolve, reject) => {
    // check if email is already in the database
    const emailQuery = 'SELECT * FROM user WHERE correo = ?';
    pool.query(emailQuery, [email], (err, rows) => {
      if (err) {
        reject({
          error: true, detail: 'No se pudo acceder a la ' +
            'base de datos para verificar el correo ' + email
        });
      } else {
        if (rows.length === 0) resolve({ error: false })
        else {
          reject({
            error: true, detail: 'El correo ' + email +
              ' ya esta registrado'
          });
        }
      }
    })
  });
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