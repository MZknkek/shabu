const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลใบเสร็จ
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM receipt';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลใบเสร็จได้',
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
// API แก้ไขใบเสร็จ
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        payment_id,
        receipt_number,
        issued_at,
        total_amount
    } = req.body;

    const sql = `
        UPDATE receipt
        SET payment_id = ?,
            receipt_number = ?,
            issued_at = ?,
            total_amount = ?
        WHERE receipt_id = ?
    `;

    db.query(
        sql,
        [
            payment_id,
            receipt_number,
            issued_at,
            total_amount,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขใบเสร็จไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบใบเสร็จที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขใบเสร็จสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบใบเสร็จ
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM receipt WHERE receipt_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบใบเสร็จไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบใบเสร็จที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบใบเสร็จสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;