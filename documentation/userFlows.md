# User Flows — Source of Truth

Canonical reference for every user flow in the app. **Consult this file before debugging any issue**, and verify the affected flow end-to-end with Playwright MCP against the steps documented here. Update the `Status` line of a flow whenever it is re-verified or found broken.

## Running locally

```bash
npm run dev   # http://localhost:3000
```

**Test accounts** (hosted Supabase dev project):

| Account | Password | Access |
|---|---|---|
| `admin@gmail.com` | `Admin@123` | Paid (Pro) |
| `test2@gmail.com` | `Admin@123` | Free tier |
| `alice/bob/carol/david/eva.test@examprep.dev` | `TestPass123!` | Seeded via `scripts/seed-test-users.mjs` (alice/carol/eva Pro; bob/david free) |

**Local constraints:**

- Stripe keys in `.env.local` are placeholders → checkout cannot complete locally. Full payment testing needs real `sk_test_`/`pk_test_` keys + `stripe listen --forward-to localhost:3000/api/stripe/webhook` + card `4242 4242 4242 4242`.
- Registration requires email confirmation (real inbox or Supabase dashboard confirm).
- The free-question limit (15/course) is enforced client-side only.
- XP/badge awards are best-effort and non-blocking — a failed award never blocks exam submission.

## Known bugs (found via Playwright walkthrough, 2026-07-05 — pending fix)

1. **CRITICAL — Timed exam submission always fails.** `app/timed-exam/[sessionId]/page.tsx:148` inserts `selected_answer: 'unattempted'` for skipped questions and lowercase option keys for answered ones; the DB check constraint `user_answers_selected_answer_check` only accepts `'A'–'D'`. The `exam_sessions` row is inserted *before* the failing `user_answers` insert, leaving orphaned sessions (visible in history with data but an empty review page), and the modal's Retry re-inserts the same session id (duplicate key). Raw DB error text is shown to the user.
2. **Question Bank answers never save.** `app/questions/[id]/QuestionViewClient.tsx:35` passes the lowercase option key to `saveUserAnswer()` → same constraint violation, silent (UI still says "Correct!", console 400). Practice mode works because `PracticeSessionUI.tsx:415` calls `.toUpperCase()` and only inserts attempted questions.
3. **`conversation_reads` table missing from live DB** — 404 on every page load (sidebar unread-count hook), 3× on `/lobby` where the upsert also fails. Unread tracking is dead sitewide.
4. **Question detail prev/next inverted.** `/questions` lists by descending ID but `/questions/[id]` navigates ascending: on "Question 1 of 40" Next is disabled and Previous moves *forward* to Question 2.
5. **Practice header shows "Question 1 of " forever** — current-question counter stuck at 1 and total missing (`/practice/[id]`).
6. **"CPA Accounting" lobby room** — leftover from the CPA→CMA rename in `lobby_rooms` data.
7. **CFA course is sold but has 0 questions** in the dev DB; courses page shows "0 of 0 questions free", and CFA is absent from question/practice/exam filters.
8. Minor: question links on `/questions` open in a new tab; closed slide-in sidebars (practice stats, exam map) stay in the accessibility tree while off-screen.

## Route map

| Route | Purpose | Guard |
|---|---|---|
| `/` | Landing page; redirects authed users → `/dashboard` | public |
| `/login` | Email/password + Google OAuth; authed users → `/courses` | public |
| `/register` | Signup with username, password strength meter | public |
| `/forgot-password` | Sends password-reset email | public |
| `/reset-password` | Sets new password from reset link | public |
| `/dashboard` | Stats, daily goal, XP bar, badges, recent sessions | auth |
| `/courses` | Course catalog, purchase entry, Pro indicators | auth |
| `/checkout` | Cart review → Stripe checkout | auth |
| `/questions` | Question bank browser with filters + pagination | auth |
| `/questions/[id]` | Single question fullscreen with prev/next | auth |
| `/practice` | Practice setup (exam type or starred mode) | auth |
| `/practice/[id]` | Practice answer loop with instant feedback | auth |
| `/practice/results` | Practice session results | auth |
| `/timed-exam` | Exam setup (type, count 1–50) | auth |
| `/timed-exam/[sessionId]` | Fullscreen timed exam session | auth |
| `/timed-exam/results` | Exam score/time breakdown | auth |
| `/timed-exam/[sessionId]/review` | Per-question exam review | auth |
| `/history` | All sessions, filterable by mode/exam | auth |
| `/history/[sessionId]/review` | Practice session review | auth |
| `/lobby` | Real-time chat: rooms, DMs, presence | auth |
| `/settings` | Profile + Preferences tabs | auth |
| `/badges` | Full badge gallery (20 badges) | auth |
| `/feedback` | Star rating + suggestion form | auth |

**API routes:** `POST /api/stripe/checkout` (create session), `GET /api/stripe/verify` (post-payment fallback grant), `POST /api/stripe/webhook` (payment grant), `GET /api/me/pro` (Pro status), `POST /api/lobby/bots` (cron bot messages), `GET /auth/callback` (OAuth/email-confirm exchange).

**Auth guard:** `middleware.ts` does a cookie-presence check only (`-auth-token`) — unauthenticated hits on protected routes redirect to `/login?redirectedFrom=…`; authed users are pushed away from `/login`/`/register` to `/courses`. Real authorization happens server-side per page via `supabase.auth.getUser()`.

---

## Flow 1: Registration → email verify → first login

**Steps:**
1. `/register` → fill email, username, password (8+ chars, capital, number, special; zxcvbn ≥ 3; confirm must match).
2. Submit → `supabase.auth.signUp()` with username metadata → "Verify your email" popup.
3. Click link in email → `/auth/callback` exchanges code, sets `last_seen_at` → redirects to `/courses`.
4. Alternative: "Continue with Google" → OAuth → `/auth/callback` → `/courses`.

**Key files:** `components/auth/registerForm.tsx`, `app/auth/callback/route.ts`
**Data:** `auth.users`, `user_profiles`
**Guards & edge cases:** duplicate email error; weak password blocked client-side; unconfirmed email can't sign in.
**Status:** ⚠️ partial 2026-07-05 — authed users correctly redirected away from `/register`; full signup + email-confirm loop needs a real inbox (form validation covered by Jest tests).

## Flow 2: Login / logout / redirects

**Steps:**
1. `/login` → email + password → `signInWithPassword()` → marks user online → redirect to `redirectedFrom` param or `/dashboard`.
2. Visiting any protected route unauthenticated → `/login?redirectedFrom=<route>`.
3. Visiting `/login` or `/register` while authed → `/courses`.
4. Logout (sidebar/menu) → session cleared → protected routes redirect to `/login`.
5. Forgot password: `/forgot-password` → email → `/reset-password` → new password → auto-redirect `/login` after ~2.5s.

**Key files:** `components/auth/loginForm.tsx`, `middleware.ts`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
**Data:** `auth.users`, `user_profiles.last_seen_at`
**Guards & edge cases:** wrong credentials show inline error; expired reset token errors only on submit.
**Status:** ✅ verified 2026-07-05 — login (both accounts), logout, `redirectedFrom` honored, protected-route redirect, authed-away-from-`/login|/register` all work.

## Flow 3: Course purchase (Stripe)

**Steps:**
1. `/courses` → "Buy Pro Access" on a course card → added to cart (localStorage via `CartContext`) → `/checkout`.
2. `/checkout` shows line items + total (CMA $59, CFA $49, FE $49 — `COURSE_PRICES_CENTS` in `lib/utils/constants.ts`).
3. "Complete Purchase" → `POST /api/stripe/checkout` → creates/reuses Stripe customer, session metadata carries `supabase_user_id` + courses → redirect to Stripe hosted checkout.
4. Payment success → redirect `/courses?success=true&session_id=…&courses=…`.
5. `CoursesClient` calls `GET /api/stripe/verify?session_id=…` (fallback if webhook is slow) → grants `course_subscriptions` rows + `user_profiles.is_premium=true` → success banner, cart cleared, course card shows Pro.
6. In parallel, `POST /api/stripe/webhook` (`checkout.session.completed`) does the same grant.

**Key files:** `components/subscription/CoursesClient.tsx`, `app/checkout/page.tsx`, `app/api/stripe/{checkout,verify,webhook}/route.ts`
**Data:** `course_subscriptions`, `user_profiles.stripe_customer_id/is_premium/premium_purchased_at`
**Guards & edge cases:** already-owned courses filtered out of checkout; invalid course codes rejected; cancel returns to `/checkout` with cart intact.
**Status:** ⚠️ partial 2026-07-05 — cart add/remove/persist and checkout page work; `POST /api/stripe/checkout` returns 500 with placeholder keys and the UI shows a graceful "Checkout failed". Payment + grant untestable locally without real test keys + `stripe listen`.

## Flow 4: Question bank browsing

**Steps:**
1. `/questions` → filter by exam type, category, difficulty → paginated list (10/page), attempted questions marked.
2. Click a question → `/questions/[id]` fullscreen view with prev/next navigation (ordered by ID).

**Key files:** `app/questions/page.tsx`, `app/questions/[id]/page.tsx`
**Data:** `questions`, `user_answers` (attempted marks), `course_subscriptions`
**Guards & edge cases:** non-Pro users hit `PaywallBanner` at 15 answered per course; `RunningLowBanner` warns at ~10.
**Status:** ❌ broken 2026-07-05 — browsing/filters/pagination fine, but answer saves fail silently (bug #2) and prev/next are inverted (bug #4); question links open a new tab (bug #8). Paywall not exercised (free account under limit).

## Flow 5: Practice session

**Steps:**
1. `/practice` → pick exam type (CMA/CFA/FE/all) or toggle "Practice Starred Questions" (starred IDs fetched → sessionStorage `starred_ids_<sessionId>`).
2. "Start" → UUID sessionId → `/practice/[id]?exam=…&session=…(&starred=…)`.
3. Select option → "Check Answer" → instant correct/incorrect feedback + explanation → XP toast (+10 correct / +2 wrong).
4. Each answer logged to `user_answers` (`mode: 'practice'`); session log appended to sessionStorage across prev/next navigation.
5. "Finish" → `/practice/results?session=…` → score, %, time, unanswered; link to review.

**Key files:** `app/practice/page.tsx`, `app/practice/[id]/page.tsx`, `app/practice/results/page.tsx`, `lib/gamification/xpEngine.ts`
**Data:** `user_answers`, `exam_sessions`, `user_xp`, `xp_transactions`, `starred_questions`
**Guards & edge cases:** free-limit paywall before start; starred mode navigates only within starred IDs; session log lost if sessionStorage cleared.
**Status:** ✅ verified 2026-07-05 — setup, correct/incorrect feedback, session log persistence, Save & End confirmation, results page, XP award (+12 observed) all work. Cosmetic: header counter stuck at "Question 1 of " (bug #5).

## Flow 6: Timed exam

**Steps:**
1. `/timed-exam` → pick exam type + question count (slider 20–100, step 5, default 20); duration = count × 1.5 min.
2. "Start Exam" → `/timed-exam/[sessionId]?type=…&count=…` → pre-exam screen (warns if fewer questions available than requested).
3. "Start Exam Now" → fullscreen enforced, timer counts down (persisted to localStorage every 5s), DevTools/copy/right-click blocked.
4. Navigate questions, select answers; timer hits 0 → auto-submit, or manual "Submit Exam".
5. Submit: exits fullscreen, scores answers, inserts `exam_sessions` row + all `user_answers`, batch-awards XP (+10/correct, +2/wrong, +50 completion, +100 perfect), checks badges (non-blocking).
6. → `/timed-exam/results?session=…` → score, time spent vs allowed → "Review Answers" → `/timed-exam/[sessionId]/review` (per-question answers + explanations).

**Key files:** `app/timed-exam/page.tsx`, `app/timed-exam/[sessionId]/page.tsx`, `app/timed-exam/results/page.tsx`, `app/timed-exam/[sessionId]/review/page.tsx`, `lib/gamification/{xpEngine,badgeEngine}.ts`
**Data:** `exam_sessions`, `user_answers`, `user_xp`, `xp_transactions`, `user_achievements`
**Guards & edge cases:** paywall for non-Pro over free limit; exiting fullscreen/leaving mid-exam is discouraged via beforeunload (fires a browser confirm) but not fully prevented; stale localStorage timer if user returns later.
**Status:** ✅ verified 2026-07-06 — full end-to-end confirmed after fix: setup → pre-exam → timer → answer Q1 → skip 19 → finish confirmation → submit → results page (1/20, 5%, 0m 57s) → review page. Zero console errors.

## Flow 7: History & review

**Steps:**
1. `/history` → summary bar (total sessions, avg accuracy, total time) → session list filterable by mode (practice/timed/all) + exam type.
2. Click a session → practice: `/history/[sessionId]/review`; timed: `/timed-exam/[sessionId]/review` → per-question review with explanations.

**Key files:** `app/history/page.tsx`, `app/history/[sessionId]/review/page.tsx`
**Data:** `exam_sessions`, `user_answers` joined to `questions`
**Guards & edge cases:** empty state when no sessions; review of another user's session must not load (RLS).
**Status:** ✅ verified 2026-07-05 — summary bar, filters, session list, and practice review (score card, correct/incorrect filter chips, expandable questions) work. Note: orphaned timed sessions from bug #1 show "No questions in this category" with all-zero chips.

## Flow 8: Dashboard & gamification

**Steps:**
1. `/dashboard` → greeting, streak badge (if >0), daily-goal card (20 q/day) with progress, stats grid (answered/accuracy/practice/timed), XP progress bar with level, badge shelf, 5 recent sessions, quick-action cards; premium banner if non-Pro.
2. XP: +10 correct, +2 wrong, +50 exam complete, +100 perfect — level via `computeLevel()` (`100 × level^1.8` thresholds, max 50).
3. Badges: 20 static definitions (`BADGE_DEFINITIONS`) — milestones, streaks, perfect scores, per-exam firsts. `BadgeModal` pops on new earn; `/badges` shows full gallery with locked/unlocked states.

**Key files:** `app/dashboard/page.tsx`, `hooks/useUserStats.ts`, `lib/gamification/{constants,xpEngine,badgeEngine}.ts`, `app/badges/page.tsx`, `lib/supabase/queries/userStats.ts`
**Data:** `user_xp`, `xp_transactions`, `user_achievements`, `exam_sessions`, `user_answers`
**Guards & edge cases:** stats degrade to zeros on missing data (never throw); streak computed backward day-by-day in UTC.
**Status:** ✅ verified 2026-07-05 — dashboard stats, XP bar (updates after practice), badge shelf, recent tests, quick actions, and `/badges` gallery (10 earned / 10 locked) all render correctly. `conversation_reads` 404 fires here too (bug #3).

## Flow 9: Lobby (real-time chat)

**Steps:**
1. `/lobby` → loads rooms (grouped by exam type), user profile, marks user online → sidebar (desktop) / tab bar (mobile).
2. Click room → message history + Supabase Realtime subscription → type + send → insert into `lobby_messages` (`message_type: 'room'`); messages stream live.
3. Click a user → DM conversation (paired sender/recipient filter, `message_type: 'dm'`), own realtime subscription.
4. Presence: online = `last_seen_at` within threshold; updated on login and message send.
5. Bots: `POST /api/lobby/bots` (Vercel cron) posts scripted messages from `user_profiles` where `is_bot=true` per `bot_script` JSON.

**Key files:** `app/lobby/page.tsx`, `components/lobby/*`, `hooks/{useLobbyPresence,useLobbyMessages,useDMMessages}.ts`, `lib/supabase/queries/lobbyQueries.ts`, `app/api/lobby/bots/route.ts`
**Data:** `lobby_rooms` (keyed by `slug`), `lobby_messages`, `user_profiles`
**Guards & edge cases:** realtime reconnect after tab sleep; malformed `bot_script` has no schema validation.
**Status:** ✅ verified 2026-07-05 — rooms list, room search, message history, real-time send/render, DM list, online users, bot profiles all work. Unread tracking dead (bug #3); "CPA Accounting" room needs rename (bug #6).

## Flow 10: Settings

**Steps:**
1. `/settings` → **Profile** tab: edit username, full name, avatar (upload → Supabase Storage → public URL), exam type, bio → save updates `user_profiles`.
2. Change password section: new password (8+, confirmation match) → `updateUser({ password })`.
3. **Preferences** tab: lobby exam type + toggles → save.
4. Pro status shown via `GET /api/me/pro`.

**Key files:** `app/settings/page.tsx`, `app/api/me/pro/route.ts`
**Data:** `user_profiles`, Supabase Storage (avatars)
**Guards & edge cases:** changes must reflect in lobby/dashboard immediately after save.
**Status:** ✅ verified 2026-07-06 — profile save persists (bio round-trip confirmed), password validation (mismatch + same-password errors surface correctly), lobby preference save persists (Finance → Accounting confirmed after reload). Avatar upload not exercised (file picker).

## Flow 11: Feedback

**Steps:**
1. `/feedback` → pick 1–5 star rating + optional suggestion text → submit → row in `user_feedback` → confirmation state.

**Key files:** `app/feedback/page.tsx`
**Data:** `user_feedback`
**Status:** ✅ verified 2026-07-06 — 4-star rating + text submission succeeds; "🎉 Thank you!" confirmation state renders correctly.
