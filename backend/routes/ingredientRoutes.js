const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลวัตถุดิบทั้งหมด
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM ingredient';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลวัตถุดิบได้',
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
// API เพิ่มวัตถุดิบ
// ===============================
router.post('/', (req, res) => {
    const {
        ingredient_name,
        unit,
        quantity,
        minimum_quantity,
        status
    } = req.body;

    const sql = `
        INSERT INTO ingredient
        (ingredient_name, unit, quantity, minimum_quantity, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            ingredient_name,
            unit,
            quantity,
            minimum_quantity,
            status
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มวัตถุดิบไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มวัตถุดิบสำเร็จ',
                ingredient_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขวัตถุดิบ
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        ingredient_name,
        unit,
        quantity,
        minimum_quantity,
        status
    } = req.body;

    const sql = `
        UPDATE ingredient
        SET ingredient_name = ?,
            unit = ?,
            quantity = ?,
            minimum_quantity = ?,
            status = ?
        WHERE ingredient_id = ?
    `;

    db.query(
        sql,
        [
            ingredient_name,
            unit,
            quantity,
            minimum_quantity,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขวัตถุดิบไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบวัตถุดิบที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขวัตถุดิบสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบวัตถุดิบ
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM ingredient WHERE ingredient_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบวัตถุดิบไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบวัตถุดิบที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบวัตถุดิบสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;