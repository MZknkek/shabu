const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลออเดอร์
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM orders';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
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
// API เพิ่มข้อมูลออเดอร์
// ===============================
router.post('/', (req, res) => {
    const {
        session_id,
        order_time,
        status
    } = req.body;

    const sql = `
        INSERT INTO orders
        (session_id, order_time, status)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            session_id,
            order_time,
            status
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มออเดอร์สำเร็จ',
                order_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขออเดอร์
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        session_id,
        order_time,
        status
    } = req.body;

    const sql = `
        UPDATE orders
        SET session_id = ?,
            order_time = ?,
            status = ?
        WHERE order_id = ?
    `;

    db.query(
        sql,
        [
            session_id,
            order_time,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบออเดอร์ที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขออเดอร์สำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบออเดอร์
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM orders WHERE order_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบออเดอร์ที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบออเดอร์สำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;