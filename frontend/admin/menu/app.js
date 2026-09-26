const API = "http://localhost:3000";
let menus = [];
let selectedCategory = "";
let currentPage = 1;
const pageSize = 12;
let currentImagePath = "";

const $ = id => document.getElementById(id);

async function loadMenus(){
    $("menuGrid").innerHTML = '<div class="loading">กำลังโหลดข้อมูล...</div>';

    try{
        const response = await fetch(API + "/menus");
        const data = await response.json();

        if(!response.ok || !data.success){
            throw new Error(data.error || data.message || "โหลดข้อมูลไม่สำเร็จ");
        }

        menus = data.data || [];
        buildCategories();
        render();
    }catch(error){
        $("menuGrid").innerHTML =
            `<div class="loading">เชื่อมต่อ Backend ไม่สำเร็จ<br>${escapeHtml(error.message)}</div>`;
    }
}

function buildCategories(){
    const categories = [...new Set(menus.map(m => m.category).filter(Boolean))];

    $("categoryFilter").innerHTML =
        '<option value="">หมวดหมู่ทั้งหมด</option>' +
        categories.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");

    const counts = {};
    menus.forEach(m => counts[m.category] = (counts[m.category] || 0) + 1);

    let html = `<button class="tab ${selectedCategory === "" ? "active":""}" data-category="">▦ ทั้งหมด (<span id="totalCount">${menus.length}</span>)</button>`;

    categories.forEach(c => {
        html += `<button class="tab ${selectedCategory === c ? "active":""}" data-category="${escapeAttr(c)}">${escapeHtml(c)} (${counts[c]})</button>`;
    });

    $("categoryTabs").innerHTML = html;

    document.querySelectorAll(".tab").forEach(btn => {
        btn.onclick = () => {
            selectedCategory = btn.dataset.category;
            $("categoryFilter").value = selectedCategory;
            currentPage = 1;
            buildCategories();
            render();
        };
    });
}

function getFilteredMenus(){
    const q = $("searchInput").value.trim().toLowerCase();
    const category = selectedCategory;
    const status = $("statusFilter").value;

    return menus.filter(m => {
        const text = `${m.menu_name || ""} ${m.category || ""} ${m.description || ""}`.toLowerCase();

        return (!q || text.includes(q))
            && (!category || m.category === category)
            && (!status || m.status === status);
    });
}

function render(){
    const list = getFilteredMenus();
    const total = list.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));

    if(currentPage > maxPage) currentPage = maxPage;

    const start = (currentPage - 1) * pageSize;
    const visible = list.slice(start, start + pageSize);

    $("totalCount").textContent = menus.length;

    $("pageText").textContent =
        total
            ? `แสดง ${start + 1} - ${Math.min(start + pageSize,total)} จาก ${total} รายการ`
            : "แสดง 0 - 0 จาก 0 รายการ";

    $("currentPage").textContent = currentPage;
    $("prevPage").disabled = currentPage === 1;
    $("nextPage").disabled = currentPage === maxPage;

    if(!visible.length){
        $("menuGrid").innerHTML = '<div class="loading">ไม่พบเมนูอาหาร</div>';
        return;
    }

    $("menuGrid").innerHTML = visible.map(menuCard).join("");
}

function menuCard(m){

    const status = String(m.status || "").trim();

    const statusClass =
        status === "พร้อมขาย" ? "ready" :
        status === "หยุดขาย" ? "stopped" :
        status === "หมด" ? "soldout" :
        "soldout";

    const image = m.image
    ? `<img src="${escapeAttr(
        m.image.startsWith("http")
            ? m.image
            : API + m.image
    )}" onerror="this.style.display='none'">`
    : "🍲";

    let statusOverlay = "";

    if(status === "หยุดขาย"){

        statusOverlay = `
            <div
                class="status-overlay stopped-overlay"
                style="
                    position:absolute;
                    inset:0;
                    z-index:10;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    background:rgba(70,70,70,0.58);
                    color:#fff;
                    text-align:center;
                "
            >
                <div
                    style="
                        width:54px;
                        height:54px;
                        border-radius:50%;
                        background:#fff;
                        color:#d88900;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:27px;
                        font-weight:bold;
                        margin-bottom:8px;
                    "
                >
                    ⏸
                </div>

                <div
                    style="
                        padding:6px 14px;
                        border-radius:20px;
                        background:#d88900;
                        color:#fff;
                        font-size:15px;
                        font-weight:700;
                    "
                >
                    หยุดขายชั่วคราว
                </div>
            </div>
        `;

    }else if(status === "หมด"){

        statusOverlay = `
            <div
                class="status-overlay soldout-overlay"
                style="
                    position:absolute;
                    inset:0;
                    z-index:10;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    background:rgba(100,35,35,0.62);
                    color:#fff;
                    text-align:center;
                "
            >
                <div
                    style="
                        width:54px;
                        height:54px;
                        border-radius:50%;
                        background:#fff;
                        color:#c40000;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:30px;
                        font-weight:bold;
                        margin-bottom:8px;
                    "
                >
                    ✕
                </div>

                <div
                    style="
                        padding:6px 16px;
                        border-radius:20px;
                        background:#c40000;
                        color:#fff;
                        font-size:15px;
                        font-weight:700;
                    "
                >
                    สินค้าหมด
                </div>
            </div>
        `;
    }

    return `
        <article class="card ${statusClass}-card">

            <div
                class="card-image"
                style="position:relative;"
            >

                ${image}

                ${statusOverlay}


            </div>

            <div class="card-body">

                <h3>
                    ${escapeHtml(m.menu_name || "-")}
                </h3>

                <div class="card-info">

                    <span>
                        ${escapeHtml(m.category || "อื่นๆ")}
                    </span>

                    <span class="price">
                        ฿ ${Number(m.price || 0).toFixed(0)}
                    </span>

                </div>

                <div class="card-actions">

                    <button
                        class="edit-btn"
                        onclick="editMenu(${m.menu_id})"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteMenu(${m.menu_id})"
                    >
                        🗑️ ลบ
                    </button>

                </div>

            </div>

        </article>
    `;
}

function openAddForm(){

    $("menuForm").reset();
    $("menuId").value = "";

    $("formTitle").textContent = "เพิ่มเมนูใหม่";
    $("menuStatus").value = "พร้อมขาย";

    clearImagePreview();

    $("formPanel").style.display = "block";
}

function closeForm(){
    $("formPanel").style.display = "none";
}

function editMenu(id){
    const m = menus.find(x => Number(x.menu_id) === Number(id));

    if(!m) return;

    $("formPanel").style.display = "block";

    $("menuId").value = m.menu_id;
    $("menuName").value = m.menu_name || "";
    $("menuCategory").value = m.category || "";
    $("menuDescription").value = m.description || "";
    $("menuPrice").value = m.price || 0;
    $("menuStatus").value = m.status || "พร้อมขาย";

    // ช่อง file ไม่สามารถใส่ path เดิมกลับเข้าไปได้
    $("menuImage").value = "";

    $("formTitle").textContent = "แก้ไขเมนู";

    currentImagePath = m.image || "";

    if(m.image){
    showImagePreview(
        m.image.startsWith("http")
            ? m.image
            : API + m.image
    );
    }else{
        clearImagePreview();
    }

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}

async function deleteMenu(id){
    const m = menus.find(x => Number(x.menu_id) === Number(id));

    if(!m) return;

    if(!confirm(`ต้องการลบ "${m.menu_name}" ใช่หรือไม่?`)) return;

    try{
        const response = await fetch(`${API}/menus/${id}`, {
            method:"DELETE"
        });

        const data = await response.json();

        if(!response.ok || !data.success){
            throw new Error(data.error || data.message || "ลบไม่สำเร็จ");
        }

        showToast("ลบเมนูสำเร็จ");

        await loadMenus();

    }catch(error){
        alert("ลบไม่สำเร็จ: " + error.message);
    }
}


/* =========================================
   เลือกรูป + Preview
========================================= */

$("uploadBox").addEventListener("click", () => {
    $("menuImage").click();
});

$("menuImage").addEventListener("change", () => {

    const file = $("menuImage").files[0];

    if(!file){
        clearImagePreview();
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if(!allowedTypes.includes(file.type)){
        alert("รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF");

        $("menuImage").value = "";
        clearImagePreview();

        return;
    }

    if(file.size > 5 * 1024 * 1024){
        alert("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB");

        $("menuImage").value = "";
        clearImagePreview();

        return;
    }

    const reader = new FileReader();

    reader.onload = event => {
        showImagePreview(event.target.result);
    };

    reader.readAsDataURL(file);
});


function showImagePreview(src){

    $("imagePreview").innerHTML = `
        <img src="${escapeAttr(src)}" alt="Preview">
    `;

    $("uploadContent").style.display = "none";
}


function clearImagePreview(){

    $("imagePreview").innerHTML = "";

    $("uploadContent").style.display = "flex";
}


/* =========================================
   เพิ่ม / แก้ไขเมนู
========================================= */

$("menuForm").addEventListener("submit", async e => {

    e.preventDefault();

    const id = $("menuId").value;

    const body = {
        menu_name: $("menuName").value.trim(),
        description: $("menuDescription").value.trim(),
        category: $("menuCategory").value,
        price: Number($("menuPrice").value || 0),
        status: $("menuStatus").value
    };

    if(!body.menu_name){
        alert("กรุณากรอกชื่อเมนู");
        return;
    }

    try{

        let imagePath = null;

        /* =========================
           อัปโหลดรูปก่อน
        ========================= */

        const imageFile = $("menuImage").files[0];

        if(imageFile){

            const formData = new FormData();

            formData.append("image", imageFile);

            const uploadResponse = await fetch(
                API + "/upload-image",
                {
                    method:"POST",
                    body:formData
                }
            );

            const uploadData = await uploadResponse.json();

            if(!uploadResponse.ok || !uploadData.success){
                throw new Error(
                    uploadData.error ||
                    uploadData.message ||
                    "อัปโหลดรูปไม่สำเร็จ"
                );
            }

            imagePath = uploadData.image;
        }


        /* =========================
           ถ้ามีรูปใหม่ ให้ใส่ path
        ========================= */

        if(imagePath){
            body.image = imagePath;
        }else if(currentImagePath){
            body.image = currentImagePath;
        }


        /* =========================
           บันทึกเมนู
        ========================= */

        const response = await fetch(
            API + "/menus" + (id ? "/" + id : ""),
            {
                method: id ? "PUT" : "POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(body)
            }
        );

        const data = await response.json();

        if(!response.ok || !data.success){
            throw new Error(
                data.error ||
                data.message ||
                "บันทึกไม่สำเร็จ"
            );
        }

        showToast(
            id
                ? "แก้ไขเมนูสำเร็จ"
                : "เพิ่มเมนูสำเร็จ"
        );

        await loadMenus();

        closeForm();

    }catch(error){

        alert("บันทึกไม่สำเร็จ: " + error.message);

    }

});


/* =========================================
   ปุ่มต่าง ๆ
========================================= */

$("addBtn").onclick = openAddForm;

$("closeForm").onclick = closeForm;
$("cancelBtn").onclick = closeForm;

$("importExportBtn").onclick = () => {
    $("importExportModal").style.display = "flex";
};

$("closeImportExport").onclick = () => {
    $("importExportModal").style.display = "none";
};

$("exportDataBtn").onclick = () => {
    exportMenus();
    $("importExportModal").style.display = "none";
};

$("importDataBtn").onclick = () => {
    $("importExportModal").style.display = "none";
    $("importFile").click();
};


$("importFile").addEventListener("change", async () => {

    const file = $("importFile").files[0];

    if(!file){
        return;
    }

    if(!file.name.toLowerCase().endsWith(".csv")){
        alert("กรุณาเลือกไฟล์ CSV เท่านั้น");
        $("importFile").value = "";
        return;
    }

    try{

        const text = await file.text();

        const rows = parseCSV(text);

        if(rows.length < 2){
            throw new Error("ไฟล์ไม่มีข้อมูลเมนู");
        }

        const headers = rows[0];

        const requiredHeaders = [
            "menu_name",
            "description",
            "category",
            "price",
            "status"
        ];

        const missing = requiredHeaders.filter(
            h => !headers.includes(h)
        );

        if(missing.length){
            throw new Error(
                "ไฟล์ CSV ไม่ถูกต้อง ขาดข้อมูล: " +
                missing.join(", ")
            );
        }

        let successCount = 0;

        for(let i = 1; i < rows.length; i++){

            const row = rows[i];

            if(!row.length || !row[0]){
                continue;
            }

            const menu = {};

            headers.forEach((header, index) => {
                menu[header] = row[index] || "";
            });

            const response = await fetch(API + "/menus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    menu_name: menu.menu_name,
                    description: menu.description,
                    category: menu.category,
                    price: Number(menu.price || 0),
                    status: menu.status,
                    image: menu.image || null
                })
            });

            const data = await response.json();

            if(response.ok && data.success){
                successCount++;
            }
        }

        await loadMenus();

        showToast(
            `นำเข้าสำเร็จ ${successCount} รายการ`
        );

    }catch(error){

        alert(
            "นำเข้าข้อมูลไม่สำเร็จ: " +
            error.message
        );

    }finally{

        $("importFile").value = "";

    }

});

function parseCSV(text){

    text = text.replace(/^\uFEFF/, "");

    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for(let i = 0; i < text.length; i++){

        const char = text[i];
        const next = text[i + 1];

        if(char === '"' && insideQuotes && next === '"'){
            value += '"';
            i++;
            continue;
        }

        if(char === '"'){
            insideQuotes = !insideQuotes;
            continue;
        }

        if(char === "," && !insideQuotes){
            row.push(value);
            value = "";
            continue;
        }

        if((char === "\n" || char === "\r") && !insideQuotes){

            if(char === "\r" && next === "\n"){
                i++;
            }

            row.push(value);
            rows.push(row);

            row = [];
            value = "";

            continue;
        }

        value += char;
    }

    if(value !== "" || row.length){
        row.push(value);
        rows.push(row);
    }

    return rows;
}

function exportMenus(){

    if(!menus.length){
        alert("ไม่มีข้อมูลเมนูสำหรับส่งออก");
        return;
    }

    const headers = [
        "menu_id",
        "menu_name",
        "description",
        "category",
        "price",
        "image",
        "status"
    ];

    const rows = menus.map(m => [
        m.menu_id,
        m.menu_name,
        m.description,
        m.category,
        m.price,
        m.image,
        m.status
    ]);

    const csv = [
        headers,
        ...rows
    ]
    .map(row =>
        row.map(value => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        }).join(",")
    )
    .join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "premium_suki_menu.csv";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    showToast("ส่งออกข้อมูลเมนูสำเร็จ");
}


$("searchInput").oninput = () => {
    currentPage = 1;
    render();
};


$("statusFilter").onchange = () => {
    currentPage = 1;
    render();
};


$("categoryFilter").onchange = () => {

    selectedCategory = $("categoryFilter").value;

    currentPage = 1;

    document.querySelectorAll(".tab").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.category === selectedCategory
        );
    });

    render();
};


$("prevPage").onclick = () => {

    if(currentPage > 1){
        currentPage--;
        render();
    }

};


$("nextPage").onclick = () => {

    const maxPage =
        Math.max(
            1,
            Math.ceil(
                getFilteredMenus().length / pageSize
            )
        );

    if(currentPage < maxPage){
        currentPage++;
        render();
    }

};


/* =========================================
   Toast
========================================= */

function showToast(message){

    const t = $("toast");

    t.textContent = message;

    t.classList.add("show");

    setTimeout(
        () => t.classList.remove("show"),
        1800
    );

}


/* =========================================
   Escape
========================================= */

function escapeHtml(value){

    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}


function escapeAttr(value){
    return escapeHtml(value);
}

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

    $("currentDateTime").innerHTML = `
        ${date}<br>
        <b>${time}</b>
    `;
}

updateDateTime();

setInterval(updateDateTime, 1000);


loadMenus();