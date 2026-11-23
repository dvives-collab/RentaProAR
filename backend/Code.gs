/**
 * RentaPro AR - Backend Google Apps Script (API REST + Google Sheets + Google Drive)
 * Arquitectura: Controlador REST con LockService, Idempotencia, Auditoría y Almacenamiento en Drive.
 */

const CONFIG = {
  ROOT_DRIVE_FOLDER: "RentaPro_AR_Documentos",
  SHEETS: {
    CLIENTES: "Clientes_Inquilinos",
    PROPIEDADES: "Propiedades_Contratos",
    INDICES: "Indices_Economicos",
    IMPUESTOS: "Impuestos_Documentos",
    LIQUIDACIONES: "Liquidaciones_Historial",
    AUDITORIA: "Auditoria_Logs"
  },
  LOCK_TIMEOUT_MS: 15000
};

/**
 * Punto de entrada HTTP GET (Consultas y Healthcheck)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    
    if (action === "ping") {
      return jsonResponse({
        status: "ok",
        app: "RentaPro AR API",
        timestamp: new Date().toISOString(),
        driveFolder: getOrCreateRootFolder_().getUrl()
      });
    }

    if (action === "getAllData") {
      ensureDatabaseStructure_();
      return jsonResponse({
        status: "ok",
        data: {
          clientes: readSheetAsObjects_(CONFIG.SHEETS.CLIENTES),
          propiedades: readSheetAsObjects_(CONFIG.SHEETS.PROPIEDADES),
          indices: readSheetAsObjects_(CONFIG.SHEETS.INDICES),
          impuestos: readSheetAsObjects_(CONFIG.SHEETS.IMPUESTOS),
          liquidaciones: readSheetAsObjects_(CONFIG.SHEETS.LIQUIDACIONES)
        },
        driveFolderUrl: getOrCreateRootFolder_().getUrl(),
        sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    }

    return jsonResponse({ status: "error", message: "Acción GET no soportada: " + action }, 400);
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

/**
 * Punto de entrada HTTP POST (Mutaciones, Carga de Documentos a Drive, CRUD con LockService)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
  
  if (!hasLock) {
    return jsonResponse({
      status: "error",
      code: "CONCURRENCY_TIMEOUT",
      message: "El servidor está procesando otra operación simultánea. Reintente en unos segundos."
    }, 429);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Payload vacío" }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const userEmail = payload.user || "sistema@rentapro.ar";
    const requestId = payload.requestId || "";

    ensureDatabaseStructure_();

    // Control de Idempotencia para evitar duplicados por reintentos de red móvil
    if (requestId && isDuplicateRequest_(requestId)) {
      return jsonResponse({
        status: "ok",
        duplicate: true,
        message: "Operación ya procesada previamente (Idempotencia verificada)."
      });
    }

    let result;

    switch (action) {
      case "setupDatabase":
        result = {
          message: "Estructura de Google Sheets y Google Drive inicializada correctamente.",
          driveFolderUrl: getOrCreateRootFolder_().getUrl(),
          sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
        };
        break;

      case "upsertCliente":
        result = upsertRecord_(CONFIG.SHEETS.CLIENTES, "id", payload.record, "CLI");
        break;

      case "deleteCliente":
        result = deleteRecord_(CONFIG.SHEETS.CLIENTES, "id", payload.id);
        break;

      case "upsertPropiedad":
        result = upsertRecord_(CONFIG.SHEETS.PROPIEDADES, "id", payload.record, "PROP");
        break;

      case "deletePropiedad":
        result = deleteRecord_(CONFIG.SHEETS.PROPIEDADES, "id", payload.id);
        break;

      case "uploadTaxDocument":
        result = handleUploadTaxDocument_(payload);
        break;

      case "updateTaxSplit":
        result = upsertRecord_(CONFIG.SHEETS.IMPUESTOS, "id", payload.record, "IMP");
        break;

      case "deleteTaxDocument":
        result = handleDeleteTaxDocument_(payload.id);
        break;

      case "upsertIndice":
        result = upsertRecord_(CONFIG.SHEETS.INDICES, "period", payload.record, "IDX");
        break;

      case "saveLiquidacion":
        result = upsertRecord_(CONFIG.SHEETS.LIQUIDACIONES, "id", payload.record, "LIQ");
        break;

      default:
        throw new Error("Acción POST desconocida: " + action);
    }

    logAudit_(userEmail, action, requestId, "OK", JSON.stringify(result).substring(0, 250));
    return jsonResponse({ status: "ok", data: result });

  } catch (err) {
    logAudit_("sistema", "ERROR_POST", "", "ERROR", err.toString());
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sube un archivo PDF/Imagen en Base64 a Google Drive (organizado por Período YYYY-MM)
 * y registra sus metadatos y enlaces en Google Sheets.
 */
function handleUploadTaxDocument_(payload) {
  const doc = payload.record;
  let driveFileId = doc.driveFileId || "";
  let drivePreviewUrl = doc.drivePreviewUrl || "";
  let driveDownloadUrl = doc.driveDownloadUrl || "";
  let driveFolderUrl = "";

  if (payload.fileBase64 && payload.fileName) {
    const rootFolder = getOrCreateRootFolder_();
    const periodFolderName = doc.period || Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "yyyy-MM");
    const periodFolder = getOrCreateSubFolder_(rootFolder, periodFolderName);
    driveFolderUrl = periodFolder.getUrl();

    const cleanBase64 = payload.fileBase64.includes(",")
      ? payload.fileBase64.split(",")[1]
      : payload.fileBase64;
    
    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const mimeType = payload.mimeType || "application/pdf";
    const safeFileName = `${periodFolderName}_${doc.serviceName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${payload.fileName}`;
    
    const blob = Utilities.newBlob(decodedBytes, mimeType, safeFileName);
    const file = periodFolder.createFile(blob);
    
    // Permitir vista previa embebida desde la app móvil/web
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    driveFileId = file.getId();
    drivePreviewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
    driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  }

  const recordToSave = Object.assign({}, doc, {
    driveFileId: driveFileId,
    drivePreviewUrl: drivePreviewUrl,
    driveDownloadUrl: driveDownloadUrl,
    driveFolderUrl: driveFolderUrl,
    updatedAt: new Date().toISOString()
  });

  const saved = upsertRecord_(CONFIG.SHEETS.IMPUESTOS, "id", recordToSave, "IMP");
  return saved;
}

/**
 * Elimina el registro en Sheets y mueve el archivo de Drive a la papelera
 */
function handleDeleteTaxDocument_(id) {
  const records = readSheetAsObjects_(CONFIG.SHEETS.IMPUESTOS);
  const target = records.find(r => r.id === id);
  if (target && target.driveFileId) {
    try {
      DriveApp.getFileById(target.driveFileId).setTrashed(true);
    } catch (e) {
      // Si ya estaba borrado en Drive, continuamos eliminando la fila
    }
  }
  return deleteRecord_(CONFIG.SHEETS.IMPUESTOS, "id", id);
}

/**
 * Crea o actualiza un registro verificando control de versión optimista
 */
function upsertRecord_(sheetName, keyField, record, prefix) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIdx = headers.indexOf(keyField);
  const verIdx = headers.indexOf("version");

  if (!record[keyField]) {
    record[keyField] = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIdx]) === String(record[keyField])) {
      rowIndex = i + 1;
      // Validación de concurrencia optimista
      if (verIdx !== -1 && record.version !== undefined) {
        const currentVersion = Number(data[i][verIdx] || 1);
        if (Number(record.version) < currentVersion) {
          throw new Error(`CONFLICT: El registro ${record[keyField]} fue modificado por otro usuario (v${currentVersion}).`);
        }
      }
      record.version = (verIdx !== -1 ? Number(data[i][verIdx] || 1) + 1 : 1);
      break;
    }
  }

  if (rowIndex === -1) {
    record.version = 1;
    record.createdAt = record.createdAt || new Date().toISOString();
  }
  record.updatedAt = new Date().toISOString();

  const rowValues = headers.map(h => {
    const val = record[h];
    if (val === undefined || val === null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return val;
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return record;
}

function deleteRecord_(sheetName, keyField, keyValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const keyIdx = data[0].indexOf(keyField);

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIdx]) === String(keyValue)) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: keyValue };
    }
  }
  return { deleted: false, id: keyValue };
}

function readSheetAsObjects_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

function ensureDatabaseStructure_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = {
    [CONFIG.SHEETS.CLIENTES]: [
      "id", "fullName", "dniCuit", "email", "phone", "propertyId", "role", "status", "notes", "version", "createdAt", "updatedAt"
    ],
    [CONFIG.SHEETS.PROPIEDADES]: [
      "id", "unitName", "address", "clientId", "tenantName", "initialAmount", "indexType", "frequencyMonths", "startDate", "endDate", "status", "version", "createdAt", "updatedAt"
    ],
    [CONFIG.SHEETS.INDICES]: [
      "period", "ipcMonthlyPct", "iclValue", "source", "updatedAt"
    ],
    [CONFIG.SHEETS.IMPUESTOS]: [
      "id", "period", "serviceName", "provider", "totalAmount", "splitMode", "assignedPropertyIds", "customPercentages", "fileName", "mimeType", "driveFileId", "drivePreviewUrl", "driveDownloadUrl", "driveFolderUrl", "version", "createdAt", "updatedAt"
    ],
    [CONFIG.SHEETS.LIQUIDACIONES]: [
      "id", "propertyId", "clientId", "period", "baseRentUpdated", "taxesTotal", "grandTotal", "dueDate", "paymentStatus", "receiptDriveUrl", "version", "updatedAt"
    ],
    [CONFIG.SHEETS.AUDITORIA]: [
      "timestamp", "user", "action", "requestId", "status", "detail"
    ]
  };

  Object.keys(schemas).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headers = schemas[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground("#0F172A")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });
}

function getOrCreateRootFolder_() {
  const folders = DriveApp.getFoldersByName(CONFIG.ROOT_DRIVE_FOLDER);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(CONFIG.ROOT_DRIVE_FOLDER);
}

function getOrCreateSubFolder_(parentFolder, subName) {
  const folders = parentFolder.getFoldersByName(subName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(subName);
}

function isDuplicateRequest_(requestId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const reqIdx = data[0].indexOf("requestId");
  for (let i = Math.max(1, data.length - 100); i < data.length; i++) {
    if (data[i][reqIdx] === requestId) return true;
  }
  return false;
}

function logAudit_(user, action, requestId, status, detail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDITORIA);
    if (sheet) {
      sheet.appendRow([new Date().toISOString(), user, action, requestId, status, detail]);
    }
  } catch (e) {}
}

function jsonResponse(obj, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
