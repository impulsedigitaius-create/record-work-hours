/**
 * Google Apps Script — Web App de respaldo para la app de Asistencia + Nómina.
 *
 * Recibe cada fichaje (POST JSON) desde la app Next.js (lib/sheets.ts) y lo
 * escribe en una hoja "Attendance". Turso sigue siendo la fuente de verdad;
 * esto es solo un respaldo legible para RRHH.
 *
 * Truco clave: en la SALIDA (OUT) completa la MISMA fila del check-in
 * (una fila = un turno con entrada y salida), buscando de abajo hacia arriba
 * la fila del mismo empleado/fecha que aún no tiene salida registrada.
 *
 * --- Payload que envía la app (lib/sheets.ts) ---
 * {
 *   "fecha":  "2026-05-31",      // YYYY-MM-DD (zona horaria Florida)
 *   "nombre": "Jane Doe",         // nombre del empleado
 *   "area":   "Kitchen",          // datos generales (campo "details")
 *   "hora":   "09:03",            // HH:MM (zona horaria Florida)
 *   "tipo":   "IN"                // "IN" (entrada) | "OUT" (salida)
 * }
 */

var SHEET_NAME = 'Attendance';
var HEADERS = ['Date', 'Employee', 'Area', 'Clock In', 'Clock Out'];
var COL = { DATE: 1, EMP: 2, AREA: 3, IN: 4, OUT: 5 };

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeaders(sheet);
    handlePunch(sheet, d);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Endpoint de prueba: abrí la URL /exec en el navegador para confirmar que vive.
function doGet() {
  return json({ ok: true, service: 'attendance-backup' });
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#ece2d0');
    sheet.setFrozenRows(1);
  }
}

function handlePunch(sheet, d) {
  var tipo = String(d.tipo).toUpperCase();

  if (tipo === 'IN') {
    // Nueva fila: entrada abierta (sin salida todavía).
    sheet.appendRow([d.fecha, d.nombre, d.area || '', d.hora, '']);
    return;
  }

  // SALIDA (OUT): completar la fila de entrada abierta del mismo empleado/fecha.
  var last = sheet.getLastRow();
  if (last >= 2) {
    var vals = sheet.getRange(2, 1, last - 1, COL.OUT).getValues();
    var tz = Session.getScriptTimeZone();
    for (var i = vals.length - 1; i >= 0; i--) {
      var rowDate = vals[i][COL.DATE - 1];
      var dateStr =
        rowDate instanceof Date
          ? Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd')
          : String(rowDate);
      var sameDay = dateStr === String(d.fecha);
      var sameEmp = String(vals[i][COL.EMP - 1]) === String(d.nombre);
      var noOut = !vals[i][COL.OUT - 1];
      if (sameDay && sameEmp && noOut) {
        sheet.getRange(i + 2, COL.OUT).setValue(d.hora);
        return;
      }
    }
  }

  // No se encontró entrada abierta -> registrar salida huérfana en su propia fila.
  sheet.appendRow([d.fecha, d.nombre, d.area || '', '', d.hora]);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
