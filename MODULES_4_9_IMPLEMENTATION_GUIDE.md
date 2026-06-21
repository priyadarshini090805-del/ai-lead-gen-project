# HaneXes Modules 4-9 Implementation Guide

**Date:** June 8, 2026  
**Status:** Infrastructure Complete - Ready for Integration Testing  
**Scope:** Modules 4-9 API Endpoints + Redis/BullMQ + Docker + GitHub Actions CI/CD

---

## EXECUTIVE SUMMARY

Complete Prisma schema extensions and API endpoint implementations for Modules 4-9:

- ✅ **Module 4:** Outreach Workflow Engine (5 database models, 5 API routes)
- ✅ **Module 5:** Content Creation (2 database models, 1 API route)
- ✅ **Module 6:** Content Scheduling (2 database models, 1 API route)
- ✅ **Module 7:** Conversation Assistant (2 database models, 2 API routes)
- ✅ **Module 8:** Social Integrations (3 database models, 2 API routes)
- ✅ **Module 9:** CRM & Analytics (2 database models, 2 API routes)
- ✅ **Infrastructure:** Redis/BullMQ, Docker, GitHub Actions CI/CD

---

## DATABASE SCHEMA ADDITIONS

### Module 4: Outreach Workflow

**Models Added:**
```prisma
enum CampaignStatus { DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED }
enum WorkflowStepType { MESSAGE, DELAY, CONDITION, BRANCH }
enum CampaignLeadStatus { PENDING, SENT, OPENED, REPLIED, FAILED, SKIPPED }

Campaign
CampaignLead
CampaignActivity
Workflow
WorkflowStep
ScheduledMessage
```

**Key Features:**
- Campaign creation and management
- Workflow step sequencing (message, delay, condition, branch)
- Lead tracking per campaign
- Activity timeline
- Scheduled message queuing

### Module 5: Content Creation

**Models Added:**
```prisma
enum ContentType {
  LINKEDIN_POST
  INSTAGRAM_CAPTION
  POSTER
  VIDEO_SCRIPT
  JOB_POST
  COMPANY_ANNOUNCEMENT
}

Content
ContentVersion
```

**Key Features:**
- Multi-type content creation
- Version history tracking
- AI-generated flag
- Relationship to User

### Module 6: Content Scheduling

**Models Added:**
```prisma
enum PublishingStatus { DRAFT, SCHEDULED, PUBLISHED, FAILED }

ScheduledContent
PublishingQueue
```

**Key Features:**
- Multi-platform scheduling (LinkedIn, Instagram)
- Timezone support
- Queue integration
- Retry mechanism
- Status tracking

### Module 7: Conversation Assistant

**Models Added:**
```prisma
Conversation
ConversationMessage
```

**Key Features:**
- Lead-scoped conversations
- Message threading
- AI suggestion flags
- User/lead sender distinction

### Module 8: Social Integrations

**Models Added:**
```prisma
enum IntegrationProvider { LINKEDIN, INSTAGRAM }
enum IntegrationStatus { ACTIVE, INACTIVE, EXPIRED }

Integration
IntegrationToken
WebhookEvent
```

**Key Features:**
- OAuth token management
- Token refresh support
- Webhook event processing
- Status tracking

### Module 9: CRM & Analytics

**Models Added:**
```prisma
Analytics
Report
```

**Key Features:**
- Daily aggregated metrics
- Lead funnel tracking
- Campaign statistics
- AI usage analytics
- Custom report generation

---

## API ENDPOINTS IMPLEMENTED

### Module 4: Campaigns & Workflows

```
GET    /api/campaigns              - List campaigns
POST   /api/campaigns              - Create campaign
GET    /api/campaigns/:id          - Get campaign detail
PUT    /api/campaigns/:id          - Update campaign
DELETE /api/campaigns/:id          - Delete campaign

GET    /api/workflows              - List workflows
POST   /api/workflows              - Create workflow
GET    /api/workflows/:id          - Get workflow detail
PUT    /api/workflows/:id          - Update workflow
DELETE /api/workflows/:id          - Delete workflow
```

### Module 5: Content Creation

```
GET    /api/content                - List content
POST   /api/content                - Create content
```

### Module 6: Content Scheduling

```
GET    /api/scheduler              - List scheduled content
POST   /api/scheduler              - Schedule content
```

### Module 7: Conversations

```
GET    /api/conversations                    - List conversations
POST   /api/conversations                    - Create/get conversation
GET    /api/conversations/:id/messages       - Get conversation messages
POST   /api/conversations/:id/messages       - Add message
```

### Module 8: Integrations

```
GET    /api/integrations                     - List integrations
POST   /api/integrations/connect/:provider   - Connect social account
```

### Module 9: Analytics & Reports

```
GET    /api/analytics              - Get analytics dashboard
GET    /api/reports                - List reports
POST   /api/reports                - Create report
```

---

## IMPLEMENTATION CHECKLIST

### Database Migration
- [ ] Run: `npx prisma migrate dev --name add-modules-4-9`
- [ ] Verify migration file created
- [ ] Test on development database

### Environment Variables
```env
# Add to .env.local:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # optional

# For LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret

# For Instagram OAuth
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
```

### Dependencies to Install
```bash
npm install --save bullmq ioredis
npm install --save-dev @types/node
```

### Docker Setup
```bash
# Build and start services
docker-compose up -d

# Verify all services healthy
docker-compose ps

# Access services:
# - App: http://localhost:3000
# - BullMQ UI: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### GitHub Actions
- [ ] Workflows created: `.github/workflows/test.yml` and `deploy.yml`
- [ ] Configure repository secrets:
  - `DEPLOYMENT_KEY` (for production)
  - `DATABASE_URL_PROD` (production database)
  - `REDIS_URL_PROD` (production Redis)

---

## FRONTEND DASHBOARD PAGES (TO BE CREATED)

### Module 4: Campaigns
- [ ] `/dashboard/campaigns` - Campaign list with filters
- [ ] `/dashboard/campaigns/new` - Create campaign
- [ ] `/dashboard/campaigns/[id]` - Campaign detail with analytics
- [ ] `/dashboard/workflows` - Workflow management

### Module 5: Content
- [ ] `/dashboard/content` - Content library
- [ ] `/dashboard/content/new` - Create/generate content
- [ ] `/dashboard/content/editor` - Rich text editor

### Module 6: Scheduling
- [ ] `/dashboard/scheduler/monthly` - Monthly calendar view
- [ ] `/dashboard/scheduler/weekly` - Weekly calendar view
- [ ] `/dashboard/scheduler/daily` - Daily view

### Module 7: Conversations
- [ ] `/dashboard/conversations` - Conversation list
- [ ] `/dashboard/conversations/[id]` - Chat interface

### Module 8: Integrations
- [ ] `/dashboard/integrations` - Integration management
- [ ] OAuth callback handling

### Module 9: Analytics
- [ ] `/dashboard/analytics` - KPI dashboard with charts
- [ ] `/dashboard/reports` - Report builder

---

## QUEUE ARCHITECTURE

### Redis Configuration
```typescript
// lib/queue/index.ts
- outreachQueue: Send messages to leads
- notificationQueue: Send notifications
- contentQueue: Publish scheduled content
- followupQueue: Send follow-up messages
```

### Worker Concurrency
- Outreach: 5 concurrent jobs
- Notifications: 10 concurrent jobs
- Content: 3 concurrent jobs (rate limit)
- Followup: 5 concurrent jobs

### Retry Policy
- Max attempts: 3
- Backoff: Exponential (2s → 4s → 8s)
- Dead letter queue: Failed jobs retained

---

## DOCKER DEPLOYMENT

### Local Development
```bash
# Start all services
docker-compose up -d

# Run migrations inside container
docker-compose exec app npx prisma migrate dev

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Deployment
```dockerfile
# Multi-stage build for optimized image
# - Build stage: npm ci, npm run build
# - Runtime stage: node_modules + built app only
# - Non-root user (nextjs:1001)
# - Health check endpoint
# - Signal handling (dumb-init)
```

---

## CI/CD PIPELINE

### Test Workflow (.github/workflows/test.yml)
Triggers: Push to main/develop, PRs

Steps:
1. Setup Node.js 18
2. Install dependencies
3. Generate Prisma client
4. Run database migrations
5. Lint check
6. TypeScript type check
7. Run test suite with coverage
8. Upload to Codecov

### Deploy Workflow (.github/workflows/deploy.yml)
Triggers: Push to main, manual

Steps:
1. Build Docker image
2. Push to GHCR registry
3. Run full test suite
4. Deploy to production

---

## CRITICAL NEXT STEPS

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add-modules-4-9
```
**Status:** ⚠️ REQUIRED BEFORE TESTING

### 2. Implement Frontend Pages
Create dashboard pages for all modules (16 pages total)
**Status:** 📋 IN PROGRESS

### 3. Create Database Services
Services for campaign execution, content publishing, etc.
**Status:** 📋 PENDING

### 4. Implement Queue Workers
Actual job handlers for sending messages, publishing content
**Status:** 📋 PENDING

### 5. OAuth Flow Implementation
LinkedIn and Instagram OAuth callback handlers
**Status:** 📋 PENDING

### 6. Testing & Validation
- Unit tests for all API routes
- Integration tests for workflows
- E2E tests for user flows
- 80%+ code coverage target

**Status:** 📋 PENDING

### 7. Deployment Configuration
- Production environment variables
- Database connection pooling
- Redis cluster setup
- Logging and monitoring

**Status:** 📋 PENDING

---

## VALIDATION COMMANDS

Once all modules are implemented, run these commands to verify:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm run test

# Build application
npm run build

# Check Prisma schema validity
npx prisma validate

# Run migrations (dev)
npx prisma migrate dev --name verify
```

---

## ARCHITECTURE DECISIONS

### API Response Format
All endpoints return consistent response:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { /* response data */ },
  "error": null
}
```

### Authentication
- JWT tokens in Authorization header
- Verified via `verifyAuth()` middleware
- User ownership verified for all resources

### Database Relations
- User → Campaign (one-to-many)
- User → Workflow (one-to-many)
- Campaign → Lead (many-to-many via CampaignLead)
- Campaign → Workflow (many-to-one)
- Content → Version (one-to-many)
- Integration → Token (one-to-many)

### Queue Semantics
- Jobs auto-retry with exponential backoff
- Failed jobs kept for debugging
- Completed jobs auto-removed after 1 hour
- Workers process concurrently per queue

---

## PERFORMANCE CONSIDERATIONS

### Database Indexes
All key fields are indexed for fast queries:
- userId (all modules)
- status (campaigns, content, integrations)
- createdAt (timeline queries)
- leadId (lead-scoped data)

### Queue Performance
- Redis in-memory caching
- Job batching where applicable
- Concurrent processing (3-10 workers per queue)
- Dead letter queue for failed jobs

### API Rate Limiting
- Implement token bucket algorithm
- Limit: 100 requests/minute per user
- Burst: 10 requests/second

---

## MONITORING & LOGGING

### Application Logs
```typescript
// All endpoints log errors to console
console.error('POST /api/campaigns error:', error);
```

### Queue Monitoring
- BullMQ UI at http://localhost:3001 (dev)
- Job counts per queue
- Failed job inspection
- Worker status

### Database Monitoring
- Slow query log (>100ms)
- Connection pool status
- Prepared statement cache

---

## SECURITY CHECKLIST

- [ ] All endpoints verify JWT authentication
- [ ] All endpoints verify user ownership
- [ ] Input validation via Zod schemas
- [ ] CSRF protection on state-changing requests
- [ ] Rate limiting on sensitive endpoints
- [ ] Secrets stored in environment variables
- [ ] Database credentials secured
- [ ] OAuth tokens encrypted at rest

---

## DEPLOYMENT TIMELINE

**Phase 1: Testing (2-3 hours)**
- Run migrations
- Test API endpoints
- Validate data flows

**Phase 2: Frontend Development (4-6 hours)**
- Create 16 dashboard pages
- Integrate with APIs
- User testing

**Phase 3: Worker Implementation (2-3 hours)**
- Implement queue workers
- Test message sending
- Validate scheduling

**Phase 4: Integration Testing (2-3 hours)**
- E2E workflows
- OAuth flows
- Error scenarios

**Phase 5: Deployment (1-2 hours)**
- Staging deployment
- Production deployment
- Monitoring setup

**Total Estimated Time:** 11-17 hours

---

## SUPPORT & DEBUGGING

### Common Issues

**Issue:** Prisma client not found
```bash
# Solution:
npx prisma generate
npm install
```

**Issue:** Redis connection refused
```bash
# Solution:
docker-compose up redis
# or
redis-server
```

**Issue:** Database migration failed
```bash
# Check migration status:
npx prisma migrate status

# Reset and retry:
npx prisma migrate reset
npx prisma migrate dev
```

---

## CONCLUSION

All infrastructure for Modules 4-9 is in place:
- ✅ Database schema extended with 16 new models
- ✅ 22 API endpoints created
- ✅ Redis/BullMQ queue system configured
- ✅ Docker containerization ready
- ✅ GitHub Actions CI/CD workflows created
- ✅ Environment configuration prepared

**Next:** Implement frontend pages and test complete workflows.
