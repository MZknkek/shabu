const API = "http://localhost:3000";

const $ = (id) => document.getElementById(id);


/* =========================
   ตรวจสอบ Login
========================= */

const token = localStorage.getItem("adminToken");
const adminUser = localStorage.getItem("adminUser");

if (!token) {

    window.location.href =
        "../login/index.html";

}


/* =========================
   แสดงชื่อ Admin
========================= */

if (adminUser) {

    try {

        const admin = JSON.parse(adminUser);

        $("adminName").textContent =
            admin.full_name || "Admin";

    } catch (error) {

        console.error(
            "อ่านข้อมูล Admin ไม่สำเร็จ:",
            error
        );

    }

}


/* =========================
   วันที่และเวลา
========================= */

function updateDateTime() {

    const now = new Date();

    const date = now.toLocaleDateString(
        "th-TH",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    const time = now.toLocaleTimeString(
        "th-TH",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

    $("currentDateTime").innerHTML =
        `${date}<br><b>${time}</b>`;

}

updateDateTime();

setInterval(
    updateDateTime,
    1000
);


/* =========================
   Fetch API
========================= */

async function fetchData(url) {

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );

    }

    const data = await response.json();

    /*
        รองรับทั้งกรณี Backend ส่ง
        Array โดยตรง
        หรือ { data: [] }
    */

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];

}


/* =========================
   ตรวจสอบว่าเป็นข้อมูลวันนี้
========================= */

function isToday(value) {

    if (!value) {
        return false;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );

}


/* =========================
   แปลงตัวเลข
========================= */

function number(value) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;

}


/* =========================
   หา Field จากหลายชื่อ
========================= */

function getValue(obj, names) {

    for (const name of names) {

        if (
            obj[name] !== undefined &&
            obj[name] !== null
        ) {

            return obj[name];

        }

    }

    return null;

}


/* =========================
   โหลด Dashboard
========================= */

async function loadDashboard() {

    try {

        const [
            tables,
            sessions,
            orders,
            payments
        ] = await Promise.all([

            fetchData(
                `${API}/tables`
            ),

            fetchData(
                `${API}/service_sessions`
            ),

            fetchData(
                `${API}/orders`
            ),

            fetchData(
                `${API}/payments`
            )

        ]);


        console.log("Dashboard Tables:", tables);
        console.log("Dashboard Sessions:", sessions);
        console.log("Dashboard Orders:", orders);
        console.log("Dashboard Payments:", payments);


        updateCustomerCount(
            sessions
        );

        updateTableSummary(
            tables
        );

        updateOrderSummary(
            orders
        );

        updateSalesSummary(
            payments
        );

        updateRecentOrders(
            orders
        );

        updateTableStatus(
            tables
        );


    } catch (error) {

        console.error(
            "โหลด Dashboard ไม่สำเร็จ:",
            error
        );

        showLoadError();

    }

}


/* =========================
   จำนวนลูกค้าวันนี้
========================= */

function updateCustomerCount(sessions) {

    const todaySessions =
        sessions.filter(session => {

            const date = getValue(
                session,
                [
                    "created_at",
                    "start_time",
                    "session_date",
                    "service_date"
                ]
            );

            return isToday(date);

        });


    let totalCustomers = 0;


    todaySessions.forEach(session => {

        totalCustomers += number(
            getValue(
                session,
                [
                    "customer_count",
                    "customers",
                    "guest_count",
                    "number_of_customers"
                ]
            )
        );

    });


    $("customerCount").textContent =
        `${totalCustomers} คน`;

}


/* =========================
   โต๊ะ
========================= */

function updateTableSummary(tables) {

    const total =
        tables.length;

    let occupied = 0;


    tables.forEach(table => {

        const status =
            String(
                getValue(
                    table,
                    [
                        "status",
                        "table_status"
                    ]
                ) || ""
            ).trim();


        if (
            status === "ใช้งานอยู่" ||
            status === "occupied" ||
            status === "ใช้งาน"
        ) {

            occupied++;

        }

    });


    $("tableCount").textContent =
        `${occupied}/${total} โต๊ะ`;


    const percentage =
        total > 0
            ? Math.round(
                (occupied / total) * 100
            )
            : 0;


    $("tableProgress").style.width =
        `${percentage}%`;

}


/* =========================
   จำนวนออเดอร์วันนี้
========================= */

function updateOrderSummary(orders) {

    const todayOrders =
        orders.filter(order => {

            const date =
                getValue(
                    order,
                    [
                        "created_at",
                        "order_date",
                        "order_time",
                        "createdAt"
                    ]
                );

            return isToday(date);

        });


    $("orderCount").textContent =
        `${todayOrders.length} รายการ`;

}


/* =========================
   ยอดขายวันนี้
========================= */

function updateSalesSummary(payments) {

    const todayPayments =
        payments.filter(payment => {

            const date =
                getValue(
                    payment,
                    [
                        "created_at",
                        "payment_date",
                        "paid_at",
                        "payment_time"
                    ]
                );

            return isToday(date);

        });


    let total = 0;


    todayPayments.forEach(payment => {

        total += number(
            getValue(
                payment,
                [
                    "total_amount",
                    "amount",
                    "payment_amount",
                    "paid_amount"
                ]
            )
        );

    });


    $("salesTotal").textContent =
        `฿ ${total.toLocaleString("th-TH")}`;

}


/* =========================
   ออเดอร์ล่าสุด
========================= */

function updateRecentOrders(orders) {

    const tbody =
        $("recentOrders");


    if (!orders.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty"
                >
                    ยังไม่มีออเดอร์
                </td>
            </tr>
        `;

        return;

    }


    const sortedOrders =
        [...orders].sort(
            (a, b) => {

                const dateA =
                    new Date(
                        getValue(
                            a,
                            [
                                "created_at",
                                "order_date",
                                "order_time"
                            ]
                        ) || 0
                    );

                const dateB =
                    new Date(
                        getValue(
                            b,
                            [
                                "created_at",
                                "order_date",
                                "order_time"
                            ]
                        ) || 0
                    );

                return dateB - dateA;

            }
        );


    const latest =
        sortedOrders.slice(0, 5);


    tbody.innerHTML =
        latest.map(
            (order, index) => {

                const orderId =
                    getValue(
                        order,
                        [
                            "order_id",
                            "id"
                        ]
                    ) || "-";


                const table =
                    getValue(
                        order,
                        [
                            "table_name",
                            "table_number",
                            "table_id"
                        ]
                    ) || "-";


                const item =
                    getValue(
                        order,
                        [
                            "menu_name",
                            "item_name",
                            "order_name"
                        ]
                    ) || "-";


                const quantity =
                    number(
                        getValue(
                            order,
                            [
                                "quantity",
                                "total_quantity"
                            ]
                        )
                    );


                const status =
                    getValue(
                        order,
                        [
                            "status",
                            "order_status"
                        ]
                    ) || "-";


                const date =
                    getValue(
                        order,
                        [
                            "created_at",
                            "order_date",
                            "order_time"
                        ]
                    );


                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                orderId
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                table
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item
                            )}
                        </td>

                        <td>
                            ${quantity}
                        </td>

                        <td>
                            ${getOrderStatus(
                                status
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                date
                            )}
                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* =========================
   สถานะออเดอร์
========================= */

function getOrderStatus(status) {

    const value =
        String(status)
            .trim();


    let className = "waiting";
    let text = value || "รอจัดเตรียม";


    if (
        value === "กำลังจัดเตรียม" ||
        value === "กำลังทำ" ||
        value === "preparing"
    ) {

        className = "preparing";

    }


    if (
        value === "เสร็จแล้ว" ||
        value === "เสร็จสิ้น" ||
        value === "completed" ||
        value === "done"
    ) {

        className = "done";

    }


    return `
        <span class="order-status ${className}">
            ${escapeHtml(text)}
        </span>
    `;

}


/* =========================
   สถานะโต๊ะ
========================= */

function updateTableStatus(tables) {

    const container =
        $("tableStatusGrid");


    if (!tables.length) {

        container.innerHTML = `
            <div class="empty">
                ไม่พบข้อมูลโต๊ะ
            </div>
        `;

        return;

    }


    container.innerHTML =
        tables.map(table => {

            const tableNumber =
                getValue(
                    table,
                    [
                        "table_number",
                        "table_name",
                        "table_code",
                        "table_id"
                    ]
                ) || "-";


            const status =
                String(
                    getValue(
                        table,
                        [
                            "status",
                            "table_status"
                        ]
                    ) || "ว่าง"
                ).trim();


            let className =
                "available";

            let statusText =
                "ว่าง";


            if (
                status === "ใช้งานอยู่" ||
                status === "ใช้งาน" ||
                status === "occupied"
            ) {

                className =
                    "occupied";

                statusText =
                    "ใช้งานอยู่";

            }


            if (
                status === "จองแล้ว" ||
                status === "reserved"
            ) {

                className =
                    "reserved";

                statusText =
                    "จองแล้ว";

            }


            return `
                <div
                    class="table-box ${className}"
                >

                    <strong>
                        ${escapeHtml(
                            tableNumber
                        )}
                    </strong>

                    <span>
                        ${statusText}
                    </span>

                </div>
            `;

        }).join("");

}


/* =========================
   เวลา
========================= */

function formatTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleTimeString(
        "th-TH",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

}


/* =========================
   Escape HTML
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================
   กรณีโหลดข้อมูลไม่ได้
========================= */

function showLoadError() {

    $("recentOrders").innerHTML = `
        <tr>
            <td
                colspan="6"
                class="empty"
            >
                ไม่สามารถโหลดข้อมูลออเดอร์ได้
            </td>
        </tr>
    `;

    $("tableStatusGrid").innerHTML = `
        <div class="empty">
            ไม่สามารถโหลดข้อมูลโต๊ะได้
        </div>
    `;

}


/* =========================
   Logout
========================= */

$("logoutButton").addEventListener(
    "click",
    () => {

        const confirmLogout =
            confirm(
                "ต้องการออกจากระบบหรือไม่?"
            );


        if (!confirmLogout) {
            return;
        }


        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminUser"
        );


        window.location.href =
            "../login/index.html";

    }
);


/* =========================
   เริ่มโหลด Dashboard
========================= */

loadDashboard();


/*
    โหลดข้อมูลใหม่ทุก 30 วินาที
*/

setInterval(
    loadDashboard,
    30000
);