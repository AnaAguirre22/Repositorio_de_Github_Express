const { Pool } = require('pg');

// Aqui armamos el pool de conexiones a PostgreSQL. Basicamente es para no abrir y cerrar la base de datos por cada consulta, sino mantener un grupito de conexiones listas para usarse y que el servidor no se trabe.
const pool = new Pool({
  user: 'postgres',          // El usuario por defecto de Postgres
  host: 'localhost',         // Como estamos probando en nuestras compus entonces es localhost
  database: 'react_express_db', // El nombre de la base de datos que creamos en pgAdmin
  password: 'Allisonhtb0110',     // Aqui cada quien debe cambiar esto por su contraseña local antes de correrlo y para que les pueda abrir postgres
  port: 5432,                // El puerto de postgres
});

// Exportamos esta configuracion para que los demas archivos (como index.js) la puedan importar y usar
module.exports = pool;