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
        SELECT
            ss.session_id,
            ss.table_id,
            ss.package_id,
            ss.customer_count,
            rt.table_number,
            bp.package_name,
            bp.price AS package_price
        FROM service_session ss
        LEFT JOIN restaurant_table rt ON ss.table_id = rt.table_id
        LEFT JOIN buffet_package bp ON ss.package_id = bp.package_id
        WHERE ss.qr_token = ?
          AND ss.status = 'ใช้งานอยู่'
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

        req.session = results[0];
        next();
    });
};

module.exports = verifySessionToken;
