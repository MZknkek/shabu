const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลโปรโมชั่นทั้งหมด
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM promotion';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลโปรโมชั่นได้',
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
// API เพิ่มโปรโมชั่น
// ===============================
router.post('/', (req, res) => {
    const {
        promotion_name,
        description,
        start_date,
        end_date,
        promotion_condition,
        discount,
        status
    } = req.body;

    const sql = `
        INSERT INTO promotion
        (
            promotion_name,
            description,
            start_date,
            end_date,
            promotion_condition,
            discount,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            promotion_name,
            description,
            start_date,
            end_date,
            promotion_condition,
            discount,
            status
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มโปรโมชั่นไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มโปรโมชั่นสำเร็จ',
                promotion_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขโปรโมชั่น
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        promotion_name,
        description,
        start_date,
        end_date,
        promotion_condition,
        discount,
        status
    } = req.body;

    const sql = `
        UPDATE promotion
        SET
            promotion_name = ?,
            description = ?,
            start_date = ?,
            end_date = ?,
            promotion_condition = ?,
            discount = ?,
            status = ?
        WHERE promotion_id = ?
    `;

    db.query(
        sql,
        [
            promotion_name,
            description,
            start_date,
            end_date,
            promotion_condition,
            discount,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขโปรโมชั่นไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบโปรโมชั่นที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขโปรโมชั่นสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบโปรโมชั่น
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM promotion WHERE promotion_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบโปรโมชั่นไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบโปรโมชั่นที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบโปรโมชั่นสำเร็จ'
            });
        }
    );
});


module.exports = router;