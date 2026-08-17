# UI Audit Findings

_Generated 2026-06-21. Screenshots in `documentation/audit/`. Methodology: every route was visited via the MCP Playwright browser tools (logged in as a seeded admin account with real CMA/FE session history), full-page screenshotted at 1440×900, and mechanically scanned via `browser_evaluate` for design-system class usage. A subset of layout-sensitive routes were also captured at 390×844 (suffix `--mobile`). See Appendix B for the exact detection script. This is an audit/documentation pass only — no components were restyled._

## Legend

- **Verdict**: 🟢 New (fully on design system) · 🟡 Mixed (AppShell/Sidebar present but contains legacy-styled subcomponents) · 🔴 Old (no design-system classes detected at all)
- **Priority**: P0 (high-traffic or jarring mismatch) · P1 (medium traffic or partial mismatch) · P2 (low traffic / cosmetic only)

## Audit Table

| Route | Screenshot | Mobile | Verdict | Legacy classes / component | New-system classes present | Console | Priority | Notes |
|---|---|---|---|---|---|---|---|---|
| `/` | `home.png` | `home--mobile.png` | 🟢 New | `bg-blue-100` (one minor leftover) | `font-jakarta`, `btn-primary`, `btn-primary-lg`, `card-hover`, `shadow-card`, `section-label`, `progress-bar/fill`, full `brand-*`/`neutral-*` palette | clean | — | Landing page is the most fully-migrated page in the app |
| `/login` | `login.png` | `login--mobile.png` | 🔴 Old | `components/auth/loginForm.tsx`: `bg-slate-50`, `text-slate-900/700/500/400`, `border-slate-100/200/300`, `bg-blue-600`, `text-blue-600` | none | clean | **P0** | First-touch page for every new/returning user; starkest contrast vs the redesigned `/` it links from |
| `/register` | `register.png` | — | 🔴 Old | `components/auth/registerForm.tsx`: `bg-gray-50`, `text-gray-900/700/600/500`, `border-gray-100/200/300`, `bg-blue-600`, `text-blue-600` | none | clean | P0 | Sibling of `/login`, same severity. Note: uses `gray-*` while loginForm uses `slate-*` — the two auth forms aren't even consistent with *each other* |
| `/forgot-password` | `forgot-password.png` | — | 🔴 Old | own markup: `bg-slate-50`, `text-slate-*`, `bg-blue-100`, `bg-blue-600` | none | clean | P1 | |
| `/reset-password` | `reset-password.png` | — | 🔴 Old | own markup: `bg-slate-50`, `text-slate-*`, `bg-blue-600` | none | clean | P1 | Only captured in default/no-token state — no real reset link available in this environment |
| `/courses` | `courses.png` | — | 🟡 Mixed | `components/subscription/CoursesClient.tsx` / `PaywallBanner.tsx`: `bg-blue-50/500/600`, `border-blue-200`, `bg-indigo-600`, `bg-gray-50/100` | Sidebar/AppShell shell (`sidebar-item`, `section-label`, `progress-bar/fill`) | clean | P0 | Shell is new, all page content (plan cards, paywall) is old — high-traffic monetization page |
| `/dashboard` | `dashboard.png` | `dashboard--mobile.png` | 🟡 Mixed | `components/dashboard/StatCard.tsx` / `QuickActions.tsx` (inferred): `bg-blue-100/600`, `text-gray-900/700/400/300`, `bg-teal-600` | `card`, `card-hover`, full Sidebar shell | clean | **P0** | First page after login — highest-traffic protected route, still visibly mixed |
| `/questions` | `questions.png` | `questions--mobile.png` | 🟡 Mixed | `components/question/Navigation.tsx`, `QuestionCard.tsx`, `QuestionFilters.tsx`: `bg-blue-50/600`, `text-blue-600`, `bg-gray-50/100`, `border-gray-200/300`, `bg-primary-600` | Sidebar shell only — question cards/filters don't use `.card`/`.btn-primary` at all | clean | P0 | `bg-primary-600` here is hex-identical to `brand-green` but should still migrate to the brand token name |
| `/questions/{id}` | `questions-id.png` | — | 🟡 Mixed | `components/question/QuestionDisplay.tsx`, `Navigation.tsx` (`QuestionHeader`): `bg-blue-600`, `bg-gray-50/100`, `border-gray-100/200`, `text-gray-500/700/900` | Sidebar shell only | clean | P1 | |
| `/practice` (setup) | `practice.png` | `practice--mobile.png` | 🔴 Old | `components/practice/PracticeSetupForm.tsx`: `bg-blue-600`, `bg-gray-50`, `border-gray-200/300`, `text-gray-400/500` | minimal (`card`, stray `neutral-*` on the page wrapper) | clean | P0 | No Sidebar/AppShell at all (page doesn't import it) — confirm this is intentional immersive design, not a missed wrap |
| `/practice/{id}` | `practice-id.png` | — | 🟡 Mixed (mostly new) | `components/practice/PracticeSessionUI.tsx` has residual `bg-slate-100/900`, `text-slate-400/500/700/900` on what appears to be a secondary info/header element | `btn-primary`, `answer-option`, `shadow-card`, full `brand-*`/`neutral-*` | clean | P2 | Already redesigned per commit 97413c8 — only a partial leftover, not a full rewrite needed |
| `/timed-exam` (setup) | `timed-exam.png` | `timed-exam--mobile.png` | 🔴 Old | `components/timed-exam/ExamSetupForm.tsx`: 100% legacy — `bg-gray-50/200`, `border-gray-50/100`, `text-blue-600`, `bg-blue-600` | none | clean | P0 | |
| `/timed-exam/{sessionId}` (pre-start "Ready to begin?" screen) | `timed-exam-sessionid.png` | — | 🔴 Old | `components/timed-exam/ExamSessionUI.tsx` pre-start state: `bg-gray-50`, `bg-blue-50`, `text-blue-600`, `text-gray-900/500`, `bg-blue-600` | none | clean | P1 | Notable: this is a *different render state* of the same component whose in-progress exam UI (below) is mostly migrated — a partial-migration gap within one component, not a separate file |
| `/timed-exam/{sessionId}` (active exam) | `timed-exam-sessionid-active.png` | — | 🟡 Mixed (mostly new) | same component, in-progress state: `bg-gray-50`, `bg-slate-900/40` (modal backdrop) | `btn-primary`, `answer-option`, `shadow-card`, `shadow-sidebar`, `section-label`, full `brand-*`/`neutral-*` | clean | P2 | |
| `/timed-exam/results` | `timed-exam-results.png` | — | 🟢 New | none detected | `card`, `btn-primary`, `btn-secondary`, `btn-ghost`, `rounded-btn`, full `neutral-*` | clean | — | Fully migrated, zero legacy classes |
| `/timed-exam/{sessionId}/review` | `timed-exam-sessionid-review.png` | — | 🔴 Old | `components/timed-exam/AnswerReviewUI.tsx`: 100% legacy — `bg-slate-50/100`, `border-slate-100/200`, `bg-blue-50/100`, `text-blue-600/800`, `bg-indigo-200`, `text-indigo-700` | none | clean | P1 | Sits right next to the fully-new `/timed-exam/results` it's linked from — jarring transition |
| `/lobby` | `lobby.png` | `lobby--mobile.png` | 🟡 Mixed | `components/lobby/*` (RoomList, ConversationList, OnlineUsersList, etc.): `bg-gray-50/100/200/300`, `bg-blue-500`, `bg-primary-600` | Sidebar classes present (imported directly) | **4 errors** | **P0** | Two distinct issues, see below |
| `/history` | `history.png` | `history--mobile.png` | 🟡 Mixed | Session-row exam badges use stock `bg-blue-600`/`bg-teal-600` instead of `.exam-badge-cma/cfa/fe`; `bg-gray-50/100/200`, `border-gray-100/200` | `card`, full Sidebar shell | clean | P1 | |
| `/history/{sessionId}/review` | `history-sessionid-review.png` | — | 🔴 Old | `components/history/HistoryAnswerReviewUI.tsx` (renders legacy `Header`/`Footer` directly): 100% legacy — `bg-gray-50/100/200`, `bg-blue-50/600`, `text-blue-600/800`, `bg-primary-600` | none | clean | P1 | Only route in the app that renders the old `Header`/`Footer` components |
| `/settings` | `settings.png` | `settings--mobile.png` | 🟡 Mixed | `components/settings/ProfileTab.tsx`, `LobbyPreferencesTab.tsx`: `bg-gray-50/200`, `text-gray-200/500/700/900`, `bg-blue-600`, `border-gray-100/200` | full Sidebar shell, `progress-bar/fill` | clean | P1 | |
| `/feedback` | `feedback.png` | — | 🟢 New | `text-gray-200` (one minor leftover) | `card`, `btn-primary`, `input`, full Sidebar shell | clean | — | Nearly fully migrated. **Process finding** (not styling): this route is absent from `middleware.ts`'s `PROTECTED` array despite fetching the authenticated user client-side — works today because the page handles its own redirect, but it's an edge-auth gap worth closing separately |

### `/lobby` — two distinct findings worth calling out explicitly

1. **Styling**: every lobby chat component (`RoomList`, `RoomChat`, `MessageBubble`, `ConversationList`, `OnlineUsersList`, etc.) is unmigrated — stock gray/blue palette throughout.
2. **Layout bug (not just styling)**: `app/lobby/page.tsx` imports `Sidebar`/`MobileTabBar` directly instead of going through `AppShell`, and hand-rolls `margin-left: var(--sidebar-width)`. Confirmed via `browser_evaluate` that this stays a hardcoded `260px` even at a 390px mobile viewport — `AppShell` handles this responsively for every other page, so `/lobby` is the one route where mobile users get content shoved off-screen.
3. **Backend bug found incidentally**: 4 console errors are 404s against `…/rest/v1/conversation_reads…` — a Supabase table the lobby code expects but that doesn't exist (or isn't exposed via PostgREST) in this environment. Not a styling issue; flagged here since it surfaced during the audit and nowhere else.

## Appendix A: Routes requiring specific DB/session state

| Route | Precondition | How satisfied in this audit |
|---|---|---|
| `/questions/{id}`, `/practice/{id}` | Real question/session id | Sourced live: extracted question id from a `QuestionCard` link via `browser_snapshot`; practice id came from the redirect after submitting the real setup form |
| `/timed-exam/{sessionId}`, `/timed-exam/results`, `/timed-exam/{sessionId}/review` | A real, finished `exam_sessions` row (results page has no null-guards on an in-progress session) | Completed a real 20-question CMA exam end-to-end through the UI (submitted with 0 answered, since `results` page only requires the session to be finished, not answered) |
| `/history`, `/history/{sessionId}/review` | ≥1 completed session | Already satisfied — the logged-in account (`admin@gmail.com`) had 12+ pre-existing sessions; the exam completed above added one more |
| `/reset-password` | A valid password-reset token | Not available in this environment — captured in its default/invalid-token state only |

## Appendix B: Token detection script

Run via `browser_evaluate` after each navigation:

```js
() => {
  const newMarkers = ['btn-primary','btn-primary-lg','btn-secondary','btn-ghost','btn-danger','card','card-hover',
    'answer-option','answer-option-selected','answer-option-correct','answer-option-wrong',
    'exam-badge-cma','exam-badge-cfa','exam-badge-fe','mode-badge-practice','mode-badge-timed',
    'stat-card','sidebar-item','sidebar-item-active','progress-bar','progress-fill','section-label',
    'feedback-correct','feedback-wrong','input'];
  const all = Array.from(document.querySelectorAll('*'))
    .flatMap(el => (el.className || '').toString().split(' ')).filter(Boolean);
  const set = new Set(all);
  const newHits = new Set(), legacyHits = new Set();
  for (const c of set) {
    if (newMarkers.includes(c) || /^(bg|text|border)-(brand|neutral)-/.test(c) ||
        ['rounded-card','rounded-btn','shadow-card','shadow-card-hover','shadow-sidebar',
         'shadow-answer','shadow-answer-hover','font-jakarta'].includes(c)) newHits.add(c);
    if (/^(bg|text|border)-(gray|slate|blue|indigo|violet|teal)-\d/.test(c) ||
        c === 'bg-primary-600' || c === 'bg-secondary-600') legacyHits.add(c);
  }
  return { newHits: [...newHits], legacyHits: [...legacyHits] };
}
```

This catches what eyeballing screenshots can't: `colors.primary.600` in `tailwind.config.ts` is hex-identical to `colors.brand.green` (`#58CC02`), so a component using `bg-primary-600` is visually indistinguishable from one using `bg-brand-green` in a static screenshot — only the class-name scan surfaces it as legacy-token debt.

## Appendix C: Known limitations of this pass

- Single account used throughout (`admin@gmail.com`, which already had rich CMA/FE session history) — free-tier paywall banner states on `/questions`/`/practice` were not captured since this account has unrestricted access. A follow-up pass with a free-tier seeded account (e.g. `bob.test@examprep.dev`) would be needed to see `PaywallBanner` in its blocking state.
- Empty-state variants (e.g. `/history` with zero sessions, `/questions` with a filter combination returning no results) were not captured — only populated states.
- `/reset-password` only captured in its no-token/default state.
- Mobile pass was scoped to AppShell-wrapped pages and the two main auth forms per the audit plan, not every single route — fullscreen immersive routes (`/practice/{id}`, `/timed-exam/{sessionId}`) and result/review sub-pages were skipped at mobile width as lower priority.

## Post-audit note (2026-08-16, code read only — not a re-run of the Playwright methodology above)

`components/lobby/MiniProfileCard.tsx` uses `bg-blue-50 text-blue-700` for a country badge (added alongside the country/exam-type filters in `FindPeople.tsx`), matching a pre-existing `bg-purple-50 text-purple-700` industry badge in the same file. Both are stock Tailwind palette classes, which `ui-pattern-library.md` §4 explicitly says not to introduce in touched components — worth mapping to `brand-*`/`neutral-*` (or a new token if a semantic "info" accent is actually wanted) next time this file is touched, not urgent enough to block on.
