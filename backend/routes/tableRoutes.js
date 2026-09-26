const express = require('express');
const router = express.Router();

const db = require('../config/database');


// ===============================
// API แสดงข้อมูลโต๊ะทั้งหมด
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM restaurant_table';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลโต๊ะได้',
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// ===============================
// API เพิ่มโต๊ะใหม่
// ===============================
router.post('/', (req, res) => {
    const {
        table_number,
        capacity,
        status,
        qr_code
    } = req.body;

    const sql = `
        INSERT INTO restaurant_table
        (table_number, capacity, status, qr_code)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [table_number, capacity, status, qr_code],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มโต๊ะไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มโต๊ะสำเร็จ',
                table_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขข้อมูลโต๊ะ
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        table_number,
        capacity,
        status,
        qr_code
    } = req.body;

    const sql = `
        UPDATE restaurant_table
        SET table_number = ?,
            capacity = ?,
            status = ?,
            qr_code = ?
        WHERE table_id = ?
    `;

    db.query(
        sql,
        [
            table_number,
            capacity,
            status,
            qr_code,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขข้อมูลโต๊ะไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบโต๊ะที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขข้อมูลโต๊ะสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบโต๊ะ
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM restaurant_table WHERE table_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบโต๊ะไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบโต๊ะที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบโต๊ะสำเร็จ'
            });
        }
    );
});


module.exports = router;