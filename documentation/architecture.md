# System Architecture Documentation

## Overview

This document provides detailed technical documentation of the Exam Prep Platform architecture, design decisions, and implementation patterns.

## Architecture Principles

### Clean Architecture
The application follows clean architecture principles with clear separation of concerns across layers:

1. **Presentation Layer** - UI and user interactions
2. **Application Layer** - Business logic and orchestration
3. **Data Access Layer** - Database and external API interactions
4. **Data Layer** - External services (Supabase, Stripe)

### Dependency Rule
Dependencies point inward. Outer layers depend on inner layers, never the reverse:
```
Presentation → Application → Data Access → Data
```

## Technology Stack Justification

### Why Next.js?

**Chosen Over:** Create React App, Remix, Gatsby, Traditional React SPA

**Reasons:**
1. **Server-Side Rendering (SSR)** - Better SEO for landing page
2. **API Routes** - Backend and frontend in one codebase
3. **Automatic Code Splitting** - Faster page loads
4. **Image Optimization** - Built-in image optimization
5. **Serverless Deployment** - Scales automatically on Vercel

### Why PostgreSQL (Supabase)?

**Chosen Over:** MongoDB, Firebase, MySQL, Self-hosted PostgreSQL

**Reasons:**
1. **Relational Data** - Our data has clear relationships (users → payments → answers → questions)
2. **ACID Compliance** - Critical for payment transactions
3. **Built-in Auth** - Saves 1-2 weeks of development
4. **Row Level Security** - Database-level authorization
5. **Auto-generated APIs** - REST and GraphQL out of the box
6. **Free Tier** - Generous limits for MVP

### Why Stripe?

**Chosen Over:** PayPal, Square, Razorpay

**Reasons:**
1. **Developer Experience** - Best-in-class API and documentation
2. **Checkout Sessions** - Pre-built payment UI
3. **PCI Compliance** - Handles security for us
4. **Webhooks** - Reliable payment confirmation
5. **Global Support** - Works in 46+ countries
6. **AI Compatibility** - Cursor/Windsurf know Stripe well

### Why Vercel?

**Chosen Over:** AWS, Azure, Netlify, Railway

**Reasons:**
1. **Next.js Native** - Created by Next.js team
2. **Zero Configuration** - One-click deployment
3. **Edge Network** - 50+ global locations
4. **Preview Deployments** - Every PR gets unique URL
5. **Free Tier** - Generous limits for MVP
6. **Automatic Scaling** - Handles traffic spikes

## Data Flow Patterns

### User Registration Flow

```
┌─────────────┐
│    User     │
│ fills form  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│  RegisterForm Component         │
│  - Validates input              │
│  - Calls handleSubmit()         │
└──────┬──────────────────────────┘
       │
       ↓ fetch('/api/auth/register')
┌─────────────────────────────────┐
│  /app/api/auth/register/route  │
│  - Validates input              │
│  - Calls supabase.auth.signUp() │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  Supabase Auth                  │
│  - Creates user                 │
│  - Returns session + JWT        │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  Response                       │
│  - Set session cookie           │
│  - Redirect to /payment         │
└─────────────────────────────────┘
```

### Payment Processing Flow

```
┌─────────────┐
│    User     │
│ clicks Pay  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│  /app/payment/checkout/page.tsx    │
│  - Calls /api/payment/create        │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  /app/api/payment/create/route.ts  │
│  - Creates Stripe checkout session  │
│  - Returns checkout URL             │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Stripe Checkout Page               │
│  - User enters card details         │
│  - Stripe processes payment         │
└──────┬──────────────────────────────┘
       │
       ├─ Success ──→ Redirect to /payment/success
       │
       └─ Webhook ─→ /api/payment/webhook
                      │
                      ↓
                ┌─────────────────────────────┐
                │  Update user_payments table │
                │  - status = 'completed'     │
                └─────────────────────────────┘
```

### Question Fetching Flow (Protected Route)

```
┌─────────────┐
│    User     │
│ visits page │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│  Middleware                     │
│  - Check session cookie         │
│  - Verify JWT valid             │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  /app/questions/page.tsx        │
│  - Calls /api/questions         │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  /app/api/questions/route.ts    │
│  1. Check authentication        │
│  2. Check payment status        │
│  3. Fetch questions from DB     │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  Supabase (PostgreSQL)          │
│  - RLS checks user paid         │
│  - Returns questions            │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  Response                       │
│  - JSON array of questions      │
└─────────────────────────────────┘
```

## Security Architecture

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─ Login Request ──→ /api/auth/login
       │                    │
       │                    ↓
       │              ┌──────────────────┐
       │              │ Supabase Auth    │
       │              │ - Verify password│
       │              │ - Create session │
       │              └────┬─────────────┘
       │                   │
       │                   ↓
       │              ┌──────────────────┐
       │              │ JWT Token        │
       │              │ - user_id        │
       │              │ - email          │
       │              │ - exp (1 week)   │
       │              └────┬─────────────┘
       │                   │
       │                   ↓
       ├─ Set Cookie ←──── httpOnly cookie
       │                   (secure, sameSite)
       │
       ├─ Subsequent Requests
       │  (Cookie automatically included)
       │
       └─ Every API Call ──→ Middleware
                             │
                             ↓
                       ┌──────────────────┐
                       │ Verify JWT       │
                       │ - Check signature│
                       │ - Check exp      │
                       │ - Extract user   │
                       └────┬─────────────┘
                            │
                            ├─ Valid ──→ Allow request
                            │
                            └─ Invalid ──→ 401 Unauthorized
```

### Row Level Security (RLS)

Database-level authorization ensures users can only access their own data:

```sql
-- Example: Users can only view their own payments
CREATE POLICY "Users can view own payments" 
ON user_payments FOR SELECT 
USING (auth.uid() = user_id);

-- Example: Only paid users can view questions
CREATE POLICY "Paid users can view questions" 
ON questions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_payments 
        WHERE user_id = auth.uid() 
        AND status = 'completed'
    )
);
```

**Benefits:**
- Security enforced at database level (can't be bypassed)
- Even if API has bug, database blocks unauthorized access
- Reduces code in application layer

## Performance Optimization

### Server-Side Rendering (SSR)

Pages are rendered on server, then hydrated on client:

```
1. User requests page
   ↓
2. Server fetches data from database
   ↓
3. Server renders React to HTML
   ↓
4. HTML sent to browser (user sees content immediately)
   ↓
5. JavaScript loads in background
   ↓
6. Page becomes interactive (hydration)
```

**Benefits:**
- Faster First Contentful Paint (FCP)
- Better SEO (Google sees full HTML)
- Works without JavaScript

### Code Splitting

Next.js automatically splits code by route:

```
Landing Page (/):
  - Only loads landing page code (~50KB)

Questions Page (/questions):
  - Only loads question components (~80KB)
  - Landing page code NOT loaded
```

**Benefits:**
- Smaller initial bundle
- Faster page loads
- Better performance on slow networks

### Database Indexing

Critical indexes for performance:

```sql
-- Fast lookup: Get user's payment status
CREATE INDEX idx_user_payments_user_id ON user_payments(user_id);

-- Fast filtering: Get CPA questions
CREATE INDEX idx_questions_exam_type ON questions(exam_type);

-- Fast filtering: Get Financial Accounting questions
CREATE INDEX idx_questions_category ON questions(category);

-- Fast lookup: Get user's answer history
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
```

**Impact:**
- Without index: 500ms query time
- With index: 10-50ms query time
- 10x-50x performance improvement

### Edge Caching

Vercel caches static content at 50+ edge locations worldwide:

```
User in Mumbai requests landing page
   ↓
Request goes to Mumbai edge server (not US)
   ↓
Edge server checks cache:
  - Cache HIT → Serve instantly (50ms)
  - Cache MISS → Fetch from origin, cache, serve (200ms)
```

**Benefits:**
- 90%+ requests served from cache
- <100ms response time globally
- Reduced load on origin server

## Scalability Strategy

### Current Architecture (MVP)

```
Users: 10-100
Database: 500MB (Supabase free tier)
Hosting: Vercel free tier
Cost: $0/month
```

### Scaling to 1,000 Users

```
Users: 1,000
Database: 1GB (still within free tier)
Hosting: Vercel free tier
Cost: $0/month
```

### Scaling to 10,000 Users

```
Users: 10,000
Database: 5GB (Supabase Pro: $25/month)
Hosting: Vercel Pro ($20/month)
Cost: $45/month
Revenue: $100,000 (10,000 × $10)
Profit Margin: 99.96%
```

### Scaling to 100,000+ Users

```
Users: 100,000+
Database: Multiple instances, read replicas
Hosting: Vercel Enterprise
Additional: CDN, caching layer (Redis)
Cost: $500-1000/month
Revenue: $1,000,000
Profit Margin: 99.9%
```

## Monitoring & Observability

### Error Tracking
- Vercel Logs for API errors
- Client-side error boundaries
- Stripe webhook failure alerts

### Performance Monitoring
- Vercel Analytics for page load times
- Database query performance (Supabase dashboard)
- API endpoint response times

### Business Metrics
- User registrations
- Payment conversion rate
- Question completion rate
- User retention

## Disaster Recovery

### Database Backups
- **Automatic:** Daily backups (Supabase)
- **Retention:** 7 days on free tier, 30 days on Pro
- **Point-in-time Recovery:** Available on Pro tier

### Data Loss Prevention
- **RLS Policies:** Prevent unauthorized deletions
- **Soft Deletes:** Consider implementing for critical data
- **Audit Logs:** Track all database changes (future)

### Incident Response
1. Detect issue (monitoring alerts)
2. Assess impact (how many users affected?)
3. Communicate with users (status page)
4. Fix issue (rollback or hotfix)
5. Post-mortem (prevent recurrence)

## Conclusion

This architecture is designed to:
1. **Start simple** - Monolithic Next.js app
2. **Scale incrementally** - Add complexity only when needed
3. **Keep costs low** - Leverage free tiers and serverless
4. **Maintain quality** - Strong typing, testing, monitoring

The architecture can support 10,000+ users without major changes, providing a solid foundation for growth.