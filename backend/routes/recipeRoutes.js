const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลสูตรอาหาร
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM recipe';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลสูตรอาหารได้',
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
// API แก้ไขสูตรอาหาร
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        menu_id,
        ingredient_id,
        quantity_used,
        unit
    } = req.body;

    const sql = `
        UPDATE recipe
        SET menu_id = ?,
            ingredient_id = ?,
            quantity_used = ?,
            unit = ?
        WHERE recipe_id = ?
    `;

    db.query(
        sql,
        [menu_id, ingredient_id, quantity_used, unit, id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขสูตรอาหารไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบสูตรอาหารที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขสูตรอาหารสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบสูตรอาหาร
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM recipe WHERE recipe_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบสูตรอาหารไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบสูตรอาหารที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบสูตรอาหารสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;