# Outreach.ai — Agentic Codebase Reference

This document is the authoritative reference for AI agents working on this codebase. Read it before making changes. It covers architecture, data models, every significant route, frontend structure, key workflows, and gotchas that have already been fixed.

---

## Stack & Ports

| Layer      | Tech                               | Port  |
|------------|------------------------------------|-------|
| Frontend   | React 18 + Vite                    | 5175  |
| Backend    | Node.js + Express                  | 3000  |
| Database   | SQLite via Prisma ORM              | file  |
| WebSocket  | ws library                         | 8080  |
| Email      | Nodemailer (Gmail SMTP / App Pass) | —     |
| AI         | Google Gemini (env) / Claude (DB)  | —     |

**Dev commands:**
```
# Backend (from repo root)
node index.js            # or nodemon index.js

# Frontend (from frontend/)
npm run dev              # vite dev server → localhost:5175
```

**API base URL in frontend:** `http://localhost:3000` — set in `frontend/src/services/api.js` as a plain axios instance. No auth headers are added by default because auth is bypassed server-side.

---

## Authentication — CRITICAL

**Auth is bypassed for local development.** `middleware/auth.js` → `authenticateToken` does this:

```js
req.userId = 1;   // hardcoded — every request is treated as user 1
next();
```

All protected routes call `router.use(authenticateToken)` but it never actually validates anything. Do **not** add real auth checks without understanding this. The real token validators (`authenticateGoogleWorkspaceToken`, `authenticateMicrosoftToken`) exist but are not used on any route.

---

## Database — Prisma + SQLite

**Schema file:** `schema.prisma` (repo root)  
**Database file:** `dev.db` (repo root, gitignored)  
**Prisma client:** generated into `node_modules/@prisma/client`

**To apply schema changes:**
```
npx prisma db push        # fast, no migration file — use for dev
npx prisma migrate dev    # requires interactive terminal — won't work in CI
```

**Prisma client import pattern used everywhere:**
```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

There is also a shared instance at `services/database.js` that the `models/` layer uses. Routes instantiate their own client directly — both approaches are in use.

---

## Data Models

### User
```
id, username (unique), email (unique), password (bcrypt hashed), createdAt
→ sequences[]
```
Only one user exists in practice (id=1, email=henry@outreach.ai). All foreign keys use userId=1.

### Prospect
```
id, firstName, lastName, email (unique), companyName?, title?, phone?,
enrichmentStatus ("pending" | "enriched"), status, notes?, createdAt
→ sequenceEnrollments[], emailActivities[], callActivities[]
```

**`status` values** (used in UI filters and badge styles):
- `Uncontacted` (default)
- `In Sequence`
- `Replied`
- `Meeting Booked`
- `Not Interested`

**`enrichmentStatus`** controls the enriched badge and filter chip. Set to `"enriched"` when title/phone/tech stack are populated (either by ZoomInfo CSV import or Gemini enrichment).

**`trackingPixelData`** — a JSON field (SQLite stores as string). Legacy enrichment data may be here (phone, linkedIn, timezone). Always check both `p.phone` and `p.trackingPixelData?.phone` when displaying/filtering phone numbers.

### Sequence
```
id, name, userId (FK→User), schemaTag ("default"), createdAt, updatedAt
→ steps[] (SequenceStep), prospectEnrollments[] (SequenceEnrollment)
```

### SequenceStep
```
id, sequenceId (FK), order (Int), stepType, delayDays (Int),
subject (""), body (""), schemaTag, createdAt, updatedAt
→ emailActivities[], callActivities[]
```

**`stepType` values** (defined in `frontend/src/constants/index.js` as `STEP_TYPE_CONFIG`):
- `AUTO_EMAIL` — sent automatically by the cron mailer
- `MANUAL_EMAIL` — flagged for manual send / HITL review
- `CALL` — creates a planned CallActivity, appears in Calls tab
- `LINKEDIN` — manual touch, appears as task
- `TASK` — generic manual task

### SequenceEnrollment
```
id, prospectId (FK), sequenceId (FK),
currentStepOrder (Int, default 0), status, nextStepDue?,
lastContactedAt?, completedAt?, optedOutAt?,
pausedAt?, pausedReason?, enrolledAt, createdAt, updatedAt
→ emailActivities[], callActivities[]
UNIQUE: [prospectId, sequenceId]
```

**`status` values:**
- `active` — being worked, cron will pick up if nextStepDue <= now
- `paused` — manually paused, cron ignores it
- `completed` — all steps sent
- `replied` — prospect replied, stopped
- `opted_out` — prospect unsubscribed
- `failed` — system error

**How the scheduler decides what to send:**  
`enrollmentService.getDueEnrollments()` queries `status='active' AND nextStepDue <= NOW()`. Then `sequenceMailer.runDueSequenceEmails()` finds the next step: if `currentStepOrder === 0`, sends step with `order=1`; otherwise finds the first step with `order > currentStepOrder`.

**`currentStepOrder=0` means "not yet started"** — step 1 is the first to send. After sending step N, `currentStepOrder` is set to N.

### EmailActivity
```
id, prospectId (FK), sequenceStepId (FK), enrollmentId (FK),
status, subject, scheduledFor?, sentAt?, openedAt?, failureReason?, createdAt
```

**`status` values:** `sent` | `opened` | `failed` | `cancelled`

Created by `enrollmentService.recordStepSent()`. Updated to `opened` by `enrollmentService.recordOpen()` (called from the tracking pixel endpoint). Failed sends also write a record (in `sequenceMailer.runDueSequenceEmails()`).

### CallActivity
```
id, prospectId (FK), sequenceStepId (FK), enrollmentId (FK),
status, scheduledFor?, completedAt?, durationSecs?, notes?, outcome?, createdAt
```

**`status` values:** `planned` | `completed` | `skipped` | `no_answer` | `voicemail` | `connected` | `cancelled`  
**`outcome` values:** `connected` | `voicemail` | `no_answer` | `left_message`

CallActivity records are **not** created automatically — they are created when a user logs a call via the Calls tab UI, or explicitly in the demo seeder.

### IntegrationCredential
```
id, provider, clientId, clientSecret, refreshToken?, email?, userId, createdAt, updatedAt
UNIQUE: [provider, userId]
```

**`provider` values in active use:** `claude` | `google` | `microsoft` | `elevenlabs`

For **Google (Gmail App Password):** `clientId` = Gmail address, `clientSecret` = 16-char App Password.  
For **Microsoft:** `clientId` = Azure app client ID, `clientSecret` = client secret, `refreshToken` = OAuth refresh token, `email` = Microsoft account email.  
For **Claude:** `clientId` = API key.

---

## Backend Routes

### Route Ordering Rule
**Express matches routes in definition order. Specific paths must come before `/:id` wildcards.** This has already been fixed in `routes/prospects.js` and `routes/sequences.js`. If you add new specific paths (e.g., `/bulk`, `/demo-reset`), always place them above the `/:id` routes.

### `routes/prospects.js` — mounted at `/prospects`

```
GET    /                    → getAllProspects() — returns all with _count.sequenceEnrollments
GET    /filter-chips        → getFilterChips()
GET    /filter              → filterProspects(req.query)
GET    /top-opportunities   → getTopOpportunities(limit, sortBy, sortOrder)
GET    /geographic-routing  → filterProspects({ countryRegion })
POST   /                    → createProspect(req.body)
DELETE /demo-reset          → deleteMany all enrollments then all prospects
POST   /bulk                → createProspectsBulk(req.body.prospects)
POST   /list-unsubscribe    → handleListUnsubscribe(email)
POST   /enrich              → bulk enrich (Gemini) — up to 10 pending prospects
GET    /:id                 → getProspectById(id)
PUT    /:id                 → updateProspect(id, req.body)
DELETE /:id                 → deleteProspect(id)
POST   /:id/win             → recordWin(id)
POST   /:id/loss            → recordLoss(id)
POST   /:id/enrich          → single prospect Gemini enrichment (phone, LinkedIn, timezone)
```

**Important:** `DELETE /demo-reset` must stay above `DELETE /:id`.

### `routes/sequences.js` — mounted at `/sequences`

```
GET    /enrollments/prospect/:prospectId  → getProspectEnrollments(id) [MUST be first]
GET    /                → getAllSequences — includes steps + prospectEnrollments (with prospect)
GET    /:id             → getSequenceById
POST   /                → createSequence
PUT    /:id             → updateSequence
DELETE /:id             → deleteSequence
POST   /:id/enroll      → enrollProspects(sequenceId, prospectIds[])
DELETE /:id/enroll/:prospectId → unenrollProspect
POST   /:id/opt-out/:prospectId → optOutProspect
POST   /:id/pause/:prospectId  → pauseEnrollment(sequenceId, prospectId, reason)
POST   /:id/resume/:prospectId → resumeEnrollment
POST   /:id/pause-all   → pause all active enrollments in the sequence
```

**`GET /sequences`** is the heaviest read — it includes `steps` and `prospectEnrollments` (each with `prospect`). The SequenceManager loads everything this way on mount.

### `routes/sequenceSteps.js` — mounted at `/sequenceSteps`

Standard CRUD: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.

### `routes/email-activities.js` — mounted at `/email-activities`

```
GET    /sequence/:sequenceId   → merged EmailActivity records + scheduled items from enrollments
PATCH  /:id/cancel             → set EmailActivity status='cancelled'
PATCH  /enrollment/:id/cancel  → pause enrollment (clears nextStepDue)
PATCH  /enrollment/:id/reschedule → update nextStepDue (body: { scheduledFor })
PATCH  /enrollment/:id/retry   → set nextStepDue=now, status='active'
```

"Scheduled" items in the GET response are not EmailActivity records — they are derived from `SequenceEnrollment` where `status='active'` and `nextStepDue` is set. They have `type: 'scheduled'` and an `enrollmentId` but no `id`.

### `routes/call-activities.js` — mounted at `/call-activities`

```
GET    /sequence/:sequenceId          → merged CallActivity records + planned items from enrollments
POST   /                              → log a call result, advances enrollment
PATCH  /:id                           → update existing CallActivity
PATCH  /enrollment/:id/skip           → log skip, advance enrollment
PATCH  /enrollment/:id/reschedule     → update nextStepDue
PATCH  /enrollment/:id/cancel         → pause enrollment
```

"Planned" call items in the GET response are derived from active enrollments where the **next step is `stepType='CALL'`**. They have `type: 'planned'` and an `enrollmentId`.

### `routes/integrations.js` — mounted at `/integrations`

```
GET    /       → list all IntegrationCredentials for userId=1
POST   /       → upsert credential (provider + clientId + clientSecret + optional fields)
DELETE /:id    → remove credential
```

On `POST /`, the route validates the credential before saving:
- **claude:** makes a test request to Anthropic API
- **google:** calls `nodemailer.verify()` on smtp.gmail.com:587 with the credentials
- **microsoft:** validates the access token against Graph API
- **elevenlabs:** calls the ElevenLabs voices endpoint

### `routes/microsoftOAuth.js` — mounted at `/auth/microsoft`

```
POST /start    → stores { clientId, clientSecret, userId, createdAt } in-memory by UUID state
               → returns { url } — the Microsoft OAuth authorize URL
GET  /callback → exchanges code+state, fetches /v1/me, upserts IntegrationCredential
               → redirects to http://localhost:5175/integrations?ms_connected=1&ms_email=...
```

State is stored in-memory (Map). A cleanup interval removes entries older than 10 minutes.

### `routes/demo.js` — mounted at `/demo`

```
POST   /load   → wipes ALL data then seeds: 25 prospects, 3 sequences with steps,
                 enrollments at varied stages, EmailActivity records, CallActivity records
               → returns { ok, summary: { prospects, sequences, enrollments, emailActivities, callActivities } }
DELETE /clear  → wipes emailActivities, callActivities, enrollments, steps, sequences, prospects
               → returns { ok, cleared: N }
```

**Warning:** `/demo/load` is destructive — it deletes everything before inserting. Safe to call repeatedly.

### `routes/hitl.js` — mounted at `/hitl`

In-memory queue (not persisted to DB). Items survive server restarts only if seed data is loaded.

```
GET    /queue         → list pending review items
POST   /queue         → add item to review queue
POST   /queue/:id/approve → approve and execute the action
POST   /queue/:id/reject  → reject and discard
```

### `routes/orchestration.js` — mounted at `/orchestration`

AI provider resolution and drafting engine:
```
POST /draft   → resolves best available AI (Claude API key from DB → Gemini from env)
              → generates email/call script draft using interpolated prompt
POST /execute → runs an agentic action (enrichment, list build, sequence draft)
```

**AI provider priority:** Claude (`IntegrationCredential` where provider='claude') → Gemini (`GEMINI_API_KEY` env var). If neither is configured, returns a 503.

---

## Services

### `services/enrollmentService.js`

All sequence lifecycle management. Exports:

| Function | Description |
|----------|-------------|
| `enrollProspects(seqId, prospectIds[])` | Upsert enrollments, reactivates completed/opted-out, sets nextStepDue from step 1 delayDays |
| `unenrollProspect(seqId, prospectId)` | Hard delete enrollment |
| `optOutProspect(seqId, prospectId)` | Sets opted_out + updates Prospect.status='Not Interested' |
| `pauseEnrollment(seqId, prospectId, reason)` | Pauses with optional reason |
| `resumeEnrollment(seqId, prospectId)` | Resumes, sets nextStepDue=now if next step exists |
| `markReplied(seqId, prospectId)` | Sets replied + updates Prospect.status='Replied' |
| `recordStepSent(enrollment, step)` | Creates EmailActivity 'sent', advances enrollment, updates Prospect.status='In Sequence' |
| `recordOpen(prospectId, stepId)` | Marks EmailActivity as 'opened' |
| `getDueEnrollments()` | Active enrollments with nextStepDue <= now |
| `getProspectEnrollments(prospectId)` | All enrollments for a prospect |

### `services/sequenceMailer.js`

SMTP email sender. Called by the cron job every 15 minutes.

```
createTransport()        → async — tries SMTP_USER env, falls back to DB google credential
interpolate(tpl, p)      → replaces {{firstName}} {{lastName}} {{company}} {{email}} {{title}}
sendStepEmail(enr, step) → sends email, calls recordStepSent(), returns EmailActivity
runDueSequenceEmails()   → main entry point — iterates due enrollments, calls sendStepEmail()
                           records failed EmailActivity on error
```

**SMTP configuration (env vars):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   (Gmail App Password — 16 chars)
EMAIL_FROM_NAME="Henry from Outreach.ai"
APP_URL=http://localhost:3000    (for tracking pixel)
```

### `services/database.js`

Exports a shared Prisma client instance. Used by `models/prospect.js`. Routes create their own instance instead.

---

## Frontend Structure

### Entry points
```
frontend/src/main.jsx          → mounts App inside BrowserRouter
frontend/src/App.jsx           → routing, sidebar, topbar, global keyboard shortcuts, overlays
frontend/src/styles.css        → all CSS custom properties and shared classes
frontend/src/constants/index.js → STEP_TYPE_CONFIG, ENROLLMENT_STATUS_STYLES, PROSPECT_STATUS_STYLES
```

### App.jsx — global shell

**State managed at App level:**
- `tourOpen` — guided tour overlay
- `demoOpen` — demo mode modal
- `paletteOpen` — command palette (⌘K)
- `shortcutsOpen` — keyboard shortcuts overlay
- `allProspects` — fetched once on mount for command palette search
- `callsToday`, `goals` — sidebar daily activity widget (localStorage)
- `hitlCount`, `activeEnrollments`, `pendingTaskCount` — nav badge counts

**Keyboard shortcuts:**
- `⌘K` / `Ctrl+K` → command palette
- `?` → shortcuts overlay
- `G + D/C/S/P/A/R/T/M/I/V` → navigate (800ms chord window)
- `Esc` → close overlays

**Route → Component mapping:**
```
/                  → Dashboard
/login             → Login
/prospects         → Prospects
/dialer            → PowerDialerView
/sequence-manager  → SequenceManager
/integrations      → Integrations
/hitl              → HITLReviewView
/analytics         → AnalyticsDashboard
/deliverability    → DeliverabilityGate
/voice-fleet       → VoiceFleetCommand
/tasks             → TaskInbox
/success-plans     → SuccessPlans
/voice-agent       → VoiceAgentLanding
/sequence-steps    → SequenceSteps (legacy)
/ws                → WebsocketViewer (debug)
```

### Contexts

**`contexts/IntegrationContext.jsx`**  
Fetches `/integrations` on mount and exposes:
- `integrations[]` — raw credential objects
- `isConfigured(provider)` — returns `true` if any credential exists for that provider string
- `reload()` — re-fetches

**Critical:** `isConfigured('gemini')` always returns `false` even if `GEMINI_API_KEY` is in `.env`, because Gemini auth is env-only (not stored in DB). Any gate that requires Gemini should check `isConfigured('claude') || !!process.env.GEMINI_API_KEY` — or in the frontend, just default to `true` as is done in Dashboard.jsx: `const claudeReady = isConfigured('claude') || isConfigured('gemini') || true`.

### Key Components

#### `Dashboard.jsx` — Command Center (`/`)
- AI chat interface powered by `/orchestration/execute`
- Stat cards (clickable, navigate to relevant pages)
- Suggested prompts, playlist/call list builder
- `claudeReady` is always `true` (AI gate was removed — Gemini works via env var)

#### `Prospects.jsx` — Contact CRM (`/prospects`)
- Fetches `GET /prospects` on mount
- Status filters, quick filters (Has Phone, Enriched), search, sort
- ZoomInfo CSV upload via PapaParse → `POST /prospects/bulk`
- Inline status editing (click badge → select dropdown)
- Engagement score computed client-side (`computeEngagementScore`)
- **Floating bulk action toolbar** appears when `selectedIds.size > 0`: Enroll in Sequence, Opt Out, Delete
- Sequence enroll modal with sequence list
- "Clear all prospects" → `DELETE /prospects/demo-reset`
- **Phone display:** always use `p.phone || p.trackingPixelData?.phone` — both fields may carry the number

#### `SequenceManager.jsx` — Sequences (`/sequence-manager`)
- Left pane: sequence list with create form
- Center pane: 4 tabs — **Steps**, **Enrolled Prospects**, **Emails**, **Calls**
- Right pane: stats (cadence summary, enrollment breakdown, per-step analytics)

**Steps tab:** Drag-to-reorder (HTML5 drag API, ID-based, live preview during drag). Inline edit form with step type selector, delay days, subject, body, personalisation tokens.

**Enrolled Prospects tab:** Shows enrolled prospects with status, next due date, actions (Pause/Resume/Opt Out/Remove). Also includes the "Add Prospect to Sequence" panel (search + bulk select mode).

**Emails tab:**
- Fetches `GET /email-activities/sequence/:id` when tab is active
- Filter by status (All/Scheduled/Sent/Opened/Failed/Cancelled)
- Bulk cancel, inline reschedule (datetime-local picker), retry failed
- "Scheduled" items come from active enrollments, not EmailActivity records

**Calls tab:**
- Fetches `GET /call-activities/sequence/:id` when tab is active
- Filter by status + **Group by** (Account / Outcome / Step / None)
- Log Call inline form (outcome, duration, notes), Reschedule, Skip, Cancel
- Phone number displayed as clickable `tel:` link

#### `Integrations.jsx` — Integrations (`/integrations`)
- `GoogleSetupForm` — 3-step App Password walkthrough + SMTP verify
- `MicrosoftSetupForm` — 6-step Azure portal walkthrough + OAuth redirect flow
- Reads `?ms_connected=1&ms_email=...` query params on mount (set by OAuth callback)
- Calls `reload()` from IntegrationContext after successful save

#### `TourOverlay.jsx` — Guided tour
- 8 steps targeting `data-tour="..."` attributes on nav links
- Stores completion in localStorage under `tour_completed_v1`
- Triggered by "Take a tour" button in sidebar footer or command palette

#### `DemoMode.jsx` — Demo mode modal
- `POST /demo/load` → full dataset replacement
- `DELETE /demo/clear` → wipe all data
- Feature list with specifics of what's loaded
- Loading animation, success/confirm-clear states
- Triggered by "🎬 Demo mode" button in sidebar footer or command palette ("Demo mode")

#### `TaskInbox.jsx` — Task Inbox (`/tasks`)
- Aggregates due actions across all sequences
- Groups into Overdue / Due Today / Upcoming
- Links back to specific prospect/sequence

#### `PowerDialerView.jsx` — Calls / Dialer (`/dialer`)
- Loads a call list (from localStorage or URL state)
- Three modes: Manual, Sequential, Power Dial
- Writes timestamps to localStorage under `calls_prospect_timestamps` key
- App.jsx reads this to power the sidebar "Calls Today" progress bar

---

## Email & Cron Scheduling

**Cron job** in `index.js`:
```js
cron.schedule('*/15 * * * *', async () => {
  const results = await runDueSequenceEmails();
  // logs if results.sent > 0 || results.failed > 0
});
```

**Send decision logic** (in `sequenceMailer.runDueSequenceEmails`):
1. Call `getDueEnrollments()` → active enrollments with `nextStepDue <= now`
2. For each enrollment, find next step:
   - If `currentStepOrder === 0` → find step with `order === 1`
   - Otherwise → find first step with `order > currentStepOrder`
3. If step is `AUTO_EMAIL` → send via SMTP, call `recordStepSent()`
4. If step is `CALL`, `LINKEDIN`, `TASK` → the cron does not auto-send these. The scheduler still advances past them via `recordStepSent()` which is called regardless. **Note:** currently the mailer sends email for ANY step type — if you want CALL steps to just advance without emailing, add a type check.
5. On error → create `EmailActivity { status: 'failed', failureReason: err.message }`

**Tracking pixels:**  
`GET /track/open?prospectId=X&stepId=Y` → calls `recordOpen(prospectId, stepId)` → updates EmailActivity to `opened`. The pixel is embedded as a 1×1 `<img>` in the HTML email.

---

## Reply Detection & OOO Handling

### Overview
The system polls inboxes for replies to sequence emails every 10 minutes (cron). Replies are classified and acted on automatically.

**Classification types:**
| Type | Action |
|------|--------|
| `ooo` | Pause enrollment (`pausedReason='ooo'`), set `resumeAt` from parsed return date + 1 day buffer (7-day fallback), decrement `currentStepOrder` by 1 so same step retries |
| `genuine_reply` | `markReplied()` — stops sequence, sets Prospect.status='Replied' |
| `unsubscribe` | `optOutProspect()` — opts out entirely |
| `bounce` | Log only |
| `unknown` | Log only |

### Transport priority
1. **Microsoft Graph API** — if `microsoft` IntegrationCredential exists with `refreshToken`. Uses `GET /me/messages` filtered by `receivedDateTime`. Matches by `In-Reply-To` header against `EmailActivity.externalMessageId`.
2. **Gmail IMAP** — if `google` IntegrationCredential exists (App Password). Uses `imapflow` + `mailparser`. Same matching logic.

### Microsoft OAuth scopes
`Mail.Send`, `Mail.Read` (added for reply detection), `User.Read`, `offline_access`, `openid`. Existing users who connected Microsoft before `Mail.Read` was added must **re-connect** via the Integrations page to grant the new scope.

### Schema fields added
- `SequenceEnrollment.resumeAt DateTime?` — when OOO-paused enrollment should auto-resume
- `EmailActivity.externalMessageId String?` — Nodemailer Message-ID for `In-Reply-To` matching
- `ReplyActivity` model — full record of each detected reply

### `ReplyActivity` model
```
id, prospectId, enrollmentId, sequenceId, fromEmail, subject, bodySnippet,
classification, oooReturnDate?, externalMessageId?, receivedAt, processedAt?, createdAt
```
Deduplication: a `ReplyActivity` with the same `externalMessageId` is never created twice.

### Key services
- `services/replyDetector.js` — `runReplyDetection()`, `classifyReply()`, `extractReturnDate()`, `resumeOooEnrollments()`
- `services/enrollmentService.js` — `pauseForOoo(sequenceId, prospectId, returnDate?)` — pauses and decrements `currentStepOrder`
- `services/sequenceMailer.js` — captures `info.messageId` from Nodemailer, passes to `recordStepSent()` which stores it as `externalMessageId`

### Routes
`/reply-activities` — mounted in `index.js`
```
GET  /sequence/:sequenceId   → all replies for a sequence (with prospect info)
GET  /prospect/:prospectId   → all replies for a prospect
PATCH /:id/reclassify        → override classification, re-applies action if enrollment still active
POST /trigger-scan           → manually trigger reply detection (responds immediately, runs async)
```

### Cron schedule
Every 10 minutes: `runReplyDetection()` which calls both `resumeOooEnrollments()` and inbox polling.

### Frontend (SequenceManager.jsx)
- **Replies tab** — new 5th tab alongside Steps/Prospects/Emails/Calls. Shows all detected replies with classification pills, OOO return dates, body snippets, and inline reclassify dropdown.
- **Enrolled Prospects tab** — OOO-paused enrollments show `✈ OOO` badge (amber) instead of `paused`. Resume date shown in Next Due column. Resume Now button (manual override).
- "Scan inbox" button in Replies tab triggers `POST /trigger-scan` for immediate on-demand polling.

### OOO retry logic
`pauseForOoo` decrements `currentStepOrder` by 1 before pausing. This means when `resumeOooEnrollments()` resumes the enrollment (sets `status='active'`, `nextStepDue=now`), the mailer will find and resend the **same step** that the OOO was a response to — because the mailer looks for steps with `order > currentStepOrder`.

---

## Demo Mode

**`POST /demo/load`** is idempotent — it deletes all data first, then inserts fresh demo content:
- 25 prospects (US, EU, APAC) — various statuses and enrichment levels
- 3 sequences: Q2 Enterprise Outbound (6 steps), SMB Cold Outreach (4 steps), Inbound Trial Follow-Up (3 steps)
- Enrollments at varied stages: active, paused, replied, opted_out, completed
- EmailActivity records: sent, opened (with open timestamps), failed (with error)
- CallActivity records: connected (with duration/notes), voicemail, no_answer, and one planned call due today

Accessible via:
- Sidebar footer → "🎬 Demo mode" button
- Command palette (⌘K) → search "demo"

---

## Known Patterns & Gotchas

### 1. Route ordering in Express
Always define specific routes before wildcards. In `routes/prospects.js`, `/filter-chips`, `/filter`, `/top-opportunities`, `/geographic-routing`, `/demo-reset`, `/bulk`, `/list-unsubscribe`, `/enrich` all come before `/:id`. In `routes/sequences.js`, `/enrollments/prospect/:prospectId` comes before `/:id`.

### 2. Phone field dual storage
Prospects have `phone` (top-level Prisma field) and may also have `trackingPixelData.phone` (legacy JSON). **Always read as:** `p.phone || p.trackingPixelData?.phone`. This affects display, filtering (`has_phone` quick filter), and engagement score calculation.

### 3. `_count` fields — only `sequenceEnrollments` exists
The Prospect model's `findAll` and `findById` include `_count: { select: { sequenceEnrollments: true } }`. There are NO `emailActivities` or `voiceAgentCalls` counts. Any UI that reads `p._count?.emailActivities` or `p._count?.voiceAgentCalls` will always get `undefined` (treated as 0). This has been cleaned up in `Prospects.jsx` and `computeEngagementScore`.

### 4. Gemini vs Claude AI gating
`isConfigured('gemini')` in the frontend always returns `false`. Gemini works through `GEMINI_API_KEY` in `.env`, which the frontend cannot read. Do not gate features on `isConfigured('gemini')`. Use `isConfigured('claude') || true` for AI feature gates, or just remove the gate.

### 5. `EmailActivity.bento` does not exist
Early code in `enrollmentService.recordStepSent()` tried to set `bento: enrollment.sequence?.bento` — this field does not exist on Sequence or EmailActivity in the schema. It has been removed. Do not add it back without a schema migration.

### 6. `currentStepOrder=0` is the initial state
Enrollment starts at 0 (not started). Step 1 is the first step to send. After sending step 1, `currentStepOrder` becomes 1. Do not confuse this with array indices.

### 7. Microsoft OAuth uses in-memory state
The OAuth state UUID is stored in a plain JS Map in `routes/microsoftOAuth.js`. It does not survive server restarts. A cleanup interval removes states after 10 minutes. This is fine for local dev.

### 8. Sequences `GET /` loads everything
`GET /sequences` returns sequences with all steps and all prospect enrollments (each with the full prospect object). This is intentional — SequenceManager needs it all. For performance on larger datasets, consider pagination or splitting the enrollments into a separate request.

### 9. HITL queue is in-memory
`routes/hitl.js` stores the review queue in a module-level array. It does not persist. Restarting the server clears it.

### 10. `callLogForm` stepOrder in `routes/callActivities.js POST /`
When logging a call via `POST /call-activities`, the request body should include `stepOrder` (the step's `order` field) so the enrollment can be correctly advanced. The route uses this to find the next step: `order > parseInt(req.body.stepOrder)`.

---

## Environment Variables

```bash
# Server
PORT=3000

# Auth (unused in local dev — auth is bypassed)
JWT_SECRET=...
JWT_EXPIRATION=1h

# Email (Gmail App Password flow)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME="Henry from Outreach.ai"
APP_URL=http://localhost:3000

# AI
GEMINI_API_KEY=...             # Google Gemini — used directly in routes
# ANTHROPIC_API_KEY=...        # Claude — stored in IntegrationCredential DB table instead

# Azure / SQS (not needed for core email/call flow)
SERVICE_BUS_CONNECTION_STRING=...
SERVICE_BUS_QUEUE_NAME=...

# Rate limits
VOICE_CALL_LIMIT=10
VOICE_CALL_DURATION=60
EMAIL_LIMIT=20
EMAIL_DURATION=60
DIALING_LIMIT=20
DIALING_DURATION=300
```

---

## Adding New Features — Checklist

**New backend route:**
1. Create `routes/myFeature.js` with `router.use(authenticateToken)` at the top
2. Import and mount in `index.js`: `app.use('/my-feature', require('./routes/myFeature'))`
3. If it has path params, ensure specific paths are defined before `/:id`

**New Prisma model field:**
1. Edit `schema.prisma`
2. Run `npx prisma db push`
3. Prisma client is automatically regenerated

**New frontend page:**
1. Create `frontend/src/components/MyPage.jsx`
2. Add `import MyPage from './components/MyPage'` to `App.jsx`
3. Add `<Route path="/my-page" element={<MyPage />} />` in the `<Routes>` block
4. Add to the `NAV` array with `path`, `label`, `icon`, `desc`
5. Add to `NAV_ACTIONS` for command palette inclusion
6. Optionally add a `G+` keyboard shortcut to the map in `App.jsx`

**New integration provider:**
1. Add validation logic in `routes/integrations.js` POST handler
2. Add setup UI in `Integrations.jsx`
3. Use `isConfigured('yourProvider')` from `useIntegrations()` to gate features

---

## File Map (active files only)

```
outreach-clone/
├── index.js                    ← Express server, middleware, cron, routes
├── schema.prisma               ← Single source of truth for DB schema
├── dev.db                      ← SQLite database (gitignored)
├── .env                        ← Environment variables
├── seed.js                     ← Basic demo seeder (run with node seed.js)
│
├── middleware/
│   └── auth.js                 ← authenticateToken (hardcoded userId=1)
│
├── models/
│   └── prospect.js             ← Prospect static methods (create, findAll, etc.)
│
├── controllers/
│   ├── prospectsController.js  ← createProspect(prospectData), updateProspect, etc.
│   └── sequences.js            ← getAllSequences, createSequence, updateSequence, etc.
│
├── services/
│   ├── enrollmentService.js    ← All enrollment lifecycle logic
│   ├── sequenceMailer.js       ← SMTP email sender + cron entry point
│   └── database.js             ← Shared Prisma client instance
│
├── routes/
│   ├── prospects.js            ← /prospects — CRUD, enrich, bulk import
│   ├── sequences.js            ← /sequences — CRUD + enrollment actions
│   ├── sequenceSteps.js        ← /sequenceSteps — step CRUD
│   ├── emailActivities.js      ← /email-activities — history + scheduling
│   ├── callActivities.js       ← /call-activities — history + call logging
│   ├── integrations.js         ← /integrations — credential CRUD + validation
│   ├── microsoftOAuth.js       ← /auth/microsoft — OAuth redirect flow
│   ├── demo.js                 ← /demo — load/clear demo dataset
│   ├── auth.js                 ← /auth — login, register
│   ├── orchestration.js        ← /orchestration — AI drafting engine
│   ├── hitl.js                 ← /hitl — in-memory review queue
│   └── voice.js, voiceAgent.js ← /voice, /voice-agent — calling features
│
└── frontend/src/
    ├── App.jsx                 ← Router, sidebar, nav, global shortcuts, overlays
    ├── styles.css              ← All CSS custom properties and shared component styles
    ├── constants/index.js      ← STEP_TYPE_CONFIG, status style maps
    ├── services/api.js         ← Axios instance (base: http://localhost:3000)
    ├── contexts/
    │   └── IntegrationContext.jsx ← isConfigured(provider), integrations state
    └── components/
        ├── Dashboard.jsx           ← / — AI command center
        ├── Prospects.jsx           ← /prospects — contact CRM
        ├── ProspectDetailDrawer.jsx ← Side drawer for prospect details
        ├── SequenceManager.jsx     ← /sequence-manager — sequences + 4 tabs
        ├── Integrations.jsx        ← /integrations — credential setup UIs
        ├── TaskInbox.jsx           ← /tasks — due actions queue
        ├── PowerDialerView.jsx     ← /dialer — dialing interface
        ├── AnalyticsDashboard.jsx  ← /analytics — pipeline metrics
        ├── HITLReviewView.jsx      ← /hitl — review queue UI
        ├── DemoMode.jsx            ← Demo mode modal (load/clear)
        ├── TourOverlay.jsx         ← Guided product tour
        ├── Toast.jsx               ← Toast notification system
        ├── SetupTooltip.jsx        ← Contextual integration setup hints
        └── VoiceFleetCommand.jsx   ← /voice-fleet — AI voice agents
```
