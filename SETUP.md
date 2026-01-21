# Project Setup Instructions

This guide will help you get the Exam Prep Platform up and running.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A Supabase account (free tier available at https://supabase.com)
- A Stripe account (for payment processing)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (a template is provided):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Configuration (optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

**To get your Supabase credentials:**
1. Go to https://app.supabase.com
2. Create a new project or select an existing one
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
exam-prep-main/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles with Tailwind
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   │   ├── client.ts     # Browser-side client
│   │   ├── server.ts     # Server-side client
│   │   └── middleware.ts # Auth middleware
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions and constants
├── public/               # Static assets
├── documentation/        # Project documentation
├── middleware.ts         # Next.js middleware (auth)
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Next Steps

### 1. Database Setup

Set up your Supabase database schema:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create tables for:
   - `users` - User profiles
   - `questions` - Question bank
   - `exam_sessions` - Exam attempts
   - `answer_submissions` - User answers

Example schema is available in `/documentation/architecture.md`

### 2. Authentication Setup

The project is pre-configured with Supabase authentication:
- Email/password authentication
- Session management via middleware
- Protected routes (configure in `lib/supabase/middleware.ts`)

### 3. Stripe Integration

To enable subscription payments:
1. Get your Stripe API keys from https://dashboard.stripe.com
2. Add them to `.env.local`
3. Create API routes for Stripe webhooks

### 4. Custom Components

Start building your UI components in:
- `components/ui/` - Reusable UI elements (buttons, inputs, cards)
- `components/layout/` - Layout components (header, footer, navigation)

## Configuration

### Path Aliases

The project uses `@/` as a path alias for the root directory:

```typescript
// Instead of this:
import { createClient } from '../../../lib/supabase/client';

// You can write:
import { createClient } from '@/lib/supabase/client';
```

### Tailwind CSS

Custom theme configuration is available in `tailwind.config.ts`. The project includes:
- Custom color palette (primary, secondary)
- Extended spacing values
- Custom utility classes in `app/globals.css`

### TypeScript

The project uses strict TypeScript configuration:
- Strict mode enabled
- Path aliases configured
- Type definitions in `lib/types/`

