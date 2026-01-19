# API Documentation

## Overview

All API endpoints are serverless functions deployed on Vercel. They follow RESTful conventions and return JSON responses.

**Base URL (Development):** `http://localhost:3000/api`  
**Base URL (Production):** `https://yourdomain.com/api`

---

## Authentication

Most endpoints require authentication via JWT token stored in httpOnly cookie.

### Headers
```http
Cookie: sb-access-token=<jwt_token>
Content-Type: application/json
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Please log in to access this resource"
}
```

---

## API Endpoints

### Authentication

#### Register User
Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "created_at": "2025-01-18T10:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1737187200
  }
}
```

**Errors:**
- `400` - Email already exists
- `400` - Invalid email format
- `400` - Password too weak

---

#### Login User
Authenticate existing user.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1737187200
  }
}
```

**Errors:**
- `401` - Invalid email or password

---

#### Logout User
End user session.

```http
POST /api/auth/logout
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Payment

#### Create Checkout Session
Create Stripe checkout session for $10 payment.

```http
POST /api/payment/create-checkout
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

**Errors:**
- `401` - Unauthorized (not logged in)
- `400` - User already has active payment

---

#### Verify Payment Status
Check if user has completed payment.

```http
GET /api/payment/verify
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "hasPaid": true,
  "payment": {
    "id": 1,
    "amount": 1000,
    "status": "completed",
    "created_at": "2025-01-18T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized

---

#### Stripe Webhook
Handle Stripe payment events.

```http
POST /api/payment/webhook
```

**Headers:**
```http
Stripe-Signature: t=1234567890,v1=abcdef...
```

**Request Body:** (Stripe sends this)
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
      "payment_status": "paid",
      "metadata": {
        "userId": "123e4567-e89b-12d3-a456-426614174000"
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

---

### Questions

#### Get Questions
Fetch questions with optional filtering.

```http
GET /api/questions?exam_type=CPA&category=Financial%20Accounting&limit=20&offset=0
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Query Parameters:**
- `exam_type` (optional): `CPA` | `CFA` | `FE`
- `category` (optional): String (e.g., "Financial Accounting")
- `limit` (optional): Number (default: 20, max: 100)
- `offset` (optional): Number (default: 0)

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": 1,
      "exam_type": "CPA",
      "category": "Financial Accounting",
      "question_text": "What is the primary purpose of GAAP?",
      "option_a": "To maximize profits",
      "option_b": "To ensure consistency in financial reporting",
      "option_c": "To minimize taxes",
      "option_d": "To eliminate all accounting errors",
      "difficulty": "medium",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

**Note:** `correct_answer` and `explanation` are NOT included in list view. They're only returned after submission.

**Errors:**
- `401` - Unauthorized (not logged in)
- `403` - Payment required (user hasn't paid)
- `400` - Invalid exam_type

---

#### Get Single Question
Fetch detailed question with all fields.

```http
GET /api/questions/1
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "exam_type": "CPA",
  "category": "Financial Accounting",
  "question_text": "What is the primary purpose of GAAP?",
  "option_a": "To maximize profits",
  "option_b": "To ensure consistency in financial reporting",
  "option_c": "To minimize taxes",
  "option_d": "To eliminate all accounting errors",
  "difficulty": "medium",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Payment required
- `404` - Question not found

---

#### Submit Answer
Submit answer and get correct answer + explanation.

```http
POST /api/questions/submit
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionId": 1,
  "selectedAnswer": "B",
  "mode": "practice"
}
```

**Response (200 OK):**
```json
{
  "isCorrect": true,
  "correctAnswer": "B",
  "explanation": "GAAP (Generally Accepted Accounting Principles) ensures consistency and comparability in financial reporting across organizations...",
  "userAnswer": {
    "id": 123,
    "question_id": 1,
    "selected_answer": "B",
    "is_correct": true,
    "answered_at": "2025-01-18T10:30:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Payment required
- `400` - Invalid question ID or answer
- `404` - Question not found

---

### Exam

#### Start Timed Exam
Create a new timed exam session.

```http
POST /api/exam/start
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "examType": "CPA",
  "questionCount": 50,
  "timeLimit": 3600
}
```

**Response (201 Created):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "examType": "CPA",
  "questionCount": 50,
  "timeLimit": 3600,
  "questions": [
    {
      "id": 1,
      "question_text": "What is...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "..."
    }
  ],
  "startTime": "2025-01-18T10:00:00Z",
  "endTime": "2025-01-18T11:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Payment required
- `400` - Invalid parameters

---

#### Submit Exam
Submit completed timed exam.

```http
POST /api/exam/submit
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "answers": [
    {
      "questionId": 1,
      "selectedAnswer": "B"
    },
    {
      "questionId": 2,
      "selectedAnswer": "C"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalQuestions": 50,
  "correctAnswers": 42,
  "scorePercentage": 84.0,
  "completedAt": "2025-01-18T10:45:00Z",
  "results": [
    {
      "questionId": 1,
      "questionText": "What is...",
      "selectedAnswer": "B",
      "correctAnswer": "B",
      "isCorrect": true,
      "explanation": "..."
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Payment required
- `400` - Invalid session ID or answers
- `404` - Session not found

---

### User

#### Get User Profile
Fetch current user's profile information.

```http
GET /api/user/profile
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "hasPaid": true,
  "createdAt": "2025-01-18T10:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized

---

#### Get Answer History
Fetch user's answer history.

```http
GET /api/user/history?limit=50&offset=0
```

**Headers:**
```http
Cookie: sb-access-token=<jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number (default: 50, max: 100)
- `offset` (optional): Number (default: 0)

**Response (200 OK):**
```json
{
  "answers": [
    {
      "id": 123,
      "question_id": 1,
      "question_text": "What is...",
      "selected_answer": "B",
      "correct_answer": "B",
      "is_correct": true,
      "mode": "practice",
      "answered_at": "2025-01-18T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Errors:**
- `401` - Unauthorized

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {} // Optional additional information
}
```

### Common Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `400` | Bad Request | Invalid input or malformed request |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Authenticated but not authorized (e.g., no payment) |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |

---

## Rate Limiting

**Current limits:**
- Authentication endpoints: 10 requests/minute
- Payment endpoints: 5 requests/minute
- Question endpoints: 100 requests/minute
- Other endpoints: 60 requests/minute

**Rate limit headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1737187200
```

---

## Webhook Events

### Stripe Webhooks

The application listens for these Stripe events:

1. **checkout.session.completed**
   - Triggered when user completes payment
   - Updates `user_payments` table
   - Sets status to `completed`

2. **payment_intent.payment_failed**
   - Triggered when payment fails
   - Updates status to `failed`
   - Sends notification to user (future)

---

## Development Notes

### Testing API Endpoints

Use `curl` or Postman for testing:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Login (saves cookie automatically)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get questions (using saved cookie)
curl http://localhost:3000/api/questions?exam_type=CPA \
  -b cookies.txt
```

### API Versioning (Future)

When breaking changes are needed:
- `/api/v2/questions` (new version)
- `/api/questions` (v1, deprecated)
- Maintain both for 6 months

---

## Security Considerations

1. **Authentication:** All protected endpoints verify JWT token
2. **Authorization:** RLS policies enforce database-level access control
3. **Input Validation:** All inputs validated and sanitized
4. **Rate Limiting:** Prevents abuse and DDoS
5. **HTTPS Only:** All production traffic encrypted
6. **CORS:** Restricted to app domain only

---

**Last Updated:** January 18, 2025  
**API Version:** 1.0