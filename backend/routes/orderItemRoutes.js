const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลรายการออเดอร์
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM order_item';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลรายการออเดอร์ได้',
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
// API เพิ่มรายการออเดอร์
// ===============================
router.post('/', (req, res) => {
    const {
        order_id,
        menu_id,
        quantity,
        note
    } = req.body;

    const sql = `
        INSERT INTO order_item
        (order_id, menu_id, quantity, note)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            order_id,
            menu_id,
            quantity,
            note
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มรายการออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มรายการออเดอร์สำเร็จ',
                order_item_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขรายการออเดอร์
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        order_id,
        menu_id,
        quantity,
        note
    } = req.body;

    const sql = `
        UPDATE order_item
        SET order_id = ?,
            menu_id = ?,
            quantity = ?,
            note = ?
        WHERE order_item_id = ?
    `;

    db.query(
        sql,
        [
            order_id,
            menu_id,
            quantity,
            note,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขรายการออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบรายการออเดอร์ที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขรายการออเดอร์สำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบรายการออเดอร์
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM order_item WHERE order_item_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบรายการออเดอร์ไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบรายการออเดอร์ที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบรายการออเดอร์สำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;