const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'premium_suki'
});

db.connect((err) => {
    if (err) {
        console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.message);
        return;
    }

    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
});

module.exports = db;
