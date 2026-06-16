/**
 * SyncTurso.gs  v3 — 2026-06-10
 * Crea / actualiza el Google Sheet "time clock employes" con datos de Turso.
 *
 * INSTRUCCIONES DE USO
 * ────────────────────
 * 1. Abre script.google.com con la cuenta digitalloxlifecamps@gmail.com
 * 2. Pega este código en el editor
 * 3. Ejecuta setup() — guarda credenciales Y activa el sync automático cada hora
 * 4. Ejecuta syncAll() para sincronizar ahora mismo
 *
 * SYNC AUTOMÁTICO
 * ───────────────
 * setup() crea un trigger que ejecuta syncAll() cada hora automáticamente.
 * Para forzar una actualización inmediata: ejecuta syncAll() manualmente.
 */

var SHEET_NAME = 'time clock employes';

function getProps() {
  var p = PropertiesService.getScriptProperties();
  return {
    url:   p.getProperty('TURSO_URL')   || '',
    token: p.getProperty('TURSO_TOKEN') || ''
  };
}

/**
 * Guarda credenciales Y activa el sync automático cada hora.
 * Ejecutar cada vez que se rote el token.
 */
function setup() {
  PropertiesService.getScriptProperties().setProperties({
    'TURSO_URL':   'https://loxlifecamps-shiftlog-impulsedigitai.aws-us-west-2.turso.io',
    'TURSO_TOKEN': 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5NjQ3OTQsImlkIjoiMDE5ZWE4N2UtNWQwMS03NzdiLWE5MmQtZjUyOWY2ODk2ZTBlIiwicmlkIjoiNDkxNmUxY2MtNTY0OS00ZjM1LWEzODAtNzBjYjlkYzk5MDhiIn0.R3ICfl1PbV-kA_OQgYZ6yJ3Nkzwt4S6tvp2OewdWEmdtm_MK50BpqLuX61SCEU9WIhWwWnd9x67ry5ehN1xgDQ'
  });
  Logger.log('✅ Credenciales guardadas.');
  createHourlyTrigger();
  Logger.log('✅ Listo. syncAll() corre automáticamente cada hora.');
  Logger.log('   Para actualizar ahora: ejecuta syncAll() manualmente.');
}

/**
 * Crea un trigger horario para syncAll().
 * Elimina triggers previos de syncAll para evitar duplicados.
 */
function createHourlyTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  var deleted = 0;
  existing.forEach(function(t) {
    if (t.getHandlerFunction() === 'syncAll') {
      ScriptApp.deleteTrigger(t);
      deleted++;
    }
  });
  if (deleted > 0) {
    Logger.log('🔄 Trigger anterior eliminado (' + deleted + ').');
  }
  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('⏰ Trigger horario creado: syncAll() se ejecuta cada 1 hora automáticamente.');
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

function syncAll() {
  var cfg = getProps();
  if (!cfg.url || !cfg.token) {
    throw new Error('❌ Credenciales vacías. Ejecuta setup() primero.');
  }

  Logger.log('🔄 Sync iniciado: ' + new Date());

  var employees = queryTurso(cfg,
    'SELECT id, last_name, first_name, name, code, phone, email, details, hourly_rate, active ' +
    'FROM employees ORDER BY last_name ASC, first_name ASC'
  );
  Logger.log('Empleados encontrados: ' + employees.length);

  var punches = queryTurso(cfg,
    'SELECT p.employee_id, e.last_name, e.first_name, p.date, p.type, p.ts ' +
    'FROM punches p JOIN employees e ON e.id = p.employee_id ' +
    'ORDER BY p.date ASC, e.last_name ASC, e.first_name ASC, p.ts ASC'
  );
  Logger.log('Fichajes encontrados: ' + punches.length);

  // Contar por tipo para diagnóstico
  var typeCounts = {};
  punches.forEach(function(p) {
    var t = p[4] || 'UNKNOWN';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  Logger.log('Por tipo: ' + JSON.stringify(typeCounts));

  var ss = getOrCreateSpreadsheet();
  writeTimeClock(ss, punches);
  writeEmployees(ss, employees);

  SpreadsheetApp.flush();
  Logger.log('✅ Sync completado: ' + new Date());
}

// ─── Página 1: Time Clock ─────────────────────────────────────────────────────

function writeTimeClock(ss, punches) {
  var sheet = getOrCreateSheet(ss, '1. Time Clock', 0);
  sheet.clearContents();

  var headers = ['Last Name', 'First Name', 'Date', 'Clock In', 'Break Out', 'Break In', 'Clock Out', 'Hours Worked', 'Status'];
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setBackground('#3b2f23')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Agrupar fichajes por empleado+fecha preservando el orden cronológico de eventos
  var grouped = {};
  var orderedKeys = [];
  punches.forEach(function(p) {
    var key = p[0] + '|' + p[3]; // employee_id + date
    if (!grouped[key]) {
      grouped[key] = { last_name: p[1], first_name: p[2], date: p[3], events: [] };
      orderedKeys.push(key);
    }
    var ts = p[5] || '';
    grouped[key].events.push({ type: p[4], hhmm: ts.length >= 16 ? ts.slice(11, 16) : '' });
  });

  // Ordenar por fecha desc, luego por apellido asc dentro de cada fecha
  orderedKeys.sort(function(a, b) {
    var ga = grouped[a], gb = grouped[b];
    if (ga.date > gb.date) return -1;
    if (ga.date < gb.date) return  1;
    if (ga.last_name < gb.last_name) return -1;
    if (ga.last_name > gb.last_name) return  1;
    return 0;
  });

  var rows = [];
  orderedKeys.forEach(function(key) {
    var g = grouped[key];
    var clockIn = '', breakOut = '', breakIn = '', clockOut = '';
    var workedMin = 0, openSeg = null;

    g.events.forEach(function(ev) {
      if (ev.type === 'IN'        && !clockIn)  clockIn  = ev.hhmm;
      if (ev.type === 'BREAK_OUT' && !breakOut) breakOut = ev.hhmm;
      if (ev.type === 'BREAK_IN'  && !breakIn)  breakIn  = ev.hhmm;
      if (ev.type === 'OUT'       && !clockOut) clockOut = ev.hhmm;
      if (ev.type === 'IN' || ev.type === 'BREAK_IN') {
        openSeg = ev.hhmm;
      }
      if ((ev.type === 'OUT' || ev.type === 'BREAK_OUT') && openSeg) {
        workedMin += minutesDiff(openSeg, ev.hhmm);
        openSeg = null;
      }
    });

    var hours  = workedMin > 0 ? (workedMin / 60).toFixed(2) : '';
    var status = clockOut ? 'Complete' : (clockIn ? 'Open shift' : 'No clock-in');
    rows.push([g.last_name, g.first_name, g.date, clockIn, breakOut, breakIn, clockOut, hours, status]);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    rows.forEach(function(row, i) {
      var bg = row[8] === 'Complete'  ? '#eef6e3'
             : row[8] === 'Open shift' ? '#fff9e6'
             : '#fdecea';
      sheet.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
    });
    var totalHours = rows.reduce(function(a, r) { return a + (parseFloat(r[7]) || 0); }, 0);
    sheet.getRange(rows.length + 2, 1, 1, headers.length)
         .setValues([['TOTAL', '', '', '', '', '', '', totalHours.toFixed(2), rows.length + ' records']])
         .setFontWeight('bold').setBackground('#ece2d0');
  }

  [150, 130, 110, 90, 90, 90, 90, 110, 110].forEach(function(w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
}

// ─── Página 2: Employees ──────────────────────────────────────────────────────

function writeEmployees(ss, employees) {
  var sheet = getOrCreateSheet(ss, '2. Employees', 1);
  sheet.clearContents();

  var headers = ['Last Name', 'First Name', 'Phone', 'Email', 'PIN Code', 'Notes', 'Status'];
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setBackground('#3b2f23')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  if (employees.length > 0) {
    // cols: id(0) last_name(1) first_name(2) name(3) code(4) phone(5) email(6) details(7) hourly_rate(8) active(9)
    var rows = employees.map(function(e) {
      var active = String(e[9]);
      return [
        e[1] || '',
        e[2] || '',
        e[5] || '',
        e[6] || '',
        e[4] || '',
        e[7] || '',
        (active === '1') ? 'Active' : 'Inactive'
      ];
    });

    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    rows.forEach(function(row, i) {
      var bg = row[6] === 'Active' ? '#eef6e3' : '#fdecea';
      sheet.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
    });
  }

  [150, 130, 130, 180, 90, 200, 90].forEach(function(w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  var ss = SpreadsheetApp.create(SHEET_NAME);
  Logger.log('Spreadsheet creado: ' + ss.getUrl());
  return ss;
}

function getOrCreateSheet(ss, name, index) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, index);
    var def = ss.getSheetByName('Sheet1');
    if (def && def.getLastRow() === 0) ss.deleteSheet(def);
  }
  return sheet;
}

function queryTurso(cfg, sql) {
  var url = cfg.url + '/v2/pipeline';
  var payload = JSON.stringify({
    requests: [{ type: 'execute', stmt: { sql: sql } }, { type: 'close' }]
  });
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + cfg.token },
    payload: payload,
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    throw new Error('Turso HTTP ' + code + ': ' + body);
  }

  var json = JSON.parse(body);
  var first = json.results[0];

  if (first.type === 'error') {
    throw new Error('Turso SQL error: ' + JSON.stringify(first.error));
  }

  var result = first.response.result;
  return result.rows.map(function(row) {
    return row.map(function(cell) {
      return (cell.type === 'null') ? null : cell.value;
    });
  });
}

function minutesDiff(hhmm1, hhmm2) {
  if (!hhmm1 || !hhmm2) return 0;
  var toMin = function(t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
  return Math.max(0, toMin(hhmm2) - toMin(hhmm1));
}
