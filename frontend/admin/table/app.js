const API = "http://localhost:3000";

function getAuthHeaders(){
    const token = localStorage.getItem("adminToken");
    return token
        ? { "Authorization": `Bearer ${token}` }
        : {};
}

function handleUnauthorized(response){
    if(response.status === 401){
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "../login/index.html";
        return true;
    }
    return false;
}

let activeSessions = [];
let packages = [];
let timerInterval = null;

let tables = [];
let currentStatus = "";
let editingId = null;
let tableViewMode = "grid";


/* =========================
   ELEMENT
========================= */

const $ = (id) => document.getElementById(id);


/* =========================
   DATE / TIME
========================= */

function updateDateTime(){

    const now = new Date();

    const date = now.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const time = now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    $("currentDateTime").innerHTML =
        `${date}<br><b>${time}</b>`;
}

updateDateTime();

setInterval(updateDateTime, 1000);


/* =========================
   TOAST
========================= */

function showToast(message){

    const toast = $("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================
   LOAD TABLES
========================= */

async function loadTables(){

    $("tableGrid").innerHTML = `
        <div class="loading">
            กำลังโหลดข้อมูลโต๊ะ...
        </div>
    `;

    try{

        await Promise.all([
            loadActiveSessions(),
            loadPackages()
        ]);

        const response =
            await fetch(`${API}/tables`, {
                headers: getAuthHeaders()
            });

        if(handleUnauthorized(response)){
            throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        }

        if(!response.ok){
            throw new Error(
                "ไม่สามารถโหลดข้อมูลโต๊ะได้"
            );
        }

        const result =
            await response.json();

        if(Array.isArray(result)){
            tables = result;
        }
        else if(Array.isArray(result.data)){
            tables = result.data;
        }
        else if(Array.isArray(result.results)){
            tables = result.results;
        }
        else{
            tables = [];
        }

        console.log(
            "Tables:",
            tables
        );

        updateSummary();

        renderTables();

    }
    catch(error){

        console.error(
            "Load Tables Error:",
            error
        );

        $("tableGrid").innerHTML = `
            <div class="empty">
                ไม่สามารถโหลดข้อมูลโต๊ะได้
            </div>
        `;

        showToast(
            "ไม่สามารถโหลดข้อมูลโต๊ะได้"
        );

    }
}


/* =========================
   SUMMARY
========================= */

function updateSummary(){

    const total = tables.length;

    const available =
        tables.filter(
            t => t.status === "ว่าง"
        ).length;

    const occupied =
        tables.filter(
            t => t.status === "ใช้งานอยู่"
        ).length;

    const reserved =
        tables.filter(
            t => t.status === "จองแล้ว"
        ).length;


    $("totalTables").textContent =
        `${total} โต๊ะ`;

    $("availableTables").textContent =
        `${available} โต๊ะ`;

    $("occupiedTables").textContent =
        `${occupied} โต๊ะ`;

    $("reservedTables").textContent =
        `${reserved} โต๊ะ`;


    $("allCount").textContent =
        total;

    $("availableCount").textContent =
        available;

    $("occupiedCount").textContent =
        occupied;

    $("reservedCount").textContent =
        reserved;
}


/* =========================
   STATUS CLASS
========================= */

function getStatusClass(status){

    if(status === "ว่าง"){
        return "available";
    }

    if(status === "ใช้งานอยู่"){
        return "occupied";
    }

    if(status === "จองแล้ว"){
        return "reserved";
    }

    return "available";
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value){

    if(value === null || value === undefined){
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   FILTER
========================= */

function getFilteredTables(){

    const search =
        $("searchInput").value
            .trim()
            .toLowerCase();

    let result = tables.filter(table => {

        const matchesStatus =
            !currentStatus ||
            table.status === currentStatus;

        const matchesSearch =
            !search ||
            String(table.table_number || "")
                .toLowerCase()
                .includes(search);

        return matchesStatus && matchesSearch;
    });


    /* =========================
       SORT
    ========================= */

    const sortType =
        $("sortSelect").value;

    if(sortType === "number"){

        result.sort((a,b) => {

            return String(a.table_number || "")
                .localeCompare(
                    String(b.table_number || ""),
                    undefined,
                    {
                        numeric:true
                    }
                );

        });

    }


    if(sortType === "capacity"){

        result.sort(
            (a,b) =>
                Number(b.capacity || 0) -
                Number(a.capacity || 0)
        );

    }


    if(sortType === "status"){

        const order = {
            "ว่าง":1,
            "ใช้งานอยู่":2,
            "จองแล้ว":3
        };

        result.sort(
            (a,b) =>
                (order[a.status] || 99) -
                (order[b.status] || 99)
        );

    }


    return result;
}

/* =========================
   SESSION TIMER
========================= */

function formatTimeLeft(milliseconds){

    if(milliseconds <= 0){
        return "00:00:00";
    }

    const totalSeconds =
        Math.floor(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds
    ]
    .map(
        value =>
            String(value).padStart(2, "0")
    )
    .join(":");
}


function formatStartTime(dateValue){

    if(!dateValue){
        return "-";
    }

    const date =
        new Date(dateValue);

    return date.toLocaleTimeString(
        "th-TH",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    ) + " น.";
}


function getSessionForTable(tableId){

    return activeSessions.find(
        session =>
            Number(session.table_id) ===
            Number(tableId)
    );

}

/* =========================
   TABLE CARD
========================= */

function tableCard(table){

    const status =
        table.status || "ว่าง";

    const statusClass =
        getStatusClass(status);

    const tableId =
        Number(table.table_id);

    const session =
    getSessionForTable(tableId);


    return `

        <article
            class="table-card ${statusClass}"
        >

            <div class="table-card-header">

                <div class="table-image">
                    🪑
                </div>


                <div class="table-main-info">

                    <div class="table-number">
                        ${escapeHtml(
                            table.table_number || "-"
                        )}
                    </div>

                    <div class="table-capacity">
                        ${Number(
                            table.capacity || 0
                        )} ที่นั่ง
                    </div>

                    <span class="table-status">
                        ${escapeHtml(status)}
                    </span>

                </div>

            </div>


            <div class="table-info">

    ${
        status === "ใช้งานอยู่" && session
        ?
        `

        <div class="info-row">

            <span class="info-icon">
                👥
            </span>

            <span>
                ลูกค้า ${Number(session.customer_count || 0)} คน
            </span>

        </div>


        <div class="info-row">

            <span class="info-icon">
                🕐
            </span>

            <span>
                เริ่ม ${formatStartTime(session.start_time)}
            </span>

        </div>


        <div class="info-row">

            <span class="info-icon">
                ⏱️
            </span>

            <span
                class="session-timer"
                data-end-time="${session.end_time}"
            >
                กำลังคำนวณ...
            </span>

        </div>


        <div class="info-row">

            <span class="info-icon">
                🏷️
            </span>

            <span>
                ${escapeHtml(
                    session.package_name || "-"
                )}
            </span>

        </div>

        `
        :
        `

        <div class="info-row">

            <span class="info-icon">
                👥
            </span>

            <span class="info-empty">
                -
            </span>

        </div>


        <div class="info-row">

            <span class="info-icon">
                🕐
            </span>

            <span class="info-empty">
                -
            </span>

        </div>

        `
    }


    ${
        status !== "ใช้งานอยู่"
        ?
        `
        <div class="info-row">

            <span class="info-icon">
                🏷️
            </span>

            <span>
                ${escapeHtml(
                    table.qr_code || "-"
                )}
            </span>

        </div>
        `
        :
        ""
    }

</div>

</div>   <!-- ปิด table-info -->

    <div class="table-actions">

    <button
        class="detail-btn"
        onclick="viewTable(${tableId})"
    >
        ดูรายละเอียด
    </button>

    ${
        status === "ใช้งานอยู่"
        ?
        `
        <button
            class="edit-btn"
            onclick="endTableSession(${tableId})"
        >
            จบการใช้งาน
        </button>
        `
        :
        `
        <button
            class="edit-btn"
            onclick="openStartSessionModal(${table.table_id})"
        >
            เริ่มใช้งาน
        </button>
        `
    }

    </div>   <!-- ปิด table-actions -->

    </article>   <!-- ปิด table-card -->

    `;
}

/* =========================
   TABLE LIST VIEW
========================= */

function tableList(table){

    const status =
        table.status || "ว่าง";

    const tableId =
        Number(table.table_id);

    const session =
        getSessionForTable(tableId);


    let timerHtml = "-";

    if(status === "ใช้งานอยู่" && session){

        timerHtml = `
            <span
                class="session-timer"
                data-end-time="${session.end_time}"
            >
                กำลังคำนวณ...
            </span>
        `;

    }


    const actionButton =
        status === "ใช้งานอยู่"

        ?

        `
        <button
            class="list-action end"
            onclick="endTableSession(${tableId})"
        >
            จบการใช้งาน
        </button>
        `

        :

        `
        <button
            class="list-action start"
            onclick="startTableSession(${tableId})"
        >
            เริ่มใช้งาน
        </button>
        `;


    return `

        <div class="table-list-row">

            <div class="list-table-number">

                <strong>
                    ${escapeHtml(
                        table.table_number || "-"
                    )}
                </strong>

            </div>


            <div>
                ${Number(
                    table.capacity || 0
                )} ที่นั่ง
            </div>


            <div>

                <span
                    class="table-status ${getStatusClass(status)}"
                >
                    ${escapeHtml(status)}
                </span>

            </div>


            <div>

                ${
                    session
                    ?
                    escapeHtml(
                        session.package_name || "-"
                    )
                    :
                    "-"
                }

            </div>


            <div>

                ${
                    session
                    ?
                    `ลูกค้า ${Number(
                        session.customer_count || 0
                    )} คน`
                    :
                    "-"
                }

            </div>


            <div>

                ${
                    session
                    ?
                    timerHtml
                    :
                    "-"
                }

            </div>


            <div class="list-actions">

                <button
                    class="list-action detail"
                    onclick="viewTable(${tableId})"
                >
                    ดูรายละเอียด
                </button>

                ${actionButton}

            </div>

        </div>

    `;
}

/* =========================
   RENDER
========================= */

function renderTables(){

    const list =
        getFilteredTables();


    if(!list.length){

        $("tableGrid").innerHTML = `
            <div class="empty">
                ไม่พบโต๊ะที่ตรงกับเงื่อนไข
            </div>
        `;

        return;
    }


    if(tableViewMode === "grid"){

    $("tableGrid").innerHTML =
        list.map(tableCard).join("");

}
else{

    $("tableGrid").innerHTML = `

        <div class="table-list">

            <div class="table-list-header">

                <div>โต๊ะ</div>
                <div>ที่นั่ง</div>
                <div>สถานะ</div>
                <div>แพ็กเกจ</div>
                <div>ลูกค้า</div>
                <div>เวลาที่เหลือ</div>
                <div>การจัดการ</div>

            </div>

            ${list.map(tableList).join("")}

        </div>

    `;

}

updateSessionTimers();
}


/* =========================
   FILTER TAB
========================= */

document
    .querySelectorAll(".filter-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter-tab"
                    )
                    .forEach(btn => {
                        btn.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );

                currentStatus =
                    button.dataset.status || "";

                renderTables();
            }
        );

    });


/* =========================
   SEARCH
========================= */

$("searchInput")
    .addEventListener(
        "input",
        renderTables
    );


$("sortSelect")
    .addEventListener(
        "change",
        renderTables
    );

    /* =========================
   TABLE VIEW TOGGLE
========================= */

/* =========================
   TABLE VIEW TOGGLE
========================= */

const gridViewBtn = $("gridViewBtn");
const listViewBtn = $("listViewBtn");

if(gridViewBtn && listViewBtn){

    gridViewBtn.addEventListener(
        "click",
        () => {

            tableViewMode = "grid";

            gridViewBtn.classList.add("active");
            listViewBtn.classList.remove("active");

            renderTables();
        }
    );


    listViewBtn.addEventListener(
        "click",
        () => {

            tableViewMode = "list";

            listViewBtn.classList.add("active");
            gridViewBtn.classList.remove("active");

            renderTables();
        }
    );

}

/* =========================
   ADD FORM
========================= */

function openAddForm(){

    editingId = null;

    $("formTitle").textContent =
        "เพิ่มโต๊ะใหม่";

    $("tableId").value = "";

    $("tableNumber").value = "";

    $("capacity").value = "";

    $("tableStatus").value =
        "ว่าง";

    $("qrCode").value = "";

    $("formModal")
        .classList.add("show");

    setTimeout(() => {
        $("tableNumber").focus();
    }, 100);
}


$("addBtn")
    .addEventListener(
        "click",
        openAddForm
    );


/* =========================
   CLOSE FORM
========================= */

function closeForm(){

    $("formModal")
        .classList.remove("show");

    editingId = null;
}


$("closeForm")
    .addEventListener(
        "click",
        closeForm
    );


$("cancelBtn")
    .addEventListener(
        "click",
        closeForm
    );


/* =========================
   CLICK OUTSIDE MODAL
========================= */

$("formModal")
    .addEventListener(
        "click",
        event => {

            if(
                event.target ===
                $("formModal")
            ){
                closeForm();
            }

        }
    );


/* =========================
   EDIT TABLE
========================= */

function editTable(id){

    const table =
        tables.find(
            t => Number(t.table_id) === Number(id)
        );

    if(!table){

        showToast(
            "ไม่พบข้อมูลโต๊ะ"
        );

        return;
    }


    editingId =
        Number(table.table_id);


    $("formTitle").textContent =
        "แก้ไขโต๊ะ";


    $("tableId").value =
        table.table_id;


    $("tableNumber").value =
        table.table_number || "";


    $("capacity").value =
        table.capacity || "";


    $("tableStatus").value =
        table.status || "ว่าง";


    $("qrCode").value =
        table.qr_code || "";


    $("formModal")
        .classList.add("show");

}


/* =========================
   VIEW DETAIL
========================= */

/* =========================
   VIEW DETAIL
========================= */

function viewTable(id){

    const table =
        tables.find(
            t =>
                Number(t.table_id) ===
                Number(id)
        );


    if(!table){

        showToast(
            "ไม่พบข้อมูลโต๊ะ"
        );

        return;
    }


    const session =
        getSessionForTable(
            table.table_id
        );


    $("detailTableNumber")
        .textContent =
            table.table_number || "-";


    $("detailCapacity")
        .textContent =
            `${Number(
                table.capacity || 0
            )} ที่นั่ง`;


    $("detailQr")
        .textContent =
            table.qr_code || "-";


    $("detailStatus")
        .textContent =
            table.status || "-";


    /* =========================
       SESSION
    ========================= */

    const sessionBox =
        $("detailSession");

    const endButton =
        $("detailEndSession");


    if(
        table.status === "ใช้งานอยู่" &&
        session
    ){

        sessionBox.classList.remove(
            "hidden"
        );

        endButton.classList.remove(
            "hidden"
        );


        $("detailCustomer")
            .textContent =
                `${Number(
                    session.customer_count || 0
                )} คน`;


        $("detailPackage")
            .textContent =
                session.package_name || "-";


        $("detailStart")
            .textContent =
                formatStartTime(
                    session.start_time
                );


        $("detailTimer")
            .dataset.endTime =
                session.end_time;


        $("detailTimer")
            .textContent =
                "กำลังคำนวณ...";


        endButton.onclick =
            async () => {

                await endTableSession(
                    table.table_id
                );

                closeTableDetail();

            };

    }
    else{

        sessionBox.classList.add(
            "hidden"
        );

        endButton.classList.add(
            "hidden"
        );

    }


    $("tableDetailModal")
        .classList.add("show");


    updateDetailTimer();

}

/* =========================
   DETAIL MODAL TIMER
========================= */

function updateDetailTimer(){

    const timer =
        $("detailTimer");


    if(!timer){
        return;
    }


    const endTime =
        timer.dataset.endTime;


    if(!endTime){

        timer.textContent =
            "-";

        return;
    }


    const remaining =
        new Date(endTime).getTime() -
        Date.now();


    if(remaining <= 0){

        timer.textContent =
            "หมดเวลา";

        timer.classList.add(
            "timer-expired"
        );

        timer.classList.remove(
            "timer-warning",
            "timer-danger"
        );

        return;
    }


    timer.textContent =
        `เหลือ ${formatTimeLeft(
            remaining
        )}`;


    timer.classList.remove(
        "timer-warning",
        "timer-danger",
        "timer-expired"
    );


    const minutes =
        remaining / 1000 / 60;


    if(minutes <= 5){

        timer.classList.add(
            "timer-danger"
        );

    }
    else if(minutes <= 30){

        timer.classList.add(
            "timer-warning"
        );

    }

}

/* =========================
   CLOSE TABLE DETAIL
========================= */

function closeTableDetail(){

    $("tableDetailModal")
        .classList.remove("show");

}


$("closeTableDetail")
    .addEventListener(
        "click",
        closeTableDetail
    );


$("detailCloseBtn")
    .addEventListener(
        "click",
        closeTableDetail
    );


$("tableDetailModal")
    .addEventListener(
        "click",
        event => {

            if(
                event.target.id ===
                "tableDetailModal"
            ){

                closeTableDetail();

            }

        }
    );

    



/* =========================
   SAVE TABLE
========================= */

$("tableForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const tableNumber =
                $("tableNumber")
                    .value
                    .trim();


            const capacity =
                Number(
                    $("capacity").value
                );


            const status =
                $("tableStatus").value;


            const qrCode =
                $("qrCode")
                    .value
                    .trim();


            if(!tableNumber){

                showToast(
                    "กรุณากรอกเลขโต๊ะ"
                );

                return;
            }


            if(!capacity || capacity < 1){

                showToast(
                    "กรุณาระบุจำนวนที่นั่ง"
                );

                return;
            }


            const data = {

                table_number:
                    tableNumber,

                capacity:
                    capacity,

                status:
                    status,

                qr_code:
                    qrCode || null

            };


            try{

                let response;


                /* =========================
                   UPDATE
                ========================= */

                if(editingId){

                    response =
                        await fetch(
                            `${API}/tables/${editingId}`,
                            {
                                method:"PUT",

                                headers:{
                                    ...getAuthHeaders(),
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(data)
                            }
                        );

                }


                /* =========================
                   INSERT
                ========================= */

                else{

                    response =
                        await fetch(
                            `${API}/tables`,
                            {
                                method:"POST",

                                headers:{
                                    ...getAuthHeaders(),
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(data)
                            }
                        );

                }


                const result =
                    await response.json();


                if(!response.ok){

                    throw new Error(
                        result.message ||
                        "บันทึกข้อมูลไม่สำเร็จ"
                    );

                }


                showToast(
                    editingId
                    ? "แก้ไขโต๊ะสำเร็จ"
                    : "เพิ่มโต๊ะสำเร็จ"
                );


                closeForm();


                await loadTables();

            }
            catch(error){

                console.error(
                    "Save Table Error:",
                    error
                );

                showToast(
                    error.message ||
                    "เกิดข้อผิดพลาด"
                );

            }

        }
    );


/* =========================
   DELETE TABLE
========================= */

async function deleteTable(id){

    const table =
        tables.find(
            t => Number(t.table_id) === Number(id)
        );


    if(!table){

        showToast(
            "ไม่พบข้อมูลโต๊ะ"
        );

        return;
    }


    const confirmed =
        confirm(
            `ต้องการลบโต๊ะ ${table.table_number} ใช่หรือไม่?`
        );


    if(!confirmed){
        return;
    }


    try{

        const response =
            await fetch(
                `${API}/tables/${id}`,
                {
                    method:"DELETE",
                    headers: getAuthHeaders()
                }
            );


        if(handleUnauthorized(response)){
            return;
        }


        const result =
            await response.json();


        if(!response.ok){

            throw new Error(
                result.message ||
                "ลบโต๊ะไม่สำเร็จ"
            );

        }


        showToast(
            "ลบโต๊ะสำเร็จ"
        );


        await loadTables();

    }
    catch(error){

        console.error(
            "Delete Table Error:",
            error
        );

        showToast(
            error.message ||
            "เกิดข้อผิดพลาด"
        );

    }
}


/* =========================
   HAMBURGER
========================= */

const hamburger =
    document.querySelector(
        ".hamburger"
    );

if(hamburger){

    hamburger.addEventListener(
        "click",
        () => {
            $("sidebar")?.classList.toggle(
                "show"
            );
        }
    );

}

/* =========================
   START TABLE SESSION
========================= */

let selectedStartTable = null;
let selectedStartPackage = null;


function openStartSessionModal(tableId){

    const table =
        tables.find(
            t =>
                Number(t.table_id) ===
                Number(tableId)
        );


    if(!table){

        showToast("ไม่พบข้อมูลโต๊ะ");

        return;
    }


    if(
        table.status !== "ว่าง" &&
        table.status !== "ว่าง "
    ){

        showToast(
            "โต๊ะนี้ไม่ว่าง ไม่สามารถเริ่มใช้งานได้"
        );

        return;
    }


    if(packages.length === 0){

        showToast(
            "ไม่พบข้อมูลแพ็กเกจ"
        );

        return;
    }


    selectedStartTable = table;
    selectedStartPackage = null;


    $("startSessionTableName").textContent =
        `โต๊ะ ${table.table_number}`;


    const packageBox =
        $("packageOptions");


    packageBox.innerHTML = "";


    packages
        .filter(
            p =>
                p.status === "เปิดบริการ"
        )
        .forEach(
            p => {

                const option =
                    document.createElement("div");

                option.className =
                    "package-option";


                option.innerHTML = `

                    <div class="package-info">

                        <div class="package-name">
                            ${escapeHtml(
                                p.package_name
                            )}
                        </div>

                        <div class="package-detail">
                            ${Number(p.duration)} นาที
                        </div>

                    </div>


                    <div class="package-price">
                        ฿ ${Number(
                            p.price || 0
                        ).toLocaleString()}
                    </div>


                    <input
                        type="radio"
                        name="startPackage"
                        class="package-radio"
                        value="${p.package_id}"
                    >

                `;


                option.addEventListener(
                    "click",
                    () => {

                        selectedStartPackage =
                            p;


                        document
                            .querySelectorAll(
                                ".package-option"
                            )
                            .forEach(
                                el =>
                                    el.classList.remove(
                                        "selected"
                                    )
                            );


                        option.classList.add(
                            "selected"
                        );


                        const radio =
                            option.querySelector(
                                ".package-radio"
                            );


                        radio.checked = true;

                    }
                );


                packageBox.appendChild(
                    option
                );

            }
        );


    $("customerCount").value = 1;


    $("startSessionModal")
        .classList.add("show");

}


function closeStartSessionModal(){

    $("startSessionModal")
        .classList.remove("show");

    selectedStartTable = null;

    selectedStartPackage = null;

}


/* =========================
   CONFIRM START
========================= */

async function confirmStartTableSession(){

    if(!selectedStartTable){

        showToast(
            "ไม่พบโต๊ะ"
        );

        return;
    }


    if(!selectedStartPackage){

        showToast(
            "กรุณาเลือกแพ็กเกจ"
        );

        return;
    }


    const customerCount =
        Number(
            $("customerCount").value
        );


    if(
        !customerCount ||
        customerCount < 1
    ){

        showToast(
            "กรุณาระบุจำนวนลูกค้า"
        );

        return;
    }


    if(
        customerCount >
        Number(selectedStartTable.capacity)
    ){

        showToast(
            `โต๊ะนี้รองรับได้สูงสุด ${selectedStartTable.capacity} คน`
        );

        return;
    }


    try{

        const response =
            await fetch(
                `${API}/service_sessions`,
                {
                    method:"POST",

                    headers:{
                        ...getAuthHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            table_id:
                                selectedStartTable.table_id,

                            package_id:
                                selectedStartPackage.package_id,

                            customer_count:
                                customerCount

                        })
                }
            );


        const result =
            await response.json();


        if(!response.ok){

            throw new Error(
                result.message ||
                "ไม่สามารถเริ่มใช้งานโต๊ะได้"
            );

        }


        closeStartSessionModal();


        showToast(
            `เริ่มใช้งานโต๊ะ ${selectedStartTable.table_number} สำเร็จ`
        );


        await loadTables();


        await loadActiveSessions();

    }
    catch(error){

        console.error(
            "Start Session Error:",
            error
        );


        showToast(
            error.message ||
            "เกิดข้อผิดพลาด"
        );

    }

}

/* =========================
   LOGOUT
========================= */

$("logoutButton")
    .addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "ต้องการออกจากระบบใช่หรือไม่?"
                );

            if(!confirmed){
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
   END TABLE SESSION
========================= */

async function endTableSession(tableId){

    const session =
        activeSessions.find(
            s =>
                Number(s.table_id) ===
                Number(tableId)
        );


    if(!session){

        showToast(
            "ไม่พบ Session ที่กำลังใช้งาน"
        );

        return;
    }


    const confirmed =
        confirm(
`ต้องการจบการใช้งานโต๊ะ ${session.table_number} ใช่หรือไม่?

แพ็กเกจ: ${session.package_name}
ลูกค้า: ${session.customer_count} คน`
        );


    if(!confirmed){
        return;
    }


    try{

        const response =
            await fetch(
                `${API}/service_sessions/${session.session_id}/end`,
                {
                    method:"PUT",
                    headers: getAuthHeaders()
                }
            );


        if(handleUnauthorized(response)){
            return;
        }


        const result =
            await response.json();


        if(!response.ok){

            throw new Error(
                result.message ||
                "ไม่สามารถจบการใช้งานได้"
            );

        }


        showToast(
            `จบการใช้งาน ${session.table_number} แล้ว`
        );


        await loadTables();

    }
    catch(error){

        console.error(
            "End Session Error:",
            error
        );

        showToast(
            error.message ||
            "เกิดข้อผิดพลาด"
        );

    }

}
/* =========================
   INITIAL LOAD
========================= */

/* =========================
   LOAD ACTIVE SESSIONS
========================= */

async function loadActiveSessions(){

    try{

        const response =
            await fetch(
                `${API}/service_sessions/active`,
                {
                    headers: getAuthHeaders()
                }
            );

        if(handleUnauthorized(response)){
            throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        }

        const result =
            await response.json();

        if(!response.ok){
            throw new Error(
                result.message ||
                "ไม่สามารถโหลด Session ได้"
            );
        }

        activeSessions =
            Array.isArray(result.data)
                ? result.data
                : [];

        console.log(
            "Active Sessions:",
            activeSessions
        );

    }
    catch(error){

        console.error(
            "Load Active Sessions Error:",
            error
        );

        activeSessions = [];

    }
}


/* =========================
   LOAD PACKAGES
========================= */

async function loadPackages(){

    try{

        const response =
            await fetch(
                `${API}/packages`,
                {
                    headers: getAuthHeaders()
                }
            );

        if(handleUnauthorized(response)){
            throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        }

        const result =
            await response.json();

        if(!response.ok){
            throw new Error(
                result.message ||
                "ไม่สามารถโหลดแพ็กเกจได้"
            );
        }

        if(Array.isArray(result)){
            packages = result;
        }
        else if(Array.isArray(result.data)){
            packages = result.data;
        }
        else{
            packages = [];
        }

        console.log(
            "Packages:",
            packages
        );

    }
    catch(error){

        console.error(
            "Load Packages Error:",
            error
        );

        packages = [];

    }
}

/* =========================
   UPDATE SESSION TIMERS
========================= */

function updateSessionTimers(){

    const timerElements =
        document.querySelectorAll(
            ".session-timer"
        );


    timerElements.forEach(timer => {

        const endTime =
            new Date(
                timer.dataset.endTime
            ).getTime();


        const now =
            Date.now();


        const remaining =
            endTime - now;


        if(remaining <= 0){

            timer.textContent =
                "หมดเวลา";

            timer.classList.add(
                "timer-expired"
            );

            timer.classList.remove(
                "timer-warning",
                "timer-danger"
            );

            return;
        }


        timer.textContent =
            `เหลือ ${formatTimeLeft(remaining)}`;


        timer.classList.remove(
            "timer-warning",
            "timer-danger"
        );


        const remainingMinutes =
            remaining / 1000 / 60;


        if(remainingMinutes <= 5){

            timer.classList.add(
                "timer-danger"
            );

        }
        else if(remainingMinutes <= 30){

            timer.classList.add(
                "timer-warning"
            );

        }

    });

}

loadTables();

updateSessionTimers();

timerInterval =
    setInterval(
        () => {

            updateSessionTimers();

            updateDetailTimer();

        },
        1000
    );

    /* =========================
   START SESSION MODAL EVENTS
========================= */

$("closeStartSession")
    ?.addEventListener(
        "click",
        closeStartSessionModal
    );


$("cancelStartSession")
    ?.addEventListener(
        "click",
        closeStartSessionModal
    );


$("confirmStartSession")
    ?.addEventListener(
        "click",
        confirmStartTableSession
    );


$("increaseCustomer")
    ?.addEventListener(
        "click",
        () => {

            const input =
                $("customerCount");

            const max =
                selectedStartTable
                    ? Number(
                        selectedStartTable.capacity
                    )
                    : 99;


            const current =
                Number(input.value) || 1;


            if(current < max){

                input.value =
                    current + 1;

            }

        }
    );


$("decreaseCustomer")
    ?.addEventListener(
        "click",
        () => {

            const input =
                $("customerCount");


            const current =
                Number(input.value) || 1;


            if(current > 1){

                input.value =
                    current - 1;

            }

        }
    );


$("startSessionModal")
    ?.addEventListener(
        "click",
        (event) => {

            if(
                event.target.id ===
                "startSessionModal"
            ){

                closeStartSessionModal();

            }

        }
    );