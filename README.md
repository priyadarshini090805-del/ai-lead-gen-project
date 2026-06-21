# HaneXes - Enterprise SaaS Authentication System

A production-ready authentication and user management system built with Next.js 15, TypeScript, and PostgreSQL.

## Features

### Authentication
- **Email/Password Registration & Login** with strong password validation
- **Google OAuth 2.0** integration with account linking
- **LinkedIn OAuth 2.0** integration with account linking
- **JWT-based Authentication** with 15-minute access tokens and 7-day refresh tokens
- **Secure Session Management** with cookie-based storage and automatic refresh

### Security
- **Password Hashing** with bcrypt (10 salt rounds)
- **CSRF Protection** with token validation
- **Rate Limiting** with configurable presets
- **Input Sanitization** and XSS protection
- **SQL Injection Prevention** via Prisma ORM
- **Audit Logging** for all authentication events
- **Secure Cookies** with httpOnly and SameSite flags
- **Helmet Security Headers** for HTTP security

### Authorization
- **Role-Based Access Control (RBAC)** with 5 role levels
  - SUPER_ADMIN: Full system access
  - ADMIN: User management and system administration
  - MANAGER: Lead and team management
  - SALES: Lead and outreach access
  - USER: Personal account access only
- **Permission-based authorization** with granular permission checks
- **Role hierarchy** with automatic elevation

### User Management
- User profiles with first/last name, email, and image
- Password reset with email verification tokens
- Forgot password functionality
- Remember me option for extended sessions
- Session management with device tracking
- Logout from all devices

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Static type safety
- **Tailwind CSS** - Utility-first styling (black/white/gray only)
- **React** - UI library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Server Actions** - Next.js server-side functions
- **Prisma ORM** - Type-safe database access
- **PostgreSQL (Neon)** - Cloud-hosted database

### Authentication
- **NextAuth.js v5** - Authentication library
- **JWT (jsonwebtoken)** - Token generation and verification
- **bcryptjs** - Password hashing
- **Cookie** - Session storage

### Validation & Security
- **Zod** - Schema validation
- **express-rate-limit** - Rate limiting middleware
- **Helmet** - HTTP security headers

### Testing
- **Jest** - Testing framework
- **@testing-library/react** - Component testing utilities

## Project Structure

```
hanexes-saas/
├── app/
│   ├── (auth)/                 # Authentication routes group
│   │   ├── layout.tsx         # Auth layout wrapper
│   │   ├── login/page.tsx      # Login page
│   │   ├── register/page.tsx   # Registration page
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.ts     # Registration endpoint
│   │       ├── login/route.ts        # Login endpoint
│   │       ├── refresh/route.ts      # Token refresh endpoint
│   │       ├── logout/route.ts       # Logout endpoint
│   │       ├── forgot-password/route.ts
│   │       ├── reset-password/route.ts
│   │       ├── sessions/route.ts     # Session management
│   │       └── [...nextauth]/route.ts # NextAuth handler
│   ├── dashboard/page.tsx      # Protected dashboard
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── lib/
│   ├── auth/
│   │   ├── crypto.ts           # Password hashing and JWT
│   │   └── __tests__/crypto.test.ts
│   ├── middleware/
│   │   ├── auth.ts             # Authentication middleware
│   │   └── rbac.ts             # Role-based access control
│   ├── security/
│   │   ├── csrf.ts             # CSRF protection
│   │   ├── rate-limit.ts       # Rate limiting
│   │   ├── audit.ts            # Audit logging
│   │   ├── sanitize.ts         # Input sanitization
│   │   └── __tests__/sanitize.test.ts
│   ├── validations/
│   │   ├── auth.ts             # Zod schemas
│   │   └── __tests__/auth.test.ts
│   ├── rbac.ts                 # RBAC system
│   ├── session.ts              # Session management
│   ├── api-response.ts         # Standardized responses
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client
│   └── __tests__/rbac.test.ts
├── prisma/
│   └── schema.prisma           # Database schema
├── app/globals.css             # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── jest.config.js
├── jest.setup.js
├── .env.local                  # Environment variables
├── .eslintrc.json
├── .gitignore
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon configured)
- npm or yarn

### Setup Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.local .env.local
# Edit .env.local with your credentials
```

3. **Generate Prisma Client**
```bash
npm run prisma:generate
```

4. **Run Database Migrations**
```bash
npm run prisma:migrate
```

5. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## API Endpoints

### Authentication

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

**Refresh Token**
```
POST /api/auth/refresh
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Logout**
```
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Session Management

**Get Sessions**
```
GET /api/auth/sessions
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "activeSessionCount": 2,
    "sessions": [...],
    "lastLogin": "2024-01-01T00:00:00Z",
    "lastLoginIp": "192.168.1.1"
  }
}
```

**Delete Session**
```
DELETE /api/auth/sessions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "sessionId": "session-123"
}
```

**Logout All Devices**
```
DELETE /api/auth/sessions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "logoutAllDevices": true
}
```

## Password Requirements

Passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

## Security Features

### Password Security
- Bcrypt hashing with 10 salt rounds
- Password strength validation with Zod
- Secure password reset tokens (1-hour expiry)
- Password history not enforced (can be added)

### Session Security
- Secure HTTP-only cookies
- SameSite cookie policy (Lax)
- Automatic token refresh every 15 minutes
- Session expiration after 24 hours
- Remember me option (7 days)

### CSRF Protection
- CSRF token generation and validation
- Token rotation on each request
- Cookie-based token storage

### Rate Limiting
- Login/Register: 5 requests per 15 minutes
- API: 100 requests per minute
- Auth operations: Configurable presets

### Input Validation
- Zod schema validation
- Email format validation
- Password strength requirements
- Script tag and event handler removal
- HTML entity escaping

### Audit Logging
- User login/logout tracking
- Password change logging
- Account creation tracking
- OAuth account linking tracking
- All logs include IP address and user agent

## Database Schema

### User Table
- `id` (String, Primary Key)
- `firstName` (String)
- `lastName` (String)
- `email` (String, Unique)
- `passwordHash` (String, Optional)
- `role` (Enum: SUPER_ADMIN, ADMIN, MANAGER, SALES, USER)
- `image` (String, Optional)
- `isActive` (Boolean)
- `emailVerified` (DateTime, Optional)
- `twoFactorEnabled` (Boolean)
- `twoFactorSecret` (String, Optional)
- `lastLoginAt` (DateTime, Optional)
- `lastLoginIp` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Account Table (OAuth)
- `id` (String, Primary Key)
- `userId` (String, Foreign Key)
- `type` (String)
- `provider` (String)
- `providerAccountId` (String, Unique with provider)
- `refreshToken` (String, Optional)
- `accessToken` (String, Optional)
- `expiresAt` (Int, Optional)
- `tokenType` (String, Optional)
- `scope` (String, Optional)
- `idToken` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Session Table
- `id` (String, Primary Key)
- `sessionToken` (String, Unique)
- `userId` (String, Foreign Key)
- `userAgent` (String, Optional)
- `ipAddress` (String, Optional)
- `expiresAt` (DateTime)
- `rememberMe` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### RefreshToken Table
- `id` (String, Primary Key)
- `userId` (String, Foreign Key)
- `token` (String, Unique)
- `expiresAt` (DateTime)
- `revokedAt` (DateTime, Optional)
- `createdAt` (DateTime)

### VerificationToken Table
- `id` (String, Primary Key)
- `userId` (String, Foreign Key)
- `token` (String, Unique)
- `type` (String: email-verification, password-reset)
- `expiresAt` (DateTime)
- `usedAt` (DateTime, Optional)
- `createdAt` (DateTime)

### AuditLog Table
- `id` (String, Primary Key)
- `userId` (String, Optional, Foreign Key)
- `action` (Enum)
- `entityType` (String)
- `entityId` (String, Optional)
- `oldValue` (String, Optional)
- `newValue` (String, Optional)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `metadata` (String, Optional)
- `createdAt` (DateTime)

## Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm test -- --coverage
```

### Test Files
- `lib/auth/__tests__/crypto.test.ts` - Password and JWT tests
- `lib/validations/__tests__/auth.test.ts` - Schema validation tests
- `lib/__tests__/rbac.test.ts` - Role-based access control tests
- `lib/security/__tests__/sanitize.test.ts` - Input sanitization tests

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...
DATABASE_DIRECT_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Auth Secrets
AUTH_SECRET=your-secret-key
CSRF_SECRET=your-secret-key
JWT_SECRET=your-secret-key

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# LinkedIn OAuth
AUTH_LINKEDIN_ID=your-linkedin-client-id
AUTH_LINKEDIN_SECRET=your-linkedin-client-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Vercel Deployment
1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Known Limitations & Future Enhancements

### Current Limitations
- Email sending not fully implemented (TODO: integrate Resend)
- Two-factor authentication schema prepared but not implemented
- Instagram OAuth schema prepared but not implemented

### Planned Enhancements
- Email verification on signup
- Two-factor authentication (2FA) with TOTP
- Instagram OAuth integration
- Password history and expiration policies
- Device management and security keys
- Advanced audit logging with search/filter
- API key authentication for programmatic access

## Contributing

This is a private project. For contributions, please follow:
1. TypeScript strict mode
2. Zod schema validation for all inputs
3. Comprehensive error handling
4. Test coverage for new features
5. Security-first mindset

## License

MIT License - See LICENSE file for details

## Support

For support and questions, contact: support@hanexes.com
