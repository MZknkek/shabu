const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลการชำระเงิน
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM payment';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลการชำระเงินได้',
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
// API เพิ่มข้อมูลการชำระเงิน
// ===============================
function validatePayment(body) {
    const errors = [];

    const sessionIdNum = parseInt(body.session_id, 10);
    if (isNaN(sessionIdNum) || sessionIdNum <= 0) {
        errors.push('session_id ต้องเป็นตัวเลขมากกว่า 0');
    }

    if (!body.payment_method || typeof body.payment_method !== 'string' || body.payment_method.trim() === '') {
        errors.push('payment_method ต้องเป็นข้อความและไม่ว่าง');
    }

    const amountNum = parseFloat(body.amount);
    if (isNaN(amountNum) || amountNum < 0) {
        errors.push('amount ต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0');
    }

    if (body.status !== undefined && typeof body.status !== 'string') {
        errors.push('status ต้องเป็นข้อความ');
    }

    return errors;
}


router.post('/', (req, res) => {
    const errors = validatePayment(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors.join(', ')
        });
    }

    const {
        session_id,
        payment_method,
        amount,
        payment_time,
        status
    } = req.body;

    const sql = `
        INSERT INTO payment
        (session_id, payment_method, amount, payment_time, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            session_id,
            payment_method,
            amount,
            payment_time,
            status
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มข้อมูลการชำระเงินไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มข้อมูลการชำระเงินสำเร็จ',
                payment_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขข้อมูลการชำระเงิน
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const errors = validatePayment(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors.join(', ')
        });
    }

    const {
        session_id,
        payment_method,
        amount,
        payment_time,
        status
    } = req.body;

    const sql = `
        UPDATE payment
        SET session_id = ?,
            payment_method = ?,
            amount = ?,
            payment_time = ?,
            status = ?
        WHERE payment_id = ?
    `;

    db.query(
        sql,
        [
            session_id,
            payment_method,
            amount,
            payment_time,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขข้อมูลการชำระเงินไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลการชำระเงินที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขข้อมูลการชำระเงินสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบข้อมูลการชำระเงิน
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM payment WHERE payment_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบข้อมูลการชำระเงินไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลการชำระเงินที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบข้อมูลการชำระเงินสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;