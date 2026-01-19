I'll create comprehensive onboarding notes for a new . Let me first examine the existing documentation and project structure:

[5 tools called]

Based on the project structure and documentation, here are comprehensive onboarding notes:

---

# 🎓 Onboarding Guide - Exam Prep Platform

**Welcome!** This guide will help you understand the project, tech stack, and how to start contributing.

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Code Organization](#code-organization)
5. [Styling Rules](#styling-rules)
6. [Development Workflow](#development-workflow)
7. [Learning Path](#learning-path)
8. [Common Tasks](#common-tasks)

---

## 🎯 Project Overview

**What are we building?**
- A web-based question bank platform for CPA, CFA, and FE exam preparation
- Users pay $10 once to get lifetime access to practice questions
- Features: Practice mode, timed exams, answer tracking, performance analytics

**Business Model:**
- One-time payment of $10 via Stripe
- Target: Students preparing for professional certification exams
- Revenue scales with user acquisition

---

## 💻 Tech Stack

### **Frontend Framework**
- **Next.js 16** (React framework with App Router)
  - Why? Server-side rendering, built-in API routes, automatic code splitting
  - Latest version with Turbopack bundler (faster builds)

### **Language**
- **TypeScript** (Strict mode enabled)
  - Why? Type safety prevents bugs, better IDE support, self-documenting code
  - You'll see `.ts` and `.tsx` files everywhere

### **Styling**
- **Tailwind CSS 3.4** (Utility-first CSS framework)
  - Why? Rapid UI development, consistent design system, no CSS files to manage
  - Example: `className="flex items-center justify-center bg-blue-600"`

### **Database & Backend**
- **Supabase** (PostgreSQL + Authentication + Real-time + Storage)
  - Why? Built-in auth, auto-generated APIs, generous free tier
  - Alternative to building your own backend

### **Payment Processing**
- **Stripe** (Payment gateway)
  - Why? Industry standard, developer-friendly, handles all payment complexity
  - PCI compliant out of the box

### **Deployment**
- **Vercel** (Hosting platform)
  - Why? Zero-config deployment, global CDN, preview deployments for every PR
  - Created by the Next.js team

### **State Management**
- **React Server Components** (built into Next.js 16)
  - No Redux/Zustand needed for now
  - Server components handle data fetching, client components handle interactivity

### **Type System**
- **TypeScript 5** with strict mode
  - All code must have proper types
  - No `any` types allowed (use `unknown` if needed)

---

## 📁 Project Structure

```
exam-prep-main/
│
├── app/                          # Next.js 16 App Router (main app code)
│   ├── layout.tsx               # Root layout (wraps all pages)
│   ├── page.tsx                 # Landing page (/)
│   ├── loading.tsx              # Loading UI
│   └── globals.css              # Global styles + Tailwind
│
├── components/                   # Reusable React components
│   ├── error-boundary.tsx       # Error handling component
│   ├── loading.tsx              # Loading spinner components
│   ├── ui/                      # UI components (buttons, inputs, cards)
│   └── layout/                  # Layout components (header, footer, nav)
│
├── lib/                         # Utility libraries and helpers
│   ├── supabase/               # Database & auth configuration
│   │   ├── config.ts           # ⭐ Centralized Supabase config (NEW)
│   │   ├── client.ts           # Browser-side Supabase client
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── middleware.ts       # Auth middleware helper
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Shared types (User, Question, etc.)
│   │
│   └── utils/                  # Helper functions
│       ├── constants.ts        # App constants (exam types, etc.)
│       ├── helpers.ts          # Utility functions (formatDate, etc.)
│       └── logger.ts           # ⭐ Logging utility (NEW)
│
├── public/                      # Static files (images, icons, etc.)
│
├── documentation/               # Project documentation
│   ├── architecture.md          # System architecture
│   ├── API_documentation.md     # API endpoint specs
│   └── User_flows.md            # User flow diagrams
│
├── middleware.ts                # Next.js middleware (runs on every request)
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── .env.local                   # Environment variables (NOT in git)
```

---

## 🏗️ Code Organization

### **Key Concepts**

#### 1. **Server vs Client Components** (Next.js 16)

```tsx
// ✅ Server Component (default) - Runs on server
// Can fetch data directly, cannot use useState/useEffect
export default async function Page() {
  const data = await fetch('...'); // Direct fetch on server
  return <div>{data}</div>;
}

// ✅ Client Component - Runs in browser
// Can use hooks, event handlers, browser APIs
'use client';
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Rule:** Keep components as Server Components unless you need:
- `useState`, `useEffect`, or other React hooks
- Event handlers (`onClick`, `onChange`)
- Browser-only APIs (`window`, `localStorage`)

---

#### 2. **Import Path Aliases**

```typescript
// ❌ Bad - Relative paths
import { createClient } from '../../../lib/supabase/client';

// ✅ Good - Use @/ alias (always from root)
import { createClient } from '@/lib/supabase/client';
```

**Rule:** Always use `@/` instead of relative paths

---

#### 3. **Supabase Client Usage**

```typescript
// ❌ Wrong - Don't create client directly
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(url, key); // Don't do this!

// ✅ Correct - Use our wrapper functions
import { createClient } from '@/lib/supabase/client'; // For client components
import { createClient } from '@/lib/supabase/server'; // For server components

const supabase = createClient();
```

**Why?** Our wrappers handle config validation, error handling, and cookie management

---

#### 4. **Type Imports**

```typescript
// ✅ Always import types
import type { User, Question } from '@/lib/types';
import { EXAM_TYPES } from '@/lib/utils/constants';

// Use the types
const user: User = {...};
const examType: ExamType = EXAM_TYPES.CPA;
```

---

## 🎨 Styling Rules

### **Tailwind CSS Conventions**

```tsx
// ✅ Good - Organized class names
<button className="
  flex items-center justify-center    // Layout
  px-4 py-2 rounded-md               // Spacing & borders
  bg-primary-600 hover:bg-primary-500 // Colors
  text-white text-sm font-semibold    // Typography
  shadow-sm transition-colors         // Effects
">
  Click Me
</button>

// ❌ Bad - Random order
<button className="text-white bg-primary-600 px-4 shadow-sm py-2">
```

### **Class Organization Order**
1. Layout (`flex`, `grid`, `block`)
2. Positioning (`absolute`, `relative`)
3. Sizing (`w-full`, `h-10`)
4. Spacing (`p-4`, `m-2`)
5. Colors (`bg-blue-500`, `text-white`)
6. Typography (`text-lg`, `font-bold`)
7. Borders (`border`, `rounded`)
8. Effects (`shadow`, `transition`)

### **Custom Colors**

We have custom color palettes defined in `tailwind.config.ts`:

```tsx
// Primary colors (blue theme)
bg-primary-50   // Lightest
bg-primary-600  // Main (use this most)
bg-primary-900  // Darkest

// Secondary colors (purple theme)
bg-secondary-50
bg-secondary-600
bg-secondary-900
```

### **Responsive Design**

```tsx
// Mobile-first approach
<div className="
  text-sm           // Default (mobile)
  sm:text-base      // Small screens (640px+)
  md:text-lg        // Medium screens (768px+)
  lg:text-xl        // Large screens (1024px+)
">
```

**Breakpoints:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

---

## 🔄 Development Workflow

### **Getting Started**

```bash
# 1. Clone and install
git clone <repo-url>
cd exam-prep-main
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run development server
npm run dev
# Open http://localhost:3000
```

### **Available Commands**

```bash
npm run dev          # Start dev server (hot reload enabled)
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Check TypeScript errors
npm run lint         # Check code style
npm run format       # Auto-format code with Prettier
```

### **Git Workflow**

```bash
# 1. Create feature branch
git checkout -b feature/add-question-page

# 2. Make changes, commit often
git add .
git commit -m "feat: add question display component"

# 3. Before pushing, check for errors
npm run type-check
npm run lint

# 4. Push and create PR
git push origin feature/add-question-page
```

### **Commit Message Convention**

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Restructure code
test: Add tests
chore: Update dependencies
```

---

## 📖 Learning Path

### **Week 1: Foundations**

**Day 1-2: Setup & Explore**
- [ ] Install Node.js, VS Code, Git
- [ ] Clone repo and run `npm install`
- [ ] Get dev server running
- [ ] Explore the codebase - open every file in `app/` and `lib/`

**Day 3-4: Learn the Stack**
- [ ] **Next.js Tutorial:** https://nextjs.org/learn (2-3 hours)
- [ ] **Tailwind CSS:** https://tailwindcss.com/docs (1 hour)
- [ ] **TypeScript Basics:** https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

**Day 5: Study Our Codebase**
- [ ] Read `/documentation/architecture.md` - Understand system design
- [ ] Read `/documentation/API_documentation.md` - Understand API endpoints
- [ ] Read `app/layout.tsx` and `app/page.tsx` - See how pages work

### **Week 2: First Contributions**

**Small Tasks to Get Started:**

1. **Add a new utility function**
   ```typescript
   // In lib/utils/helpers.ts
   export function capitalizeFirstLetter(text: string): string {
     if (!text) return '';
     return text.charAt(0).toUpperCase() + text.slice(1);
   }
   ```

2. **Create a simple UI component**
   ```tsx
   // In components/ui/Badge.tsx
   export function Badge({ text }: { text: string }) {
     return (
       <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
         {text}
       </span>
     );
   }
   ```

3. **Add a new constant**
   ```typescript
   // In lib/utils/constants.ts
   export const DIFFICULTY_COLORS = {
     easy: 'bg-green-100 text-green-700',
     medium: 'bg-yellow-100 text-yellow-700',
     hard: 'bg-red-100 text-red-700',
   } as const;
   ```

### **Week 3-4: Bigger Features**

Work on actual user-facing features:
- Create a question display component
- Build the answer submission form
- Add loading states to pages
- Implement error handling

---

## 🛠️ Common Tasks

### **1. Creating a New Page**

```tsx
// app/questions/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function QuestionsPage() {
  // Fetch data on server
  const supabase = await createClient();
  const { data: questions } = await supabase.from('questions').select('*');

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Practice Questions</h1>
      {/* Render questions */}
    </main>
  );
}
```

### **2. Creating an API Endpoint**

```typescript
// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .limit(20);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ questions: data });
}
```

### **3. Using the Logger**

```typescript
import { logger } from '@/lib/utils/logger';

// In any file
logger.info('User viewed questions page', { userId: '123' });
logger.error('Failed to save answer', error, { questionId: '456' });
```

### **4. Creating a Client Component with State**

```tsx
// components/QuestionCard.tsx
'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types';

export function QuestionCard({ question }: { question: Question }) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">{question.question_text}</h3>
      <div className="space-y-2">
        {['A', 'B', 'C', 'D'].map((option) => (
          <button
            key={option}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full p-3 text-left rounded border ${
              selectedAnswer === option ? 'bg-primary-50 border-primary-500' : ''
            }`}
          >
            {option}. {question[`option_${option.toLowerCase()}`]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚠️ Important Rules

### **DO's ✅**

1. **Always use TypeScript types**
   ```typescript
   // ✅ Good
   function greet(name: string): string {
     return `Hello, ${name}!`;
   }
   
   // ❌ Bad
   function greet(name) {
     return `Hello, ${name}!`;
   }
   ```

2. **Use constants instead of magic strings**
   ```typescript
   // ✅ Good
   import { EXAM_TYPES } from '@/lib/utils/constants';
   if (examType === EXAM_TYPES.CPA) {...}
   
   // ❌ Bad
   if (examType === 'CPA') {...}
   ```

3. **Handle errors gracefully**
   ```typescript
   // ✅ Good
   try {
     const data = await fetchData();
   } catch (error) {
     logger.error('Fetch failed', error);
     return <ErrorMessage />;
   }
   
   // ❌ Bad
   const data = await fetchData(); // Might crash!
   ```

4. **Use helper functions**
   ```typescript
   // ✅ Good
   import { formatDate } from '@/lib/utils/helpers';
   const formatted = formatDate(date, 'full');
   
   // ❌ Bad
   const formatted = new Date(date).toLocaleDateString(); // Inconsistent
   ```

### **DON'Ts ❌**

1. **Don't use `any` type**
   ```typescript
   // ❌ Bad
   function process(data: any) {...}
   
   // ✅ Good
   function process(data: Question) {...}
   // OR if you really don't know the type:
   function process(data: unknown) {...}
   ```

2. **Don't commit `.env.local`**
   - It's in `.gitignore` for security reasons
   - Contains secret API keys

3. **Don't write inline styles**
   ```tsx
   // ❌ Bad
   <div style={{ color: 'red', fontSize: '16px' }}>
   
   // ✅ Good
   <div className="text-red-600 text-base">
   ```

4. **Don't create Supabase client directly**
   ```typescript
   // ❌ Bad
   const supabase = createBrowserClient(url, key);
   
   // ✅ Good
   import { createClient } from '@/lib/supabase/client';
   const supabase = createClient();
   ```

---

## 🎓 Key Concepts to Understand

### **1. Server vs Client Rendering**

**Server Component** (runs on server):
- Fetches data directly from database
- Can use environment variables
- HTML generated on server
- Better for SEO

**Client Component** (runs in browser):
- Has interactivity (clicks, forms)
- Uses React hooks
- Can access browser APIs
- Needs `'use client'` at top

### **2. Authentication Flow**

```
1. User logs in
   ↓
2. Supabase creates JWT token
   ↓
3. Token stored in httpOnly cookie
   ↓
4. Every request includes cookie
   ↓
5. Middleware verifies token
   ↓
6. If valid, allow access
```

### **3. Database Access (Supabase)**

```typescript
// Query data
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('exam_type', 'CPA')
  .limit(20);

// Insert data
const { data, error } = await supabase
  .from('user_answers')
  .insert({ user_id, question_id, selected_answer });
```

---

## 📚 Resources

### **Must Read**
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Supabase Docs: https://supabase.com/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook

### **Helpful Tools**
- **VS Code Extensions:**
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - TypeScript Auto Import

- **Browser Extensions:**
  - React Developer Tools
  - Supabase DevTools


---

**Questions?** Check `/documentation/` or ask the team!