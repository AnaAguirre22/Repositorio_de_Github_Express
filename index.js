// PROYECTO FINAL DE DESARROLLO WEB DEL LADO DEL SERVIDOR 
// Integrantes: Ana Aguirre Sanchez, Fatima Lizarraga Velarde, Lopez Sanchez Jonathan, Salazar Sanchez Jaasiel, Tirado Barraza Allison.

const express = require('express');
const pool = require('./db'); // Nos traemos la conexion centralizada a PostgreSQL
const connectMongoDB = require("./mongoConnection"); // Nos traemos la conexion a MongoDB
const Vehiculo = require("./Vehiculo"); // Nos traemos el molde/modelo de vehiculos

const app = express();

// Este middleware (q es obligatorio) sirve para que Express pueda entender los JSON que le mandamos por Postman
app.use(express.json());


// SECCION 1: CONEXIONES A LAS BASES DE DATOS 
// Responsable: Ana Aguirre


// Probamos que la conexion a Postgres funcione llamando al pool
pool.connect()
  .then(() => {
    console.log('Conexión exitosa a PostgreSQL');
  })
  .catch((err) => {
    console.error('Error de conexión a PostgreSQL:', err);
  });

// Encendemos la conexion a Mongo al mismo tiempo
connectMongoDB();

// Ruta de prueba en el navegador para ver que todo este bien
app.get('/', (req, res) => {
  res.send('API del Proyecto Final corriendo al 100% con PostgreSQL y MongoDB');
});


// SECCION 2: ALUMNOS 
// Responsable: Fatima Lizarraga


// 1. Consultar todos los alumnos que sigan activos en el sistema
app.get('/api/getAlumnos', async (req, res) => {
  try {
    
    const resultado = await pool.query('SELECT * FROM alumno');
    res.status(200).json({
      message: "Alumnos encontrados correctamente",
      data: resultado.rows
    });
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 2. Traer un solo alumno por su ID (siempre y cuando este activo)
app.get('/api/getAlumnoById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Protegemos el servidor por si alguien manda letras en vez de un ID numerico
    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID del alumno debe ser numerico, no letras' });
    }

    const resultado = await pool.query(
      'SELECT * FROM alumno WHERE id = $1',
      [id]
    );

    // Si no encontro nada avisamos
    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
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

// 3. El buscador de alumnos busca coincidencias en nombre o apellido
app.get('/api/searchAlumno', async (req, res) => {
  try {
    const { query } = req.query; // Lo que el usuario escribe en la URL (?query=Juan)

    // Si nos mandan la busqueda vacia entonces rebotamos la peticion
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: 'Tienes que escribir algo para buscar' });
    }

    // Le ponemos los % para que funcione el LIKE de SQL 
    const busquedaEfectiva = `%${query}%`;
    const resultado = await pool.query(
      'SELECT * FROM alumno WHERE nombre LIKE $1 OR apellido LIKE $1',
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

// 4. Crear un alumno nuevo
app.post('/api/createAlumno', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;

    // Validamos que no nos dejen campos en blanco
    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Insertamos y con RETURNING * le decimos a Postgres que nos devuelva el alumno recién creado
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

// 5. Modificar la info de un alumno
app.put('/api/updateAlumno/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, edad, correo } = req.body;

    // Volvemos a blindar contra datos basura
    if (isNaN(id)) return res.status(400).json({ message: 'El ID debe ser numérico' });
    if (!nombre || !apellido || !edad || !correo) return res.status(400).json({ message: 'Todos los campos son obligatorios' });

    // Checamos si el alumno existe y esta activo antes de intentar actualizarlo
    const verificar = await pool.query('SELECT * FROM alumno WHERE id = $1', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({  message: 'El alumno no existe' });
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

// 6. Dar de baja a un alumno
app.delete('/api/deleteAlumno/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) return res.status(400).json({ message: 'El ID debe ser numérico' });

    // Verificamos que el alumno exista antes de realizar la baja lógica
    const verificar = await pool.query('SELECT * FROM alumno WHERE id = $1', [id]);
    if (verificar.rows.length === 0) {
      return res.status(404).json({  message: 'El alumno no existe' });
    }

    // En vez de un DELETE que borre el registro, hacemos un UPDATE para cambiar su estatus a false
    await pool.query('DELETE FROM alumno WHERE id = $1', [id]);

    res.status(200).json({
      message: "Alumno dado de baja correctamente"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// SECCION 3: MATERIAS 
// Responsable: Jaasiel Salazar

// Ver todo el catalogo de materias
app.get('/materias', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM materia');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar materias:', error);
    res.status(500).json({ message: 'Error al obtener las materias' });
  }
});

// Dar de alta una materia nueva
app.post('/materias', async (req, res) => {
  try {
    const { nombre, semestre, creditos } = req.body;
    
    // ValidaciOn basica de campos vacios
    if (!nombre || !semestre || !creditos) {
      return res.status(400).json({ error: 'Todos los campos (nombre, semestre, creditos) son obligatorios' });
    }
    
    const resultado = await pool.query(
      'INSERT INTO materia (nombre, semestre, creditos) VALUES ($1, $2, $3) RETURNING *',
      [nombre, semestre, creditos]
    );
    res.status(201).json({
      message: 'Materia insertada correctamente',
      materia: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al insertar materia:', error);
    res.status(500).json({ message: 'Error al insertar la materia' });
  }
});


// SECCION 4: RELACIONES E INSCRIPCIONES 
// Responsables: Jaasiel / Ana 


// Inscribir a un alumno en una materia usando la tabla intermedia
app.post('/api/assignMateriaToAlumno', async (req, res) => {
    const { alumno_id, materia_id } = req.body;

    // Verificamos que vengan los datos y sean numeros validos
    if (!alumno_id || !materia_id) return res.status(400).json({ error: 'alumno_id y materia_id son obligatorios' });
    if (isNaN(alumno_id) || isNaN(materia_id)) return res.status(400).json({ error: 'Ambos IDs deben ser numéricos' });

    try {
        // Verificamos que el alumno exista y se encuentre activo
        const alumnoActivo = await pool.query('SELECT * FROM alumno WHERE id = $1', [alumno_id]);
        if (alumnoActivo.rows.length === 0) return res.status(404).json({ error: 'El alumno no existe' });

        // Validacion: Revisar que la materia que le quieren meter si exista en el catalogo
        const materiaExiste = await pool.query('SELECT * FROM materia WHERE id = $1', [materia_id]);
        if (materiaExiste.rows.length === 0) return res.status(404).json({ error: 'La materia solicitada no existe' });

        // Validacion: Evitamos que metan la misma materia dos veces para el mismo alumno
        const existe = await pool.query(
            'SELECT * FROM alumno_materia WHERE alumno_id = $1 AND materia_id = $2',
            [alumno_id, materia_id]
        );
        if (existe.rows.length > 0) return res.status(400).json({ error: 'El alumno ya tiene inscrita esta materia' });

        // Ya que paso todos los filtros insertamos la relacion
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

// Ver las materias de un alumno especifico cruzando tablas con JOIN
app.get('/api/getMateriasByAlumnoId/:id', async (req, res) => {
    const alumnoId = req.params.id;

    if (isNaN(alumnoId)) return res.status(400).json({ error: 'El ID debe ser numérico' });

    try {
        const alumnoActivo = await pool.query('SELECT * FROM alumno WHERE id = $1', [alumnoId]);
        if (alumnoActivo.rows.length === 0) return res.status(404).json({ error: 'El alumno no existe' });

        // Hacemos el JOIN para traer los nombres y datos de la materia basandonos en la tabla intermedia
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

// Contar cuantas materias agarro un alumno, esto es como para probabilidad o estadistica 
app.get('/api/getMateriasCountByAlumnoId/:id', async (req, res) => {
    const alumnoId = req.params.id;

    if (isNaN(alumnoId)) return res.status(400).json({ error: 'El ID debe ser numérico' });

    try {
        const alumnoActivo = await pool.query('SELECT * FROM alumno WHERE id = $1', [alumnoId]);
        if (alumnoActivo.rows.length === 0) return res.status(404).json({ error: 'El alumno no existe' });

        // Usamos COUNT de SQL para que Postgres haga el calculo directo y no tener que contarlo nosotros
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


// SECCION 5: VEHICULOS (MongoDB y Mongoose) 
// Responsable: Jonathan Lopez

// Consultar todo el garaje de vehiculos
app.get("/api/getVehiculos", async (req, res) => {
  try {
    // Vehiculo.find() trae toda la coleccion directo de MongoDB
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

// Registrar un carro nuevo en MongoDB
app.post("/api/createVehiculo", async (req, res) => {
  try {
    const { marca, modelo, anio, color } = req.body;
    
    // Validacion de campos vacios usando trim() para que no nos metan puros espacios
    if (!marca?.trim() || !modelo?.trim() || !anio || !color?.trim()) {
      return res.status(400).json({ 
        status: "Error",
        message: "Faltan campos obligatorios. Asegúrate de enviar: marca, modelo, anio y color." 
      });
    }

    // Validacion: El año tiene que ser un numero real y tener logica (ej. de 1900 a 2027)
    const anioNumero = Number(anio);
    if (isNaN(anioNumero) || anioNumero < 1900 || anioNumero > 2027) {
      return res.status(400).json({ 
        status: "Error",
        message: "El campo 'anio' debe ser un numero (entre 1900 y 2027)." 
      });
    }

    // Armamos el objeto con el esquema y lo guardamos
    const nuevoVehiculo = new Vehiculo({ marca, modelo, anio, color });
    await nuevoVehiculo.save();

    res.status(201).json({
      message: "Vehículo creado y guardado en Mongo correctamente",
      data: nuevoVehiculo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear vehículo",
      error: error.message,
    });
  }
});

// El buscador de vehiculos busca por marca sin importar mayusculas o minisculas
app.get("/api/vehiculos/buscar", async (req, res) => {
  try {
    const { marca } = req.query; // Captura el valor de la URL (?marca=Nissan)

    if (!marca) {
      return res.status(400).json({
        status: "Error",
        message: "Por favor, especifica una 'marca' en la URL para buscar."
      });
    }

    // Usamos $regex para buscar coincidencias parciales y la "i" para ignorar mayusculas/minusculas
    const vehiculosEncontrados = await Vehiculo.find({
      marca: { $regex: marca, $options: "i" }
    });

    // Validamos si existen vehículos registrados con la marca solicitada
    if (vehiculosEncontrados.length === 0) {
      return res.status(404).json({
        status: "Success",
        message: `No tenemos registrado ningún vehículo de la marca: ${marca}`,
        data: []
      });
    }

    res.status(200).json({
      status: "Success",
      results: vehiculosEncontrados.length, // le decimos cuantos encontramos
      data: vehiculosEncontrados
    });

  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Error al realizar la busqueda de vehículos",
      error: error.message
    });
  }
});

// aqui se enciende el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo sin problemas en http://localhost:3000');
});