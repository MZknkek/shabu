const db = require('../config/database');

const verifySessionToken = (req, res, next) => {
    const token = req.headers['x-session-token'];

    if (!token || typeof token !== 'string') {
        return res.status(401).json({
            success: false,
            message: 'กรุณาระบุ session token'
        });
    }

    const sql = `
        SELECT session_id, table_id
        FROM service_session
        WHERE qr_token = ?
          AND status = 'ใช้งานอยู่'
        LIMIT 1
    `;

    db.query(sql, [token], (err, results) => {
        if (err) {
            console.error('verifySessionToken error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถตรวจสอบ session ได้'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'session token ไม่ถูกต้องหรือหมดอายุ'
            });
        }

        req.session_id = results[0].session_id;
        req.table_id = results[0].table_id;
        next();
    });
};

module.exports = verifySessionToken;
