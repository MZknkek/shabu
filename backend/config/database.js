const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'premium_suki',
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

module.exports = db;
