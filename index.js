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

// 2. SECCIÓN: ALUMNOS (Le toca a ti Fatima)

// Fatima: aqui debes modificar este GET para que funcione la "eliminacion logica"
// El profe pidio que solo muestre alumnos activos. agrega un "WHERE isActive = true" en tu SQL
app.get('/alumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ error: 'Error al obtener los alumnos' });
  }
});

// Fatima Este es el GET para buscar por ID.
// Tienes que asegurar que valide que el ID sea numerico (ya esta) y que el alumno este activo (falta el WHERE)
app.get('/alumnos/:id', async (req, res) => {
  try {
    const { id } = req.params; 
    
    // Jona y/o Fatima: validacion basica para que la base de datos no truene si mandan texto
    if (isNaN(id)) {
      return res.status(400).json({ error: 'El id debe ser numérico' });
    }
    
    const resultado = await pool.query('SELECT * FROM alumno WHERE id = $1', [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al consultar alumno:', error);
    res.status(500).json({ error: 'Error al obtener el alumno' });
  }
});

// Fatima esste es para crear un alumno (POST)
// Asegurate de que pida todos los campos necesarios
app.post('/alumnos', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;
    
    // Jona y/o Fatima: validacion de que no vengan campos vacios
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

// FATIMAAA AQUI DEBES AGREGAR TUS DOS ENDPOINTS FALTANTES:
// 1. El PUT para actualizar alumno (/api/updateAlumno/:id)
// 2. El DELETE para la eliminación lógica (/api/deleteAlumno/:id) -> Acuerdate que NO es un DELETE real, es un UPDATE para cambiar isActive = false
// 3. El GET con la consulta LIKE para buscar alumnos por nombre o apellido (/api/searchAlumno?query=...)


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