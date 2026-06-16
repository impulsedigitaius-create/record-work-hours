-- Esquema Turso / LibSQL para la app de Asistencia + Nómina
-- Aplicar con: turso db shell <db> < schema.sql

CREATE TABLE IF NOT EXISTS employees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  last_name     TEXT NOT NULL DEFAULT '',
  first_name    TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',      -- display: "First Last" (usado en punch screen)
  code          TEXT NOT NULL UNIQUE,          -- PIN único de ingreso
  phone         TEXT,                          -- teléfono (mandatorio en UI al crear)
  email         TEXT,                          -- email (opcional)
  details       TEXT,                          -- notas generales
  hourly_rate   REAL NOT NULL DEFAULT 0,       -- tarifa base por hora
  photo_url     TEXT,
  active        INTEGER NOT NULL DEFAULT 1     -- baja lógica (1 activo / 0 inactivo)
);

CREATE TABLE IF NOT EXISTS punches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   INTEGER NOT NULL REFERENCES employees(id),
  type          TEXT NOT NULL CHECK(type IN ('IN','BREAK_OUT','BREAK_IN','OUT')),
  date          TEXT NOT NULL,                 -- YYYY-MM-DD (zona horaria Florida)
  ts            TEXT NOT NULL,                 -- YYYY-MM-DD HH:MM:SS (zona horaria Florida)
  synced_sheets INTEGER NOT NULL DEFAULT 0
);

-- Fila única de configuración global (id siempre = 1)
CREATE TABLE IF NOT EXISTS settings (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  weekly_hours        REAL NOT NULL DEFAULT 40,
  working_days        INTEGER NOT NULL DEFAULT 5,
  overtime_multiplier REAL NOT NULL DEFAULT 1.5
);
INSERT OR IGNORE INTO settings (id, weekly_hours, working_days, overtime_multiplier)
VALUES (1, 40, 5, 1.5);

CREATE INDEX IF NOT EXISTS idx_emp_code       ON employees(code);
CREATE INDEX IF NOT EXISTS idx_emp_lastname   ON employees(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_punch_emp_date ON punches(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_punch_date     ON punches(date);
