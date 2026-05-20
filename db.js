const { Pool } = require('pg');

//configuracion del pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'react_express_db',
  password: 'AuSa22_06', 
  port: 5432,
});

// la exportacion del pool para que lo usen en sus consultas 
module.exports = pool;