# User Flows - Exam Prep Platform

This document outlines all user journeys through the application, from landing page to studying questions.

---

## Table of Contents

1. [Primary User Flow (Happy Path)](#primary-user-flow-happy-path)
2. [Alternative User Flows](#alternative-user-flows)
3. [Detailed Flow Diagrams](#detailed-flow-diagrams)
4. [Edge Cases & Error Flows](#edge-cases--error-flows)

---

## Primary User Flow (Happy Path)

### Overview: New User → Paid User → Active Studier

```
Landing Page
    ↓
Register Account
    ↓
Payment ($10)
    ↓
Browse Questions
    ↓
Practice Mode / Timed Exam Mode
    ↓
View Results & Explanations
```

---

## Flow 1: New User Registration & Payment

### Visual Flow:

```
┌─────────────────┐
│  Landing Page   │  ← User arrives (Google search, social media, etc.)
│                 │
│  [Get Started]  │
└────────┬────────┘
         │ Click "Get Started"
         ↓
┌─────────────────┐
│ Registration    │  ← User sees registration form
│   Page          │
│                 │
│ Email: _______  │
│ Password: _____ │
│                 │
│ [Create Account]│
└────────┬────────┘
         │ Submit form
         ↓
┌─────────────────┐
│ Account Created │  ← Backend creates user in Supabase
│                 │     Session cookie set
│ "Welcome!"      │
└────────┬────────┘
         │ Auto-redirect (2 seconds)
         ↓
┌─────────────────┐
│ Payment Page    │  ← User must pay before accessing content
│                 │
│ Unlock Access   │
│ $10 one-time    │
│                 │
│ [Pay with Card] │
└────────┬────────┘
         │ Click "Pay"
         ↓
┌─────────────────┐
│ Stripe Checkout │  ← User redirected to Stripe's hosted page
│                 │     (Secure payment processing)
│ Card Details    │
│ [Pay $10.00]    │
└────────┬────────┘
         │ Payment successful
         ↓
┌─────────────────┐
│ Payment Success │  ← Stripe redirects back to our site
│                 │     Webhook updates database
│ "Payment        │
│  Confirmed!"    │
│                 │
│ [Start Studying]│
└────────┬────────┘
         │ Click "Start Studying"
         ↓
┌─────────────────┐
│ Questions Page  │  ← User can now access questions
│                 │
│ Filter: [CPA ▼] │
│                 │
│ [Practice Mode] │
│ [Timed Exam]    │
└─────────────────┘
```

### Detailed Steps:

#### Step 1: Landing Page
**What user sees:**
- Hero section: "Master Your Professional Exams for Just $10"
- Value propositions: "100+ practice questions", "Detailed explanations", "Timed exam mode"
- Call-to-action button: "Get Started"

**User action:** Click "Get Started"

**Backend:** None (static page)

**Next step:** Registration page

---

#### Step 2: Registration Page
**URL:** `/register`

**What user sees:**
- Form with:
  - Email input
  - Password input (with strength indicator)
  - "Create Account" button
- Link: "Already have an account? Log in"

**User action:** 
- Enter email (e.g., `john@example.com`)
- Enter password (minimum 8 characters)
- Click "Create Account"

**Frontend validation:**
- Email format valid
- Password meets requirements
- Show loading spinner

**Backend (API call):**
```
POST /api/auth/register
Body: { email, password }
  ↓
Supabase creates user in auth.users table
  ↓
Returns session token
  ↓
Frontend stores session cookie
```

**Success:**
- Show success message: "Account created!"
- Auto-redirect to payment page (2 seconds)

**Error handling:**
- Email already exists → "This email is already registered. Please log in."
- Weak password → "Password must be at least 8 characters"
- Network error → "Something went wrong. Please try again."

**Next step:** Payment page

---

#### Step 3: Payment Page
**URL:** `/payment/checkout`

**What user sees:**
- Heading: "Unlock Full Access"
- Price: "$10 - One-time payment"
- Benefits list:
  - ✓ 100+ practice questions
  - ✓ Detailed explanations
  - ✓ Timed exam mode
  - ✓ Lifetime access
- "Pay with Card" button (Stripe)

**User action:** Click "Pay with Card"

**Backend (API call):**
```
POST /api/payment/create-checkout
  ↓
Creates Stripe Checkout Session
  ↓
Returns checkout URL
  ↓
Frontend redirects to Stripe
```

**User experience:**
- Redirected to Stripe's secure payment page
- Enters card details (Stripe handles this)
- Clicks "Pay $10.00"

**Stripe processes payment:**
- If successful → Redirects to `/payment/success`
- If failed → Shows error, allows retry

**Webhook (background):**
```
Stripe sends webhook to /api/payment/webhook
  ↓
Webhook updates user_payments table
  ↓
Sets status = 'completed'
```

**Next step:** Payment success page

---

#### Step 4: Payment Success Page
**URL:** `/payment/success`

**What user sees:**
- Success icon (checkmark)
- Message: "Payment Confirmed! 🎉"
- Sub-message: "You now have full access to all questions"
- "Start Studying" button

**User action:** Click "Start Studying"

**Backend:** None (just navigation)

**Next step:** Questions browser

---

#### Step 5: Questions Browser
**URL:** `/questions`

**What user sees:**
- Filter dropdown: "Exam Type: [CPA ▼]"
- Category filter: "Category: [All ▼]"
- Two big buttons:
  - "Practice Mode" (browse freely)
  - "Timed Exam Mode" (simulated exam)
- Question count: "150 questions available"

**User action:** Choose a study mode

**Backend (on page load):**
```
GET /api/questions?exam_type=CPA
  ↓
Check user authentication (session cookie)
  ↓
Check payment status (RLS policy in Supabase)
  ↓
Return questions if paid
```

**Next step:** Practice Mode OR Timed Exam Mode

---

## Flow 2: Practice Mode (Untimed Study)

### Visual Flow:

```
┌─────────────────┐
│ Questions Page  │
│                 │
│ [Practice Mode] │ ← User clicks this
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Practice Mode   │  ← Shows one question at a time
│                 │
│ Question #1     │
│                 │
│ What is GAAP?   │
│                 │
│ ○ A) ...        │
│ ○ B) ...        │
│ ○ C) ...        │
│ ○ D) ...        │
│                 │
│ [Submit Answer] │
└────────┬────────┘
         │ User selects B, clicks Submit
         ↓
┌─────────────────┐
│ Answer Result   │  ← Shows if correct/incorrect
│                 │
│ ✓ Correct!      │     OR    │ ✗ Incorrect     │
│                 │           │                 │
│ The answer is B │           │ Correct: B      │
│                 │           │ You selected: C │
│                 │           │                 │
│                 │           │ Explanation:    │
│                 │           │ GAAP ensures... │
│                 │           │                 │
│ [Next Question] │           │ [Next Question] │
└────────┬────────┘           └────────┬────────┘
         │                             │
         └─────────────┬───────────────┘
                       ↓
                 ┌─────────────────┐
                 │ Question #2     │  ← Repeat cycle
                 └─────────────────┘
```

### Detailed Steps:

#### Step 1: Enter Practice Mode
**URL:** `/practice`

**What user sees:**
- Progress indicator: "Question 1 of 20"
- Question text
- 4 multiple choice options (A, B, C, D)
- "Submit Answer" button (disabled until option selected)
- "Next Question" button (appears after answering)

**User action:** 
- Read question
- Select an option (radio button)
- Click "Submit Answer"

**Frontend:**
- Disable option selection after submit
- Show loading state

**Backend (API call):**
```
POST /api/questions/submit
Body: { questionId: 1, selectedAnswer: 'B', mode: 'practice' }
  ↓
Validate user is authenticated
  ↓
Check user has paid
  ↓
Save answer to user_answers table
  ↓
Return: { isCorrect: true/false, correctAnswer, explanation }
```

**Response handling:**

**If correct:**
- Show green checkmark: "✓ Correct!"
- Show correct answer: "The answer is B"
- Do NOT show explanation (user got it right)

**If incorrect:**
- Show red X: "✗ Incorrect"
- Show correct answer: "Correct answer: B"
- Show what user selected: "You selected: C"
- Show detailed explanation: "GAAP (Generally Accepted Accounting Principles)..."

**User action:** Click "Next Question"

**Next step:** Load next question, repeat cycle

---

## Flow 3: Timed Exam Mode (Simulated Exam)

### Visual Flow:

```
┌─────────────────┐
│ Questions Page  │
│                 │
│ [Timed Exam]    │ ← User clicks this
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Exam Setup      │  ← User configures exam
│                 │
│ Exam Type:      │
│ [CPA ▼]         │
│                 │
│ # Questions:    │
│ [50 ▼]          │
│                 │
│ Time Limit:     │
│ 60 minutes      │
│                 │
│ [Start Exam]    │
└────────┬────────┘
         │ Click "Start Exam"
         ↓
┌─────────────────┐
│ Exam In Progress│  ← Timer counts down
│                 │
│ Time: 59:42 ⏱️   │
│ Question 1/50   │
│                 │
│ Question text   │
│                 │
│ ○ A) ...        │  ← User CANNOT see answer after submit
│ ○ B) ...        │     Must complete all questions
│ ○ C) ...        │
│ ○ D) ...        │
│                 │
│ [Next Question] │
└────────┬────────┘
         │ User answers all 50 questions
         │ OR time runs out
         ↓
┌─────────────────┐
│ Exam Complete   │  ← Auto-submit when done
│                 │
│ Calculating...  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Exam Results    │  ← Shows score and review
│                 │
│ Your Score:     │
│ 42/50 (84%)     │
│                 │
│ ⭐⭐⭐⭐         │
│                 │
│ Time: 47:23     │
│                 │
│ [Review Answers]│
│ [Retake Exam]   │
└────────┬────────┘
         │ Click "Review Answers"
         ↓
┌─────────────────┐
│ Answer Review   │  ← Shows all questions with explanations
│                 │
│ Q1: ✓ Correct   │
│ Q2: ✗ Incorrect │  ← Can click to see explanation
│ Q3: ✓ Correct   │
│ ...             │
└─────────────────┘
```

### Detailed Steps:

#### Step 1: Exam Setup
**URL:** `/timed-exam`

**What user sees:**
- Exam configuration form:
  - Exam Type dropdown (CPA, CFA, FE)
  - Number of questions (20, 30, 50)
  - Time limit (auto-calculated based on # questions)
- "Start Exam" button
- Warning: "You cannot pause once started"

**User action:**
- Select exam type: "CPA"
- Select questions: "50"
- Click "Start Exam"

**Backend (API call):**
```
POST /api/exam/start
Body: { examType: 'CPA', questionCount: 50, timeLimit: 3600 }
  ↓
Validate user is authenticated and paid
  ↓
Generate random 50 questions from CPA pool
  ↓
Create exam session (UUID)
  ↓
Return: { sessionId, questions[], startTime, endTime }
```

**Frontend:**
- Stores session ID
- Starts countdown timer
- Loads first question

**Next step:** Exam in progress

---

#### Step 2: Taking the Exam
**URL:** `/timed-exam/[sessionId]`

**What user sees:**
- Timer at top: "59:42" (counts down)
- Progress: "Question 1 of 50"
- Question with 4 options
- Navigation buttons:
  - "Previous" (disabled on Q1)
  - "Next" (goes to next question)
  - "Submit Exam" (always visible)

**Key difference from Practice Mode:**
- User does NOT see if answer is correct immediately
- Must complete all questions before seeing results
- Can navigate back/forth between questions
- Can change answers before submitting

**User actions:**
- Answer questions
- Navigate between questions
- Submit when done OR timer runs out

**Frontend state management:**
```javascript
{
  sessionId: '550e8400...',
  answers: {
    1: 'B',
    2: 'C',
    3: 'A',
    // ... user's selections
  },
  currentQuestion: 15,
  timeRemaining: 3420  // seconds
}
```

**Auto-submit:**
- When timer reaches 0:00
- Frontend automatically calls submit API
- Shows "Time's up! Submitting exam..."

**Next step:** Exam submission

---

#### Step 3: Exam Submission
**User action:** Click "Submit Exam" OR timer expires

**Frontend:**
- Show confirmation dialog: "Submit exam? You have 15 unanswered questions."
- If user confirms or time expired:

**Backend (API call):**
```
POST /api/exam/submit
Body: { 
  sessionId: '550e8400...',
  answers: [
    { questionId: 1, selectedAnswer: 'B' },
    { questionId: 2, selectedAnswer: 'C' },
    // ... all answers
  ]
}
  ↓
Validate session exists and belongs to user
  ↓
For each answer:
  - Check if correct
  - Save to user_answers table with session_id
  ↓
Calculate score
  ↓
Return: {
  totalQuestions: 50,
  correctAnswers: 42,
  scorePercentage: 84,
  results: [
    { questionId, isCorrect, selectedAnswer, correctAnswer, explanation },
    // ... for all questions
  ]
}
```

**Next step:** Results page

---

#### Step 4: Exam Results
**URL:** `/timed-exam/[sessionId]/results`

**What user sees:**

**Summary card:**
- Big score: "42/50"
- Percentage: "84%"
- Star rating: ⭐⭐⭐⭐ (based on percentage)
- Time taken: "47 minutes 23 seconds"
- Date/time: "January 18, 2025 at 2:30 PM"

**Action buttons:**
- "Review Answers" → See all questions with explanations
- "Retake Exam" → Start new exam
- "Back to Dashboard" → Go to questions page

**User action:** Click "Review Answers"

**Next step:** Answer review

---

#### Step 5: Answer Review
**URL:** `/timed-exam/[sessionId]/review`

**What user sees:**
- List of all 50 questions with status:

```
Question 1: ✓ Correct
  [Collapsed - click to expand]

Question 2: ✗ Incorrect
  [Expanded automatically]
  Question: What is the accounting equation?
  Your answer: B) Assets = Liabilities
  Correct answer: A) Assets = Liabilities + Equity
  
  Explanation:
  The fundamental accounting equation states that...
  [full explanation text]

Question 3: ✓ Correct
  [Collapsed]

...
```

**User actions:**
- Scroll through results
- Click to expand/collapse questions
- Read explanations for incorrect answers

**Backend:** None (data already loaded from results API)

---

## Flow 4: Returning User Login

### Visual Flow:

```
┌─────────────────┐
│  Landing Page   │
│                 │
│ [Login]         │ ← User clicks "Login" link
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Login Page     │
│                 │
│ Email: _______  │
│ Password: _____ │
│                 │
│ [Log In]        │
│                 │
│ Forgot password?│
└────────┬────────┘
         │ Submit credentials
         ↓
         ├─── Valid? ───┐
         │              │
         NO             YES
         │              │
         ↓              ↓
┌─────────────────┐  ┌─────────────────┐
│ Error Message   │  │ Login Success   │
│                 │  │                 │
│ "Invalid email  │  │ Setting up...   │
│  or password"   │  │                 │
│                 │  └────────┬────────┘
│ [Try Again]     │           │
└─────────────────┘           │
                              ↓
                        Has user paid?
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   YES                  NO
                    │                   │
                    ↓                   ↓
            ┌─────────────────┐  ┌─────────────────┐
            │ Questions Page  │  │ Payment Page    │
            │                 │  │                 │
            │ Welcome back!   │  │ Complete payment│
            └─────────────────┘  │ to continue     │
                                 └─────────────────┘
```

### Detailed Steps:

#### Step 1: Login Page
**URL:** `/login`

**What user sees:**
- Email input
- Password input
- "Log In" button
- "Forgot password?" link
- "Don't have an account? Sign up" link

**User action:**
- Enter email
- Enter password
- Click "Log In"

**Backend (API call):**
```
POST /api/auth/login
Body: { email, password }
  ↓
Supabase verifies credentials
  ↓
If valid:
  - Creates session
  - Returns session token
  - Frontend stores cookie
  ↓
If invalid:
  - Returns error
```

**Success:**
- Check payment status:
  - Has paid → Redirect to `/questions`
  - Has NOT paid → Redirect to `/payment/checkout`

**Error:**
- Show error: "Invalid email or password"
- Keep user on login page

---

## Flow 5: Password Reset

### Visual Flow:

```
┌─────────────────┐
│  Login Page     │
│                 │
│ [Forgot password?]│ ← User clicks this
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Reset Password  │
│                 │
│ Enter email:    │
│ ___________     │
│                 │
│ [Send Reset Link]│
└────────┬────────┘
         │ User enters email
         ↓
┌─────────────────┐
│ Email Sent      │
│                 │
│ "Check your     │
│  email for      │
│  reset link"    │
└─────────────────┘
         │
         ↓
    User checks email
         │
         ↓
┌─────────────────┐
│ Email Inbox     │ ← Supabase sends email
│                 │
│ [Reset Password]│ ← User clicks link in email
└────────┬────────┘
         │ Link goes to /reset-password?token=xxx
         ↓
┌─────────────────┐
│ New Password    │
│                 │
│ New password:   │
│ ___________     │
│                 │
│ Confirm:        │
│ ___________     │
│                 │
│ [Reset Password]│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Password Reset  │
│                 │
│ "Password       │
│  updated!"      │
│                 │
│ [Log In]        │
└─────────────────┘
```

---

## Alternative User Flows

### Scenario 1: User Tries to Access Questions Without Paying

```
User logs in
  ↓
Tries to visit /questions
  ↓
Middleware checks payment status
  ↓
Payment NOT found
  ↓
Redirect to /payment/checkout
  ↓
Show message: "Complete payment to access questions"
```

### Scenario 2: User Closes Tab During Exam

```
User starts timed exam
  ↓
Tab closed / Browser crashed
  ↓
User reopens site
  ↓
Logs in
  ↓
System detects incomplete exam session
  ↓
Show option: "You have an incomplete exam. Resume or start new?"
  ↓
If Resume: Load exam state, continue timer
If New: Archive old session, start fresh
```

### Scenario 3: Payment Fails

```
User on payment page
  ↓
Clicks "Pay with Card"
  ↓
Redirected to Stripe
  ↓
Card declined
  ↓
Stripe shows error
  ↓
User can:
  - Try different card
  - Cancel and return to site
  ↓
If canceled: Redirect to /payment/checkout
Show: "Payment was not completed. Please try again."
```

---

## Navigation Flow (Site Map)

```
/ (Landing Page)
│
├─ /register ──→ /payment/checkout ──→ /payment/success ──→ /questions
│                      ↑
├─ /login ─────────────┘
│
└─ /questions
      │
      ├─ /practice ──→ (Browse questions, immediate feedback)
      │
      └─ /timed-exam
            │
            ├─ /timed-exam (Setup)
            │
            ├─ /timed-exam/[sessionId] (Taking exam)
            │
            └─ /timed-exam/[sessionId]/results
                  │
                  └─ /timed-exam/[sessionId]/review
```

---

## User States & Permissions

### State 1: Anonymous User (Not Logged In)
**Can access:**
- ✅ Landing page (/)
- ✅ Register page (/register)
- ✅ Login page (/login)
- ✅ Password reset (/reset-password)

**Cannot access:**
- ❌ Questions (/questions)
- ❌ Practice mode
- ❌ Timed exam
- ❌ Payment success page

**Redirect behavior:**
- If tries to access protected page → Redirect to /login

---

### State 2: Logged In, Not Paid
**Can access:**
- ✅ Everything anonymous user can access
- ✅ Payment checkout page (/payment/checkout)

**Cannot access:**
- ❌ Questions (/questions)
- ❌ Practice mode
- ❌ Timed exam

**Redirect behavior:**
- If tries to access questions → Redirect to /payment/checkout

---

### State 3: Logged In, Paid (Full Access)
**Can access:**
- ✅ Everything!
- ✅ Questions browser
- ✅ Practice mode
- ✅ Timed exam mode
- ✅ All features

**Cannot access:**
- Nothing restricted

---

## Mobile vs Desktop Flow Differences

### Mobile Considerations:

**Landing Page:**
- Hamburger menu instead of horizontal nav
- Simplified hero section
- Call-to-action button more prominent

**Questions Browser:**
- Filters collapse into dropdown
- One question per screen (no sidebar)
- Swipe to next question (optional)

**Timed Exam:**
- Timer fixed at top (sticky)
- Question navigation as bottom sheet
- Larger tap targets for options

**Results Page:**
- Stack score cards vertically
- Scrollable answer review

---

## Session Management Flow

```
User logs in
  ↓
Session cookie set (expires in 7 days)
  ↓
Every page request:
  - Check if cookie exists
  - Validate with Supabase
  - Refresh if needed
  ↓
If session invalid/expired:
  - Clear cookie
  - Redirect to /login
  ↓
User stays logged in for 7 days
  ↓
Auto-logout after 7 days
```

---

## Summary: Key User Journeys

### Journey 1: First-Time User (Most Common)
```
Landing → Register → Payment → Questions → Practice Mode
Timeline: 5-10 minutes
```

### Journey 2: Returning User
```
Landing → Login → Questions → Practice/Timed Exam
Timeline: 1-2 minutes
```

### Journey 3: User Taking Timed Exam
```
Questions → Timed Exam Setup → Exam → Results → Review
Timeline: 60-90 minutes
```

---

**Next Document: UI/UX Wireframes →**

This user flow document should be used alongside the UI/UX wireframes to understand both the flow logic and visual design.