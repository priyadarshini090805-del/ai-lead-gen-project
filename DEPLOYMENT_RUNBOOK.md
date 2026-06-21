# HaneXes — Deployment Runbook (Vercel + Neon)

> You must run these from **your own machine**, because the deployment must reach
> `api.vercel.com` and your Neon database — both of which are blocked from the
> environment where the code fixes were made. Everything below is copy-paste ready.

## 0. Prerequisites (one time)
```bash
npm i -g vercel
node -v   # 18+ (20 LTS recommended)
```

## 1. ROTATE the leaked secrets first (non-negotiable)
Every secret shared in chat is compromised. Regenerate:
- **Neon DB password** → Neon console → Roles → reset password → update DATABASE_URL/DIRECT_URL.
- **OpenRouter key** → openrouter.ai → revoke old, create new.
- **Google / LinkedIn / Instagram OAuth secrets** → each provider console → rotate client secret.
- **JWT_SECRET / NEXTAUTH_SECRET / ENCRYPTION_KEY** → `openssl rand -hex 32` (use three *different* values).
- **CRON_SECRET** → `openssl rand -hex 16`.

> Note on ENCRYPTION_KEY: if you change it after tokens are stored, previously
> encrypted integration tokens can't be decrypted — users must reconnect their
> LinkedIn/Instagram/Google accounts. Set it once, before launch.

## 2. Fill the environment file
```bash
cp .env.production.example .env
# edit .env with the rotated values + your real Vercel app URL
```

## 3. Push the schema to Neon (creates all tables incl. the new ones)
```bash
npm install
npx prisma generate
npx prisma db push          # uses DATABASE_URL/DIRECT_URL from .env
# (optional, recommended for prod history) move to real migrations later:
#   npx prisma migrate dev --name init      # in a dev branch DB
#   npx prisma migrate deploy               # in prod
```

## 4. Link & configure the Vercel project
```bash
export VERCEL_TOKEN=YOUR_ROTATED_VERCEL_TOKEN     # do NOT reuse the one shared in chat
vercel link --yes --token "$VERCEL_TOKEN"

# Push every env var to Production (repeat per variable, or use the script in step 6):
vercel env add DATABASE_URL production --token "$VERCEL_TOKEN"
vercel env add DATABASE_DIRECT_URL production --token "$VERCEL_TOKEN"
vercel env add NEXT_PUBLIC_APP_URL production --token "$VERCEL_TOKEN"
vercel env add NEXTAUTH_URL production --token "$VERCEL_TOKEN"
vercel env add NEXTAUTH_SECRET production --token "$VERCEL_TOKEN"
vercel env add JWT_SECRET production --token "$VERCEL_TOKEN"
vercel env add ENCRYPTION_KEY production --token "$VERCEL_TOKEN"
vercel env add OPENROUTER_API_KEY production --token "$VERCEL_TOKEN"
vercel env add GOOGLE_CLIENT_ID production --token "$VERCEL_TOKEN"
vercel env add GOOGLE_CLIENT_SECRET production --token "$VERCEL_TOKEN"
vercel env add LINKEDIN_CLIENT_ID production --token "$VERCEL_TOKEN"
vercel env add LINKEDIN_CLIENT_SECRET production --token "$VERCEL_TOKEN"
vercel env add INSTAGRAM_CLIENT_ID production --token "$VERCEL_TOKEN"
vercel env add INSTAGRAM_CLIENT_SECRET production --token "$VERCEL_TOKEN"
vercel env add INSTAGRAM_WEBHOOK_TOKEN production --token "$VERCEL_TOKEN"
vercel env add RESEND_API_KEY production --token "$VERCEL_TOKEN"
vercel env add EMAIL_FROM production --token "$VERCEL_TOKEN"
vercel env add CRON_SECRET production --token "$VERCEL_TOKEN"
vercel env add FEATURE_INSTAGRAM_ENABLED production --token "$VERCEL_TOKEN"
```
Or just run `./scripts/deploy-vercel.sh` (step 6) which loads them from `.env`.

## 5. Configure OAuth redirect URIs on each provider
Set the callback URLs to your deployed origin:
- Google:    `https://your-app.vercel.app/api/integrations/google/callback`
- LinkedIn:  `https://your-app.vercel.app/api/integrations/linkedin/callback`
- Instagram: `https://your-app.vercel.app/api/integrations/instagram/callback`
And enable the required products/scopes:
- LinkedIn → "Sign In with LinkedIn using OpenID Connect" + "Share on LinkedIn" (`w_member_social`).
- Instagram → Business login with `instagram_business_basic`, `instagram_business_content_publish` (Business/Creator account linked to a Facebook Page).
- Google → Gmail readonly + OpenID scopes; add your domain to the OAuth consent screen.

## 6. Deploy
```bash
./scripts/deploy-vercel.sh        # builds env push + `vercel --prod`
# or manually:
vercel --prod --token "$VERCEL_TOKEN"
```
The crons in `vercel.json` (publish every minute, Gmail poll every 10 min) activate
automatically on Vercel — no extra scheduler needed.

## 7. Smoke test (after the URL is live)
```bash
BASE=https://your-app.vercel.app
curl -s $BASE/api/health
# register → login → capture the returned JWT → call an authed route:
curl -s -X POST $BASE/api/auth/register -H 'content-type: application/json' \
  -d '{"firstName":"Test","lastName":"User","email":"you@example.com","password":"Str0ng!pass"}'
```
Then in the UI: create a lead → generate an AI message → connect LinkedIn → schedule a post.

## Known follow-ups (documented honestly)
- `next.config.js` still has `typescript.ignoreBuildErrors: true`. The runtime-critical
  paths were fixed, but a tail of legacy duplicate services (e.g. content-generation-pipeline,
  lead-enrichment, conversation-intelligence) may still carry type debt. Turn the flag off and
  run `npx tsc --noEmit` to get the remaining list when you want a fully type-clean build.
- LinkedIn DM send / connections import are intentionally unavailable (no public API) — by design.
- Move from `prisma db push` to real migrations before you have production data you can't lose.
