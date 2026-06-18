# Payroll & Attendance App

Control de asistencia (fichaje) + cálculo de nómina para empleados.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 · framer-motion ·
Turso/LibSQL · Zod. Optimizado para Vercel.

- Idioma: **Inglés por defecto** con toggle ES/EN (i18n liviano, sin librerías).
- Zona horaria fija: **Florida, EE.UU. (`America/New_York`, EST/EDT)** — todo registro/visualización
  usa esta zona sin importar el servidor.
- Diseño: paleta cálida beige, títulos en **Playfair Display**, cuerpo en **Inter**, tarjetas con
  sombras suaves.

## Funcionalidades

1. **Portal del trabajador** (`/`): ingreso de PIN → confirma empleado y decide automáticamente
   ENTRADA/SALIDA según el último fichaje del día → check animado.
2. **Admin · Empleados** (`/admin/employees`): CRUD con nombre, datos generales, **tarifa por hora**
   y código PIN único. Baja lógica (no borra, conserva historial).
3. **Admin · Ajustes** (`/admin/settings`): horas semanales exigidas, días laborables y multiplicador
   de horas extra.
4. **Admin · Nómina** (`/admin/payroll`): filtro por período (semanal / quincenal / personalizado)
   y cálculo automático por empleado.
5. **Automated Weekly Report** (`/api/cron/weekly-report`): Every Friday at 7:30 PM (Florida time),
   generates and sends a PDF with employee hours worked (Monday–Friday) via Resend to
   impulsedigitaius@gmail.com and jessica.ferran85@gmail.com. Full ImpulseDigitAI branding with logo,
   colors (#1B3A8C navy, #E8ECF5 light blue), contact info, and website footer. All in English.

## Lógica de nómina (`lib/payroll.ts`)

Modelo **por hora**:

```
expectedDaily  = weekly_hours / working_days
expectedHours  = expectedDaily × (días laborables en el rango)   // Lun..(working_days)
overtimeHours  = max(0, worked − expected)
regularHours   = worked − overtimeHours
shortfallHours = max(0, expected − worked)        // atrasos / salidas anticipadas
basePay        = regularHours × hourly_rate
overtimePay    = overtimeHours × hourly_rate × overtime_multiplier
totalPay       = basePay + overtimePay
```

Los turnos se forman emparejando IN→OUT por empleado/día. Un turno abierto (IN sin OUT) no suma
horas y se marca con ⚠ en la tabla.

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.local.example .env.local
#   editar: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_PASSWORD, SESSION_SECRET

# 3. Crear la base en Turso y aplicar el esquema
turso db create payroll-attendance      # si aún no existe
turso db shell <tu-db> < schema.sql

# 4. Desarrollo
npm run dev      # http://localhost:3000
```

### Flujo de prueba

1. Entrá a `/admin/login` con `ADMIN_PASSWORD` y creá 1–2 empleados (tarifa + PIN).
2. Configurá Ajustes Globales (horas semanales, días, multiplicador).
3. En `/`, fichá con un PIN: la primera vez registra ENTRADA, la siguiente SALIDA.
4. En `/admin/payroll`, elegí el período y verificá el desglose: base + extras − déficit.

## Respaldo opcional a Google Sheets

Dejá `SHEETS_WEBHOOK_URL` vacío para desactivarlo. Si lo configurás (URL de un Apps Script Web App),
cada fichaje se envía **fire-and-forget**: si Sheets falla, se loguea pero nunca rompe el fichaje.
Turso sigue siendo la única fuente de verdad. (Ver el script de referencia en `EXTRACCION-DISENO.md` §5.)

## Despliegue en Vercel

1. Importá el repo en Vercel.
2. Cargá las mismas variables de entorno del `.env.local`, más:
   - `RESEND_API_KEY`: obtenida de https://resend.com/api-keys
   - `CRON_SECRET`: cadena aleatoria de 32+ caracteres (protege el endpoint del cron)
3. Deploy. El esquema de Turso se aplica una sola vez con `turso db shell` (paso 3 de arriba).
4. **Configura tu dominio en Resend:** Ve a https://resend.com/domains, agrega tu dominio y verifica
   los registros DNS en tu proveedor de hosting (Hostinger, etc.).
5. Una vez deployado, el cron se ejecutará automáticamente cada viernes 7:30 PM Florida time.
   Los informes se envían desde tu dominio verificado (ej: contact@tudominio.com).
