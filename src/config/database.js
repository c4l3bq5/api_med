const { Pool } = require('pg');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(client => {
        console.log('Conexión exitosa a la base de datos')
        client.release();
    } )
    .catch(err=>{
        console.error('Error al conectar a la base de datos', err.stack)
    })

module.exports = pool;    