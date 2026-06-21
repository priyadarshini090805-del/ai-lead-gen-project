# HaneXes — Deploy to Vercel via GitHub (step by step)

This build is configured for **Vercel** (Postgres-backed queue + Vercel Cron). Login is via
**Google or LinkedIn** (Instagram is connect-to-publish only). Follow in order.

## 1. Push to GitHub
```bash
cd priya-hanxes-2
git init && git add -A && git commit -m "HaneXes ready"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
`.env` is gitignored on purpose — you'll paste secrets into Vercel instead (step 3).

## 2. Import the project in Vercel
- vercel.com → Add New → Project → import your repo.
- Framework: **Next.js** (auto). Build command stays `npm run vercel-build`
  (it runs `prisma generate` + `prisma db push` + `next build`).
- Don't deploy yet — add env vars first.

## 3. Add Environment Variables (Production)
Paste each of these (values are in your `.env`). **Set the URL ones to your real Vercel domain.**

```
DATABASE_URL, DATABASE_DIRECT_URL
NEXT_PUBLIC_APP_URL   = https://<your-app>.vercel.app
NEXTAUTH_URL          = https://<your-app>.vercel.app
NEXTAUTH_SECRET, AUTH_SECRET, JWT_SECRET
ADMIN_EMAILS          = your admin email(s), comma-separated
OPENROUTER_API_KEY, OPENROUTER_MODEL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
FEATURE_INSTAGRAM_ENABLED, INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_WEBHOOK_TOKEN
ENCRYPTION_KEY
CRON_SECRET
RESEND_API_KEY (optional), EMAIL_FROM
```

## 4. Configure OAuth redirect URLs (critical — login fails without these)
There are TWO kinds of callbacks. Add **all** that apply, using your real domain.

**A. Login (NextAuth):**
- Google  → `https://<app>.vercel.app/api/auth/callback/google`
- LinkedIn → `https://<app>.vercel.app/api/auth/callback/linkedin`

**B. Account connect (for Gmail lead capture + posting):**
- Google  → `https://<app>.vercel.app/api/integrations/google/callback`
- LinkedIn → `https://<app>.vercel.app/api/integrations/linkedin/callback`
- Instagram → `https://<app>.vercel.app/api/integrations/instagram/callback`

Where to set them:
- **Google Cloud Console** → Credentials → your OAuth client → Authorized redirect URIs.
  Also add your domain to the OAuth consent screen; enable Gmail API for lead capture.
- **LinkedIn Developers** → your app → Auth tab → Redirect URLs. Enable products:
  *Sign In with LinkedIn using OpenID Connect* and *Share on LinkedIn* (`w_member_social`).
- **Meta/Instagram** (for publishing) → Instagram app → add the integrations callback;
  the Instagram account must be a **Business/Creator** account. Publishing needs
  `instagram_business_content_publish` (requires Meta app review to go live).

## 5. Deploy
Click **Deploy**. The build pushes the schema to Neon automatically. First load may take ~30s.

## 6. First login & roles
- Open the site → **Continue with Google** (or LinkedIn).
- Because your email is in `ADMIN_EMAILS`, you'll be an **ADMIN** (you'll see Audit Logs in the
  sidebar). Everyone else signs up as **USER**.
- Then: connect LinkedIn under **Integrations**, create a lead, generate an AI message,
  schedule a post — the cron (`vercel.json`, every minute) publishes it to your LinkedIn at the
  scheduled time and notifies you.

## What's real (no fake data)
- Every dashboard number comes from your Postgres rows for *your* user id.
- AI messages call OpenRouter live. LinkedIn/Instagram posting calls the real Graph/UGC APIs.
- Scheduled posts auto-publish via the cron worker with retry + failure notifications.

## Notes
- Reports module was removed as requested.
- Rotate any secret you consider sensitive; they were shared in chat.
- `prisma db push` is used for the first deploy; switch to `prisma migrate` once you have data.
