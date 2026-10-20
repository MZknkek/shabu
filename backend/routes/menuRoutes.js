const express = require('express');
const router = express.Router();
const db = require('../config/database');


// ===============================
// API แสดงข้อมูลเมนูอาหารทั้งหมด
// ===============================
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM menu';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลเมนูได้',
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
// API เพิ่มเมนูอาหาร
// ===============================
function validateMenu(body) {
    const errors = [];

    if (!body.menu_name || typeof body.menu_name !== 'string' || body.menu_name.trim() === '') {
        errors.push('menu_name ต้องเป็นข้อความและไม่ว่าง');
    }

    const priceNum = parseFloat(body.price);
    if (isNaN(priceNum) || priceNum < 0) {
        errors.push('price ต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0');
    }

    if (body.status !== undefined && typeof body.status !== 'string') {
        errors.push('status ต้องเป็นข้อความ');
    }

    return errors;
}


router.post('/', (req, res) => {
    const errors = validateMenu(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors.join(', ')
        });
    }

    const {
        menu_name,
        description,
        category,
        price,
        image,
        status
    } = req.body;

    const sql = `
        INSERT INTO menu
        (menu_name, description, category, price, image, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            menu_name,
            description,
            category,
            price,
            image,
            status
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'เพิ่มเมนูไม่สำเร็จ',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'เพิ่มเมนูสำเร็จ',
                menu_id: result.insertId
            });
        }
    );
});


// ===============================
// API แก้ไขเมนูอาหาร
// ===============================
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const errors = validateMenu(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors.join(', ')
        });
    }

    const {
        menu_name,
        description,
        category,
        price,
        image,
        status
    } = req.body;

    const sql = `
        UPDATE menu
        SET menu_name = ?,
            description = ?,
            category = ?,
            price = ?,
            image = ?,
            status = ?
        WHERE menu_id = ?
    `;

    db.query(
        sql,
        [
            menu_name,
            description,
            category,
            price,
            image,
            status,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'แก้ไขเมนูไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบเมนูที่ต้องการแก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'แก้ไขเมนูสำเร็จ'
            });
        }
    );
});


// ===============================
// API ลบเมนูอาหาร
// ===============================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'DELETE FROM menu WHERE menu_id = ?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'ลบเมนูไม่สำเร็จ',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบเมนูที่ต้องการลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบเมนูสำเร็จ'
            });
        }
    );
});


// ===============================
// ส่ง Router กลับไปให้ server.js
// ===============================
module.exports = router;