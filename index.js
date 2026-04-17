const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());

pool.connect()
  .then(() => {
    console.log('✅ Conexión exitosa a PostgreSQL');
  })
  .catch((err) => {
    console.error('❌ Error de conexión', err);
  });

app.get('/', (req, res) => {
  res.send('API funcionando');
});

app.get('/alumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ error: 'Error al obtener los alumnos' });
  }
});

app.post('/alumnos', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;

    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Consulta para insertar en PostgreSQL
    const resultado = await pool.query(
      'INSERT INTO alumno (nombre, apellido, edad, correo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, edad, correo]
    );

    // Respuesta exitosa
    res.status(201).json({
      mensaje: 'Alumno insertado correctamente',
      alumno: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al insertar alumno:', error);
    res.status(500).json({ error: 'Error al insertar el alumno' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

