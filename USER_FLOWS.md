# User Flow Inventory — QA Checklist

Every user-facing flow in the application, derived from the actual routes, components, and API endpoints in this repo. Use this as the reference when testing: for each flow, verify **the UI behavior AND the resulting database state** — a flow is not "passing" until both check out.

Status legend: `[ ]` untested · `[~]` tested, issues found (link/describe) · `[x]` verified end-to-end

---

## 1. Authentication & Account

### 1.1 Registration
- [ ] Visit `/register` → fill form (`components/auth/registerForm.tsx`) → submit
- [ ] Password strength meter (zxcvbn) responds while typing; weak passwords handled per form rules
- [ ] Duplicate email / invalid input shows an error, does not create account
- [ ] Success path: Supabase user created; `user_profiles` row exists for the new user
- [ ] Email confirmation flow (if enabled): `/auth/callback` exchanges the code and lands the user in the app

### 1.2 Login / Logout
- [ ] Visit `/login` → valid credentials → redirected to authenticated area (post-login redirect target is correct)
- [ ] Invalid credentials → error message, stays on `/login`
- [ ] Authenticated user visiting `/login` or `/register` is redirected away (middleware)
- [ ] Logout clears session; protected routes redirect back to `/login`

### 1.3 Middleware route gating
- [ ] Unauthenticated access to each protected route redirects to `/login`: `/questions`, `/practice`, `/timed-exam`, `/dashboard`, `/lobby`, `/history`, `/courses`, `/settings`
- [ ] Note: middleware only checks cookie presence — confirm each protected page ALSO does a real `supabase.auth.getUser()` server- or client-side (a forged/stale cookie must not reach data)

### 1.4 Password reset
- [ ] `/forgot-password` → submit email → confirmation state shown
- [ ] Reset link → `/reset-password` → new password accepted → can log in with new password; old password rejected

---

## 2. Per-Course Access & Payments (Stripe)

### 2.1 Course catalog & paywall
- [ ] `/courses` (`CoursesClient.tsx`) lists CMA / CFA / FE with prices from `COURSE_PRICES_CENTS` (CMA $59, CFA $49, FE $49)
- [ ] Purchased course shows as owned; unpurchased shows buy CTA
- [ ] `PaywallBanner.tsx` appears where a user lacks access to a course's content, and not where they have access

### 2.2 Checkout
- [ ] Buy CTA → `POST /api/stripe/checkout` → Stripe Checkout session created with correct `course` in metadata and correct price
- [ ] `stripe_customer_id` is created once and reused on `user_profiles` (no duplicate Stripe customers on repeat purchases)
- [ ] `/checkout` page (`CheckoutClient.tsx`) renders and hands off to Stripe correctly
- [ ] Cancel path returns the user to the app without granting access

### 2.3 Webhook → access grant (requires Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] `checkout.session.completed` → `POST /api/stripe/webhook` verifies signature → `course_subscriptions` row created for the right `user_id` + `course`
- [ ] Bad/unsigned webhook payload is rejected (4xx), grants nothing
- [ ] Duplicate webhook delivery does not create duplicate subscription rows
- [ ] `GET /api/stripe/verify` post-payment verification path works (success page state)
- [ ] `GET /api/me/pro` returns correct access state for the user
- [ ] After grant: user can immediately access that course's questions; other courses remain gated

---

## 3. Question Bank

### 3.1 Browse & filter (`/questions`)
- [ ] Page requires auth; loads question list for courses the user owns
- [ ] Filters (`QuestionFilters.tsx`): exam type / topic / etc. change results correctly; "clear all filters" resets
- [ ] Pagination (`components/ui/Pagination.tsx`) works at boundaries (first/last page, single page)
- [ ] Question detail `/questions/[id]` renders stem, choices, and (post-answer) explanation
- [ ] User without the course cannot open that course's question by direct URL

### 3.2 Answering (`QuestionView.tsx`)
- [ ] Select answer → submit → correct/incorrect feedback + explanation shown
- [ ] DB: `user_answers` row written with correct question id, choice, correctness, mode
- [ ] XP: correct answer awards `answer_correct` XP; wrong answer awards `answer_wrong` XP; `user_xp` upserted; `xp_transactions` logged (see §6)
- [ ] Re-answering / navigation between questions (`Navigation.tsx`) keeps state consistent

### 3.3 Starring
- [ ] Star/unstar a question (`starredQueries.ts`) → `starred_questions` row created/removed
- [ ] Starred state persists across reload; starred filter/list shows the right set

---

## 4. Practice Mode

- [ ] `/practice` setup (`PracticeSetupForm.tsx`): must select an exam type — starting without one shows inline error, does not start
- [ ] Start → `/practice/[id]` session (`PracticeSessionUI.tsx`): per-question timer label, question number in header
- [ ] Answer flow: feedback + explanation per question; answers recorded in `user_answers` with practice mode
- [ ] Session end → `/practice/results` (`PracticeResultsUI.tsx`): score/summary matches the answers actually given
- [ ] Print session works
- [ ] XP for the session awarded per rules (batch via `batchAwardXP` — verify no double-award, see §6)

---

## 5. Timed Exam

- [ ] `/timed-exam` setup (`ExamSetupForm.tsx`): exam type + question count selection; time limit shown; validation blocks empty selection
- [ ] Start → `exam_sessions` row created; `/timed-exam/[sessionId]` (`ExamSessionUI.tsx`) runs with countdown
- [ ] Timer expiry auto-submits the exam
- [ ] Manual submit → `/timed-exam/results` (`ExamResultsUI.tsx`): score matches recorded answers
- [ ] Review: `/timed-exam/[sessionId]/review` (`AnswerReviewUI.tsx`) shows each question with the user's answer vs correct answer
- [ ] Abandon/refresh mid-exam: session state behaves sanely (resume or clean end — no orphaned forever-open session)
- [ ] XP: `exam_complete` awarded once per completed exam; `perfect_bonus` on 100% only

---

## 6. Gamification (XP · Levels · Badges)

- [ ] XP amounts match `XPSource` constants for: `answer_correct`, `answer_wrong`, `exam_complete`, `perfect_bonus`
- [ ] `awardXP`/`batchAwardXP`: `user_xp` total is correct after a mixed session; every award has a matching `xp_transactions` row (no drift, no double-count on retry/re-render)
- [ ] Level: `computeLevel()`/`getXPProgress()` — `XPProgressBar.tsx` shows correct level and progress at threshold boundaries (exactly at threshold, 1 XP below)
- [ ] Level-up moment surfaces to the user (`XPToast.tsx`)
- [ ] `/badges` (`BadgeShelf.tsx`, `BadgeModal.tsx`): earned vs unearned states correct against `BADGE_DEFINITIONS`; badge detail modal opens
- [ ] Badge evaluation (`badgeEngine.ts`) triggers on qualifying activity — pick 2–3 badges and drive their criteria end-to-end
- [ ] Dashboard stats (`useUserStats`, `getUserStats`): totals, accuracy, streak. Streak is computed in UTC walking backward day-by-day — verify around midnight boundary and after a missed day
- [ ] Fresh user (no rows anywhere): dashboard and stats degrade to zeros, no crashes

---

## 7. Lobby (Real-time Chat)

### 7.1 Rooms
- [ ] `/lobby` loads room list (`RoomList.tsx`); rooms keyed by slug
- [ ] Join room → presence appears (`useLobbyPresence`, `OnlineUsersList.tsx`); leaving removes presence
- [ ] Send message (`MessageInput.tsx`) → appears for sender AND for a second logged-in user in real time (test with two browser contexts)
- [ ] Emoji picker inserts emoji into message
- [ ] Room rename works and propagates
- [ ] Pinned rooms (`usePinnedRooms`) persist across reload

### 7.2 Direct messages
- [ ] Find user by username → open DM (`ConversationList.tsx`, `useDMMessages`)
- [ ] DM sends/receives in real time between two users; conversation list updates
- [ ] Unread badge (`UnreadBadge.tsx`) increments on receive, clears on read
- [ ] Notification toast (`NotificationToast.tsx`, `useNotifications`) fires for messages received while elsewhere in the app
- [ ] Mini profile card (`MiniProfileCard.tsx`) opens from a user/message

### 7.3 Bots (service-role cron)
- [ ] `POST /api/lobby/bots` posts scripted bot messages (`user_profiles.is_bot` + `bot_script`) into rooms
- [ ] Endpoint is not callable by a regular authenticated user (service-role only — verify auth guard)

### 7.4 Lobby preferences
- [ ] Settings → Lobby tab (`LobbyPreferencesTab.tsx`): preferences save and take effect (industry selector, etc.)

---

## 8. History

- [ ] `/history` lists past sessions (`HistoryComponents.tsx`) — correct dates, scores, modes
- [ ] `/history/[sessionId]/review` (`HistoryAnswerReviewUI.tsx`) replays a past session's answers accurately
- [ ] Direct URL to another user's session id is blocked (RLS / ownership check)

---

## 9. Settings & Profile

- [ ] `/settings` tabs render (`SettingsTabs.tsx`): Profile, Lobby preferences
- [ ] Profile edits (`ProfileTab.tsx`) save → success message (`SuccessMessage.tsx`) → persist on reload → reflected elsewhere (e.g. lobby display name)
- [ ] `user_profiles.exam_type` uses `CMA` (never `CPA`) everywhere a track is written

---

## 10. Marketing / Misc

- [ ] `/` homepage renders for logged-out users; CTAs route to register/login
- [ ] `/feedback` page submits successfully
- [ ] `app/loading.tsx` and `error-boundary.tsx`: force a slow load and a thrown error — graceful states, no white screen
- [ ] Sidebar/App shell (`AppShell.tsx`, `Sidebar.tsx`): active states correct on every route; mobile layout usable on small viewport

---

## Cross-cutting checks (apply to every flow above)

1. **DB truth over UI truth** — after each mutating action, verify the row(s) in Supabase, not just the toast.
2. **Console/network clean** — no errors or failed requests during the happy path.
3. **RLS enforcement** — repeat key reads/writes as a second user; user B must never see or mutate user A's data (answers, sessions, DMs, stars, XP).
4. **CMA naming** — no `CPA` string reachable in UI or written to DB.
5. **Client boundary rules** — flows must not leak the service-role client to the browser; only `app/api/stripe/*` and `app/api/lobby/bots` use it.
6. **Coding standards on every fix** — `@/*` imports, Server Components by default (`'use client'` only when needed), queries in `lib/supabase/queries/*` not inline in components, and `npm run type-check && npm run lint && npm test` green before considering a fix done.
