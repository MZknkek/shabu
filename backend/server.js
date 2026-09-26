require('dotenv').config();

const path = require('path');
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../frontend/images'));
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');

        cb(null, Date.now() + '_' + name + ext);
    }
});

const uploadImage = multer({
    storage: imageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF'));
        }
    }
});

app.use('/images', express.static(
    path.join(__dirname, '../frontend/images')
));

// ===============================
// Routes
// ===============================
const tableRoutes = require('./routes/tableRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const packageRoutes = require('./routes/packageRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const menuRoutes = require('./routes/menuRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const packageMenuRoutes = require('./routes/packageMenuRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const serviceSessionRoutes = require('./routes/serviceSessionRoutes');
const receiptRoutes = require('./routes/receiptRoutes');

const authRoutes = require('./routes/authRoutes');

// ===============================
// หน้าแรก
// ===============================
app.get('/', (req, res) => {
    res.send('Premium Suki Backend ทำงานปกติแล้ว!');
});


// ===============================
// ทดสอบการเชื่อมต่อฐานข้อมูล
// ===============================
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 AS test', (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ',
                error: err.message
            });
        }

        res.json({
            success: true,
            message: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
            data: results
        });
    });
});


// ===============================
// ใช้งาน Routes
// ===============================
app.use('/auth', authRoutes);

app.use('/tables', tableRoutes);
app.use('/packages', packageRoutes);
app.use('/menus', menuRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/promotions', promotionRoutes);
app.use('/service_sessions', serviceSessionRoutes);
app.use('/package_menus', packageMenuRoutes);
app.use('/recipes', recipeRoutes);
app.use('/orders', orderRoutes);
app.use('/order_items', orderItemRoutes);
app.use('/payments', paymentRoutes);
app.use('/receipts', receiptRoutes);

app.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาเลือกรูปภาพ'
        });
    }

    res.json({
        success: true,
        message: 'อัปโหลดรูปสำเร็จ',
        image: `/images/${req.file.filename}`
    });
});


// ===============================
// เปิด Server
// ===============================
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});