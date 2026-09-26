const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const db = require('../config/database');


/* =========================
   POST /auth/login
========================= */

router.post('/login', (req, res) => {

    const { username, password } = req.body;

    // ตรวจสอบข้อมูล
    if (!username || !password) {

        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        });

    }


    // ค้นหา Admin
    const sql = `
        SELECT
            admin_id,
            username,
            password_hash,
            full_name,
            status
        FROM admin_user
        WHERE username = ?
        LIMIT 1
    `;


    db.query(
        sql,
        [username],
        async (err, results) => {

            if (err) {

                console.error(
                    'Login Error:',
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: 'เกิดข้อผิดพลาดของระบบ'
                });

            }


            // ไม่พบ Username
            if (results.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
                });

            }


            const admin = results[0];


            // ตรวจสอบสถานะบัญชี
            if (admin.status !== 'ใช้งาน') {

                return res.status(403).json({
                    success: false,
                    message: 'บัญชีนี้ถูกปิดใช้งาน'
                });

            }


            // ตรวจสอบ Password
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    admin.password_hash
                );


            if (!passwordMatch) {

                return res.status(401).json({
                    success: false,
                    message:
                        'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
                });

            }


            // สร้าง Token
            const token = jwt.sign(
                {
                    admin_id: admin.admin_id,
                    username: admin.username,
                    full_name: admin.full_name
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: '8h'
                }
            );


            // Login สำเร็จ
            res.json({

                success: true,

                message: 'เข้าสู่ระบบสำเร็จ',

                token: token,

                admin: {
                    admin_id: admin.admin_id,
                    username: admin.username,
                    full_name: admin.full_name
                }

            });

        }
    );

});


/* =========================
   Export Router
========================= */

module.exports = router;