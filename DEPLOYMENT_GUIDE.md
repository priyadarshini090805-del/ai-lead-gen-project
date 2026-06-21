# HaneXes Platform - Production Deployment Guide

## Pre-Deployment Verification

### 1. Code Quality Checks
```bash
# Install dependencies
npm install --legacy-peer-deps

# Run linter (should pass with no errors)
npm run lint

# Run type checking (should pass with no errors)
npm run type-check

# Build application (should succeed)
npm run build

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in all required variables:

**Critical (must be set):**
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `ENCRYPTION_KEY` - Generate: `openssl rand -hex 16`
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`
- `SENDGRID_API_KEY` or SMTP credentials
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`

**Important (for full functionality):**
- `OPENROUTER_API_KEY` - AI content generation
- `SENTRY_DSN` - Error tracking
- `HUNTER_API_KEY` - Email validation
- `CLEARBIT_API_KEY` - Company enrichment

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb hanexes

# Run migrations
npx prisma migrate deploy

# Verify connection
npx prisma studio  # Check if UI loads and tables visible
```

### 4. Local Testing

```bash
# Start development server
npm run dev

# Test API health
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Test email service (if configured)
# Use your SendGrid test credentials
```

## Docker Deployment

### Build Image
```bash
docker build -t hanexes:latest .
```

### Run Container
```bash
docker run \
  -p 3000:3000 \
  --env-file .env \
  -e DATABASE_URL=postgresql://postgres:password@db:5432/hanexes \
  -e REDIS_URL=redis://redis:6379 \
  hanexes:latest
```

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Production Checklist

### Infrastructure
- [ ] PostgreSQL database configured
- [ ] Redis instance running
- [ ] HTTPS/TLS certificates installed
- [ ] Reverse proxy (nginx/Apache) configured
- [ ] Health check endpoint monitored
- [ ] Log aggregation configured
- [ ] Backup strategy implemented

### Security
- [ ] All environment variables set (never commit .env)
- [ ] JWT_SECRET is 32+ random characters
- [ ] ENCRYPTION_KEY is set for credential encryption
- [ ] Database user has minimal required permissions
- [ ] Database backups encrypted
- [ ] Rate limiting verified (100 req/min)
- [ ] CSP headers verified (curl -I http://your-domain)
- [ ] CORS configured for your domain

### Monitoring
- [ ] Sentry project created and DSN configured
- [ ] Health check endpoint monitored
- [ ] Error tracking active
- [ ] Database connections monitored
- [ ] Redis connections monitored
- [ ] Disk space monitoring
- [ ] Memory usage monitoring

### OAuth/Integrations
- [ ] Google OAuth redirect URIs set
- [ ] LinkedIn OAuth redirect URIs set
- [ ] Instagram OAuth redirect URIs set
- [ ] Webhook URLs registered with platforms
- [ ] Webhook secrets stored securely

### Email/SMS
- [ ] SendGrid account configured
- [ ] Twilio account configured
- [ ] Email templates tested
- [ ] SMS sending verified
- [ ] WhatsApp Business account linked

## Deployment Commands

### AWS EC2 with Docker
```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Clone repository
git clone https://github.com/yourorg/hanexes.git
cd hanexes

# Setup environment
cp .env.example .env
# Edit .env with production values

# Build and run
docker build -t hanexes .
docker run -d -p 80:3000 \
  --env-file .env \
  --restart unless-stopped \
  --name hanexes \
  hanexes
```

### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create hanexes-prod

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set DATABASE_URL=your-db-url
# ... set all required variables

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure environment variables in Vercel dashboard
# Set all .env variables
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# API health
curl https://your-domain/api/health

# Database connectivity
curl https://your-domain/api/health | grep database

# Response should include: {"status":"healthy","services":{"database":"ok"}}
```

### 2. Authentication
```bash
# Test user registration
curl -X POST https://your-domain/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Test login
curl -X POST https://your-domain/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Security Headers
```bash
# Verify CSP headers
curl -I https://your-domain

# Should include:
# Content-Security-Policy: default-src 'self'...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

### 4. Rate Limiting
```bash
# Test rate limiting (should return 429 after 100 requests)
for i in {1..101}; do
  curl https://your-domain/api/health
done
```

## Rollback Procedure

### If Deployment Fails

1. **Docker**: Restart previous image
   ```bash
   docker stop hanexes
   docker run -d ... hanexes:previous-version
   ```

2. **Heroku**: Rollback release
   ```bash
   heroku releases
   heroku rollback v123
   ```

3. **Database**: Restore from backup
   ```bash
   pg_restore -d hanexes < backup.sql
   ```

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma
npx prisma db pull
npx prisma db push
```

### Redis Connection Issues
```bash
# Test connection
redis-cli PING

# Should return: PONG
```

### Email Not Sending
```bash
# Check SendGrid API key
curl https://api.sendgrid.com/v3/mail/send \
  -X POST \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json"

# Check Twilio credentials
curl -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json
```

### High Memory Usage
```bash
# Check Node memory
node --max-old-space-size=2048 server.js

# Monitor with Docker
docker stats hanexes
```

## Monitoring Setup

### Sentry Integration
1. Create Sentry project at sentry.io
2. Copy DSN to SENTRY_DSN environment variable
3. Errors automatically captured
4. Set up alerts for high error rates

### Database Monitoring
1. Enable PostgreSQL logs
2. Monitor slow queries
3. Set up backup automation

### Application Performance
1. Monitor API response times
2. Track error rates
3. Monitor queue job durations
4. Track OAuth success rates

## Maintenance

### Daily
- Monitor error tracking (Sentry)
- Check application health
- Review logs for warnings

### Weekly
- Database backup verification
- Security audit logs
- Update monitoring dashboards

### Monthly
- Dependency security updates (npm audit)
- Performance analysis
- Cost review (cloud services)
- OAuth token rotation

## Support Contacts

- **Database Support**: Your PostgreSQL provider
- **Redis Support**: Your Redis provider
- **Email Support**: SendGrid support
- **SMS Support**: Twilio support
- **Error Tracking**: Sentry support
- **Application Monitoring**: Your monitoring provider

---

**Last Updated**: June 2026  
**Version**: 1.0  
**Status**: Production Ready
