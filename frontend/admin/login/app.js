const $ = (id) => document.getElementById(id);

const loginForm = $("loginForm");
const passwordInput = $("password");
const togglePassword = $("togglePassword");
const loginMessage = $("loginMessage");


/* =========================
   แสดง / ซ่อน Password
========================= */

togglePassword.addEventListener("click", () => {

    if(passwordInput.type === "password"){

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

    }else{

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

    }

});


/* =========================
   Login
========================= */

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();


    const username = $("username").value.trim();
    const password = $("password").value;


    loginMessage.textContent = "";
    loginMessage.className = "login-message";


    if(!username || !password){

        loginMessage.textContent =
            "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";

        loginMessage.classList.add("error");

        return;
    }


    try{

        loginMessage.textContent =
            "กำลังเข้าสู่ระบบ...";

        loginMessage.classList.add("success");


        const response = await fetch(
            "http://localhost:3000/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );


        const data = await response.json();


        if(!response.ok || !data.success){

            loginMessage.textContent =
                data.message || "เข้าสู่ระบบไม่สำเร็จ";

            loginMessage.className =
                "login-message error";

            return;
        }


        /* =========================
           Login สำเร็จ
        ========================= */

        localStorage.setItem(
            "adminToken",
            data.token
        );

        localStorage.setItem(
            "adminUser",
            JSON.stringify(data.admin)
        );


        loginMessage.textContent =
            "เข้าสู่ระบบสำเร็จ";

        loginMessage.className =
            "login-message success";


        /* ไป Dashboard */

        setTimeout(() => {

            window.location.href =
                "../dashboard/index.html";

        }, 500);


    }catch(error){

        console.error(error);

        loginMessage.textContent =
            "ไม่สามารถเชื่อมต่อ Server ได้";

        loginMessage.className =
            "login-message error";

    }

});