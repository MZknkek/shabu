# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run Backend Server**: `cd backend && npm start` (runs Express app on port 3000)
- **Test Database Connection**: `curl http://localhost:3000/test-db`
- **Frontend Development**: Serve `frontend/` using VS Code Live Server or static HTTP server.

## Architecture & Structure

**Premium Suki** is a restaurant management system consisting of:

- **`backend/`**: Node.js & Express REST API using `mysql2` to connect to a MySQL database named `premium_suki`.
  - **`server.js`**: Application entry point, configures CORS, JSON parsing, Multer image upload middleware, and mounts all API routes.
  - **`routes/`**: Modular route handlers for entities like menus, orders, tables, payments, promotions, and authentication.
  - **`config/database.js`**: MySQL database connection configuration.
- **`frontend/`**: Client-side web application interface.
  - **`admin/`**: Management panels including dashboard, menu, stock, orders, tables, and promotions.
  - **`customer/`**: Customer-facing interfaces for viewing menus, placing orders, and handling payments.
  - **`images/`**: Uploaded assets storage directory.

## สรุปสิ่งที่ได้ดำเนินการเพื่อรองรับการย้ายเครื่อง (Summary of Changes)

1. **เพิ่มการรองรับ Environment Variables ในการเชื่อมต่อฐานข้อมูล**:
   - ปรับปรุงไฟล์ `backend/config/database.js` ให้ดึงค่าคอนฟิก (Host, User, Password, Database) ผ่าน `process.env`
   - สร้างไฟล์ต้นแบบ `backend/.env.example` เพื่อให้สามารถคัดลอกและตั้งค่าคอนฟิกได้ง่ายบนเครื่องใหม่

2. **จัดทำข้อแนะนำและข้อควรระวัง (Portability Notes)**:
   - บันทึกรายละเอียดขั้นตอนการติดตั้ง การจัดการฐานข้อมูล MySQL, การติดตั้ง Dependencies (`npm install`) และการตรวจสอบ API URL ลงใน `CLAUDE.md` เพื่อให้ทีมงานหรือ Claude ตัวถัดไปสามารถนำไปรันบนเครื่องอื่นได้อย่างราบรื่น
