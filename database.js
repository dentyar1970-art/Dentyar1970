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

function openDentyarDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported."));
            return;
        }

        const request = indexedDB.open(
            DENTYAR_DB_NAME,
            DENTYAR_DB_VERSION
        );

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            createStore(db, "settings", "id");
            createStore(db, "users", "id", ["username", "role"]);
            createStore(db, "patients", "id", [
                "fileNumber",
                "nationalCode",
                "mobile",
                "lastName"
            ]);

            createStore(db, "patientMedical", "id", ["patientId"]);
            createStore(db, "dentalCharts", "id", ["patientId"]);
            createStore(db, "toothHistory", "id", ["patientId", "toothNumber"]);
            createStore(db, "documents", "id", ["patientId"]);
            createStore(db, "patientTimeline", "id", ["patientId", "date"]);

            createStore(db, "appointments", "id", [
                "patientId",
                "doctorId",
                "date"
            ]);

            createStore(db, "services", "id", ["code", "category"]);
            createStore(db, "treatmentPlans", "id", ["patientId"]);
            createStore(db, "treatments", "id", ["patientId", "toothNumber"]);

            createStore(db, "invoices", "id", [
                "patientId",
                "invoiceNumber"
            ]);

            createStore(db, "payments", "id", ["patientId", "invoiceId"]);
            createStore(db, "insurance", "id", ["name"]);
            createStore(db, "laboratories", "id", ["name"]);
            createStore(db, "inventory", "id", ["code", "name"]);
            createStore(db, "reports", "id", ["type", "date"]);
            createStore(db, "auditLogs", "id", [
                "userId",
                "action",
                "date"
            ]);

            createStore(db, "backups", "id", ["date"]);
            createStore(db, "syncQueue", "id", [
                "entity",
                "entityId",
                "status"
            ]);
        };

        request.onsuccess = function (event) {
            dentyarDB = event.target.result;

            dentyarDB.onversionchange = function () {
                dentyarDB.close();
            };

            resolve(dentyarDB);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Create Object Store
   --------------------------------------------------------- */

function createStore(db, name, keyPath, indexes = []) {
    if (db.objectStoreNames.contains(name)) {
        return;
    }

    const store = db.createObjectStore(name, {
        keyPath: keyPath
    });

    indexes.forEach(function (indexName) {
        try {
            store.createIndex(indexName, indexName, {
                unique: false
            });
        } catch (error) {
            console.warn("Index creation skipped:", indexName);
        }
    });
}

/* ---------------------------------------------------------
   Ensure Database
   --------------------------------------------------------- */

async function ensureDentyarDB() {
    if (dentyarDB) {
        return dentyarDB;
    }

    return await openDentyarDB();
}

/* ---------------------------------------------------------
   Add
   --------------------------------------------------------- */

async function dentyarAdd(storeName, data) {
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

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = function () {
            resolve(record);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Update
   --------------------------------------------------------- */

async function dentyarUpdate(storeName, data) {
    const db = await ensureDentyarDB();

    if (!data || !data.id) {
        throw new Error("Record ID is required.");
    }

    const record = {
        ...data,
        updatedAt: dentyarNow()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = function () {
            resolve(record);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Get By ID
   --------------------------------------------------------- */

async function dentyarGet(storeName, id) {
    const db = await ensureDentyarDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = function () {
            resolve(request.result || null);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Get All
   --------------------------------------------------------- */

async function dentyarGetAll(storeName) {
    const db = await ensureDentyarDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = function () {
            resolve(request.result || []);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Delete
   --------------------------------------------------------- */

async function dentyarDelete(storeName, id) {
    const db = await ensureDentyarDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = function () {
            resolve(true);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Search
   --------------------------------------------------------- */

async function dentyarSearchPatients(query) {
    const patients = await dentyarGetAll(
        DENTYAR_STORES.patients
    );

    const q = String(query || "")
        .trim()
        .toLowerCase();

    if (!q) {
        return patients;
    }

    return patients.filter(function (patient) {
        return [
            patient.firstName,
            patient.lastName,
            patient.fileNumber,
            patient.mobile,
            patient.nationalCode
        ].some(function (value) {
            return String(value || "")
                .toLowerCase()
                .includes(q);
        });
    });
}

/* ---------------------------------------------------------
   Patient File Number
   --------------------------------------------------------- */

async function generatePatientFileNumber() {
    const patients = await dentyarGetAll(
        DENTYAR_STORES.patients
    );

    let maxNumber = 0;

    patients.forEach(function (patient) {
        const number = parseInt(
            patient.fileNumber,
            10
        );

        if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
        }
    });

    return String(maxNumber + 1).padStart(6, "0");
}

/* ---------------------------------------------------------
   Patient Creation
   --------------------------------------------------------- */

async function createDentyarPatient(patientData) {
    const fileNumber =
        patientData.fileNumber ||
        await generatePatientFileNumber();

    const patient = {
        ...patientData,
        fileNumber: fileNumber,
        entityType: "patient",
        createdAt: dentyarNow(),
        updatedAt: dentyarNow()
    };

    return await dentyarAdd(
        DENTYAR_STORES.patients,
        patient
    );
}

/* ---------------------------------------------------------
   Patient Medical File
   --------------------------------------------------------- */

async function savePatientMedical(
    patientId,
    medicalData
) {
    const existing = await findByIndex(
        DENTYAR_STORES.patientMedical,
        "patientId",
        patientId
    );

    const record = {
        ...(existing || {}),
        ...medicalData,
        patientId: patientId,
        updatedAt: dentyarNow()
    };

    if (!record.id) {
        record.id = dentyarId("medical");
        record.createdAt = dentyarNow();
    }

    return await dentyarUpdate(
        DENTYAR_STORES.patientMedical,
        record
    );
}

/* ---------------------------------------------------------
   Find By Index
   --------------------------------------------------------- */

async function findByIndex(
    storeName,
    indexName,
    value
) {
    const db = await ensureDentyarDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(
            storeName
        );

        if (!store.indexNames.contains(indexName)) {
            resolve(null);
            return;
        }

        const index = store.index(indexName);
        const request = index.get(value);

        request.onsuccess = function () {
            resolve(request.result || null);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------------------------------------------------------
   Patient Timeline
   --------------------------------------------------------- */

async function addPatientTimeline(
    patientId,
    eventType,
    title,
    details = {}
) {
    return await dentyarAdd(
        DENTYAR_STORES.patientTimeline,
        {
            patientId: patientId,
            eventType: eventType,
            title: title,
            details: details,
            date: dentyarNow()
        }
    );
}

/* ---------------------------------------------------------
   Audit Log
   --------------------------------------------------------- */

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
            action: action,
            entity: entity,
            entityId: entityId,
            userId: userId,
            details: details,
            date: dentyarNow()
        }
    );
}

/* ---------------------------------------------------------
   Sync Queue
   --------------------------------------------------------- */

async function addToSyncQueue(
    entity,
    entityId,
    operation,
    data
) {
    return await dentyarAdd(
        DENTYAR_STORES.syncQueue,
        {
            entity: entity,
            entityId: entityId,
            operation: operation,
            data: data,
            status: "pending",
            queuedAt: dentyarNow()
        }
    );
}

/* ---------------------------------------------------------
   Database Export
   --------------------------------------------------------- */

async function exportDentyarDatabase() {
    const backup = {
        database: DENTYAR_DB_NAME,
        version: DENTYAR_DB_VERSION,
        createdAt: dentyarNow(),
        stores: {}
    };

    for (const storeName of Object.values(
        DENTYAR_STORES
    )) {
        backup.stores[storeName] =
            await dentyarGetAll(storeName);
    }

    return backup;
}

/* ---------------------------------------------------------
   Database Statistics
   --------------------------------------------------------- */

async function getDentyarDatabaseStats() {
    const stats = {};

    for (const storeName of Object.values(
        DENTYAR_STORES
    )) {
        const records =
            await dentyarGetAll(storeName);

        stats[storeName] = records.length;
    }

    return stats;
}

/* ---------------------------------------------------------
   Initialize
   --------------------------------------------------------- */

window.DENTYAR_DB = {
    name: DENTYAR_DB_NAME,
    version: DENTYAR_DB_VERSION,
    stores: DENTYAR_STORES,

    open: openDentyarDB,
    add: dentyarAdd,
    update: dentyarUpdate,
    get: dentyarGet,
    getAll: dentyarGetAll,
    delete: dentyarDelete,

    searchPatients: dentyarSearchPatients,
    createPatient: createDentyarPatient,
    savePatientMedical: savePatientMedical,

    addPatientTimeline: addPatientTimeline,
    addAuditLog: addAuditLog,
    addToSyncQueue: addToSyncQueue,

    exportDatabase: exportDentyarDatabase,
    getStats: getDentyarDatabaseStats
};

/* Automatically initialize database */

openDentyarDB()
    .then(function () {
        console.log(
            "DENTYAR database initialized successfully."
        );
    })
    .catch(function (error) {
        console.error(
            "DENTYAR database initialization failed:",
            error
        );
    });
