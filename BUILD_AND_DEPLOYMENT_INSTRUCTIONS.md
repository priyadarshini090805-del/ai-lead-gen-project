# HaneXes Build & Deployment Instructions

**Last Updated:** June 8, 2026  
**Status:** Modules 1-9 Infrastructure Complete  
**Target:** Production Ready in 2-3 days

---

## IMMEDIATE NEXT STEPS (TODAY - 30 MINUTES)

### Step 1: Create Prisma Migration
```bash
cd priya-hanxes-2

# Generate new migration for Modules 4-9
npx prisma migrate dev --name add-modules-4-9-infrastructure

# Expected output:
# ✔ Created migration folder successfully
# ✔ Prisma schema validated successfully to line NNN
# ✔ Executed migrations in xxxms
```

**If migration fails:**
```bash
# Reset database (WARNING: Data loss)
npx prisma migrate reset

# Or push to production database:
npx prisma migrate deploy
```

### Step 2: Update Dependencies
```bash
# Install queue management
npm install bullmq ioredis redis

# Verify installation
npm list bullmq ioredis redis
```

### Step 3: Verify Schema
```bash
# Validate Prisma schema
npx prisma validate

# Generate updated Prisma client
npx prisma generate

# Check for TypeScript errors
npx tsc --noEmit
```

### Step 4: Run Basic Tests
```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build check
npm run build --skip-next-build
```

**Expected Result:** All commands succeed with no errors

---

## DEVELOPMENT SETUP (1-2 HOURS)

### Option A: Docker Development (Recommended)

```bash
# 1. Build and start all services
docker-compose up --build -d

# 2. Verify all services are healthy
docker-compose ps
# Expected: postgres (healthy), redis (healthy), app (healthy)

# 3. Run migrations inside container
docker-compose exec app npx prisma migrate dev

# 4. Access application
# - App: http://localhost:3000
# - BullMQ UI: http://localhost:3001
# - Redis: localhost:6379
# - PostgreSQL: localhost:5432

# 5. View logs
docker-compose logs -f app

# 6. Stop services
docker-compose down
```

### Option B: Local Development

```bash
# 1. Start PostgreSQL (if not running)
# macOS:
brew services start postgresql
# or
sudo systemctl start postgresql

# 2. Start Redis
# macOS:
brew services start redis
# or
redis-server

# 3. Create development database
createdb hanexes

# 4. Run migrations
npx prisma migrate dev

# 5. Start application
npm run dev

# 6. Open browser
open http://localhost:3000
```

---

## TESTING & VALIDATION (2-3 HOURS)

### Unit Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- app/api/campaigns/route.test.ts

# Run with coverage
npm test -- --coverage

# Expected coverage: 70%+ for new modules
```

### Integration Testing

```bash
# Start services
docker-compose up -d

# Run integration tests
npm run test:integration

# Clean up
docker-compose down
```

### API Endpoint Testing

```bash
# Using curl:
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Using Postman:
# - Import .env.local variables
# - Set Bearer token
# - Run all endpoint tests

# Expected response:
# {
#   "success": true,
#   "data": { "campaigns": [], "total": 0 },
#   "message": "Campaigns retrieved"
# }
```

### Database Validation

```bash
# Check database schema
npx prisma db execute --stdin < prisma/schema.prisma

# Inspect data
npx prisma studio

# Run seed (if exists)
npx prisma db seed
```

---

## FRONTEND DASHBOARD IMPLEMENTATION (4-6 HOURS)

### Module 4: Campaigns & Workflows
```bash
# Create campaign pages
touch app/dashboard/campaigns/page.tsx
touch app/dashboard/campaigns/new/page.tsx
touch app/dashboard/campaigns/[id]/page.tsx
touch app/dashboard/workflows/page.tsx

# Components needed:
# - CampaignList, CampaignForm, CampaignDetail
# - WorkflowBuilder, WorkflowStep components
# - Campaign analytics chart
```

### Module 5: Content Management
```bash
touch app/dashboard/content/page.tsx
touch app/dashboard/content/new/page.tsx
touch app/dashboard/content/editor/page.tsx

# Components needed:
# - ContentList, ContentForm
# - RichTextEditor, ContentPreview
# - VersionHistory
```

### Module 6: Content Scheduling
```bash
touch app/dashboard/scheduler/page.tsx
touch app/dashboard/scheduler/[view]/page.tsx

# Components needed:
# - CalendarMonth, CalendarWeek, CalendarDay
# - ScheduleForm, SchedulePreview
# - Timezone selector
```

### Module 7: Conversations
```bash
touch app/dashboard/conversations/page.tsx
touch app/dashboard/conversations/[id]/page.tsx

# Components needed:
# - ConversationList
# - ChatInterface, MessageInput
# - AIReplyWidget
```

### Module 8: Integrations
```bash
touch app/dashboard/integrations/page.tsx
touch app/dashboard/integrations/[provider]/page.tsx

# Components needed:
# - IntegrationCard, IntegrationList
# - OAuthCallback handler
# - TokenManagement
```

### Module 9: Analytics
```bash
touch app/dashboard/analytics/page.tsx
touch app/dashboard/reports/page.tsx

# Components needed:
# - KPICard, MetricChart
# - FunnelChart, GrowthChart
# - ReportBuilder, ExportButton
```

---

## PRODUCTION DEPLOYMENT (1-2 DAYS)

### Pre-Deployment Checklist

- [ ] All tests pass (80%+ coverage)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Database migrations tested
- [ ] API endpoints validated
- [ ] Frontend pages implemented
- [ ] OAuth flows tested
- [ ] Environment variables configured
- [ ] Secrets rotated

### Production Environment Setup

```bash
# 1. Create production .env file
cat > .env.production << EOF
# Database
DATABASE_URL="${PROD_DATABASE_URL}"
DATABASE_DIRECT_URL="${PROD_DATABASE_DIRECT_URL}"

# Redis
REDIS_URL="${PROD_REDIS_URL}"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)

# OAuth
AUTH_GOOGLE_ID="${PROD_GOOGLE_ID}"
AUTH_GOOGLE_SECRET="${PROD_GOOGLE_SECRET}"
AUTH_LINKEDIN_ID="${PROD_LINKEDIN_ID}"
AUTH_LINKEDIN_SECRET="${PROD_LINKEDIN_SECRET}"

# Email
RESEND_API_KEY="${PROD_RESEND_KEY}"

# AI
OPENAI_API_KEY="${PROD_OPENAI_KEY}"
OPENROUTER_API_KEY="${PROD_OPENROUTER_KEY}"
EOF
```

### Docker Deployment

```bash
# 1. Build production image
docker build -t hanexes:latest .

# 2. Push to registry
docker tag hanexes:latest your-registry/hanexes:latest
docker push your-registry/hanexes:latest

# 3. Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose exec app npx prisma migrate deploy

# 5. Verify health
curl https://yourdomain.com/api/health
```

### Kubernetes Deployment (Optional)

```bash
# Create deployment
kubectl apply -f k8s/deployment.yaml

# Check rollout
kubectl rollout status deployment/hanexes

# View logs
kubectl logs -f deployment/hanexes

# Scale deployment
kubectl scale deployment hanexes --replicas=3
```

### GitHub Actions Deployment

```bash
# 1. Commit and push
git add .
git commit -m "Release: Modules 4-9 implementation"
git push origin main

# 2. Watch GitHub Actions
# - Go to Actions tab
# - Monitor test.yml execution
# - Monitor deploy.yml execution

# 3. Verify deployment
# - Check running services
# - Check logs
# - Test endpoints
```

---

## VERIFICATION AFTER DEPLOYMENT

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/health

# Database
curl https://api.yourdomain.com/api/health/db

# Redis
curl https://api.yourdomain.com/api/health/redis

# Expected: All return { status: "ok" }
```

### Smoke Tests

```bash
# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test campaigns
curl -X GET https://api.yourdomain.com/api/campaigns \
  -H "Authorization: Bearer ${TOKEN}"

# Test content
curl -X GET https://api.yourdomain.com/api/content \
  -H "Authorization: Bearer ${TOKEN}"
```

### Database Verification

```bash
# Check record counts
psql -c "SELECT count(*) FROM public.Campaign;"
psql -c "SELECT count(*) FROM public.Content;"
psql -c "SELECT count(*) FROM public.Conversation;"

# Expected: counts should be reasonable
```

---

## TROUBLESHOOTING

### Migration Issues

**Problem:** Migration fails with "relation already exists"
```bash
# Solution: Drop and recreate
npx prisma migrate reset
npx prisma migrate dev
```

**Problem:** Migration pending
```bash
# Check status:
npx prisma migrate status

# Resolve:
npx prisma migrate resolve --rolled-back add-modules-4-9
npx prisma migrate deploy
```

### Connection Issues

**Problem:** Cannot connect to Redis
```bash
# Check if Redis is running:
redis-cli ping

# Start Redis:
redis-server
# or
docker-compose up redis
```

**Problem:** Cannot connect to PostgreSQL
```bash
# Check connections:
psql -l

# Start PostgreSQL:
brew services start postgresql
# or
docker-compose up postgres
```

### Performance Issues

**Problem:** Queries are slow
```bash
# Enable query logging:
export DEBUG=prisma:engine

# Check indexes:
npx prisma db execute --stdin << SQL
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
SQL

# Add missing indexes if needed
```

**Problem:** Redis memory usage high
```bash
# Check memory:
redis-cli info memory

# Clear old keys:
redis-cli FLUSHALL  # WARNING: Loses all data

# Check queue sizes:
redis-cli LLEN outreach
redis-cli LLEN notifications
```

---

## MONITORING & ALERTING

### Application Monitoring

```bash
# View logs
docker-compose logs -f app

# Monitor CPU/Memory
docker stats

# Check error rates
curl https://api.yourdomain.com/api/metrics/errors
```

### Queue Monitoring

```bash
# Access BullMQ UI
open http://localhost:3001

# Check queue lengths
redis-cli
> LLEN outreach
> LLEN notifications
> LLEN content
> LLEN followup
```

### Database Monitoring

```bash
# Connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -c "SELECT query, mean_time FROM pg_stat_statements 
WHERE mean_time > 100 ORDER BY mean_time DESC;"

# Index usage
psql -c "SELECT schemaname, tablename, indexname, 
idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan ASC;"
```

---

## ROLLBACK PROCEDURES

### If Deployment Fails

```bash
# 1. Check status
docker-compose ps

# 2. View logs
docker-compose logs app

# 3. Rollback migration
npx prisma migrate resolve --rolled-back add-modules-4-9

# 4. Restore previous version
git revert HEAD
git push origin main

# 5. Monitor GitHub Actions rollback
```

### Database Rollback

```bash
# 1. Backup current database
pg_dump hanexes > backup-$(date +%s).sql

# 2. Rollback migration
npx prisma migrate resolve --rolled-back add-modules-4-9

# 3. Restore from backup if needed
psql hanexes < backup-1717939200.sql
```

---

## PERFORMANCE OPTIMIZATION

### Database Optimization

```sql
-- Add missing indexes
CREATE INDEX idx_campaign_user_status ON Campaign(userId, status);
CREATE INDEX idx_content_user_type ON Content(userId, type);
CREATE INDEX idx_conversation_user_lead ON Conversation(userId, leadId);
CREATE INDEX idx_scheduled_content_status_date ON ScheduledContent(status, scheduledFor);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# Enable maxmemory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Monitor evictions
redis-cli INFO evicted_keys

# Optimize key expiry
redis-cli BGSAVE
```

### Application Optimization

```typescript
// Add query caching
const cacheKey = `campaigns:${userId}:${status}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Add pagination defaults
const take = Math.min(parseInt(take) || 20, 100);

// Implement request batching
// Combine multiple requests into single query
```

---

## ROLLOUT STRATEGY

### Phase 1: Staging (1 day)
- Deploy to staging environment
- Run full test suite
- Verify all integrations
- Performance testing

### Phase 2: Beta (2-3 days)
- Deploy to beta environment
- Limited user group (100-1000)
- Monitor error rates
- Gather feedback

### Phase 3: Production (1 day)
- Full production deployment
- Gradual rollout (blue-green)
- Real-time monitoring
- Support on-call

### Phase 4: Monitoring (Ongoing)
- 24/7 uptime monitoring
- Daily performance reviews
- Weekly optimization sessions
- Monthly feature planning

---

## SUCCESS CRITERIA

✅ **All tests passing**
- npm test ≥ 80% coverage
- npm run lint - no errors
- npx tsc --noEmit - no errors

✅ **All endpoints working**
- GET /api/campaigns - 200
- POST /api/campaigns - 201
- All Module 4-9 endpoints functional

✅ **Database operational**
- All migrations applied
- Data integrity verified
- Indexes created

✅ **Infrastructure running**
- Redis operational
- BullMQ workers running
- GitHub Actions CI/CD working

✅ **Performance acceptable**
- API response time < 500ms
- Database queries < 100ms
- Queue processing < 30s

---

## SUPPORT & ESCALATION

**Technical Issues:**
- Slack: #hanexes-dev
- Email: dev-support@hanexes.io
- On-call: +1-555-0123

**Deployment Issues:**
- Contact: DevOps team
- Page: ops-page.hanexes.io
- Escalation: CTO

**Database Issues:**
- Contact: Database team
- Slack: #database-support
- On-call: +1-555-0456

---

## FINAL CHECKLIST

- [ ] Prisma migration created and tested
- [ ] Dependencies installed (bullmq, ioredis)
- [ ] TypeScript compilation successful
- [ ] All linting issues resolved
- [ ] Unit tests ≥ 80% coverage
- [ ] Integration tests passing
- [ ] API endpoints responding
- [ ] Docker images built
- [ ] GitHub Actions workflows passing
- [ ] Production environment variables set
- [ ] Database backups configured
- [ ] Monitoring and alerting setup
- [ ] Team training completed
- [ ] Documentation updated
- [ ] Deployment approved

---

## TIME ESTIMATE

- Migration: 15 minutes
- Testing: 1-2 hours
- Frontend implementation: 4-6 hours
- Staging deployment: 1 hour
- Monitoring setup: 30 minutes
- Production deployment: 1 hour

**Total: 8-11 hours (1 business day)**

---

**Status: Ready for deployment ✅**

All infrastructure is in place. Begin with Step 1 in "IMMEDIATE NEXT STEPS" and follow the instructions sequentially.
