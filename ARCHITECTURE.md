# Phase 1: SourceIQ Codebase Architecture Analysis

## Executive Summary

SourceIQ is a **production-ready SaaS prototype** for AI-powered research verification. It's built on a modern TypeScript stack with TanStack Start (React 19, SSR), Supabase PostgreSQL, and Vercel AI SDK. The app is designed for critical thinking — analyzing articles, detecting bias, verifying claims, and generating study material.

---

## 1. Architecture Overview

### Stack & Framework
- **Frontend:** React 19 + TypeScript
- **Framework:** TanStack Start (SSR-capable, built on Vite)
- **Routing:** TanStack Router (file-based, like Next.js App Router)
- **Styling:** Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
- **State Management:** React Query (TanStack) for server state + React Hooks for client
- **Forms:** React Hook Form + Zod validation
- **Database:** Supabase PostgreSQL + Realtime
- **Authentication:** Supabase Auth + Lovable Cloud Auth
- **AI:** Vercel AI SDK (Google Gemini 3 Flash Preview via Lovable gateway)
- **Notifications:** Sonner (toast library)
- **Build:** Vite with TanStack plugin (supports Nitro for Cloudflare Workers)

### Design Philosophy
- **SSR-first:** Pages render on server for performance & SEO
- **Type-safe:** Strict TypeScript + Zod validation on inputs/outputs
- **Modular:** Components, hooks, lib utilities organized by feature
- **Error-first:** Comprehensive error handling (SSR wrappers, boundaries, error pages)

---

## 2. Folder Structure & Purpose

```
src/
├── routes/                  # File-based routing (TanStack Router)
│   ├── __root.tsx          # App shell: layout, error boundaries, providers
│   ├── index.tsx           # Landing page (marketing)
│   ├── auth.tsx            # Sign in / Sign up page
│   ├── reset-password.tsx  # Password reset flow
│   ├── _authenticated/     # Protected routes (layout for logged-in users)
│   └── README.md           # Routing conventions
│
├── components/
│   ├── ui/                 # shadcn/ui components (Radix primitives)
│   │   ├── button.tsx, input.tsx, label.tsx, ...
│   │   ├── form.tsx        # React Hook Form integration
│   │   ├── sidebar.tsx     # Sidebar (resizable, collapsible)
│   │   ├── tabs.tsx, accordion.tsx, dialog.tsx, ...
│   │   └── sonner.tsx      # Toast notifications
│   │
│   ├── marketing/          # Landing page sections
│   │   ├── MarketingNav.tsx
│   │   ├── Hero.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Testimonials.tsx
│   │   ├── PricingPreview.tsx
│   │   ├── TrustIndicators.tsx
│   │   ├── WorkspacePeek.tsx
│   │   ├── FAQ.tsx
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   │
│   ├── workspace/          # Workspace components (dashboard, article editor, etc.)
│   │   └── [To be built]
│   │
│   └── common/             # Shared components
│       └── GlassPanel.tsx  # Frosted glass effect
│
├── lib/
│   ├── research.functions.ts   # TanStack Server Functions (ingest, analyze, study)
│   ├── workspace.functions.ts  # Workspace operations
│   ├── ai-gateway.server.ts    # Lovable AI gateway (Gemini 3 Flash)
│   ├── error-capture.ts        # SSR error capture
│   ├── error-page.ts           # Error page HTML
│   ├── lovable-error-reporting.ts
│   └── utils.ts                # Utility functions (cn, etc.)
│
├── integrations/
│   ├── supabase/
│   │   ├── client.ts           # Supabase client (Proxy pattern)
│   │   ├── client.server.ts    # Server-side Supabase
│   │   ├── auth-middleware.ts  # Auth verification
│   │   ├── auth-attacher.ts    # Auth context attachment
│   │   └── types.ts            # Generated TypeScript types
│   │
│   └── lovable/
│       └── index.ts            # Lovable Cloud Auth client
│
├── hooks/
│   └── [To be built: custom hooks for data fetching, etc.]
│
├── assets/
│   ├── sourceiq-logo.png
│   └── [images, icons]
│
├── router.tsx              # Router instance creation (QueryClient setup)
├── start.ts                # TanStack Start entry + middleware
├── server.ts               # Server entry with error handling
├── styles.css              # Tailwind globals + custom CSS
└── routeTree.gen.ts        # Auto-generated route tree (don't edit)
```

---

## 3. Core Features Implemented

### A. Landing Page (Marketing)
- **Route:** `/` (public)
- **Components:** Hero, Features, How-It-Works, Testimonials, Pricing preview, FAQ, CTA
- **Status:** ✅ Complete with responsive design
- **Design:** Premium, minimalist aesthetic with Cormorant Garamond + Inter typography

### B. Authentication
- **Route:** `/auth` (public)
- **Flow:** Sign up, Sign in, Google OAuth, Password reset
- **Provider:** Supabase Auth + Lovable Cloud Auth
- **Status:** ✅ Implemented with error handling
- **Features:**
  - Email/password signup & signin
  - Google OAuth integration
  - Password reset flow
  - Session persistence (localStorage)

### C. Core Research Functions (Server-side)
Located in `src/lib/research.functions.ts` — built with TanStack Server Functions:

#### 1. **ingestArticle**
- Accepts: URL or text + project ID
- Handles: YouTube, Wikipedia, GitHub, Reddit with platform-specific logic
- Blocks: Instagram, TikTok, Facebook, X/Twitter, LinkedIn (need user to paste text)
- Features:
  - URL fetching with timeout (20s)
  - HTML-to-text conversion
  - Content validation (min 80 chars)
  - Stores in Supabase `articles` table
- Middleware: `requireSupabaseAuth` (user must be logged in)

#### 2. **analyzeArticle**
- Accepts: Article ID
- Uses: Gemini 3 Flash (via Lovable gateway)
- Output schema: Summary, trust_score (0-100), claims, bias_flags, sources
- Features:
  - Structured JSON output (Zod validated)
  - Fact-checking per claim (Supported/Contested/Unverified/False)
  - Bias detection (6 types: emotional-language, cherry-picking, etc.)
  - Recommendation of cross-reference sources
- Stores in Supabase `analyses` table

#### 3. **generateStudyMaterial**
- Accepts: Article ID, kind (flashcards | summary | quiz)
- Outputs:
  - **Flashcards:** Question/answer pairs (8-12)
  - **Summary:** Headline + key points + outline
  - **Quiz:** MCQ questions (5-8) with explanation
- Stores in Supabase `study_sets` table

### D. Supabase Integration
- **Client:** Proxy pattern for lazy initialization (caches across renders)
- **Auth:** Built-in with Supabase Auth API
- **Database:** PostgreSQL with RLS (Row Level Security)
- **Types:** Auto-generated TypeScript types (`types.ts`)
- **Middleware:** Auth verification on server functions

---

## 4. Data Flow & State Management

### Server State (React Query)
```
Client Component
    ↓ useQuery
Server Function (TanStack Start)
    ↓ Middleware: Auth check
Supabase or AI Processing
    ↓ Response
React Query Cache
    ↓ invalidateQueries
Component Re-render
```

### Client State (Hooks)
- Form inputs: `useState`
- Modal/sidebar state: `useState`
- Navigation: TanStack Router (`useNavigate`, `useParams`)

### Authentication Flow
```
User → /auth page
    → Sign up/in with email/password OR Google OAuth
    → Supabase stores session in localStorage
    → __root.tsx monitors onAuthStateChange
    → Redirect to /app (dashboard) if logged in
```

---

## 5. Key Technologies & Why

| Tech | Purpose | Why Chosen |
|------|---------|-----------|
| **TanStack Start** | Full-stack React framework | SSR-ready, server functions, type-safe |
| **Supabase** | Database & Auth | Open-source Firebase alternative, PostgreSQL |
| **Vercel AI SDK** | LLM integration | Type-safe, structured output (Zod) |
| **shadcn/ui** | Component library | Unstyled, accessible, customizable |
| **React Query** | Server state | Caching, deduplication, refetching |
| **React Hook Form** | Form handling | Lightweight, performant, integrates with Zod |
| **Zod** | Validation | Runtime type checking, excellent errors |
| **Tailwind CSS** | Styling | Utility-first, responsive, dark mode ready |

---

## 6. Authentication & Authorization

### User Context
- Attached via middleware in `start.ts`
- Available in server functions as `context.userId`, `context.supabase`
- Checked by `requireSupabaseAuth` middleware

### Session Flow
1. **Sign in:** Supabase stores JWT in localStorage
2. **Refresh:** Auto-refresh token before expiry
3. **Listen:** `onAuthStateChange` in `__root.tsx` triggers re-validation
4. **Protected:** Server functions enforce auth middleware

### Database RLS
- All tables have RLS policies
- `users.id = auth.uid()` ensures isolation
- Client never bypasses auth (always through server)

---

## 7. Error Handling Strategy

### SSR Errors
- Caught in `src/server.ts` and `src/start.ts`
- Wrapped with `renderErrorPage()`
- Error boundary in `__root.tsx` for client-side

### User-Facing Errors
- Toast notifications (Sonner)
- Form validation errors (React Hook Form)
- Server function error messages

### Logging
- Lovable error reporting for client errors
- Console errors for debugging

---

## 8. Performance Considerations

- **Code splitting:** Routes are lazy-loaded
- **Caching:** React Query + localStorage for auth
- **SSR:** Rendered on server reduces First Contentful Paint
- **Image optimization:** Consider lazy loading (not yet implemented)
- **Bundle size:** shadcn/ui is tree-shakeable

---

## 9. Database Schema (Inferred from code)

```sql
-- articles
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID NULLABLE,
  title TEXT,
  source_url TEXT NULLABLE,
  content TEXT,
  created_at TIMESTAMP,
);

-- analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  user_id UUID REFERENCES auth.users(id),
  trust_score INT (0-100),
  summary TEXT,
  claims JSONB,
  bias_flags JSONB,
  sources JSONB,
  created_at TIMESTAMP,
);

-- study_sets
CREATE TABLE study_sets (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  user_id UUID REFERENCES auth.users(id),
  kind ENUM('flashcards', 'summary', 'quiz'),
  content JSONB,
  created_at TIMESTAMP,
);
```

---

## 10. Routing Map

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Landing page |
| `/auth` | Public | Sign in / Sign up |
| `/reset-password` | Public | Password reset |
| `/app` | Protected | Dashboard (to be built) |
| `/app/workspace/:id` | Protected | Workspace detail (to be built) |
| `/app/article/:id` | Protected | Article analysis (to be built) |

---

## 11. What's Missing (To-Do)

### High Priority
- [ ] `/app/` dashboard (workspace list)
- [ ] `/app/workspace/:id` (main research interface)
- [ ] Article ingestion UI
- [ ] Analysis viewer (trust score, claims, bias)
- [ ] Study material viewer
- [ ] User profile & settings

### Medium Priority
- [ ] Sharing & collaboration
- [ ] Export (PDF, DOCX, Markdown)
- [ ] Real-time collaboration (Supabase Realtime)
- [ ] Search & filtering

### Low Priority
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Admin panel

---

## 12. Developer Workflow

### Typical Feature Development
1. Create a new route in `src/routes/`
2. Build components in `src/components/`
3. Add custom hooks in `src/hooks/` if needed
4. Use `createServerFn` in `src/lib/` for backend logic
5. Import shadcn/ui components as needed
6. Test locally with `npm run dev`
7. Commit and push

### Naming Conventions
- Routes: `kebab-case` (e.g., `reset-password.tsx`)
- Components: `PascalCase` (e.g., `MarketingNav.tsx`)
- Server functions: `camelCase` (e.g., `ingestArticle`)
- Files: Match export name or use `index.tsx`

---

## 13. Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
LOVABLE_API_KEY=sk-...
```

---

## Summary

SourceIQ is a **well-architected, modern SaaS** with:
- ✅ Type-safe end-to-end (TypeScript + Zod)
- ✅ Server-first approach (SSR + server functions)
- ✅ Production-grade error handling
- ✅ Scalable component library (shadcn/ui)
- ✅ AI integration ready (Gemini 3 Flash)
- ✅ Authentication & authorization built-in

**Next Steps:** Phase 2 (Audit) will identify technical debt and optimization opportunities.

---

**Generated:** 2026-07-16
**Project:** SourceIQ Prototype
