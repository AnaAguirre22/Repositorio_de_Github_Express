// PROYECTO FINAL: DESARROLLO WEB DEL LADO DEL SERVIDOR 
// Integrantes del equipo: Ana Aguirre Sanchez, Fatima Lizarraga Velarde, Lopez Sanchez Jonathan, Salazar Sanchez Jaasiel, Tirado Barraza Allison.

const express = require('express');
const pool = require('./db'); // conexion centralizada a PostgreSQL (configurada por Ana)
const connectMongoDB = require("./mongoConnection"); // conexion a MongoDB (configurada por Ana)
const Vehiculo = require("./Vehiculo"); // modelo de vehiculos para MongoDB (configurado por Ana)

const app = express();

// middleware obligatorio para que Express pueda entender y leer los formatos JSON que enviamos en el Body
app.use(express.json());

// 1. SECCIÓN DE CONEXIONES A LAS BASES DE DATOS (Hecho por Ana)

// probamos que la conexión a PostgreSQL funcione correctamente usando el pool de db.js
pool.connect()
  .then(() => {
    console.log('Conexión exitosa a PostgreSQL');
  })
  .catch((err) => {
    console.error('Error de conexión a PostgreSQL:', err);
  });

// encendemos la conexión a MongoDB al levantar el servidor
connectMongoDB();

// la ruta raíz para verificar en el navegador que el servidor esté encendido
app.get('/', (req, res) => {
  res.send('API del Proyecto Final corriendo con PostgreSQL y MongoDB');
});

// SECCIÓN 2: ALUMNOS (Módulo de Fátima)

// 1. Consultar todos los alumnos activos
app.get('/api/getAlumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno WHERE isactive = true');
    res.status(200).json({
      message: "Alumnos encontrados correctamente",
      data: resultado.rows
    });
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 2. Consultar alumno por ID (Solo si está activo)
app.get('/api/getAlumnoById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID del alumno debe ser numérico' });
    }

    const resultado = await pool.query(
      'SELECT * FROM alumno WHERE id = $1 AND isactive = true',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado o inactivo' });
    }

    res.status(200).json({
      message: "Alumno encontrado correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 3. Buscar alumno por nombre o apellido usando LIKE
app.get('/api/searchAlumno', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: 'El parámetro de búsqueda es obligatorio' });
    }

    const busquedaEfectiva = `%${query}%`;
    const resultado = await pool.query(
      'SELECT * FROM alumno WHERE (nombre LIKE $1 OR apellido LIKE $1) AND isactive = true',
      [busquedaEfectiva]
    );

    res.status(200).json({
      message: "Búsqueda realizada con éxito",
      data: resultado.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 4. Crear alumno (POST)
app.post('/api/createAlumno', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;

    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO alumno (nombre, apellido, edad, correo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, edad, correo]
    );

    res.status(201).json({
      message: 'Alumno insertado correctamente',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 5. Modificar el alumno (PUT)
app.put('/api/updateAlumno/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, edad, correo } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID debe ser numérico' });
    }
    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios para actualizar' });
    }

    const verificar = await pool.query('SELECT * FROM alumno WHERE id = $1 AND isactive = true', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({ message: 'El alumno no existe o está inactivo' });
    }

    const resultado = await pool.query(
      'UPDATE alumno SET nombre = $1, apellido = $2, edad = $3, correo = $4 WHERE id = $5 RETURNING *',
      [nombre, apellido, edad, correo, id]
    );

    res.status(200).json({
      message: "Alumno modificado correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 6. Eliminar alumno de manera lógica (DELETE)
app.delete('/api/deleteAlumno/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID debe ser numérico' });
    }

    const verificar = await pool.query('SELECT * FROM alumno WHERE id = $1 AND isactive = true', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({ message: 'El alumno no existe o ya estaba inactivo' });
    }

    // UPDATE en vez de DELETE físico
    await pool.query('UPDATE alumno SET isactive = false WHERE id = $1', [id]);

    res.status(200).json({
      message: "Alumno eliminado de manera lógica correctamente"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// 3. SECCIÓN: MATERIAS (Le toca a JAASIEL)

// Jaasiel: consulta general de materias
app.get('/materias', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM materia');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar materias:', error);
    res.status(500).json({ error: 'Error al obtener las materias' });
  }
});

// Jaasiel: Endpoint para crear una materia (POST)
app.post('/materias', async (req, res) => {
  try {
    const { nombre, semestre, creditos } = req.body;
    
    // Jona y/o Jaasiel: validar que el nombre exista y no venga vacio
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


// 4. SECCIÓN: RELACIÓN ALUMNO-MATERIA (Le toca a JAASIEL)

// JAASIEL AqUI VAN TUS TRES ENDPOINTS DE RELACIONES USANDO LA TABLA INTERMEDIA QUE CREE YO (ANA):
// 1. El POST para inscribir una materia a un alumno (/api/assignMateriaToAlumno)
//    -> OJO: Tienes que validar que alumno_id y materia_id existan en sus tablas y que no se repita la misma inscripcion
// 2. El GET para ver que materias tiene asignadas un alumno (/api/getMateriasByAlumnoId/:id)
// 3. El GET para contar cuantas materias tiene un alumno (/api/getMateriasCountByAlumnoId/:id) usando COUNT en SQL

// Jaasiel: Endpoint para inscribir una materia a un alumno (POST)
app.post('/api/assignMateriaToAlumno', async (req, res) => {
    const { alumno_id, materia_id } = req.body;

    if (!alumno_id || !materia_id) {
        return res.status(400).json({ error: 'alumno_id y materia_id son obligatorios' });
    }

    try {
        // Validación: Revisar si ya existe la relación para no duplicar
        const existe = await pool.query(
            'SELECT * FROM alumno_materia WHERE alumno_id = $1 AND materia_id = $2',
            [alumno_id, materia_id]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'El alumno ya tiene inscrita esta materia' });
        }

        // Insertar la nueva relación
        const resultado = await pool.query(
            'INSERT INTO alumno_materia (alumno_id, materia_id) VALUES ($1, $2) RETURNING *',
            [alumno_id, materia_id]
        );

        res.status(201).json({ mensaje: 'Materia inscrita con éxito', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al inscribir materia:', error);
        res.status(500).json({ error: 'Error interno del servidor al inscribir materia' });
    }
});

// Jaasiel: Obtener las materias de un alumno específico (GET)
app.get('/api/getMateriasByAlumnoId/:id', async (req, res) => {
    const alumnoId = req.params.id;

    try {
        const resultado = await pool.query(
            `SELECT m.id, m.nombre, m.semestre, m.creditos 
             FROM materia m
             JOIN alumno_materia am ON m.id = am.materia_id
             WHERE am.alumno_id = $1`,
            [alumnoId]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener materias del alumno:', error);
        res.status(500).json({ error: 'Error al obtener las materias' });
    }
});

// Jaasiel: Contar cuántas materias tiene asignadas un alumno (GET)
app.get('/api/getMateriasCountByAlumnoId/:id', async (req, res) => {
    const alumnoId = req.params.id;

    try {
        const resultado = await pool.query(
            'SELECT COUNT(materia_id) as total_materias FROM alumno_materia WHERE alumno_id = $1',
            [alumnoId]
        );

        res.json({
            alumno_id: alumnoId,
            total_materias: parseInt(resultado.rows[0].total_materias)
        });
    } catch (error) {
        console.error('Error al contar materias:', error);
        res.status(500).json({ error: 'Error al contar las materias' });
    }
});









// 5. SECCIÓN: VEHICULOS - MONGOOSE Y MONGO DB (Le toca a el JONA)

// Jona: Consulta general de la coleccion en MongoDB. Ya lee el modelo Vehiculo
app.get("/api/getVehiculos", async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    res.status(200).json({
      message: "Vehículos consultados correctamente",
      data: vehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar vehículos",
      error: error.message,
    });
  }
});

// Jona: Insercion en MongoDB. Recuerda revisar que las validaciones cumplan con la rubrica del profesor.
app.post("/api/createVehiculo", async (req, res) => {
  try {
    const { marca, modelo, anio, color } = req.body;
    
    // Jona: Validacion de campos obligatorios antes de guardar en Mongo
    if (!marca || !modelo || !anio || !color) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }
    // Jona el año debe ser un numero valido
    if (isNaN(anio)) {
      return res.status(400).json({ message: "El año debe ser numérico" });
    }

    const nuevoVehiculo = new Vehiculo({ marca, modelo, anio, color });
    await nuevoVehiculo.save();

    res.status(201).json({
      message: "Vehículo creado correctamente",
      data: nuevoVehiculo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear vehículo",
      error: error.message,
    });
  }
});


// ENCENDIDO LOCAL DEL SERVIDOR
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});