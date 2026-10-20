require('dotenv').config();

const path = require('path');
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const verifyToken = require('./middleware/auth');

if (!process.env.JWT_SECRET) {
    console.error('ERROR: ไม่พบค่า JWT_SECRET ใน environment variables');
    console.error('กรุณาตั้งค่า JWT_SECRET ในไฟล์ .env ก่อนรัน Server');
    process.exit(1);
}

const app = express();
const PORT = 3000;

const allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    ...(process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
        : [])
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: origin not allowed'), false);
    }
}));

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
app.get('/test-db', verifyToken, (req, res) => {
    db.query('SELECT 1 AS test', (err, results) => {
        if (err) {
            console.error('test-db error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล'
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

app.use('/tables', verifyToken, tableRoutes);
app.use('/packages', verifyToken, packageRoutes);
app.use('/menus', verifyToken, menuRoutes);
app.use('/ingredients', verifyToken, ingredientRoutes);
app.use('/promotions', verifyToken, promotionRoutes);
app.use('/service_sessions', verifyToken, serviceSessionRoutes);
app.use('/package_menus', verifyToken, packageMenuRoutes);
app.use('/recipes', verifyToken, recipeRoutes);
app.use('/orders', verifyToken, orderRoutes);
app.use('/order_items', verifyToken, orderItemRoutes);
app.use('/payments', verifyToken, paymentRoutes);
app.use('/receipts', verifyToken, receiptRoutes);

app.post('/upload-image', verifyToken, uploadImage.single('image'), (req, res) => {
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
// จับ Route ที่ไม่พบ (404)
// ===============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบ endpoint ที่เรียก'
    });
});


// ===============================
// Error Handler กลาง
// ===============================
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});


// ===============================
// เปิด Server
// ===============================
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});