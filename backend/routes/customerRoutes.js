const express = require('express');
const router = express.Router();
const db = require('../config/database');
const verifySessionToken = require('../middleware/sessionToken');

const safeError = {
    success: false,
    message: 'เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง'
};

// GET /customer/session - ข้อมูล session ของลูกค้า
router.get('/session', verifySessionToken, (req, res) => {
    const session = req.session;

    res.json({
        success: true,
        data: {
            session_id: session.session_id,
            table_id: session.table_id,
            table_number: session.table_number,
            package_id: session.package_id,
            package_name: session.package_name,
            package_price: session.package_price,
            customer_count: session.customer_count
        }
    });
});

// GET /customer/menu - เมนูที่ขายได้ พร้อมบอกฟรีหรือจ่ายเพิ่ม
router.get('/menu', verifySessionToken, (req, res) => {
    const session = req.session;

    const sql = `
        SELECT
            m.menu_id,
            m.menu_name,
            m.description,
            m.category,
            m.price,
            m.image,
            CASE
                WHEN pm.package_menu_id IS NOT NULL THEN 0
                ELSE m.price
            END AS final_price,
            CASE
                WHEN pm.package_menu_id IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS is_included_in_package
        FROM menu m
        LEFT JOIN package_menu pm
            ON pm.menu_id = m.menu_id
            AND pm.package_id = ?
        WHERE m.status = 'ขายได้'
        ORDER BY m.category, m.menu_name
    `;

    db.query(sql, [session.package_id], (err, results) => {
        if (err) {
            console.error('customer menu error:', err.message);
            return res.status(500).json(safeError);
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// POST /customer/order - สั่งอาหาร
router.post('/order', verifySessionToken, (req, res) => {
    const session = req.session;
    const items = req.body.items;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุรายการอาหารที่ต้องการสั่ง'
        });
    }

    if (items.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'สามารถสั่งได้สูงสุด 30 รายการต่อครั้ง'
        });
    }

    for (const item of items) {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
            return res.status(400).json({
                success: false,
                message: 'จำนวนต่อรายการต้องเป็นจำนวนเต็ม 1-20'
            });
        }
    }

    const menuIds = items.map(i => i.menu_id);

    db.getConnection((err, connection) => {
        if (err) {
            console.error('order connection error:', err.message);
            return res.status(500).json(safeError);
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('order beginTransaction error:', err.message);
                return res.status(500).json(safeError);
            }

            const menuSql = `
                SELECT
                    m.menu_id,
                    m.price,
                    m.status,
                    CASE
                        WHEN pm.package_menu_id IS NOT NULL THEN 0
                        ELSE m.price
                    END AS final_price
                FROM menu m
                LEFT JOIN package_menu pm
                    ON pm.menu_id = m.menu_id
                    AND pm.package_id = ?
                WHERE m.menu_id IN (?) AND m.status = 'ขายได้'
            `;

            connection.query(menuSql, [session.package_id, menuIds], (err, menuResults) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('order menu query error:', err.message);
                        return res.status(500).json(safeError);
                    });
                }

                const menuMap = {};
                for (const row of menuResults) {
                    menuMap[row.menu_id] = row;
                }

                for (const item of items) {
                    if (!menuMap[item.menu_id]) {
                        return connection.rollback(() => {
                            connection.release();
                            return res.status(400).json({
                                success: false,
                                message: 'พบรายการอาหารที่ไม่มีหรือไม่เปิดขาย'
                            });
                        });
                    }
                }

                const orderSql = `
                    INSERT INTO orders (session_id, order_status, created_at)
                    VALUES (?, 'รอดำเนินการ', NOW())
                `;

                connection.query(orderSql, [session.session_id], (err, orderResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('order insert error:', err.message);
                            return res.status(500).json(safeError);
                        });
                    }

                    const orderId = orderResult.insertId;

                    const itemValues = [];
                    const itemParams = [];

                    for (const item of items) {
                        const menu = menuMap[item.menu_id];
                        itemValues.push('(?, ?, ?, ?)');
                        itemParams.push(
                            orderId,
                            item.menu_id,
                            item.quantity,
                            menu.final_price
                        );
                    }

                    const itemSql = `
                        INSERT INTO order_item
                        (order_id, menu_id, quantity, price)
                        VALUES ${itemValues.join(', ')}
                    `;

                    connection.query(itemSql, itemParams, (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('order item insert error:', err.message);
                                return res.status(500).json(safeError);
                            });
                        }

                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('order commit error:', err.message);
                                    return res.status(500).json(safeError);
                                });
                            }

                            connection.release();
                            res.json({
                                success: true,
                                message: 'สั่งอาหารสำเร็จ',
                                order_id: orderId
                            });
                        });
                    });
                });
            });
        });
    });
});

// GET /customer/orders - ออเดอร์ของ session ตัวเอง
router.get('/orders', verifySessionToken, (req, res) => {
    const session = req.session;

    const sql = `
        SELECT
            o.order_id,
            o.order_status,
            o.created_at,
            oi.order_item_id,
            oi.menu_id,
            m.menu_name,
            oi.quantity,
            oi.price AS unit_price,
            (oi.quantity * oi.price) AS item_total,
            oi.note
        FROM orders o
        LEFT JOIN order_item oi ON o.order_id = oi.order_id
        LEFT JOIN menu m ON oi.menu_id = m.menu_id
        WHERE o.session_id = ?
        ORDER BY o.created_at DESC, oi.order_item_id ASC
    `;

    db.query(sql, [session.session_id], (err, results) => {
        if (err) {
            console.error('customer orders error:', err.message);
            return res.status(500).json(safeError);
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// POST /customer/bill-request - เรียกเก็บเงิน
router.post('/bill-request', verifySessionToken, (req, res) => {
    const session = req.session;

    db.getConnection((err, connection) => {
        if (err) {
            console.error('bill request connection error:', err.message);
            return res.status(500).json(safeError);
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('bill request beginTransaction error:', err.message);
                return res.status(500).json(safeError);
            }

            const checkSql = `
                SELECT bill_request_id
                FROM bill_request
                WHERE session_id = ?
                  AND status != 'เสร็จสิ้น'
                  AND status != 'ยกเลิก'
                LIMIT 1
                FOR UPDATE
            `;

            connection.query(checkSql, [session.session_id], (err, existing) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('bill request check error:', err.message);
                        return res.status(500).json(safeError);
                    });
                }

                if (existing.length > 0) {
                    return connection.rollback(() => {
                        connection.release();
                        return res.status(409).json({
                            success: false,
                            message: 'คำขอเก็บเงินของโต๊ะนี้มีอยู่แล้ว'
                        });
                    });
                }

                const insertSql = `
                    INSERT INTO bill_request (session_id)
                    VALUES (?)
                `;

                connection.query(insertSql, [session.session_id], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('bill request insert error:', err.message);
                            return res.status(500).json(safeError);
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('bill request commit error:', err.message);
                                return res.status(500).json(safeError);
                            });
                        }

                        connection.release();
                        res.json({
                            success: true,
                            message: 'ส่งคำขอเก็บเงินเรียบร้อย',
                            bill_request_id: result.insertId
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
