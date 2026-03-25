const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

app.get('/usuario', (req, res) => {
  const usuario = {
    id: 1,
    nombre: 'Ana Aguirre', 
    rol: 'Estudiante de Informática UAS'
  };

  res.json(usuario);
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});