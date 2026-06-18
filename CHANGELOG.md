# Lox Life Camps — Time Clock & Payroll App
## Development Log

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 3 · Framer Motion · Turso/LibSQL · Google Apps Script  
**Live:** https://loxlifecamp-time-clock.vercel.app · https://record-work-hours.vercel.app  
**Status:** ✅ Delivered to client — 2026-06-10 · ✅ Weekly Report Automation added — 2026-06-18

---

## 🗂 Project Structure

```
app/
  page.tsx                    — Landing (Clock In card + Staff link)
  clock/page.tsx              — Employee PIN entry + live clock
  confirm/page.tsx            — Punch confirmation (flexible buttons)
  admin/
    page.tsx                  — Redirects to /admin/today
    layout.tsx                — AdminShell wrapper (skips login page)
    today/page.tsx            — Live attendance dashboard
    employees/page.tsx        — Employee management
    payroll/page.tsx          — Payroll calculator
    settings/page.tsx         — Global settings
    login/page.tsx            — Admin login
  api/
    validate/route.ts         — PIN validation → returns nextTypes[]
    punch/route.ts            — Record punch (enforces sequence)
    employees/route.ts        — CRUD employees
    employees/[id]/route.ts   — Edit / deactivate / delete employee
    payroll/route.ts          — Payroll calculation
    settings/route.ts         — Read/update settings
    auth/login · logout       — Session auth
    cron/
      weekly-report/route.ts  — Vercel Cron: generates + sends weekly PDF report every Friday 7:30 PM
    admin/
      today/route.ts          — Today's attendance status
      punches/route.ts        — Manual punch entry (GET + POST)
      punches/[id]/route.ts   — Delete punch
lib/
  types.ts                    — PunchType, Employee, Punch, PayrollRow
  punch-sequence.ts           — NEXT_PUNCHES flexible sequence map (break optional)
  queries.ts                  — All DB queries (Turso/LibSQL)
  payroll.ts                  — calculatePayroll(), pairShifts()
  timezone.ts                 — todaySite(), nowSite(), timeFromTs()
  i18n.ts                     — EN/ES translations
  auth.ts / auth-server.ts    — HMAC-SHA256 cookie session
  db.ts                       — Turso client
  sheets.ts                   — Sheets webhook (fire-and-forget)
components/
  admin/admin-shell.tsx       — Header + tabs (Today/Employees/Payroll/Settings)
  pdf/
    WeeklyReportPDF.tsx       — PDF component: employee hours table + totals + ImpulseDigitAI branding
  ui/                         — Button, Card, Logo, EmployeeAvatar, LangToggle
google-sheets/
  SyncTurso.gs                — Google Apps Script (Turso HTTP API sync) ✅ ACTIVE
scripts/
  migrate-punch-types.mjs     — DB migration for BREAK_OUT/BREAK_IN types
  migrate-add-name-columns.mjs — DB migration for last_name/first_name columns
schema.sql                    — Turso/LibSQL schema
public/
  logo.png                    — App logo (favicon + header)
```

---

## ✅ Features (all delivered)

### Branding & UI
- Logo `public/logo.png` — used as favicon + header logo
- Fonts: **Playfair Display** (display/headers), **Inter** (body), **Orbitron** (clock screen)
- Color palette: `espresso` · `clay` · `sand` · `latte` · `cream` · `terracotta` · `olive` · `camp-green-light` (#8bc34a) · `camp-green-dark` (#558b2f)
- Green gradient app background (`app-bg` in globals.css)

### Landing Page (`/`)
- Single "Clock In/Out" card centered
- Small plain-text "Staff" link below — no box, no border → `/admin/login`

### Clock Screen (`/clock`)
- Live Florida-timezone clock (Inter, updates every second)
- Date displayed in full: `Monday, June 8, 2026`
- PIN entry → validates → redirects to `/confirm`

### Punch Confirmation (`/confirm`)
- Shows employee name + avatar
- **4 action buttons** in 2×2 grid (Clock In · Break Out · Break In · Clock Out)
- **Flexible sequence** — break is OPTIONAL:
  ```
  null / OUT  →  Clock In only
  IN          →  Break Out  OR  Clock Out  (both active simultaneously)
  BREAK_OUT   →  Break In only (mandatory return from break)
  BREAK_IN    →  Break Out again  OR  Clock Out
  ```
- Multiple active buttons possible; inactive = gray + disabled
- `NEXT_PUNCHES: Record<string, PunchType[]>` in `lib/punch-sequence.ts`
- Success screen with spring animation

### Admin Panel (`/admin`) — password `1313`

#### Today Tab (`/admin/today`)
- Summary cards: Total Staff · On Shift 🟢 · On Break 🟡 · Clocked Out 🔴 · Not Started ⚪
- Employee cards grouped by status with last punch time
- Auto-refresh every 30s + manual ↻ button

#### Employees Tab (`/admin/employees`)
- Table: Last Name | First Name | PIN | Status | ⋮ — no Hourly Rate column
- **⋮ dropdown menu** per row: ⏱ Manual Entry · ✏️ Edit · ⛔/✅ Deactivate/Activate · 🗑 Delete Permanently
- **New/Edit** modal: Last Name · First Name · PIN (auto-generated) · Phone · Email · Notes — no Hourly Rate field
- **Deactivate** — confirmation modal before soft-delete (punch history preserved)
- **🗑 Delete Permanently** — confirmation modal → removes employee + ALL punch history via `db.batch()`
- **Manual Entry modal** (compact, max-w-sm):
  - Date picker (defaults to today Florida time)
  - Existing punches shown as color pills with × delete button
  - Type buttons show ONLY punch types NOT yet recorded that day
  - Time input + `✓ Save [Type]` button
  - Hides input area when all 4 punches are recorded

#### Payroll Tab (`/admin/payroll`)
- Period presets: **Today** (default) · Weekly · Biweekly · Custom
- **Weekly always starts on Monday** — `mondayOf()` helper calculates the Monday of the current week
- **‹ › navigation** — Today: day-by-day · Weekly: 7-day blocks (Mon→Sun) · Biweekly: 14-day blocks
- **Hours only — no monetary amounts** (rate and total columns removed by client request)
- **Table:** Employee | Hours Worked (2 columns)
- ⚠ warning inline for open shifts (missing clock-out)
- **Dark espresso banner:** "Total del Día / Total del Período" + total hours + employee count
- **↓ Export PDF** — Opens print dialog with branded report: header (Lox Life Camps), period label, styled table (Employee / Hours Worked), dark total banner · no extra npm dependencies (browser print-to-PDF)

#### Settings Tab (`/admin/settings`)
- Weekly hours · Working days — Overtime Multiplier removed from UI (stays in DB)

### Weekly Report Automation (`/api/cron/weekly-report`)
- **Schedule:** Every Friday at 7:30 PM Florida time (23:30 UTC, via Vercel Cron)
- **Recipients:** impulsedigitaius@gmail.com · jessica.ferran85@gmail.com
- **PDF Report:** ImpulseDigitAI branded (navy #1B3A8C · light blue #E8ECF5)
  - Header: "IMPULSEDIGITAI LLC · Weekly Hours Report"
  - Table: Employee names | Hours worked (Mon–Fri)
  - Total banner: Period hours + employee count
  - Footer: Generated timestamp
- **Email:** Sent via Resend (onboarding@resend.dev, no domain verification needed)
- **Security:** Protected by `CRON_SECRET` header authentication

---

## 🔢 Payroll Calculation

```
Worked time = sum of (IN→BREAK_OUT) + (IN→OUT) + (BREAK_IN→BREAK_OUT) + (BREAK_IN→OUT) segments
Break time does NOT count as worked hours

regularHours = worked - overtimeHours
basePay      = regularHours × hourlyRate
overtimePay  = overtimeHours × hourlyRate × multiplier (default 1.5)
totalPay     = basePay + overtimePay
```

---

## 🗄 Database (Turso/LibSQL)

**URL:** `libsql://loxlifecamps-shiftlog-impulsedigitai.aws-us-west-2.turso.io`

```sql
employees (id, last_name, first_name, name, code UNIQUE, phone, email, details, hourly_rate, photo_url, active)
punches   (id, employee_id, type CHECK IN ('IN','BREAK_OUT','BREAK_IN','OUT'), date, ts, synced_sheets)
settings  (id=1, weekly_hours=40, working_days=5, overtime_multiplier=1.5)
```

**Timestamp format:** `"YYYY-MM-DD HH:MM:SS"` in Florida local time (NOT UTC).  
Extracted to HH:MM via `.slice(11,16)` in both app and GS script.

**Migrations applied:**
- `scripts/migrate-punch-types.mjs` — expanded CHECK from `('IN','OUT')` to all 4 types
- `scripts/migrate-add-name-columns.mjs` — added `last_name`, `first_name`; split from `name`

---

## 🌐 Timezone

All times stored and displayed in **America/New_York (Florida EST/EDT)**.  
Server: `lib/timezone.ts` — `todaySite()`, `nowSite()`.  
Client: `Intl.DateTimeFormat({ timeZone: 'America/New_York' })`.

---

## 🔐 Auth

- HMAC-SHA256 cookie-based session (edge-safe)
- `SESSION_SECRET` throws at runtime if not set
- Admin password: `1313` (recommend changing in Vercel)

---

## 📦 Environment Variables

```
TURSO_DATABASE_URL=libsql://loxlifecamps-shiftlog-impulsedigitai.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=<rotated 2026-06-08>
ADMIN_PASSWORD=1313
SESSION_SECRET=<32-char hex>
SHEETS_WEBHOOK_URL=
RESEND_API_KEY=re_xxxx    # For weekly report email delivery
CRON_SECRET=<32-char hex> # Protects /api/cron/weekly-report endpoint
```

---

## 📊 Google Sheets Sync

**Script:** `google-sheets/SyncTurso.gs` (v3 — 2026-06-10)  
**Account:** `digitalloxlifecamps@gmail.com`  
**Sheet:** `"time clock employes"` (Google Drive)  
**Status:** ✅ Active

- Calls Turso HTTP API directly (`/v2/pipeline`) — no app server needed
- Credentials via `getProps()` — read per-execution (NOT globals), prevents stale credential bugs
- **Sheet 1 — "1. Time Clock":** Last Name · First Name · Date · Clock In · Break Out · Break In · Clock Out · Hours Worked · Status
- **Sheet 2 — "2. Employees":** Last Name · First Name · Phone · Email · PIN · Notes · Status (no Hourly Rate)
- Color coding: Complete 🟢 · Open shift 🟡 · No clock-in 🔴 · Active/Inactive employees
- Explicit SQL error detection: `first.type === 'error'` throws readable message instead of crashing silently
- Null-safe timestamp: checks `ts.length >= 16` before `.slice(11,16)`
- **v3: `setup()` auto-creates hourly trigger** via `createHourlyTrigger()` — deletes any duplicates first
- Logging: punch counts by type (`IN: N, BREAK_OUT: N, BREAK_IN: N, OUT: N`) for easy debugging
- Rows sorted: most recent date first, then alphabetically by last name
- To re-sync immediately: run `syncAll()` in Apps Script
- To rotate token: update token in `setup()` → run `setup()` once (re-creates trigger + saves token)`

---

## 🐛 Bugs Fixed

| Bug | Root Cause | Fix |
|---|---|---|
| "Code already in use" on new employee | Catch block masked ALL DB errors | `err.message.includes('unique')` to distinguish |
| `last_name` column missing in prod | Vercel pointed to wrong/older DB | Re-set TURSO_DATABASE_URL + ran migration |
| `ADMIN_PASSWOR` typo in Vercel | Typo on initial setup | Removed + re-added correctly |
| `SESSION_SECRET` missing in Vercel | Never added | Added via `vercel env add` |
| `isActive={e.active}` TypeScript error | `active` is `number` not `boolean` | Changed to `e.active === 1` |
| Time "25:99" passed API validation | Regex checked format only | Added `h >= 0 && h <= 23` range check |
| Apps Script `http:///v2/pipeline` error | `setup()` not run before `syncAll()` | Must run `setup()` first to set Script Properties |
| Weekly payroll navigating day-by-day | `isDaily = from === to` triggered on Mondays (week start = today) | Changed to `isDaily = preset === 'today'` only; weekly/biweekly always shift full blocks |
| Google Sheets employees not syncing | Global vars read before props saved; SQL errors masked as TypeError | `getProps()` per-execution + explicit `first.type === 'error'` check |
| Export CSV not visual enough | Raw CSV not useful for payroll manager | Replaced with PDF export via `window.print()` — branded report with table + total banner |
| Break Out / Break In missing in Google Sheet | `syncAll()` ran before breaks were recorded today — no auto-trigger existed | Added `createHourlyTrigger()` to `setup()` in GS script v3; Sheet shows all 4 punch types correctly once re-synced |

---

## 🚀 Dev Commands

```bash
export PATH="$PATH:$HOME/.nvm/versions/node/v24.15.0/bin"
cd "/Users/asapmusic/Desktop/proyectos claude via vs code/record-work-hours-main"

npm run dev                                                           # local dev
npx vercel --prod                                                     # deploy production
npx vercel logs record-work-hours.vercel.app --level error -x        # check errors
node --env-file=.env.local scripts/migrate-add-name-columns.mjs      # run migration
```

---

## 📝 Future / Not yet built

- Photo upload for employees (field exists in DB, UI not built)
- Push notifications when employee clocks in/out
- Push notifications when employee clocks in/out
