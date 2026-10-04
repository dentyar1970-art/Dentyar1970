/* =========================================================
   DENTYAR VERSION 1
   Application Core
   ========================================================= */

(function () {
    "use strict";

    const APP = {
        name: "DENTYAR",
        version: "1.0.0",
        clinic: "مطب لبخند زیبا",
        tagline: "دنت‌یار؛ دستیار هوشمند دندان‌پزشکی شما",
        manager: "حمید آل کثیر"
    };

    const state = {
        currentView: "dashboard",
        currentPatient: null,
        initialized: false
    };

    /* -------------------------------------------------------
       Helpers
       ------------------------------------------------------- */

    function $(selector) {
        return document.querySelector(selector);
    }

    function $all(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showMessage(message, type = "info") {
        let box = $("#dentyar-message");

        if (!box) {
            box = document.createElement("div");
            box.id = "dentyar-message";
            box.style.position = "fixed";
            box.style.bottom = "20px";
            box.style.left = "50%";
            box.style.transform = "translateX(-50%)";
            box.style.zIndex = "99999";
            box.style.padding = "12px 20px";
            box.style.borderRadius = "10px";
            box.style.background = "#0f766e";
            box.style.color = "#fff";
            box.style.fontSize = "14px";
            box.style.boxShadow = "0 4px 18px rgba(0,0,0,.18)";
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

    /* -------------------------------------------------------
       Navigation
       ------------------------------------------------------- */

    function navigate(view) {
        state.currentView = view;

        $all("[data-view]").forEach(function (element) {
            element.classList.toggle(
                "active",
                element.dataset.view === view
            );
        });

        $all("[data-nav]").forEach(function (element) {
            element.classList.toggle(
                "active",
                element.dataset.nav === view
            );
        });

        document.dispatchEvent(
            new CustomEvent("dentyar:navigate", {
                detail: {
                    view: view
                }
            })
        );
    }

    function setupNavigation() {
        document.addEventListener("click", function (event) {
            const button =
                event.target.closest("[data-navigate]");

            if (!button) {
                return;
            }

            event.preventDefault();

            const target = button.dataset.navigate;

            if (target) {
                navigate(target);
            }
        });
    }

    /* -------------------------------------------------------
       Patient Functions
       ------------------------------------------------------- */

    async function getPatients() {
        if (
            !window.DENTYAR_DB ||
            !window.DENTYAR_DB.getAll
        ) {
            return [];
        }

        try {
            return await window.DENTYAR_DB.getAll(
                "patients"
            );
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async function searchPatients(query) {
        if (
            window.DENTYAR_DB &&
            window.DENTYAR_DB.searchPatients
        ) {
            return await window.DENTYAR_DB.searchPatients(
                query
            );
        }

        return [];
    }

    async function createPatient(data) {
        if (
            !window.DENTYAR_DB ||
            !window.DENTYAR_DB.createPatient
        ) {
            throw new Error(
                "Database is not available."
            );
        }

        const patient =
            await window.DENTYAR_DB.createPatient(data);

        state.currentPatient = patient;

        return patient;
    }

    /* -------------------------------------------------------
       Dashboard
       ------------------------------------------------------- */

    async function loadDashboard() {
        const patients = await getPatients();

        const patientCount =
            document.querySelector(
                "[data-stat='patients']"
            );

        if (patientCount) {
            patientCount.textContent =
                patients.length.toLocaleString("fa-IR");
        }

        document.dispatchEvent(
            new CustomEvent("dentyar:dashboard", {
                detail: {
                    patients: patients.length
                }
            })
        );
    }

    /* -------------------------------------------------------
       Patient Search UI
       ------------------------------------------------------- */

    function setupPatientSearch() {
        const input =
            document.querySelector(
                "[data-patient-search]"
            );

        if (!input) {
            return;
        }

        let timer = null;

        input.addEventListener("input", function () {
            clearTimeout(timer);

            timer = setTimeout(async function () {
                const results =
                    await searchPatients(
                        input.value
                    );

                renderPatientResults(results);
            }, 200);
        });
    }

    function renderPatientResults(patients) {
        const container =
            document.querySelector(
                "[data-patient-results]"
            );

        if (!container) {
            return;
        }

        if (!patients.length) {
            container.innerHTML =
                "<div>بیماری یافت نشد.</div>";
            return;
        }

        container.innerHTML = patients
            .map(function (patient) {
                return `
                    <button
                        type="button"
                        class="dentyar-patient-result"
                        data-patient-id="${escapeHTML(patient.id)}">
                        <strong>
                            ${escapeHTML(
                                patient.firstName
                            )}
                            ${escapeHTML(
                                patient.lastName
                            )}
                        </strong>
                        <small>
                            پرونده:
                            ${escapeHTML(
                                patient.fileNumber
                            )}
                        </small>
                    </button>
                `;
            })
            .join("");

        container
            .querySelectorAll(
                "[data-patient-id]"
            )
            .forEach(function (button) {
                button.addEventListener(
                    "click",
                    async function () {
                        const patient =
                            await window.DENTYAR_DB.get(
                                "patients",
                                button.dataset.patientId
                            );

                        state.currentPatient =
                            patient;

                        document.dispatchEvent(
                            new CustomEvent(
                                "dentyar:patientSelected",
                                {
                                    detail: patient
                                }
                            )
                        );
                    }
                );
            });
    }

    /* -------------------------------------------------------
       Patient Form
       ------------------------------------------------------- */

    function setupPatientForm() {
        const form =
            document.querySelector(
                "[data-patient-form]"
            );

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const formData =
                    new FormData(form);

                const data = {
                    firstName:
                        formData.get("firstName") ||
                        "",
                    lastName:
                        formData.get("lastName") ||
                        "",
                    fatherName:
                        formData.get("fatherName") ||
                        "",
                    nationalCode:
                        formData.get(
                            "nationalCode"
                        ) || "",
                    mobile:
                        formData.get("mobile") ||
                        "",
                    birthDate:
                        formData.get(
                            "birthDate"
                        ) || "",
                    gender:
                        formData.get("gender") ||
                        "",
                    job:
                        formData.get("job") ||
                        "",
                    address:
                        formData.get("address") ||
                        "",
                    note:
                        formData.get("note") ||
                        ""
                };

                try {
                    const patient =
                        await createPatient(
                            data
                        );

                    showMessage(
                        "پرونده بیمار با موفقیت ثبت شد.",
                        "success"
                    );

                    form.reset();

                    document.dispatchEvent(
                        new CustomEvent(
                            "dentyar:patientCreated",
                            {
                                detail: patient
                            }
                        )
                    );

                    await loadDashboard();
                } catch (error) {
                    console.error(error);

                    showMessage(
                        "ثبت پرونده بیمار انجام نشد.",
                        "error"
                    );
                }
            }
        );
    }

    /* -------------------------------------------------------
       Global Actions
       ------------------------------------------------------- */

    function setupGlobalActions() {
        document.addEventListener(
            "click",
            function (event) {
                const action =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!action) {
                    return;
                }

                const name =
                    action.dataset.action;

                switch (name) {
                    case "dashboard":
                        navigate("dashboard");
                        break;

                    case "patients":
                        navigate("patients");
                        break;

                    case "new-patient":
                        navigate("new-patient");
                        break;

                    case "refresh":
                        initializeDashboard();
                        showMessage(
                            "اطلاعات به‌روزرسانی شد.",
                            "success"
                        );
                        break;

                    default:
                        break;
                }
            }
        );
    }

    /* -------------------------------------------------------
       Settings
       ------------------------------------------------------- */

    async function loadSettings() {
        if (
            !window.DENTYAR_DB ||
            !window.DENTYAR_DB.getAll
        ) {
            return;
        }

        try {
            const settings =
                await window.DENTYAR_DB.getAll(
                    "settings"
                );

            document.dispatchEvent(
                new CustomEvent(
                    "dentyar:settingsLoaded",
                    {
                        detail: settings
                    }
                )
            );
        } catch (error) {
            console.error(
                "Settings loading error:",
                error
            );
        }
    }

    /* -------------------------------------------------------
       Application Initialization
       ------------------------------------------------------- */

    async function initializeDatabase() {
        if (
            !window.DENTYAR_DB ||
            !window.DENTYAR_DB.open
        ) {
            console.warn(
                "DENTYAR database module not found."
            );
            return false;
        }

        try {
            await window.DENTYAR_DB.open();
            return true;
        } catch (error) {
            console.error(
                "Database initialization failed:",
                error
            );
            return false;
        }
    }

    async function initializeDashboard() {
        await loadDashboard();
    }

    async function initializeApp() {
        if (state.initialized) {
            return;
        }

        await initializeDatabase();

        setupNavigation();
        setupGlobalActions();
        setupPatientSearch();
        setupPatientForm();

        await loadSettings();
        await initializeDashboard();

        state.initialized = true;

        document.dispatchEvent(
            new CustomEvent(
                "dentyar:ready",
                {
                    detail: {
                        app: APP,
                        state: state
                    }
                }
            )
        );

        console.log(
            "DENTYAR VERSION 1 initialized."
        );
    }

    /* -------------------------------------------------------
       Public API
       ------------------------------------------------------- */

    window.DENTYAR_APP = {
        info: APP,
        state: state,

        navigate: navigate,

        getPatients: getPatients,
        searchPatients: searchPatients,
        createPatient: createPatient,

        loadDashboard:
            initializeDashboard,

        showMessage: showMessage,

        initialize:
            initializeApp
    };

    /* -------------------------------------------------------
       Start
       ------------------------------------------------------- */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );
    } else {
        initializeApp();
    }
})();
