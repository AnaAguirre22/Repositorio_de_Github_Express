const express = require('express');
const pool = require('./db'); 
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('API funcionando y lista para PostgreSQL');
});

pool.connect()
  .then(() => {
    console.log('Conexión exitosa a PostgreSQL');
  })
  .catch((err) => {
    console.error('Error de conexión', err);
  });

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});