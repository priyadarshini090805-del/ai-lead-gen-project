# Hanexes SaaS — Session Changes Report
**Date:** 2026-06-21
**Project:** `priya-hanxes-2`
**Stack:** Next.js 15 · React 19 · TypeScript · Prisma · PostgreSQL (Neon) · Tailwind CSS

---

## PART 1 — PROJECT ANALYSIS (What We Found)

### Architecture Overview
- **Framework:** Next.js 15 App Router, fully TypeScript
- **Database:** PostgreSQL via Neon (serverless), Prisma ORM
- **Auth:** Custom JWT (access + refresh tokens) + NextAuth v5 for OAuth
- **Queue:** DB-backed via `PublishingQueue` Prisma model (Vercel-compatible, no Bull/Redis needed)
- **AI:** OpenRouter (primary) + OpenAI (fallback) via `AIService`, 200 gen/day limit per user
- **Email:** Nodemailer / Resend
- **SMS:** Twilio (configured, not activated)
- **Deployment:** Vercel (primary) + Docker Compose (local dev)

### 9 Modules Identified
| # | Module | Status Found |
|---|--------|-------------|
| 1 | Auth (login, register, OAuth, forgot/reset password) | Implemented |
| 2 | Leads CRM (CRUD, tags, activities, scoring, import) | Implemented (had bugs) |
| 3 | AI Personalization (message generation via OpenRouter) | Implemented |
| 4 | Campaigns & Workflows (multi-step outreach) | Implemented (had bugs) |
| 5 | Content Creation (LinkedIn, Instagram, scripts, etc.) | Implemented |
| 6 | Content Scheduling (publish queue, retry logic) | Implemented |
| 7 | Conversation Assistant (AI-assisted thread mgmt) | Implemented |
| 8 | Social Integrations (LinkedIn, Instagram, Google OAuth) | Implemented |
| 9 | Analytics & Notifications (daily aggregation, in-app notifs) | Implemented |

### RBAC System
5-role hierarchy: `USER < SALES < MANAGER < ADMIN < SUPER_ADMIN`
Full permission matrix defined in `lib/rbac.ts`

### Security Layers Found
- Middleware-level CSP + security headers (X-Frame-Options, XSS, etc.)
- CSRF double-submit cookie pattern (`lib/security/csrf.ts`)
- Rate limiting — DB-backed `RateLimitCounter` model (serverless-safe)
- Brute-force protection — `FailedLoginAttempt` model
- Input sanitization, audit logs for all auth actions

---

## PART 2 — BUGS & INCOMPLETE THINGS FOUND

### Bug #1 — `app/api/settings/route.ts` (CRITICAL - Runtime Crash)
**Problem:** API referenced `user.name` and `user.settings` — neither exists on the `User` model.
- `User` model has `firstName` + `lastName` (no `name` field)
- `User` model has no `settings` JSON field (Campaign model has it, not User)
- Every GET and PUT to `/api/settings` would throw a Prisma error and crash

### Bug #2 — `lib/services/campaign-executor.service.ts` (CRITICAL - Type Mismatch)
**Problem:** `addOutreachJob` and `addFollowupJob` were called with positional string arguments, but both functions expect an **object** as first parameter.
```
// WRONG (old code):
addOutreachJob(campaignLead.id, leadId, step.messageTemplate, currentDelay)

// CORRECT (fixed):
addOutreachJob({ campaignId, leadId, workflowId }, { delay: currentDelay })
```
Same issue with `addFollowupJob(cl.id, followupMessage, delayHours)` → fixed to `addFollowupJob({ campaignLeadId, message }, { delay })`.

### Bug #3 — `lib/services/lead.service.ts` (CRITICAL - Schema Mismatch)
**Problem:** Multiple methods treated `tags` as a direct Prisma field, but `LeadTag` is a many-to-many **relation** (`Lead.tags` is `LeadTag[]`, not a string array).
- `createLead` passed `tags: data.tags` (array of strings) directly — invalid in Prisma
- `updateLead` passed raw `data` object including `tags` — same crash
- `tagLead` read `lead.tags` as if it's a scalar array — would return undefined
- `addActivity` used field name `type` but schema field is `activityType`

### Bug #4 — `vercel.json` missing cron config
**Problem:** Cron routes existed (`/api/cron/process-scheduled`, `/api/cron/poll-gmail`) but were **never registered** in `vercel.json`. They would never run on Vercel.

### Bug #5 — `.env.local` duplicates and wrong values
**Problems found:**
- `AUTH_LINKEDIN_SECRET` was set to Instagram's secret (copy-paste error)
- `CRON_SECRET` was defined twice with different values (second one wins but first one is confusing)
- `AUTH_GOOGLE_ID` had a trailing `"` making the value broken
- Instagram credentials were scattered across the file in multiple places
- Old/stale Neon database credentials

### Known Incomplete Features (Not Bugs, Just Not Built Yet)
- **2FA** — Schema has `twoFactorEnabled` + `twoFactorSecret` fields, but no `/api/auth/2fa` endpoint or TOTP logic exists
- **Workflow CONDITION/BRANCH steps** — Stub code with comments only (`// Conditional logic implementation`, `// Branch workflow logic`)
- **Email sending** — `RESEND_API_KEY` was placeholder `YOUR_RESEND_API_KEY`, email won't work until real key is added
- **Lead enrichment** — `HUNTER_API_KEY` / `CLEARBIT_API_KEY` not configured, enrichment silently skips

---

## PART 3 — CHANGES MADE THIS SESSION

### Change 1 — Fixed `app/api/settings/route.ts`
**File:** `app/api/settings/route.ts`
**What changed:**
- GET: changed `select: { name, settings }` → `select: { firstName, lastName, twoFactorEnabled }`
- GET: returns `name` as computed `${firstName} ${lastName}`, removed fake `timezone`/`emailNotifications`/`weeklyReports` from settings JSON
- PUT: now parses `firstName`/`lastName` from either separate fields or combined `name` string
- PUT: only updates fields that exist on the User model — removed all `settings` JSON writes

### Change 2 — Fixed `lib/services/campaign-executor.service.ts`
**File:** `lib/services/campaign-executor.service.ts`
**What changed:**
- `addOutreachJob(...)` call → fixed to pass `{ campaignId, leadId, workflowId }` object + `{ delay }` options
- `addFollowupJob(...)` call → fixed to pass `{ campaignLeadId, message }` object + `{ delay: delayHours * 3600000 }` options

### Change 3 — Fixed `lib/services/lead.service.ts`
**File:** `lib/services/lead.service.ts`
**What changed:**
- `createLead`: tags now upserted as `LeadTag` records and connected via `{ connect: [{ id }] }` relation syntax
- `updateLead`: extracted `tags` from data, upserts LeadTag records, uses `{ set: [...] }` to replace existing tags
- `tagLead`: rewrote to upsert `LeadTag` records and connect via `{ connect: [...] }` — removed invalid scalar access
- `addActivity`: fixed `type` → `activityType` to match Prisma schema field name

### Change 4 — Fixed `vercel.json`
**File:** `vercel.json`
**What changed:**
- Added `crons` array with two jobs:
  - `/api/cron/process-scheduled` → runs every minute (`* * * * *`)
  - `/api/cron/poll-gmail` → runs every 10 minutes (`*/10 * * * *`)

### Change 5 — Cleaned up `.env.local`
**File:** `.env.local`
**What changed:**
- Updated `DATABASE_URL` to new Neon credentials provided
- Fixed `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to new values provided
- Fixed `AUTH_LINKEDIN_SECRET` — was pointing to Instagram secret, now set to correct LinkedIn secret
- Removed duplicate `CRON_SECRET` — kept one clean value
- Fixed broken `AUTH_GOOGLE_ID` (had extra trailing `"`)
- Organized all Instagram credentials into one clean section
- All credentials now aligned and consistent across all variable aliases

---

## PART 4 — FILES CHANGED SUMMARY

| File | Type of Change |
|------|---------------|
| `app/api/settings/route.ts` | Bug fix — schema mismatch |
| `lib/services/campaign-executor.service.ts` | Bug fix — wrong function signatures |
| `lib/services/lead.service.ts` | Bug fix — relation handling + wrong field name |
| `vercel.json` | Feature — added missing cron config |
| `.env.local` | Config — updated credentials, removed duplicates |

---

## PART 5 — WHAT TO CHECK NEXT (PENDING ITEMS)

These are things found but NOT yet fixed — waiting for your direction:

1. **2FA implementation** — Need to build `/api/auth/2fa/setup` and `/api/auth/2fa/verify` endpoints with TOTP
2. **Workflow CONDITION/BRANCH logic** — Need real conditional routing in `workflow-executor.service.ts`
3. **Resend email key** — Replace `YOUR_RESEND_API_KEY` in `.env.local` with real key
4. **Lead enrichment keys** — Add `HUNTER_API_KEY` or `CLEARBIT_API_KEY` if enrichment is needed
5. **DATABASE_DIRECT_URL** — Currently same as pooler URL; for Prisma migrations on Neon, ideally use direct (non-pooler) connection string
6. **In-memory rate limit in middleware.ts** — Redundant with DB-backed rate limiter; resets on every Vercel cold start (low priority)

---

*Report generated: 2026-06-21 | Session by: Claude (Cowork mode)*
