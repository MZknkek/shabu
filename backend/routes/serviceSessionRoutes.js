const express = require('express');
const router = express.Router();
const db = require('../config/database');


/* =========================
   GET /service_sessions
   ดึง Session ทั้งหมด
========================= */

router.get('/', (req, res) => {

    const sql = `
        SELECT
            ss.session_id,
            ss.table_id,
            rt.table_number,

            ss.package_id,
            bp.package_name,
            bp.price,
            bp.duration,

            ss.customer_count,
            ss.start_time,
            ss.end_time,
            ss.status

        FROM service_session ss

        LEFT JOIN restaurant_table rt
            ON ss.table_id = rt.table_id

        LEFT JOIN buffet_package bp
            ON ss.package_id = bp.package_id

        ORDER BY ss.session_id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                'Get Service Sessions Error:',
                err.message
            );

            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึงข้อมูลการใช้งานโต๊ะได้',
                error: err.message
            });
        }


        res.json({
            success: true,
            data: results
        });

    });

});


/* =========================
   GET /service_sessions/active
   ดึงเฉพาะ Session ที่กำลังใช้งาน
========================= */

router.get('/active', (req, res) => {

    const sql = `
        SELECT
            ss.session_id,
            ss.table_id,
            rt.table_number,

            ss.package_id,
            bp.package_name,
            bp.price,
            bp.duration,

            ss.customer_count,
            ss.start_time,
            ss.end_time,
            ss.status

        FROM service_session ss

        LEFT JOIN restaurant_table rt
            ON ss.table_id = rt.table_id

        LEFT JOIN buffet_package bp
            ON ss.package_id = bp.package_id

        WHERE ss.status = 'ใช้งานอยู่'

        ORDER BY ss.start_time ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                'Get Active Sessions Error:',
                err.message
            );

            return res.status(500).json({
                success: false,
                message: 'ไม่สามารถดึง Session ที่กำลังใช้งานได้',
                error: err.message
            });
        }


        res.json({
            success: true,
            data: results
        });

    });

});


/* =========================
   GET /service_sessions/:id
   ดึง Session รายการเดียว
========================= */

router.get('/:id', (req, res) => {

    const sessionId =
        Number(req.params.id);


    if(!sessionId){

        return res.status(400).json({
            success: false,
            message: 'Session ID ไม่ถูกต้อง'
        });

    }


    const sql = `
        SELECT
            ss.session_id,
            ss.table_id,
            rt.table_number,

            ss.package_id,
            bp.package_name,
            bp.price,
            bp.duration,

            ss.customer_count,
            ss.start_time,
            ss.end_time,
            ss.status

        FROM service_session ss

        LEFT JOIN restaurant_table rt
            ON ss.table_id = rt.table_id

        LEFT JOIN buffet_package bp
            ON ss.package_id = bp.package_id

        WHERE ss.session_id = ?

        LIMIT 1
    `;


    db.query(
        sql,
        [sessionId],
        (err, results) => {

            if(err){

                console.error(
                    'Get Session Error:',
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: 'ไม่สามารถดึงข้อมูล Session ได้',
                    error: err.message
                });

            }


            if(results.length === 0){

                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูล Session'
                });

            }


            res.json({
                success: true,
                data: results[0]
            });

        }
    );

});


/* =========================
   POST /service_sessions
   เริ่มใช้งานโต๊ะ
========================= */

router.post('/', (req, res) => {

    const {
        table_id,
        package_id,
        customer_count
    } = req.body;


    if(!table_id || !package_id){

        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุโต๊ะและแพ็กเกจ'
        });

    }


    const customers =
        Number(customer_count || 1);


    if(customers < 1){

        return res.status(400).json({
            success: false,
            message: 'จำนวนลูกค้าต้องมากกว่า 0'
        });

    }


    /*
        ตรวจสอบว่าโต๊ะมีอยู่จริง
    */

    const checkTableSql = `
        SELECT
            table_id,
            table_number,
            status

        FROM restaurant_table

        WHERE table_id = ?

        LIMIT 1
    `;


    db.query(
        checkTableSql,
        [table_id],
        (tableErr, tableResults) => {

            if(tableErr){

                return res.status(500).json({
                    success: false,
                    message: 'ไม่สามารถตรวจสอบโต๊ะได้',
                    error: tableErr.message
                });

            }


            if(tableResults.length === 0){

                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบโต๊ะที่ระบุ'
                });

            }


            const table =
                tableResults[0];


            /*
                ป้องกันเปิดโต๊ะที่กำลังใช้งาน
            */

            if(table.status === 'ใช้งานอยู่'){

                return res.status(409).json({
                    success: false,
                    message: 'โต๊ะนี้กำลังถูกใช้งานอยู่'
                });

            }


            /*
                ตรวจสอบ Package
            */

            const packageSql = `
                SELECT
                    package_id,
                    package_name,
                    price,
                    duration,
                    status

                FROM buffet_package

                WHERE package_id = ?

                LIMIT 1
            `;


            db.query(
                packageSql,
                [package_id],
                (packageErr, packageResults) => {

                    if(packageErr){

                        return res.status(500).json({
                            success: false,
                            message: 'ไม่สามารถตรวจสอบแพ็กเกจได้',
                            error: packageErr.message
                        });

                    }


                    if(packageResults.length === 0){

                        return res.status(404).json({
                            success: false,
                            message: 'ไม่พบแพ็กเกจที่ระบุ'
                        });

                    }


                    const packageData =
                        packageResults[0];


                    /*
                        duration = นาที
                    */

                    const duration =
                        Number(packageData.duration);


                    if(!duration || duration <= 0){

                        return res.status(400).json({
                            success: false,
                            message: 'แพ็กเกจนี้ไม่มีระยะเวลาที่ถูกต้อง'
                        });

                    }


                    /*
                        ใช้เวลาเดียวกันทั้ง Start / End
                    */

                    const startTime =
                        new Date();


                    const endTime =
                        new Date(
                            startTime.getTime()
                            +
                            duration * 60 * 1000
                        );


                    const insertSql = `
                        INSERT INTO service_session
                        (
                            table_id,
                            package_id,
                            customer_count,
                            start_time,
                            end_time,
                            status
                        )

                        VALUES (?, ?, ?, ?, ?, ?)
                    `;


                    db.query(
                        insertSql,
                        [
                            table_id,
                            package_id,
                            customers,
                            startTime,
                            endTime,
                            'ใช้งานอยู่'
                        ],
                        (insertErr, insertResult) => {

                            if(insertErr){

                                console.error(
                                    'Create Session Error:',
                                    insertErr.message
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: 'ไม่สามารถเริ่มการใช้งานโต๊ะได้',
                                    error: insertErr.message
                                });

                            }


                            /*
                                เปลี่ยนสถานะโต๊ะ
                            */

                            const updateTableSql = `
                                UPDATE restaurant_table

                                SET status = 'ใช้งานอยู่'

                                WHERE table_id = ?
                            `;


                            db.query(
                                updateTableSql,
                                [table_id],
                                (updateErr) => {

                                    if(updateErr){

                                        console.error(
                                            'Update Table Status Error:',
                                            updateErr.message
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message: 'สร้าง Session สำเร็จ แต่เปลี่ยนสถานะโต๊ะไม่สำเร็จ',
                                            error: updateErr.message
                                        });

                                    }


                                    res.status(201).json({

                                        success: true,

                                        message:
                                            'เริ่มใช้งานโต๊ะสำเร็จ',

                                        data: {

                                            session_id:
                                                insertResult.insertId,

                                            table_id:
                                                table_id,

                                            package_id:
                                                package_id,

                                            package_name:
                                                packageData.package_name,

                                            customer_count:
                                                customers,

                                            duration:
                                                duration,

                                            start_time:
                                                startTime,

                                            end_time:
                                                endTime,

                                            status:
                                                'ใช้งานอยู่'

                                        }

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


/* =========================
   PUT /service_sessions/:id/end
   จบการใช้งานโต๊ะ
========================= */

router.put('/:id/end', (req, res) => {

    const sessionId =
        Number(req.params.id);


    if(!sessionId){

        return res.status(400).json({
            success: false,
            message: 'Session ID ไม่ถูกต้อง'
        });

    }


    /*
        ค้นหา Session ก่อน
    */

    const findSql = `
        SELECT
            session_id,
            table_id,
            status

        FROM service_session

        WHERE session_id = ?

        LIMIT 1
    `;


    db.query(
        findSql,
        [sessionId],
        (findErr, findResults) => {

            if(findErr){

                return res.status(500).json({
                    success: false,
                    message: 'ไม่สามารถค้นหา Session ได้',
                    error: findErr.message
                });

            }


            if(findResults.length === 0){

                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบ Session นี้'
                });

            }


            const session =
                findResults[0];


            if(session.status === 'จบการใช้งาน'){

                return res.status(400).json({
                    success: false,
                    message: 'Session นี้จบการใช้งานแล้ว'
                });

            }


            const endTime =
                new Date();


            /*
                เปลี่ยน Session
            */

            const updateSessionSql = `
                UPDATE service_session

                SET
                    end_time = ?,
                    status = 'จบการใช้งาน'

                WHERE session_id = ?
            `;


            db.query(
                updateSessionSql,
                [
                    endTime,
                    sessionId
                ],
                (updateErr) => {

                    if(updateErr){

                        return res.status(500).json({
                            success: false,
                            message: 'ไม่สามารถจบการใช้งานได้',
                            error: updateErr.message
                        });

                    }


                    /*
                        เปลี่ยนโต๊ะกลับเป็นว่าง
                    */

                    const updateTableSql = `
                        UPDATE restaurant_table

                        SET status = 'ว่าง'

                        WHERE table_id = ?
                    `;


                    db.query(
                        updateTableSql,
                        [session.table_id],
                        (tableErr) => {

                            if(tableErr){

                                return res.status(500).json({
                                    success: false,
                                    message: 'จบ Session แล้ว แต่เปลี่ยนสถานะโต๊ะไม่สำเร็จ',
                                    error: tableErr.message
                                });

                            }


                            res.json({

                                success: true,

                                message:
                                    'จบการใช้งานโต๊ะสำเร็จ',

                                data: {

                                    session_id:
                                        sessionId,

                                    table_id:
                                        session.table_id,

                                    end_time:
                                        endTime,

                                    status:
                                        'จบการใช้งาน'

                                }

                            });

                        }
                    );

                }
            );

        }
    );

});


module.exports = router;