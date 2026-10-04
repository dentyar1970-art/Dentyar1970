/* =========================================================
   DENTYAR VERSION 1
   Database Layer - Phase B
   Local-first | Sync-ready | Native-ready
   IndexedDB Version 2
   ========================================================= */

"use strict";

/* =========================================================
   DATABASE CONFIG
   ========================================================= */

const DENTYAR_DB_NAME = "DENTYAR_DB";
const DENTYAR_DB_VERSION = 2;

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

/* =========================================================
   GENERAL UTILITIES
   ========================================================= */

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

function dentyarSafeString(value) {
    return String(value ?? "").trim();
}

/* =========================================================
   DATABASE OPEN
   ========================================================= */

function openDentyarDB() {
    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {
            reject(
                new Error("IndexedDB is not supported.")
            );
            return;
        }

        const request = indexedDB.open(
            DENTYAR_DB_NAME,
            DENTYAR_DB_VERSION
        );

        request.onupgradeneeded = function (event) {

            const db = event.target.result;
            const oldVersion = event.oldVersion;

            console.log(
                "DENTYAR DB upgrade:",
                oldVersion,
                "→",
                DENTYAR_DB_VERSION
            );

            /* ---------------------------------------------
               CORE
               --------------------------------------------- */

            createStore(
                db,
                "settings",
                "id"
            );

            createStore(
                db,
                "users",
                "id",
                ["username", "role"]
            );

            /* ---------------------------------------------
               PATIENTS
               --------------------------------------------- */

            createStore(
                db,
                "patients",
                "id",
                [
                    "fileNumber",
                    "nationalCode",
                    "mobile",
                    "lastName",
                    "firstName"
                ]
            );

            createStore(
                db,
                "patientMedical",
                "id",
                ["patientId"]
            );

            createStore(
                db,
                "dentalCharts",
                "id",
                ["patientId"]
            );

            createStore(
                db,
                "toothHistory",
                "id",
                [
                    "patientId",
                    "toothNumber"
                ]
            );

            createStore(
                db,
                "documents",
                "id",
                ["patientId"]
            );

            createStore(
                db,
                "patientTimeline",
                "id",
                [
                    "patientId",
                    "date"
                ]
            );

            /* ---------------------------------------------
               APPOINTMENTS
               --------------------------------------------- */

            createStore(
                db,
                "appointments",
                "id",
                [
                    "patientId",
                    "doctorId",
                    "date"
                ]
            );

            /* ---------------------------------------------
               TREATMENT
               --------------------------------------------- */

            createStore(
                db,
                "services",
                "id",
                [
                    "code",
                    "category"
                ]
            );

            createStore(
                db,
                "treatmentPlans",
                "id",
                ["patientId"]
            );

            createStore(
                db,
                "treatments",
                "id",
                [
                    "patientId",
                    "toothNumber"
                ]
            );

            /* ---------------------------------------------
               FINANCE
               --------------------------------------------- */

            createStore(
                db,
                "invoices",
                "id",
                [
                    "patientId",
                    "invoiceNumber"
                ]
            );

            createStore(
                db,
                "payments",
                "id",
                [
                    "patientId",
                    "invoiceId"
                ]
            );

            createStore(
                db,
                "insurance",
                "id",
                ["name"]
            );

            /* ---------------------------------------------
               LAB / INVENTORY
               --------------------------------------------- */

            createStore(
                db,
                "laboratories",
                "id",
                ["name"]
            );

            createStore(
                db,
                "inventory",
                "id",
                [
                    "code",
                    "name"
                ]
            );

            /* ---------------------------------------------
               SYSTEM
               --------------------------------------------- */

            createStore(
                db,
                "reports",
                "id",
                [
                    "type",
                    "date"
                ]
            );

            createStore(
                db,
                "auditLogs",
                "id",
                [
                    "userId",
                    "action",
                    "date"
                ]
            );

            createStore(
                db,
                "backups",
                "id",
                ["date"]
            );

            createStore(
                db,
                "syncQueue",
                "id",
                [
                    "entity",
                    "entityId",
                    "status"
                ]
            );
        };

        request.onsuccess = function (event) {

            dentyarDB = event.target.result;

            dentyarDB.onversionchange = function () {
                dentyarDB.close();
                dentyarDB = null;
            };

            resolve(dentyarDB);
        };

        request.onerror = function () {
            reject(request.error);
        };

        request.onblocked = function () {
            console.warn(
                "DENTYAR database upgrade is blocked."
            );
        };
    });
}

/* =========================================================
   OBJECT STORE CREATION
   ========================================================= */

function createStore(
    db,
    name,
    keyPath,
    indexes = []
) {

    let store;

    if (!db.objectStoreNames.contains(name)) {

        store = db.createObjectStore(
            name,
            {
                keyPath: keyPath
            }
        );

    } else {

        store = null;
    }

    if (!store) {
        return;
    }

    indexes.forEach(function (indexName) {

        try {

            if (!store.indexNames.contains(indexName)) {

                store.createIndex(
                    indexName,
                    indexName,
                    {
                        unique: false
                    }
                );
            }

        } catch (error) {

            console.warn(
                "Index creation skipped:",
                indexName,
                error
            );
        }
    });
}

/* =========================================================
   ENSURE DATABASE
   ========================================================= */

async function ensureDentyarDB() {

    if (dentyarDB) {
        return dentyarDB;
    }

    return await openDentyarDB();
}

/* =========================================================
   ADD
   ========================================================= */

async function dentyarAdd(
    storeName,
    data
) {

    const db = await ensureDentyarDB();

    const record = {
        ...data
    };

    if (!record.id) {
        record.id = dentyarId(storeName);
    }

    if (!record.createdAt) {
        record.createdAt = dentyarNow();
    }

    record.updatedAt = dentyarNow();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            const request =
                store.add(record);

            request.onsuccess =
                function () {
                    resolve(record);
                };

            request.onerror =
                function () {
                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   UPDATE / UPSERT
   ========================================================= */

async function dentyarUpdate(
    storeName,
    data
) {

    const db = await ensureDentyarDB();

    if (!data || !data.id) {
        throw new Error(
            "Record ID is required."
        );
    }

    const record = {
        ...data,
        updatedAt: dentyarNow()
    };

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            const request =
                store.put(record);

            request.onsuccess =
                function () {
                    resolve(record);
                };

            request.onerror =
                function () {
                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   GET BY ID
   ========================================================= */

async function dentyarGet(
    storeName,
    id
) {

    const db = await ensureDentyarDB();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            const request =
                store.get(id);

            request.onsuccess =
                function () {

                    resolve(
                        request.result || null
                    );
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   GET ALL
   ========================================================= */

async function dentyarGetAll(
    storeName
) {

    const db = await ensureDentyarDB();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            const request =
                store.getAll();

            request.onsuccess =
                function () {

                    resolve(
                        request.result || []
                    );
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   DELETE
   ========================================================= */

async function dentyarDelete(
    storeName,
    id
) {

    const db = await ensureDentyarDB();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            const request =
                store.delete(id);

            request.onsuccess =
                function () {

                    resolve(true);
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   FIND BY INDEX
   ========================================================= */

async function findByIndex(
    storeName,
    indexName,
    value
) {

    const db = await ensureDentyarDB();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    storeName
                );

            if (
                !store.indexNames.contains(
                    indexName
                )
            ) {

                resolve(null);
                return;
            }

            const index =
                store.index(indexName);

            const request =
                index.get(value);

            request.onsuccess =
                function () {

                    resolve(
                        request.result || null
                    );
                };

            request.onerror =
                function () {

                    reject(request.error);
                };
        }
    );
}

/* =========================================================
   PATIENT SEARCH
   ========================================================= */

async function dentyarSearchPatients(
    query
) {

    const patients =
        await dentyarGetAll(
            DENTYAR_STORES.patients
        );

    const q =
        dentyarSafeString(query)
            .toLowerCase();

    if (!q) {
        return patients;
    }

    return patients.filter(
        function (patient) {

            return [

                patient.firstName,
                patient.lastName,
                patient.fileNumber,
                patient.mobile,
                patient.nationalCode,
                patient.fatherName

            ].some(
                function (value) {

                    return String(
                        value || ""
                    )
                    .toLowerCase()
                    .includes(q);
                }
            );
        }
    );
}

/* =========================================================
   GENERATE PATIENT FILE NUMBER
   ========================================================= */

async function generatePatientFileNumber() {

    const patients =
        await dentyarGetAll(
            DENTYAR_STORES.patients
        );

    let maxNumber = 0;

    patients.forEach(
        function (patient) {

            const number =
                parseInt(
                    patient.fileNumber,
                    10
                );

            if (
                !isNaN(number) &&
                number > maxNumber
            ) {

                maxNumber = number;
            }
        }
    );

    return String(
        maxNumber + 1
    ).padStart(6, "0");
}

/* =========================================================
   CREATE PATIENT
   ========================================================= */

async function createDentyarPatient(
    patientData
) {

    const data = {
        ...patientData
    };

    const fileNumber =
        data.fileNumber ||
        await generatePatientFileNumber();

    const patient = {

        ...data,

        fileNumber:
            String(fileNumber),

        entityType:
            "patient",

        createdAt:
            dentyarNow(),

        updatedAt:
            dentyarNow()
    };

    const saved =
        await dentyarAdd(
            DENTYAR_STORES.patients,
            patient
        );

    await addPatientTimeline(
        saved.id,
        "patient_created",
        "ایجاد پرونده بیمار",
        {
            fileNumber:
                saved.fileNumber
        }
    );

    await addAuditLog(
        "create",
        "patient",
        saved.id,
        null,
        {
            fileNumber:
                saved.fileNumber
        }
    );

    await addToSyncQueue(
        "patient",
        saved.id,
        "create",
        saved
    );

    return saved;
}

/* =========================================================
   UPDATE PATIENT
   ========================================================= */

async function updateDentyarPatient(
    patientId,
    patientData
) {

    const existing =
        await dentyarGet(
            DENTYAR_STORES.patients,
            patientId
        );

    if (!existing) {
        throw new Error(
            "Patient not found."
        );
    }

    const updated = {
        ...existing,
        ...patientData,
        id: patientId,
        updatedAt: dentyarNow()
    };

    const saved =
        await dentyarUpdate(
            DENTYAR_STORES.patients,
            updated
        );

    await addPatientTimeline(
        patientId,
        "patient_updated",
        "ویرایش پرونده بیمار",
        {}
    );

    await addAuditLog(
        "update",
        "patient",
        patientId,
        null,
        {}
    );

    await addToSyncQueue(
        "patient",
        patientId,
        "update",
        saved
    );

    return saved;
}

/* =========================================================
   PATIENT MEDICAL FILE
   ========================================================= */

async function savePatientMedical(
    patientId,
    medicalData
) {

    const existing =
        await findByIndex(
            DENTYAR_STORES.patientMedical,
            "patientId",
            patientId
        );

    const record = {

        ...(existing || {}),

        ...medicalData,

        patientId:
            patientId,

        updatedAt:
            dentyarNow()
    };

    if (!record.id) {

        record.id =
            dentyarId("medical");

        record.createdAt =
            dentyarNow();
    }

    const saved =
        await dentyarUpdate(
            DENTYAR_STORES.patientMedical,
            record
        );

    await addPatientTimeline(
        patientId,
        "medical_updated",
        "به‌روزرسانی پرونده پزشکی",
        {}
    );

    return saved;
}

/* =========================================================
   DENTAL CHART
   ========================================================= */

async function saveDentalChart(
    patientId,
    chartData
) {

    const existing =
        await findByIndex(
            DENTYAR_STORES.dentalCharts,
            "patientId",
            patientId
        );

    const record = {

        ...(existing || {}),

        ...chartData,

        patientId:
            patientId,

        updatedAt:
            dentyarNow()
    };

    if (!record.id) {

        record.id =
            dentyarId("chart");

        record.createdAt =
            dentyarNow();
    }

    return await dentyarUpdate(
        DENTYAR_STORES.dentalCharts,
        record
    );
}

/* =========================================================
   TOOTH HISTORY
   ========================================================= */

async function addToothHistory(
    patientId,
    toothNumber,
    historyData
) {

    return await dentyarAdd(
        DENTYAR_STORES.toothHistory,
        {
            patientId:
                patientId,

            toothNumber:
                String(toothNumber),

            ...historyData,

            date:
                dentyarNow()
        }
    );
}

/* =========================================================
   PATIENT TIMELINE
   ========================================================= */

async function addPatientTimeline(
    patientId,
    eventType,
    title,
    details = {}
) {

    return await dentyarAdd(
        DENTYAR_STORES.patientTimeline,
        {

            patientId:
                patientId,

            eventType:
                eventType,

            title:
                title,

            details:
                details,

            date:
                dentyarNow()
        }
    );
}

/* =========================================================
   DOCUMENT
   ========================================================= */

async function addPatientDocument(
    patientId,
    documentData
) {

    return await dentyarAdd(
        DENTYAR_STORES.documents,
        {

            patientId:
                patientId,

            ...documentData,

            uploadedAt:
                dentyarNow()
        }
    );
}

/* =========================================================
   AUDIT LOG
   ========================================================= */

async function addAuditLog(
    action,
    entity,
    entityId,
    userId = null,
    details = {}
) {

    return await dentyarAdd(
        DENTYAR_STORES.auditLogs,
        {

            action:
                action,

            entity:
                entity,

            entityId:
                entityId,

            userId:
                userId,

            details:
                details,

            date:
                dentyarNow()
        }
    );
}

/* =========================================================
   SYNC QUEUE
   ========================================================= */

async function addToSyncQueue(
    entity,
    entityId,
    operation,
    data
) {

    return await dentyarAdd(
        DENTYAR_STORES.syncQueue,
        {

            entity:
                entity,

            entityId:
                entityId,

            operation:
                operation,

            data:
                data,

            status:
                "pending",

            queuedAt:
                dentyarNow()
        }
    );
}

/* =========================================================
   DATABASE EXPORT
   ========================================================= */

async function exportDentyarDatabase() {

    const backup = {

        database:
            DENTYAR_DB_NAME,

        version:
            DENTYAR_DB_VERSION,

        createdAt:
            dentyarNow(),

        stores:
            {}
    };

    for (
        const storeName
        of Object.values(DENTYAR_STORES)
    ) {

        backup.stores[storeName] =
            await dentyarGetAll(
                storeName
            );
    }

    return backup;
}

/* =========================================================
   DATABASE STATISTICS
   ========================================================= */

async function getDentyarDatabaseStats() {

    const stats = {};

    for (
        const storeName
        of Object.values(DENTYAR_STORES)
    ) {

        const records =
            await dentyarGetAll(
                storeName
            );

        stats[storeName] =
            records.length;
    }

    return stats;
}

/* =========================================================
   DATABASE RESET
   ========================================================= */

async function closeDentyarDB() {

    if (dentyarDB) {

        dentyarDB.close();
        dentyarDB = null;
    }
}

/* =========================================================
   PUBLIC API
   ========================================================= */

window.DENTYAR_DB = {

    name:
        DENTYAR_DB_NAME,

    version:
        DENTYAR_DB_VERSION,

    stores:
        DENTYAR_STORES,

    open:
        openDentyarDB,

    close:
        closeDentyarDB,

    add:
        dentyarAdd,

    update:
        dentyarUpdate,

    get:
        dentyarGet,

    getAll:
        dentyarGetAll,

    delete:
        dentyarDelete,

    findByIndex:
        findByIndex,

    searchPatients:
        dentyarSearchPatients,

    generatePatientFileNumber:
        generatePatientFileNumber,

    createPatient:
        createDentyarPatient,

    updatePatient:
        updateDentyarPatient,

    savePatientMedical:
        savePatientMedical,

    saveDentalChart:
        saveDentalChart,

    addToothHistory:
        addToothHistory,

    addPatientTimeline:
        addPatientTimeline,

    addPatientDocument:
        addPatientDocument,

    addAuditLog:
        addAuditLog,

    addToSyncQueue:
        addToSyncQueue,

    exportDatabase:
        exportDentyarDatabase,

    getStats:
        getDentyarDatabaseStats
};

/* =========================================================
   AUTO INITIALIZATION
   ========================================================= */

openDentyarDB()
    .then(function () {

        console.log(
            "DENTYAR VERSION 1 database initialized.",
            "DB Version:",
            DENTYAR_DB_VERSION
        );

    })
    .catch(function (error) {

        console.error(
            "DENTYAR database initialization failed:",
            error
        );
    });
