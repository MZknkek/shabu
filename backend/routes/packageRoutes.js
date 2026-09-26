const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลแพ็กเกจบุฟเฟต์ทั้งหมด
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM buffet_package';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลแพ็กเกจได้',
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
// API เพิ่มแพ็กเกจใหม่
// ===============================
router.post('/', (req, res) => {
    const {
        package_name,
        price,
        duration,
        status
    } = req.body;

    const sql = `
        INSERT INTO buffet_package
        (package_name, price, duration, status)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [package_name, price, duration, status],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มแพ็กเกจไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มแพ็กเกจสำเร็จ',
                package_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขแพ็กเกจบุฟเฟต์
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const {
        package_name,
        price,
        duration,
        status
    } = req.body;

    const sql = `
        UPDATE buffet_package
        SET package_name = ?,
            price = ?,
            duration = ?,
            status = ?
        WHERE package_id = ?
    `;

    db.query(
        sql,
        [
            package_name,
            price,
            duration,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขแพ็กเกจไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบแพ็กเกจที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขแพ็กเกจสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบแพ็กเกจบุฟเฟต์
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM buffet_package WHERE package_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบแพ็กเกจไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบแพ็กเกจที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบแพ็กเกจสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;