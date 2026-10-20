-- ======================================================
-- Migration 001: เพิ่ม QR token สำหรับลูกค้าเข้าหน้าสั่งอาหาร
-- และเพิ่มคอลัมน์ price ใน order_item สำหรับเก็บราคาขายจริง
-- ======================================================
-- เป้าหมาย:
-- 1. เพิ่มคอลัมน์ qr_token ในตาราง service_session
--    QR จะผูกกับ service_session (ไม่ใช่โต๊ะ) สร้างตอนเปิด session
--    ลูกค้าใช้ token นี้ผ่าน header X-Session-Token เพื่อเรียก API ลูกค้า
-- 2. เพิ่มคอลัมน์ price ใน order_item เพื่อบันทึกราคาขายจริง
--    (เมนูในแพ็กเกจ = 0, เมนูนอกแพ็กเกจ = menu.price)
-- ======================================================

-- คำสั่งหลัก 1: เพิ่มคอลัมน์ qr_token หลัง session_id
ALTER TABLE service_session
    ADD COLUMN qr_token VARCHAR(64) NULL UNIQUE AFTER session_id;

-- คำอธิบาย:
-- - VARCHAR(64) รองรับ token จาก crypto.randomBytes(32).toString('hex') = 64 ตัวอักษร
-- - UNIQUE สร้าง index ให้อัตโนมัติ ไม่ต้อง ADD INDEX เพิ่ม
-- - NULL ชั่วคราว เพราะ session เก่าอาจยังไม่มี token

-- คำสั่งหลัก 2: เพิ่มคอลัมน์ price ใน order_item
ALTER TABLE order_item
    ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER menu_id;

-- ======================================================
-- ROLLBACK (ใช้เฉพาะเมื่อต้องการย้อนกลับ)
-- ======================================================
-- ALTER TABLE service_session DROP COLUMN qr_token;
-- ALTER TABLE order_item DROP COLUMN price;
