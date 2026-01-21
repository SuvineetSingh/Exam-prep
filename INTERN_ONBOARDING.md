# 🎓 Intern Onboarding Guide - Exam Prep Platform

Welcome to the team! This guide will get you up and running in under 30 minutes.

---

## 📋 Prerequisites

Before you start, make sure you have:
- [ ] **Node.js 18+** installed ([Download](https://nodejs.org))
- [ ] **Git** installed
- [ ] **VS Code** or your preferred editor
- [ ] **GitHub account** with access to this repository
- [ ] **Supabase credentials** (ask team lead)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd exam-prep-main
```

### Step 2: Install Dependencies

```bash
npm install
```

This will take 2-3 minutes. ☕

### Step 3: Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Open in your editor
code .env.local
```

**Add your Supabase credentials** (get these from your team lead):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **NEVER commit `.env.local` to Git!** It's already in `.gitignore`.

### Step 4: Start Development Server

```bash
npm run dev
```

Open: **http://localhost:3000** 🎉

### Step 5: Verify Connection

Visit: **http://localhost:3000/test-db**

You should see: ✅ **Successfully connected to Supabase!**

---

## 📁 Project Structure

```
exam-prep-main/
│
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout (wraps all pages)
│   ├── page.tsx                 # Landing page (/)
│   ├── loading.tsx              # Loading UI
│   ├── globals.css              # Global styles + Tailwind
│   └── test-db/                 # Database connection test
│
├── components/                   # Reusable React components
│   ├── error-boundary.tsx       # Error handling
│   ├── loading.tsx              # Loading spinners
│   ├── ui/                      # UI components (buttons, inputs)
│   └── layout/                  # Layout components (header, footer)
│
├── lib/                         # Utility libraries
│   ├── supabase/               # Database & auth
│   │   ├── config.ts           # ⭐ Centralized config
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   │
│   ├── types/                  # TypeScript types
│   │   └── index.ts            # Shared types
│   │
│   └── utils/                  # Helper functions
│       ├── constants.ts        # App constants
│       ├── helpers.ts          # Utility functions
│       └── logger.ts           # Logging utility
│
├── documentation/               # Project docs
│   ├── introduction.md          # Project overview
│   ├── architecture.md          # System design
│   ├── API_documentation.md     # API specs
│   └── userFlows.md            # User flows
│
├── middleware.ts                # Next.js middleware (auth)
├── .env.local                   # ⚠️ Your secrets (NOT in Git)
├── .env.local.example           # Template (safe to commit)
└── package.json                 # Dependencies

```

---

## 💻 Tech Stack

| Technology | Purpose | Docs |
|------------|---------|------|
| **Next.js 16** | React framework with App Router | [Docs](https://nextjs.org/docs) |
| **TypeScript** | Type-safe JavaScript | [Docs](https://www.typescriptlang.org/docs) |
| **Tailwind CSS** | Utility-first CSS | [Docs](https://tailwindcss.com/docs) |
| **Supabase** | PostgreSQL + Auth + Storage | [Docs](https://supabase.com/docs) |
| **Stripe** | Payment processing | [Docs](https://stripe.com/docs) |
| **Vercel** | Hosting & deployment | [Docs](https://vercel.com/docs) |

---

## 🎯 Your First Week

### Day 1: Setup & Explore
- [ ] Complete Quick Start above
- [ ] Read `documentation/introduction.md`
- [ ] Explore the codebase - open every file in `app/` and `lib/`
- [ ] Run `npm run type-check` and `npm run lint`

### Day 2: Learn the Stack
- [ ] Complete [Next.js Tutorial](https://nextjs.org/learn) (2-3 hours)
- [ ] Read [Tailwind CSS Basics](https://tailwindcss.com/docs/utility-first) (1 hour)
- [ ] Review `documentation/architecture.md`

### Day 3: First Contribution
- [ ] Create a simple UI component (see tasks below)
- [ ] Make your first commit
- [ ] Create a pull request

### Day 4-5: Build Features
- [ ] Pick a task from the backlog
- [ ] Implement and test
- [ ] Get code review

---

## 🛠️ Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
npm run dev

# 4. Check for errors
npm run type-check
npm run lint

# 5. Commit changes
git add .
git commit -m "feat: add your feature description"

# 6. Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code (no logic change)
refactor: Restructure code
test: Add tests
chore: Update dependencies
```

### Before Every Commit

```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Format code
npm run format
```

---

## 📝 Coding Standards

### TypeScript Rules

```typescript
// ✅ GOOD - Always use types
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ❌ BAD - No types
function greet(name) {
  return `Hello, ${name}!`;
}

// ✅ GOOD - Import types
import type { User } from '@/lib/types';

// ✅ GOOD - Use constants
import { EXAM_TYPES } from '@/lib/utils/constants';
if (examType === EXAM_TYPES.CPA) {...}

// ❌ BAD - Magic strings
if (examType === 'CPA') {...}
```

### Import Paths

```typescript
// ✅ GOOD - Use @/ alias
import { createClient } from '@/lib/supabase/client';

// ❌ BAD - Relative paths
import { createClient } from '../../../lib/supabase/client';
```

### Tailwind CSS

```tsx
// ✅ GOOD - Organized classes
<button className="
  flex items-center justify-center    // Layout
  px-4 py-2 rounded-md               // Spacing
  bg-primary-600 hover:bg-primary-500 // Colors
  text-white font-semibold            // Typography
  transition-colors                   // Effects
">
  Click Me
</button>

// ❌ BAD - Random order
<button className="text-white bg-primary-600 px-4">
```

### Component Structure

```tsx
// ✅ GOOD - Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ GOOD - Client Component (when needed)
'use client';
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## 🎓 Learning Resources

### Must Read
1. **Next.js Docs** - https://nextjs.org/docs
2. **Tailwind CSS** - https://tailwindcss.com/docs
3. **Supabase Guide** - https://supabase.com/docs
4. **TypeScript Handbook** - https://www.typescriptlang.org/docs/handbook

### Project Docs
1. `documentation/introduction.md` - Project overview
2. `documentation/architecture.md` - System design
3. `documentation/API_documentation.md` - API endpoints
4. `SUPABASE_SETUP.md` - Database setup

### VS Code Extensions (Recommended)
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Auto Import** - Auto-import suggestions

---

## 🚀 Starter Tasks

### Easy (Day 3-4)

**Task 1: Create a Badge Component**
```tsx
// File: components/ui/Badge.tsx
export function Badge({ 
  text, 
  variant = 'default' 
}: { 
  text: string; 
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const colors = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[variant]}`}>
      {text}
    </span>
  );
}
```

**Task 2: Add Difficulty Colors Constant**
```typescript
// File: lib/utils/constants.ts
// Add this to existing constants:

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
} as const;
```

**Task 3: Create a Card Component**
```tsx
// File: components/ui/Card.tsx
export function Card({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
```

### Medium (Week 2)

**Task 4: Create Question Card Component**
- Display a question with options
- Handle answer selection
- Show correct/incorrect feedback

**Task 5: Build Question List Page**
- Fetch questions from Supabase
- Display in a grid
- Add filtering by exam type

**Task 6: Add Loading States**
- Add skeleton loaders
- Handle loading states properly
- Show error messages

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check what's wrong
npm run type-check

# Restart VS Code TypeScript server
# CMD + Shift + P → "TypeScript: Restart TS Server"
```

### Supabase connection issues
```bash
# Check environment variables
cat .env.local

# Restart dev server
# Ctrl+C, then npm run dev
```

### Git issues
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard origin/main
```

---

## ✅ Daily Checklist

Before ending your day:
- [ ] All code committed and pushed
- [ ] Pull request created (if feature complete)
- [ ] No console errors in browser
- [ ] TypeScript check passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Updated your task status

---

## 🤝 Getting Help

### When You're Stuck

1. **Check the docs** in `/documentation/`
2. **Search the codebase** for similar examples
3. **Read error messages** carefully (they're usually helpful!)
4. **Ask in team chat** - No question is too small!
5. **Schedule a pairing session** with a senior dev

### Good Questions to Ask

✅ "I'm trying to fetch questions from Supabase, but getting an error. Here's my code and the error message..."

✅ "I read the architecture doc but I'm not sure when to use Server vs Client components. Can you explain?"

✅ "I want to add a new feature. Should I create it in `app/` or `components/`?"

❌ "It doesn't work" (too vague - include details!)

---

## 🎯 Success Metrics

### Week 1 Goals
- [ ] Development environment set up
- [ ] Made first commit
- [ ] Created first component
- [ ] Understand project structure

### Month 1 Goals
- [ ] Built 3+ features
- [ ] Comfortable with Next.js and Supabase
- [ ] Can review others' code
- [ ] Understand the full architecture

---

## 📚 Additional Resources

### Internal
- **Team Wiki** - [Link to wiki]
- **Design System** - [Link to Figma]
- **API Docs** - `documentation/API_documentation.md`

### External
- **Next.js Discord** - https://nextjs.org/discord
- **Supabase Discord** - https://discord.supabase.com
- **Tailwind Discord** - https://tailwindcss.com/discord

---

## 🎉 Welcome to the Team!

You're joining a well-structured, production-ready codebase. Take your time to learn, ask questions, and have fun coding!

**Remember:**
- 💬 Ask questions early and often
- 🧪 Test your code before committing
- 📖 Read the docs when stuck
- 🤝 Help others when you can
- 🎯 Focus on learning, not perfection

**Let's build something amazing together!** 🚀

---

**Questions?** Reach out to your team lead or check the documentation!
