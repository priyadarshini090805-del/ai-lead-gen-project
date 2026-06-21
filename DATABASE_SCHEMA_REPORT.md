# Database Schema Report

**Database:** PostgreSQL (Neon)  
**ORM:** Prisma v5.8.0  
**Total Tables:** 10  
**Total Enums:** 4  

---

## Table Definitions

### 1. User
**Purpose:** Store user account information and authentication data

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | ✅ | Primary key |
| firstName | String | | | User's first name |
| lastName | String | | | User's last name |
| email | String | ✅ | ✅ | Unique email address |
| passwordHash | String? | | | bcrypt hashed password (nullable for OAuth users) |
| role | UserRole | | ✅ | User role for RBAC |
| image | String? | | | Profile image URL |
| isActive | Boolean | | | Account status |
| emailVerified | DateTime? | | | Email verification timestamp |
| twoFactorEnabled | Boolean | | | 2FA status |
| twoFactorSecret | String? | | | TOTP secret (encrypted) |
| lastLoginAt | DateTime? | | | Last login timestamp |
| lastLoginIp | String? | | | Last login IP address |
| createdAt | DateTime | | | Account creation timestamp |
| updatedAt | DateTime | | | Last update timestamp |

**Relations:**
- `accounts` → Account[] (OneToMany)
- `sessions` → Session[] (OneToMany)
- `refreshTokens` → RefreshToken[] (OneToMany)
- `verificationTokens` → VerificationToken[] (OneToMany)
- `auditLogs` → AuditLog[] (OneToMany)
- `leads` → Lead[] (OneToMany)
- `leadTags` → LeadTag[] (OneToMany)

**Indexes:**
- `email` - Unique constraint
- `role` - For RBAC queries

---

### 2. Account
**Purpose:** Store OAuth provider account linking information

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String | | ✅ | Foreign key to User |
| type | String | | | Account type (e.g., "oauth") |
| provider | String | | | OAuth provider (google, linkedin) |
| providerAccountId | String | | | Provider's user ID |
| refreshToken | String? | | | OAuth refresh token (encrypted) |
| accessToken | String? | | | OAuth access token (encrypted) |
| expiresAt | Int? | | | Token expiry timestamp (Unix) |
| tokenType | String? | | | Token type (Bearer, etc.) |
| scope | String? | | | OAuth scope permissions |
| idToken | String? | | | OAuth ID token |
| createdAt | DateTime | | | Creation timestamp |
| updatedAt | DateTime | | | Last update timestamp |

**Constraints:**
- Unique: (provider, providerAccountId)

**Indexes:**
- `userId` - For user lookup

---

### 3. Session
**Purpose:** Store active user sessions with device tracking

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| sessionToken | String | ✅ | | Session identifier |
| userId | String | | ✅ | Foreign key to User |
| userAgent | String? | | | Browser/device info |
| ipAddress | String? | | | Session IP address |
| expiresAt | DateTime | | ✅ | Session expiration |
| rememberMe | Boolean | | | Remember me flag |
| createdAt | DateTime | | | Creation timestamp |
| updatedAt | DateTime | | | Last update timestamp |

**Indexes:**
- `userId` - User session lookup
- `expiresAt` - For cleanup queries

---

### 4. RefreshToken
**Purpose:** Store refresh tokens for token renewal

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String | | ✅ | Foreign key to User |
| token | String | ✅ | | Refresh token value |
| expiresAt | DateTime | | ✅ | Token expiry |
| revokedAt | DateTime? | | | Revocation timestamp |
| createdAt | DateTime | | | Creation timestamp |

**Indexes:**
- `userId` - User token lookup
- `expiresAt` - For cleanup queries
- `token` - Unique constraint

---

### 5. VerificationToken
**Purpose:** Store verification tokens for email and password reset

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String | | ✅ | Foreign key to User |
| token | String | ✅ | ✅ | Verification token |
| type | String | | | Token type (email-verification, password-reset) |
| expiresAt | DateTime | | ✅ | Token expiry |
| usedAt | DateTime? | | | When token was used |
| createdAt | DateTime | | | Creation timestamp |

**Indexes:**
- `userId` - User token lookup
- `token` - Token lookup
- `expiresAt` - For cleanup queries

---

### 6. AuditLog
**Purpose:** Store audit trail of all authentication and system events

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String? | | ✅ | Foreign key to User (nullable for guest actions) |
| action | AuditAction | | | Type of action performed |
| entityType | String | | | Entity type (User, Lead, etc.) |
| entityId | String? | | | Entity identifier |
| oldValue | String? | | | Old value for update operations |
| newValue | String? | | | New value for update operations |
| ipAddress | String? | | | Source IP address |
| userAgent | String? | | | Browser/device information |
| metadata | String? | | | Additional JSON metadata |
| createdAt | DateTime | | ✅ | Event timestamp |

**Indexes:**
- `userId` - User audit lookup
- `action` - Action type filtering
- `createdAt` - Time-based queries

---

### 7. FailedLoginAttempt
**Purpose:** Track failed login attempts for brute force protection

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| email | String? | | ✅ | Email address attempted |
| ipAddress | String | | ✅ | Source IP address |
| attemptCount | Int | | | Number of failed attempts |
| lastAttemptAt | DateTime | | | Last attempt timestamp |
| lockedUntil | DateTime? | | ✅ | Lockout expiry time |

**Constraints:**
- Unique: (email, ipAddress)

---

### 8. Lead
**Purpose:** Store lead/prospect information for sales pipeline

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String | | ✅ | Owner/creator |
| firstName | String | | | Lead first name |
| lastName | String | | | Lead last name |
| email | String | | ✅ | Lead email address |
| phone | String? | | | Lead phone number |
| company | String? | | ✅ | Company name |
| jobTitle | String? | | | Job title/position |
| linkedinUrl | String? | | | LinkedIn profile URL |
| instagramHandle | String? | | | Instagram handle |
| source | String? | | | How lead was acquired |
| status | LeadStatus | | ✅ | Lead pipeline status |
| score | Int | | | Lead quality score (0-100) |
| notes | String? | | | Internal notes |
| createdAt | DateTime | | ✅ | Creation date |
| updatedAt | DateTime | | | Last modified date |

**Relations:**
- `user` → User (ManyToOne)
- `tags` → LeadTag[] (ManyToMany via implicit table)
- `activities` → LeadActivity[] (OneToMany)
- `statusHistory` → LeadStatusHistory[] (OneToMany)

**Indexes:**
- `userId` - User's leads
- `status` - Status filtering
- `email` - Email lookup
- `company` - Company filtering
- `createdAt` - Date-based queries

---

### 9. LeadTag
**Purpose:** Store custom tags for lead categorization

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| userId | String | | ✅ | Tag owner |
| name | String | | | Tag name |
| color | String | | | Hex color code |
| createdAt | DateTime | | | Creation date |

**Constraints:**
- Unique: (userId, name) - User can't have duplicate tag names

**Relations:**
- `user` → User (ManyToOne)
- `leads` → Lead[] (ManyToMany)

---

### 10. LeadActivity
**Purpose:** Track all activities and changes to leads

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| leadId | String | | ✅ | Associated lead |
| activityType | LeadActivityType | | | Type of activity |
| description | String? | | | Activity description |
| createdAt | DateTime | | ✅ | Activity timestamp |

**Relations:**
- `lead` → Lead (ManyToOne)

**Indexes:**
- `leadId` - Activity lookup
- `createdAt` - Timeline sorting

---

### 11. LeadStatusHistory
**Purpose:** Maintain history of lead status changes

**Fields:**
| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| id | String (CUID) | ✅ | | Primary key |
| leadId | String | | ✅ | Associated lead |
| oldStatus | LeadStatus | | | Previous status |
| newStatus | LeadStatus | | | New status |
| createdAt | DateTime | | ✅ | Change timestamp |

**Indexes:**
- `leadId` - History lookup
- `createdAt` - Timeline sorting

---

## Enum Definitions

### UserRole
```
SUPER_ADMIN - Full system access
ADMIN - System administration
MANAGER - Team/resource management
SALES - Sales operations
USER - Basic user access
```

### AuditAction
```
LOGIN - User login
LOGOUT - User logout
REGISTER - User registration
PASSWORD_CHANGE - Password change
PASSWORD_RESET - Password reset
OAUTH_LOGIN - OAuth login
ACCOUNT_LINK - Account linking
PROFILE_UPDATE - Profile update
ROLE_CHANGE - Role assignment change
DELETE_ACCOUNT - Account deletion
SESSION_REFRESH - Token refresh
```

### LeadStatus
```
NEW - Newly created lead
CONTACTED - Initial contact made
QUALIFIED - Qualified as opportunity
CONVERTED - Closed/converted
LOST - Lost opportunity
```

### LeadActivityType
```
CREATED - Lead created
UPDATED - Lead information updated
STATUS_CHANGED - Status changed
TAG_ADDED - Tag added to lead
TAG_REMOVED - Tag removed from lead
NOTE_ADDED - Note added (future)
```

---

## Relationships

**User → Account** (1:M)
- User can have multiple OAuth accounts
- OnDelete: Cascade

**User → Session** (1:M)
- User can have multiple active sessions
- OnDelete: Cascade

**User → RefreshToken** (1:M)
- User can have multiple refresh tokens
- OnDelete: Cascade

**User → VerificationToken** (1:M)
- User can have multiple verification tokens
- OnDelete: Cascade

**User → AuditLog** (1:M)
- User can have multiple audit log entries
- OnDelete: SetNull (preserves logs)

**User → Lead** (1:M)
- User can own multiple leads
- OnDelete: Cascade

**User → LeadTag** (1:M)
- User can have multiple tags
- OnDelete: Cascade

**Lead → LeadActivity** (1:M)
- Lead can have multiple activities
- OnDelete: Cascade

**Lead → LeadStatusHistory** (1:M)
- Lead can have multiple status changes
- OnDelete: Cascade

**Lead ↔ LeadTag** (M:M)
- Leads can have multiple tags
- Tags can be applied to multiple leads
- Implicit junction table

---

## Performance Optimizations

**Indexes:** 25+ indexes for optimal query performance
**Cascading Deletes:** Maintain data integrity
**Unique Constraints:** Prevent duplicates
**Foreign Keys:** Maintain referential integrity
**Pagination:** Limit query result sets

---

## Database Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 10 |
| Total Enums | 4 |
| Relationships | 15+ |
| Indexes | 25+ |
| Unique Constraints | 8 |
| Foreign Keys | 12 |

---

## Migration Strategy

1. Create database schema with `npx prisma migrate dev`
2. Generate Prisma client with `npx prisma generate`
3. Verify schema integrity
4. Run seed data (future)
5. Create database backups
6. Deploy to production

---

## Scalability Considerations

**Partitioning:** Consider partitioning AuditLog by date
**Archiving:** Archive old audit logs quarterly
**Indexes:** Monitor index usage and optimize
**Caching:** Implement Redis for frequently accessed data
**Search:** Add full-text search indexes as needed

---

## Data Protection

**Encryption:** OAuth tokens encrypted at rest
**Hashing:** Passwords hashed with bcrypt
**Audit Trail:** Complete audit trail maintained
**Access Control:** User-scoped data isolation
**GDPR Ready:** Support for data export and deletion

---

