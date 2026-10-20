const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token ไม่ถูกต้องหรือหมดอายุ'
            });
        }

        req.admin = decoded;
        next();
    });
};

module.exports = verifyToken;
