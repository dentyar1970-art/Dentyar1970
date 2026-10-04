/* =========================================================
   DENTYAR VERSION 1
   Phase B — Patients & EHR
   Application Core
   Local-first | Sync-ready | Native-ready
   ========================================================= */

(function () {
    "use strict";

    const APP = {
        name: "DENTYAR",
        version: "1.0.0",
        phase: "B",
        clinic: "مطب لبخند زیبا",
        tagline: "دنت‌یار؛ دستیار هوشمند دندان‌پزشکی شما",
        manager: "حمید آل کثیر"
    };

    const state = {
        currentView: "dashboard",
        currentPatient: null,
        patients: [],
        initialized: false
    };

    /* =========================================================
       Utilities
       ========================================================= */

    function $(selector, root = document) {
        return root.querySelector(selector);
    }

    function $all(selector, root = document) {
        return Array.from(root.querySelectorAll(selector));
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeNumber(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, function (d) {
                return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d));
            })
            .replace(/[٠-٩]/g, function (d) {
                return String("٠١٢٣٤٥٦٧٨٩".indexOf(d));
            });
    }

    function showMessage(message, type = "info") {
        let box = document.querySelector("[data-dentyar-message]");

        if (!box) {
            box = document.createElement("div");
            box.setAttribute("data-dentyar-message", "");
            box.style.position = "fixed";
            box.style.left = "20px";
            box.style.right = "20px";
            box.style.bottom = "20px";
            box.style.zIndex = "99999";
            box.style.padding = "14px 18px";
            box.style.borderRadius = "12px";
            box.style.background = "#0f766e";
            box.style.color = "#fff";
            box.style.fontSize = "14px";
            box.style.textAlign = "center";
            box.style.boxShadow = "0 8px 25px rgba(0,0,0,.18)";
            document.body.appendChild(box);
        }

        box.textContent = message;

        if (type === "error") {
            box.style.background = "#b91c1c";
        } else if (type === "success") {
            box.style.background = "#047857";
        } else {
            box.style.background = "#0f766e";
        }

        clearTimeout(box._timer);

        box._timer = setTimeout(function () {
            box.remove();
        }, 3000);
    }

    /* =========================================================
       Database
       ========================================================= */

    async function db() {
        if (!window.DENTYAR_DB) {
            throw new Error("DENTYAR database layer is not available.");
        }

        return window.DENTYAR_DB;
    }

    async function getPatients() {
        const database = await db();

        const patients = await database.getAll("patients");

        state.patients = Array.isArray(patients) ? patients : [];

        return state.patients;
    }

    async function searchPatients(query) {
        const database = await db();

        const value = String(query ?? "").trim();

        if (!value) {
            return getPatients();
        }

        if (typeof database.searchPatients === "function") {
            return database.searchPatients(value);
        }

        const patients = await database.getAll("patients");

        const normalized = normalizeNumber(value).toLowerCase();

        return patients.filter(function (patient) {
            return [
                patient.firstName,
                patient.lastName,
                patient.fileNumber,
                patient.mobile,
                patient.nationalCode,
                patient.fatherName
            ]
                .map(function (item) {
                    return normalizeNumber(item).toLowerCase();
                })
                .some(function (item) {
                    return item.includes(normalized);
                });
        });
    }

    async function createPatient(data) {
        const database = await db();

        const patient = {
            firstName: String(data.firstName || "").trim(),
            lastName: String(data.lastName || "").trim(),
            fatherName: String(data.fatherName || "").trim(),
            nationalCode: normalizeNumber(data.nationalCode).trim(),
            mobile: normalizeNumber(data.mobile).trim(),
            birthDate: data.birthDate || "",
            gender: data.gender || "",
            job: String(data.job || "").trim(),
            address: String(data.address || "").trim(),
            note: String(data.note || "").trim()
        };

        if (!patient.firstName) {
            throw new Error("نام بیمار الزامی است.");
        }

        if (!patient.lastName) {
            throw new Error("نام خانوادگی بیمار الزامی است.");
        }

        if (typeof database.createPatient === "function") {
            return database.createPatient(patient);
        }

        if (typeof database.createDentyarPatient === "function") {
            return database.createDentyarPatient(patient);
        }

        return database.add("patients", patient);
    }

    async function updatePatient(id, data) {
        const database = await db();

        const oldPatient = await database.get("patients", id);

        if (!oldPatient) {
            throw new Error("بیمار پیدا نشد.");
        }

        const updated = {
            ...oldPatient,
            ...data,
            updatedAt: new Date().toISOString()
        };

        return database.update("patients", updated);
    }

    async function getPatient(id) {
        const database = await db();
        return database.get("patients", id);
    }

    /* =========================================================
       Navigation
       ========================================================= */

    function navigate(view) {
        state.currentView = view;

        $all("[data-view]").forEach(function (element) {
            const target = element.getAttribute("data-view");

            if (target === view) {
                element.classList.add("active");
                element.removeAttribute("hidden");
            } else if (
                element.hasAttribute("data-page") ||
                element.hasAttribute("data-section")
            ) {
                element.classList.remove("active");
            }
        });

        if (view === "patients") {
            showPatientsView();
        }

        if (view === "dashboard") {
            loadDashboard();
        }
    }

    function setupNavigation() {
        $all("[data-nav], [data-navigate]").forEach(function (element) {
            element.addEventListener("click", function (event) {
                const target =
                    element.getAttribute("data-nav") ||
                    element.getAttribute("data-navigate");

                if (!target) {
                    return;
                }

                event.preventDefault();
                navigate(target);
            });
        });
    }

    /* =========================================================
       Patients UI
       ========================================================= */

    function getPatientContainer() {
        let container = document.querySelector("[data-patients-container]");

        if (container) {
            return container;
        }

        const main =
            document.querySelector("main") ||
            document.querySelector(".container") ||
            document.body;

        container = document.createElement("section");
        container.setAttribute("data-patients-container", "");
        container.style.display = "none";
        container.style.margin = "20px auto";
        container.style.maxWidth = "1100px";
        container.style.padding = "20px";

        main.appendChild(container);

        return container;
    }

    function buildPatientsView() {
        const container = getPatientContainer();

        container.innerHTML = `
            <div style="
                background:#fff;
                border-radius:18px;
                padding:20px;
                box-shadow:0 8px 30px rgba(15,118,110,.08);
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:12px;
                    flex-wrap:wrap;
                    margin-bottom:18px;
                ">
                    <div>
                        <h2 style="margin:0;color:#0f172a;">
                            پرونده بیماران
                        </h2>
                        <div style="
                            margin-top:6px;
                            color:#64748b;
                            font-size:13px;
                        ">
                            مدیریت اطلاعات پایه و پرونده پزشکی بیمار
                        </div>
                    </div>

                    <button
                        type="button"
                        data-action="new-patient"
                        style="
                            border:0;
                            border-radius:10px;
                            padding:11px 16px;
                            background:#0f766e;
                            color:#fff;
                            cursor:pointer;
                            font-family:inherit;
                        "
                    >
                        + ثبت بیمار جدید
                    </button>
                </div>

                <div style="margin-bottom:16px;">
                    <input
                        type="search"
                        data-patient-search
                        placeholder="جست‌وجو بر اساس نام، نام خانوادگی، شماره پرونده، موبایل یا کد ملی"
                        style="
                            width:100%;
                            box-sizing:border-box;
                            padding:13px 14px;
                            border:1px solid #cbd5e1;
                            border-radius:10px;
                            font-family:inherit;
                            font-size:14px;
                            outline:none;
                        "
                    >
                </div>

                <div data-patient-results></div>

                <div
                    data-patient-form-wrapper
                    hidden
                    style="
                        margin-top:20px;
                        padding-top:20px;
                        border-top:1px solid #e2e8f0;
                    "
                >
                    <form data-patient-form>

                        <input type="hidden" name="id">

                        <div style="
                            display:grid;
                            grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                            gap:12px;
                        ">

                            <label>
                                نام
                                <input name="firstName" required>
                            </label>

                            <label>
                                نام خانوادگی
                                <input name="lastName" required>
                            </label>

                            <label>
                                نام پدر
                                <input name="fatherName">
                            </label>

                            <label>
                                کد ملی
                                <input name="nationalCode" inputmode="numeric">
                            </label>

                            <label>
                                موبایل
                                <input name="mobile" inputmode="tel">
                            </label>

                            <label>
                                تاریخ تولد
                                <input name="birthDate" placeholder="مثلاً 1370/05/20">
                            </label>

                            <label>
                                جنسیت
                                <select name="gender">
                                    <option value="">انتخاب شود</option>
                                    <option value="male">مرد</option>
                                    <option value="female">زن</option>
                                    <option value="other">سایر</option>
                                </select>
                            </label>

                            <label>
                                شغل
                                <input name="job">
                            </label>

                            <label style="grid-column:1/-1;">
                                نشانی
                                <textarea name="address" rows="2"></textarea>
                            </label>

                            <label style="grid-column:1/-1;">
                                یادداشت
                                <textarea name="note" rows="3"></textarea>
                            </label>

                        </div>

                        <div style="
                            display:flex;
                            gap:10px;
                            margin-top:16px;
                            flex-wrap:wrap;
                        ">
                            <button
                                type="submit"
                                style="
                                    border:0;
                                    border-radius:10px;
                                    padding:11px 18px;
                                    background:#0f766e;
                                    color:#fff;
                                    cursor:pointer;
                                    font-family:inherit;
                                "
                            >
                                ذخیره پرونده
                            </button>

                            <button
                                type="button"
                                data-action="cancel-patient"
                                style="
                                    border:1px solid #cbd5e1;
                                    border-radius:10px;
                                    padding:11px 18px;
                                    background:#fff;
                                    color:#334155;
                                    cursor:pointer;
                                    font-family:inherit;
                                "
                            >
                                انصراف
                            </button>
                        </div>

                    </form>
                </div>

                <div
                    data-patient-profile
                    hidden
                    style="
                        margin-top:20px;
                        padding-top:20px;
                        border-top:1px solid #e2e8f0;
                    "
                ></div>

            </div>
        `;

        setupPatientSearch();
        setupPatientForm();
        renderPatientResults(state.patients);
    }

    function showPatientsView() {
        const container = getPatientContainer();

        if (!container.innerHTML.trim()) {
            buildPatientsView();
        }

        container.style.display = "block";

        const otherSections = $all(
            "main > section:not([data-patients-container])"
        );

        otherSections.forEach(function (section) {
            section.style.display = "none";
        });

        loadPatients();
    }

    async function loadPatients() {
        try {
            const patients = await getPatients();
            renderPatientResults(patients);
        } catch (error) {
            console.error(error);
            showMessage("خطا در دریافت فهرست بیماران.", "error");
        }
    }

    function renderPatientResults(patients) {
        const box = document.querySelector("[data-patient-results]");

        if (!box) {
            return;
        }

        if (!patients || !patients.length) {
            box.innerHTML = `
                <div style="
                    padding:25px;
                    text-align:center;
                    color:#64748b;
                    background:#f8fafc;
                    border-radius:12px;
                ">
                    هنوز بیماری ثبت نشده است.
                </div>
            `;
            return;
        }

        box.innerHTML = patients.map(function (patient) {
            const name =
                `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

            return `
                <button
                    type="button"
                    data-patient-id="${escapeHTML(patient.id)}"
                    style="
                        width:100%;
                        display:block;
                        text-align:right;
                        border:1px solid #e2e8f0;
                        background:#fff;
                        border-radius:12px;
                        padding:14px;
                        margin-bottom:10px;
                        cursor:pointer;
                        font-family:inherit;
                    "
                >
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:10px;
                        flex-wrap:wrap;
                    ">
                        <strong style="color:#0f172a;">
                            ${escapeHTML(name || "بدون نام")}
                        </strong>

                        <span style="color:#0f766e;">
                            پرونده:
                            ${escapeHTML(patient.fileNumber || "—")}
                        </span>
                    </div>

                    <div style="
                        margin-top:7px;
                        color:#64748b;
                        font-size:13px;
                    ">
                        موبایل:
                        ${escapeHTML(patient.mobile || "—")}
                        &nbsp; | &nbsp;
                        کد ملی:
                        ${escapeHTML(patient.nationalCode || "—")}
                    </div>
                </button>
            `;
        }).join("");

        $all("[data-patient-id]", box).forEach(function (button) {
            button.addEventListener("click", function () {
                openPatient(button.getAttribute("data-patient-id"));
            });
        });
    }

    function setupPatientSearch() {
        const input = document.querySelector("[data-patient-search]");

        if (!input) {
            return;
        }

        input.addEventListener("input", async function () {
            try {
                const results = await searchPatients(input.value);
                renderPatientResults(results);
            } catch (error) {
                console.error(error);
                showMessage("خطا در جست‌وجوی بیماران.", "error");
            }
        });
    }

    function setupPatientForm() {
        const form = document.querySelector("[data-patient-form]");

        if (!form) {
            return;
        }

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = new FormData(form);

            const data = Object.fromEntries(formData.entries());

            try {
                if (data.id) {
                    await updatePatient(data.id, data);

                    showMessage(
                        "اطلاعات بیمار با موفقیت به‌روزرسانی شد.",
                        "success"
                    );
                } else {
                    await createPatient(data);

                    showMessage(
                        "بیمار با موفقیت ثبت شد.",
                        "success"
                    );
                }

                form.reset();
                form.querySelector("[name=id]").value = "";

                const wrapper =
                    document.querySelector("[data-patient-form-wrapper]");

                if (wrapper) {
                    wrapper.hidden = true;
                }

                await loadPatients();

            } catch (error) {
                console.error(error);

                showMessage(
                    error.message || "ذخیره بیمار انجام نشد.",
                    "error"
                );
            }
        });

        const newButton =
            document.querySelector("[data-action='new-patient']");

        if (newButton) {
            newButton.addEventListener("click", function () {
                openNewPatientForm();
            });
        }

        const cancelButton =
            document.querySelector("[data-action='cancel-patient']");

        if (cancelButton) {
            cancelButton.addEventListener("click", function () {
                closePatientForm();
            });
        }
    }

    function openNewPatientForm() {
        const wrapper =
            document.querySelector("[data-patient-form-wrapper]");

        const form =
            document.querySelector("[data-patient-form]");

        if (!wrapper || !form) {
            return;
        }

        form.reset();

        const idField = form.querySelector("[name=id]");

        if (idField) {
            idField.value = "";
        }

        wrapper.hidden = false;

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function openPatient(id) {
        try {
            const patient = await getPatient(id);

            if (!patient) {
                showMessage("پرونده بیمار پیدا نشد.", "error");
                return;
            }

            state.currentPatient = patient;

            renderPatientProfile(patient);

        } catch (error) {
            console.error(error);
            showMessage("خطا در بازکردن پرونده بیمار.", "error");
        }
    }

    function renderPatientProfile(patient) {
        const profile =
            document.querySelector("[data-patient-profile]");

        if (!profile) {
            return;
        }

        const name =
            `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

        profile.hidden = false;

        profile.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:12px;
                flex-wrap:wrap;
            ">

                <div>
                    <h3 style="margin:0;color:#0f172a;">
                        ${escapeHTML(name || "بیمار")}
                    </h3>

                    <div style="
                        margin-top:7px;
                        color:#0f766e;
                        font-size:13px;
                    ">
                        شماره پرونده:
                        ${escapeHTML(patient.fileNumber || "—")}
                    </div>
                </div>

                <button
                    type="button"
                    data-action="edit-current-patient"
                    style="
                        border:1px solid #0f766e;
                        border-radius:10px;
                        padding:9px 14px;
                        background:#fff;
                        color:#0f766e;
                        cursor:pointer;
                        font-family:inherit;
                    "
                >
                    ویرایش اطلاعات
                </button>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                gap:12px;
                margin-top:18px;
            ">

                ${profileItem("نام پدر", patient.fatherName)}
                ${profileItem("کد ملی", patient.nationalCode)}
                ${profileItem("موبایل", patient.mobile)}
                ${profileItem("تاریخ تولد", patient.birthDate)}
                ${profileItem("جنسیت", genderText(patient.gender))}
                ${profileItem("شغل", patient.job)}

            </div>

            <div style="
                margin-top:14px;
                padding:14px;
                background:#f8fafc;
                border-radius:12px;
            ">
                <strong>نشانی</strong>
                <div style="margin-top:7px;color:#475569;">
                    ${escapeHTML(patient.address || "ثبت نشده")}
                </div>
            </div>

            <div style="
                margin-top:12px;
                padding:14px;
                background:#f8fafc;
                border-radius:12px;
            ">
                <strong>یادداشت</strong>
                <div style="margin-top:7px;color:#475569;">
                    ${escapeHTML(patient.note || "ثبت نشده")}
                </div>
            </div>
        `;

        const editButton =
            profile.querySelector(
                "[data-action='edit-current-patient']"
            );

        if (editButton) {
            editButton.addEventListener("click", function () {
                editPatient(patient);
            });
        }

        profile.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function profileItem(label, value) {
        return `
            <div style="
                padding:12px;
                border:1px solid #e2e8f0;
                border-radius:10px;
            ">
                <div style="
                    color:#64748b;
                    font-size:12px;
                ">
                    ${escapeHTML(label)}
                </div>

                <div style="
                    margin-top:5px;
                    color:#0f172a;
                ">
                    ${escapeHTML(value || "—")}
                </div>
            </div>
        `;
    }

    function genderText(value) {
        if (value === "male") return "مرد";
        if (value === "female") return "زن";
        if (value === "other") return "سایر";
        return "—";
    }

    function editPatient(patient) {
        const wrapper =
            document.querySelector("[data-patient-form-wrapper]");

        const form =
            document.querySelector("[data-patient-form]");

        if (!wrapper || !form) {
            return;
        }

        wrapper.hidden = false;

        Object.keys(patient).forEach(function (key) {
            const field = form.elements[key];

            if (field) {
                field.value = patient[key] ?? "";
            }
        });

        const idField = form.querySelector("[name=id]");

        if (idField) {
            idField.value = patient.id || "";
        }

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function closePatientForm() {
        const wrapper =
            document.querySelector("[data-patient-form-wrapper]");

        const form =
            document.querySelector("[data-patient-form]");

        if (wrapper) {
            wrapper.hidden = true;
        }

        if (form) {
            form.reset();

            const idField = form.querySelector("[name=id]");

            if (idField) {
                idField.value = "";
            }
        }
    }

    /* =========================================================
       Dashboard
       ========================================================= */

    async function loadDashboard() {
        try {
            const patients = await getPatients();

            const stat = document.querySelector(
                "[data-stat='patients']"
            );

            if (stat) {
                stat.textContent = patients.length;
            }

        } catch (error) {
            console.error(error);
        }
    }

    /* =========================================================
       Global actions
       ========================================================= */

    function setupGlobalActions() {
        $all("[data-action]").forEach(function (element) {
            const action = element.getAttribute("data-action");

            if (action === "patients") {
                element.addEventListener("click", function () {
                    navigate("patients");
                });
            }
        });

        $all("[data-view='patients']").forEach(function (element) {
            element.addEventListener("click", function () {
                navigate("patients");
            });
        });
    }

    /* =========================================================
       Settings
       ========================================================= */

    async function loadSettings() {
        try {
            const database = await db();

            if (typeof database.getAll === "function") {
                await database.getAll("settings");
            }
        } catch (error) {
            console.warn("Settings initialization:", error);
        }
    }

    /* =========================================================
       Initialization
       ========================================================= */

    async function initializeDatabase() {
        const database = await db();

        if (typeof database.open === "function") {
            await database.open();
        }

        return database;
    }

    async function initializeDashboard() {
        await loadDashboard();
    }

    async function initializeApp() {
        if (state.initialized) {
            return;
        }

        try {
            await initializeDatabase();
            await loadSettings();

            buildPatientsView();

            setupNavigation();
            setupGlobalActions();

            await initializeDashboard();

            state.initialized = true;

            console.info(
                "DENTYAR VERSION 1 — Phase B initialized successfully."
            );

        } catch (error) {
            console.error("DENTYAR initialization failed:", error);

            showMessage(
                "راه‌اندازی دنت‌یار با خطا مواجه شد.",
                "error"
            );
        }
    }

    /* =========================================================
       Public API
       ========================================================= */

    window.DENTYAR_APP = {
        APP,
        state,
        navigate,
        getPatients,
        searchPatients,
        createPatient,
        updatePatient,
        getPatient,
        openPatient,
        loadPatients,
        showPatientsView
    };

    /* =========================================================
       Start
       ========================================================= */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );
    } else {
        initializeApp();
    }

})();
