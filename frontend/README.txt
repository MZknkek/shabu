PREMIUM SUKI - หน้า "จัดการเมนูอาหาร"

1) MySQL/phpMyAdmin
เพิ่ม price ให้ตาราง menu:
ALTER TABLE menu
ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0
AFTER category;

2) Backend
นำโค้ดใน server_routes.txt ไปวางใน server.js
หลัง GET /menus

ต้องใช้:
const mysql = require('mysql2');

และใช้ callback style ให้เหมือน GET เดิม

3) Frontend
เปิดโฟลเดอร์นี้ด้วย VS Code
ใช้ Live Server เปิด index.html

4) API ที่หน้าเว็บใช้
GET    /menus
POST   /menus
PUT    /menus/:id
DELETE /menus/:id

หมายเหตุ:
ตอนนี้ช่องรูปภาพรับ "ชื่อไฟล์/URL" ก่อน
ถ้าจะทำระบบอัปโหลดไฟล์จริง ค่อยเพิ่ม multer ในขั้นถัดไป
