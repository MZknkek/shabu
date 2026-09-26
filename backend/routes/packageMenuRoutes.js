const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลแพ็กเกจและเมนู
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM package_menu';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลแพ็กเกจและเมนูได้',
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
// API แก้ไขแพ็กเกจและเมนู
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { package_id, menu_id } = req.body;

    const sql = `
        UPDATE package_menu
        SET package_id = ?,
            menu_id = ?
        WHERE package_menu_id = ?
    `;

    db.query(
        sql,
        [package_id, menu_id, id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขข้อมูลแพ็กเกจและเมนูไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขข้อมูลแพ็กเกจและเมนูสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบแพ็กเกจและเมนู
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM package_menu WHERE package_menu_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบข้อมูลแพ็กเกจและเมนูไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบข้อมูลแพ็กเกจและเมนูสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;