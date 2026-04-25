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
  res.send('API funcionando correctamente');
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

app.get('/alumnos/:id', async (req, res) => {
  try {
    const { id } = req.params; 

    if (isNaN(id)) {
      return res.status(400).json({ error: 'El id debe ser numérico' });
    }

    const resultado = await pool.query(
      'SELECT * FROM alumno WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al consultar alumno:', error);
    res.status(500).json({ error: 'Error al obtener el alumno' });
  }
});

app.post('/alumnos', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;

    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO alumno (nombre, apellido, edad, correo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, edad, correo]
    );

    res.status(201).json({
      mensaje: 'Alumno insertado correctamente',
      alumno: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al insertar alumno:', error);
    res.status(500).json({ error: 'Error al insertar el alumno' });
  }
});

app.get('/materias', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM materia');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar materias:', error);
    res.status(500).json({ error: 'Error al obtener las materias' });
  }
});

app.get('/materias/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'El id debe ser numérico' });
    }

    const resultado = await pool.query(
      'SELECT * FROM materia WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al consultar materia:', error);
    res.status(500).json({ error: 'Error al obtener la materia' });
  }
});

app.post('/materias', async (req, res) => {
  try {
    const { nombre, semestre, creditos } = req.body;

    if (!nombre || !semestre || !creditos) {
      return res.status(400).json({ error: 'Todos los campos (nombre, semestre, creditos) son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO materia (nombre, semestre, creditos) VALUES ($1, $2, $3) RETURNING *',
      [nombre, semestre, creditos]
    );

    res.status(201).json({
      mensaje: 'Materia insertada correctamente',
      materia: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al insertar materia:', error);
    res.status(500).json({ error: 'Error al insertar la materia' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});