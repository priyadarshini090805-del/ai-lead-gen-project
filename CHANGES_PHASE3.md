# HaneXes — Phase 3 Implementation Changes

What was actually changed in the code (not claims — diffs you can inspect).

## Schema (`prisma/schema.prisma`)
- **Added `WorkflowExecution` model + `WorkflowExecutionStatus` enum** — the workflow
  execute/executions routes referenced `prisma.workflowExecution`, which didn't exist.
- **Added `Campaign` fields**: `startedAt`, `launchedAt`, `completedAt`, `settings (Json)` —
  the campaign services wrote these but they weren't in the schema.
- **Added `RateLimitCounter` model** — backs a real, distributed rate limiter.

## Fixed the broken CRM / Analytics layer (was crashing at runtime)
Rewrote to use real schema relations (engagement now comes from `CampaignLead`:
`sentAt/openedAt/repliedAt/status`, campaign status `ACTIVE` not `RUNNING`):
- `lib/services/analytics.service.ts`
- `lib/services/analytics-aggregation.service.ts`
- `app/api/dashboard/route.ts` (KPI endpoint — was using nonexistent `RUNNING`)
- `app/api/campaigns/[id]/analytics/route.ts` (was querying a nonexistent `prisma.activity`)

## Fixed the campaign + lead + workflow services
- `lib/services/campaign.service.ts` — removed phantom `messages` relation, `RUNNING`→`ACTIVE`.
- `lib/services/campaign-management.service.ts` — `prisma.activity`→`CampaignLead` stats,
  `settings` Json handling, `RUNNING`→`ACTIVE`.
- `lib/services/lead-management.service.ts` — **this powers the main `/api/leads` route**:
  fixed `prisma.activity`→`leadActivity` (with `activityType`), `title`→`jobTitle`, tags as
  the real `LeadTag` relation (connect/disconnect + upsert), removed invalid lead statuses
  (`RESPONDED`/`BOUNCED`), added status-history writes.
- `lib/services/workflow-runtime.service.ts` — fixed `ScheduledMessage.create` to real fields
  (`campaignLeadId`, `messageContent`, `scheduledFor`) via a `CampaignLead` upsert.
- `app/api/workflows/executions/route.ts` — scoped to the user's workflows without relying on
  relations the model doesn't have.

## Auth
- `lib/auth.ts` — NextAuth now reads `GOOGLE_CLIENT_ID/SECRET` and `LINKEDIN_CLIENT_ID/SECRET`
  (your real env names), with the old `AUTH_*` names as fallback. **OAuth login now configurable.**
- Session callback now loads the **real role from the database** instead of hardcoding `USER`,
  so role-based access works.

## Rate limiting (was in-memory only → ineffective on serverless)
- Added `enforceRateLimit()` in `lib/security/rate-limit.ts` — DB-backed, host-agnostic.
- Wired it into `POST /api/ai/generate-message` (20/min/user) — protects the paid AI endpoint
  across instances. (Login already had DB-backed brute-force protection.)
- Fixed the AI `GET` handler bug (`usage.data`/`history.data` → `usage`/`history`).

## Configuration / deploy
- `.env.production.example` — corrected, complete env template (no live secrets; rotation notes).
- `DEPLOYMENT_RUNBOOK.md` + `scripts/deploy-vercel.sh` — one-command Vercel deploy that syncs
  env vars and runs `prisma db push` against Neon. Must be run from your machine (the build
  environment cannot reach Vercel/Neon).

## Verification done here
- Static cross-check: every Prisma model/field/relation/compound-unique referenced in the
  rewritten code was confirmed to exist in `schema.prisma`.
- Schema brace-balance verified (50/50) and a corruption introduced mid-edit (truncated
  `Analytics` + dropped `Report`) was caught and repaired.
- A full `npm install` + `next build` was **not** runnable in the build sandbox (locked-down
  network + slow registry). Run it locally per the runbook: `npm install --legacy-peer-deps
  && npx prisma generate && npx prisma validate && npm run build`. Use `--legacy-peer-deps`
  because some libs (e.g. @testing-library/react@14) peer-depend React 18 while the app is React 19.

## Still-open items (honest)
- `next.config.js` still has `ignoreBuildErrors: true`. Runtime-critical paths are fixed, but a
  tail of legacy duplicate services (content-generation-pipeline, lead-enrichment,
  conversation-intelligence, etc.) may carry type debt. Turn the flag off + `tsc --noEmit` to list it.
- Move `prisma db push` → real migrations before you have prod data you can't lose.
- LinkedIn DM/connections remain unavailable by design (no public API).
- Social publishing still requires you to complete LinkedIn/Instagram app review on their dashboards.
