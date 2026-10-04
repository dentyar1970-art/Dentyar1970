/* =========================================================
   DENTYAR VERSION 1
   Database Layer
   Local-first | Sync-ready | Native-ready
   ========================================================= */

const DENTYAR_DB_NAME = "DENTYAR_DB";
const DENTYAR_DB_VERSION = 1;

const DENTYAR_STORES = {
    settings: "settings",
    users: "users",
    patients: "patients",
    patientMedical: "patientMedical",
    dentalCharts: "dentalCharts",
    toothHistory: "toothHistory",
    documents: "documents",
    patientTimeline: "patientTimeline",
    appointments: "appointments",
    services: "services",
    treatmentPlans: "treatmentPlans",
    treatments: "treatments",
    invoices: "invoices",
    payments: "payments",
    insurance: "insurance",
    laboratories: "laboratories",
    inventory: "inventory",
    reports: "reports",
    auditLogs: "auditLogs",
    backups: "backups",
    syncQueue: "syncQueue"
};

let dentyarDB = null;

/* ---------------------------------------------------------
   Utility
   --------------------------------------------------------- */

function dentyarId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 10)
    );
}

function dentyarNow() {
    return new Date().toISOString();
}

/* ---------------------------------------------------------
   Database Open
   --------------------------------------------------------- */

function openDentyar
