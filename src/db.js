const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'vitokos_coffee',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};