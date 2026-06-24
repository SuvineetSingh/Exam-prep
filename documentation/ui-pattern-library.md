# UI Pattern Library

_The canonical reference for the Duolingo-inspired design system introduced in commit `97413c8`. New components and any component you touch should use **only** the tokens and component classes documented here. For the current per-route migration status, see [`ui-audit-findings.md`](./ui-audit-findings.md) — the two docs are complementary: this one is "what good looks like," that one is "what's not there yet."_

_Supersedes the "Styling Rules" section in `documentation/introduction.md` (lines 213–276), which still documents the old `primary`/`secondary` blue palette. That section has not been edited as part of this pass — flagged for future removal._

## 1. Design Tokens

### 1.1 Colors

Defined in `tailwind.config.ts:11-62` and mirrored as CSS variables in `app/globals.css:6-27`.

| Token | Tailwind class | Hex | CSS var | Usage |
|---|---|---|---|---|
| Brand green | `bg-brand-green` / `text-brand-green` | `#58CC02` | `--brand-green` | Primary actions, success states, active nav item |
| Brand green dark | `bg-brand-green-dark` | `#46A302` | `--brand-green-dark` | Primary button hover |
| Brand amber | `bg-brand-amber` | `#FF9600` | `--brand-amber` | Streaks, warnings |
| Brand coral | `bg-brand-coral` | `#FF4B4B` | `--brand-coral` | Errors, wrong-answer state, danger button |
| Brand blue | `bg-brand-blue` | `#1CB0F6` | `--brand-blue` | Secondary accent (e.g. avatar gradient) |
| Brand purple | `bg-brand-purple` | `#CE82FF` | `--brand-purple` | Practice-mode accent |
| Neutral 900 / 700 / 500 / 400 / 200 / 100 | `text-neutral-900` etc. | `#1A1A2E` / `#3B3B52` / `#6B6B80` / `#AFAFAF` / `#E5E5EA` / `#F7F7F7` | `--text-primary` / `--text-secondary` / — / `--text-muted` / `--border` / `--surface-alt` | Full text/border/background hierarchy — use these instead of stock `gray`/`slate` |
| Exam CMA / CFA / FE | `colors.exam.cma/cfa/fe` | `#D97706` / `#7C3AED` / `#0D9488` | — | **Defined but not actually used** — see callout below |

**Known mismatch #1**: `colors.exam.*` tokens exist in `tailwind.config.ts:31-35` but the `.exam-badge-cma/cfa/fe` component classes (`globals.css:130-143`) don't reference them — they use stock Tailwind `amber-100/700`, `violet-100/700`, `teal-100/700` instead. Don't assume `bg-exam-cma` is used anywhere in the codebase; it isn't.

**Known mismatch #2**: `colors.primary.*` and `colors.secondary.*` (`tailwind.config.ts:36-62`) are legacy aliases kept only for old components — the comment in the source literally says "Keep primary alias for legacy components." `primary.600` (`#58CC02`) is hex-identical to `brand.green`, so a component using `bg-primary-600` renders identically to one using `bg-brand-green` — the only way to tell them apart is by reading the class name. **Never use `primary-*`/`secondary-*` in new or touched code.**

### 1.2 Typography

- Headings and body both use **Plus Jakarta Sans** (`--font-jakarta`) with **Inter** (`--font-inter`) as fallback, loaded via `next/font/google` in `app/layout.tsx:14-25` and applied through `font-sans`/`font-jakarta` in `tailwind.config.ts:64-67` and directly in `globals.css:34-44` (`body`, `h1`-`h6`).
- Headings get `letter-spacing: -0.01em` (`globals.css:43`).
- `.section-label` (`globals.css:181-183`): 10px, `font-black`, uppercase, `tracking-widest`, `text-neutral-400` — used for sidebar group headers like "Community" and section dividers.

### 1.3 Radii

| Token | Value | Class |
|---|---|---|
| `card` | 16px | `rounded-card` |
| `btn` | 12px | `rounded-btn` |
| `4xl` | 2rem | `rounded-4xl` |

### 1.4 Shadows

| Token | Value | Class |
|---|---|---|
| `card` | `0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)` | `shadow-card` |
| `card-hover` | `0 4px 12px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.06)` | `shadow-card-hover` |
| `sidebar` | `2px 0 8px rgba(0,0,0,.06)` | `shadow-sidebar` |
| `answer` | `0 2px 8px rgba(0,0,0,.06)` | `shadow-answer` |
| `answer-hover` | `0 4px 16px rgba(88,204,2,.15)` | `shadow-answer-hover` |

### 1.5 Animations

Defined in `tailwind.config.ts:78-129`.

| Name | Duration / easing | Usage |
|---|---|---|
| `answer-bounce` | 0.35s, bouncy | Selecting an answer option |
| `shake` | 0.4s ease-in-out | Wrong-answer feedback |
| `slide-up` / `slide-down` | 0.25s ease-out | Toasts, bottom sheets |
| `fade-scale-in` | 0.2s ease-out | Modals appearing |
| `pop` | 0.35s, bouncy | Badge/XP reward pop |
| `streak-glow` | 2s, infinite | Daily-streak flame icon |
| `progress-fill` | 0.8s ease-out | Progress bar filling |
| `float` | 3s, infinite | Decorative floating elements (landing page) |

**Lobby-specific legacy set** (`globals.css:228-252`, explicitly commented "keep for lobby"): `fadeIn`/`.animate-fade-in`, `slideIn`/`.animate-slide-in`, `slideUp`/`.animate-slide-up`, `.online-dot`/`pulse-dot`. These are separate from the core animation token set above — don't extend them, they exist only because the lobby chat UI hasn't been migrated yet (see `ui-audit-findings.md`).

## 2. Component Class Reference

All defined in `app/globals.css` under `@layer components` (lines 47-193). Use these over hand-rolled Tailwind utility chains whenever one fits.

| Class | Source | Notes |
|---|---|---|
| `.card` / `.card-hover` | `globals.css:66-72` | White bg, `rounded-card`, `border-neutral-200`, `shadow-card`. `-hover` adds `hover:shadow-card-hover` |
| `.btn-primary` / `.btn-primary-lg` | `globals.css:75-83` | Brand-green filled button, bold white text, scale-down on active. `-lg` is just bigger padding |
| `.btn-secondary` | `globals.css:85-89` | White bg, neutral border, for secondary actions |
| `.btn-ghost` | `globals.css:91-94` | No background until hover — for tertiary/cancel actions |
| `.btn-danger` | `globals.css:96-99` | Coral filled — destructive actions |
| `.input` | `globals.css:102-107` | Standard text input with brand-green focus ring |
| `.answer-option` (+ `-selected` / `-correct` / `-wrong`) | `globals.css:110-127` | Practice/exam answer choice buttons with state modifiers |
| `.exam-badge-cma` / `-cfa` / `-fe` | `globals.css:130-143` | Pill badges for exam type (see token mismatch #1 above) |
| `.mode-badge-practice` / `-timed` | `globals.css:145-153` | Pill badges for session mode |
| `.stat-card` | `globals.css:156-158` | `.card` + padding + flex column — dashboard stat tiles |
| `.sidebar-item` / `.sidebar-item-active` | `globals.css:161-169` | Sidebar nav row, active state uses green-50 bg + brand-green text |
| `.progress-bar` / `.progress-fill` | `globals.css:172-178` | XP/daily-goal progress bars |
| `.section-label` | `globals.css:181-183` | See Typography above |
| `.feedback-correct` / `.feedback-wrong` | `globals.css:186-191` | Full-bleed correct/wrong feedback banners |
| `.focus-ring`, `.score-high/-mid/-low`, `.text-balance`, `.animate-in` | `globals.css:195-217` | Utility helpers — score color thresholds, balanced text wrap, generic fade-up entrance |

### Real usage example

```tsx
// app/feedback/page.tsx — a fully-migrated page
<div className="card p-6">
  <textarea className="input" rows={4} placeholder="What's on your mind?" />
  <button className="btn-primary w-full py-4 justify-center text-base">
    Submit Feedback
  </button>
</div>
```

## 3. Layout Primitives

- **`AppShell`** (`components/layout/AppShell.tsx`): the standard page wrapper. Props: `user` (required), `children`, `dailyAnswered?`, `dailyGoal?`, `fullscreen?`.
  - Default mode renders `Sidebar` + `MobileTabBar` + a `<main>` offset by `marginLeft: var(--sidebar-width)`, with content constrained to `max-w-5xl mx-auto px-6 py-8`.
  - `fullscreen={true}` strips the sidebar entirely and just renders `children` inside a `min-h-screen bg-neutral-100` div — **use this only for immersive session pages** (`/practice/[id]`, `/timed-exam/[sessionId]`), not as a generic "hide the sidebar" escape hatch.
- **`Sidebar` + `MobileTabBar`** (`components/layout/Sidebar.tsx`): normally consumed *through* `AppShell`, not imported directly. **`/lobby` is the one exception** — it imports both directly and hand-rolls the `margin-left` offset, which is why it doesn't get `AppShell`'s responsive `@media (max-width: 768px) { margin-left: 0 }` behavior (defined in `globals.css:58-63` as `.page-content`, but `/lobby` doesn't use that class either — it inlines its own style). See `ui-audit-findings.md` for the resulting mobile bug. **New pages should always go through `AppShell`, never import `Sidebar` directly.**
- **Breakpoint convention**: 768px (`md`) is the single layout breakpoint in this app — `Sidebar` is `hidden md:flex`, `MobileTabBar` is `md:hidden`. Don't introduce new ad-hoc breakpoints for layout-level decisions.

## 4. Do's and Don'ts

- **Do** use the component classes (`.btn-primary`, `.card`, `.answer-option`, etc.) over hand-rolled Tailwind utility chains for these common patterns.
- **Do** use `brand-*` / `neutral-*` tokens directly when no existing component class fits.
- **Do** route every new page through `AppShell` rather than importing `Sidebar` directly.
- **Don't** use `colors.primary.*` / `colors.secondary.*` — legacy aliases kept only so old components keep rendering; not for new use.
- **Don't** use default Tailwind `gray-*` / `slate-*` / `blue-*` / `indigo-*` / `violet-*` / `teal-*` palettes in new or touched components — map to the nearest `neutral-*` (text/borders/backgrounds) or `brand-*` (accents/actions) token instead.
- **Don't** introduce new one-off shadow/radius values inline — extend the tokens in `tailwind.config.ts` if a genuinely new value is needed, so it stays documented here.

## 5. Known Inconsistencies / Not Yet Migrated

Full detail and screenshots in [`ui-audit-findings.md`](./ui-audit-findings.md). At a glance, the unmigrated surfaces are:

- Auth forms (`components/auth/loginForm.tsx`, `registerForm.tsx`) and the standalone `/forgot-password`, `/reset-password` pages
- Setup forms (`PracticeSetupForm.tsx`, `ExamSetupForm.tsx`) and the pre-start "Ready to begin?" state inside `ExamSessionUI.tsx`
- Review UIs (`AnswerReviewUI.tsx`, `HistoryAnswerReviewUI.tsx` — the latter also renders the legacy `Header`/`Footer` components, the only place they're still used)
- Question-bank components (`Navigation.tsx`, `QuestionDisplay.tsx`, `QuestionCard.tsx`, `QuestionFilters.tsx`, `QuestionNavigation.tsx`)
- Dashboard widgets (`StatCard.tsx`, `QuickActions.tsx`) and Courses page (`CoursesClient.tsx`, `PaywallBanner.tsx`)
- Settings tabs (`ProfileTab.tsx`, `LobbyPreferencesTab.tsx`)
- The entire lobby chat surface (`components/lobby/*`) — plus a layout bug where `/lobby` bypasses `AppShell` (see Layout Primitives above)
- `components/ui/Pagination.tsx`, and `components/ui/ProfileModal.tsx` (possibly dead code — references a nonexistent `/preferences` route, verify before removing)
