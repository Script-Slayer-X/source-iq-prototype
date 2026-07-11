
# SourceIQ — v1 Build Plan

Premium AI research workspace with the Luminous Scholar direction (deep-shadow dark + immersive nature photography), Lovable Cloud auth, and real Lovable AI-powered research features.

## 1. Design system (src/styles.css)

Port the chosen prototype's tokens verbatim:

- Background `hsl(230 15% 4%)`, foreground `hsl(230 10% 96%)`, muted `hsl(230 10% 60%)`, accent `hsl(185 90% 65%)` (luminous cyan), glass `hsl(230 20% 10% / 0.5)`, border `hsl(230 10% 100% / 0.1)`.
- Fonts loaded via `<link>` in `__root.tsx`: **Cormorant Garamond** (italic display), **Inter** (body), **JetBrains Mono** (labels).
- Radius scale, `reveal` keyframe, `--ease-out` easing.
- Map tokens into shadcn's `@theme inline` layer so all shadcn components inherit dark theme; keep semantic tokens (`--primary`, `--card`, etc.) aligned to the palette.
- Add utilities: `.glass-panel` (backdrop-blur + translucent bg + hairline border), `.animate-reveal`, subtle noise overlay class.

## 2. Backend (Lovable Cloud)

Enable Lovable Cloud. Migrations:

- `profiles` (id → auth.users, display_name, avatar_url, created_at) + trigger on `auth.users` insert. RLS: user reads/updates own row. Grants for `authenticated` + `service_role`.
- `projects` (id, user_id, title, description, created_at, updated_at). RLS: owner-only CRUD.
- `articles` (id, project_id, user_id, title, source_url, content, created_at). RLS: owner-only.
- `analyses` (id, article_id, user_id, trust_score int, summary text, claims jsonb, bias_flags jsonb, sources jsonb, created_at). RLS: owner-only.
- `study_sets` (id, article_id, user_id, kind text ['flashcards'|'summary'|'quiz'], content jsonb, created_at). RLS: owner-only.
- Grants + `has_role` skeleton included even if unused now (future admin).

Auth: email/password + Google (via `supabase--configure_social_auth`). `/reset-password` route included.

## 3. AI server functions (`src/lib/*.functions.ts`)

Provider helper `src/lib/ai-gateway.server.ts` (canonical Lovable AI Gateway setup). All calls to `google/gemini-3-flash-preview` via AI SDK, protected with `requireSupabaseAuth`:

- `analyzeArticle` — input: `{ articleId }`. Fetches article, prompts model with strict JSON schema (`{ summary, trust_score:0-100, claims:[{text, verdict, confidence}], bias_flags:[{type, quote}], suggested_sources:[{title, url, why}] }`), persists into `analyses`, returns row.
- `verifySources` — input: `{ articleId, claims }`. Model cross-checks claims and returns per-claim verification with citations.
- `generateStudyMaterial` — input: `{ articleId, kind }`. Structured output for flashcards / summary / quiz; persists to `study_sets`.
- `ingestArticle` — input: `{ projectId, url|text, title? }`. If URL, server-side `fetch` + readability-style extraction (simple HTML → text via regex/DOMParser polyfill); persists to `articles`.

Register `attachSupabaseAuth` in `src/start.ts` functionMiddleware.

## 4. Routes

```
src/routes/
  __root.tsx              (fonts, metadata, QueryClientProvider, auth listener)
  index.tsx               (marketing landing — hero, workspace peek, features, CTA)
  auth.tsx                (sign-in / sign-up, Google + email)
  reset-password.tsx
  _authenticated/
    route.tsx             (integration-managed gate)
    app.tsx               (workspace shell: sidebar + <Outlet />)
    app.index.tsx         (dashboard: recent projects + quick "Analyze URL" input)
    app.projects.$projectId.tsx      (project → article list)
    app.articles.$articleId.tsx      (article analyzer: content + verification panel + study generator)
    app.settings.tsx      (profile, theme note, sign out)
```

Every route defines its own `head()` with distinct title/description/og.

## 5. Component architecture (modular, reusable)

```
src/components/
  layout/
    MarketingNav.tsx
    AppSidebar.tsx        (uses shadcn sidebar; Projects, Study Sets, Settings)
    AppHeader.tsx         (breadcrumbs + user menu)
  marketing/
    Hero.tsx
    WorkspacePeek.tsx     (static preview mirroring the prototype's app snapshot)
    FeatureGrid.tsx
    HowItWorks.tsx
    CTASection.tsx
    Footer.tsx
  workspace/
    ProjectList.tsx
    ProjectCard.tsx
    ArticleList.tsx
    ArticleIngestForm.tsx (paste URL or text)
    ArticleReader.tsx     (rendered content with claim highlights)
    VerificationPanel.tsx (TrustScore, CitationCard, BiasFlagList)
    TrustScoreDial.tsx    (animated cyan meter)
    CitationCard.tsx
    StudyGenerator.tsx    (kind picker + results)
    Flashcard.tsx
  ui/                     (shadcn primitives — reused everywhere; no rewrites)
  common/
    GlassPanel.tsx        (wrapper for the recurring glass surface)
    SectionHeading.tsx    (mono eyebrow + italic serif title)
    Reveal.tsx            (scroll-triggered fade/slide wrapper)
    EmptyState.tsx
    LoadingShimmer.tsx
```

Business logic lives in `src/lib/*.functions.ts` and hooks under `src/hooks/` (`useProjects`, `useArticle`, `useAnalysis`, `useStudySets`) which wrap TanStack Query around the server fns. Components stay presentational.

## 6. Landing page

Mirrors the chosen prototype exactly: fixed glass nav, centered italic serif hero with cyan accent, workspace preview card, three-column feature grid. Add: "How it works" (3 steps), CTA block, footer.

**Immersive photography direction:** Generate one wide, deep-shadow nature image (misty forest / dark mountain range at dusk) used as a low-opacity background behind the hero and as the CTA section backdrop, with heavy vignette so the cyan accent still sings. One additional atmospheric texture image for the features section divider.

## 7. Workspace UX

- Sidebar: Projects (list + "New project"), Study Sets, Settings, user chip at bottom.
- Article page: 3-column — reader (center), verification panel (right, sticky), study generator (collapsible under reader). Trust score dial animates from 0 → value. Claims render as inline `<mark>`-style spans linked to citation cards.
- Ingest form supports paste URL or paste text; shows loading shimmer while `analyzeArticle` runs.
- All mutations via TanStack Query with optimistic invalidation.

## 8. Quality & polish

- Lazy-load workspace routes with dynamic imports where TanStack supports it.
- Responsive: sidebar collapses to icon rail < md; verification panel becomes a bottom sheet on mobile.
- A11y: semantic landmarks, aria-labels on icon buttons, focus rings using accent, one `<main>` per route.
- Motion: `Reveal` wrapper for scroll-in on landing; hover elevation on cards; trust score count-up.
- SEO on landing: real title/description/og text; social preview handled at serve time.

## 9. What's explicitly out of v1

- Pricing page, billing, teams — not requested.
- Knowledge graph visualization — mentioned as marketing copy only.
- PDF ingestion — v2.

## Technical notes

- Chat/text default model: `google/gemini-3-flash-preview`; structured output via `generateText` + `Output.object` (Gemini works without `structuredOutputs: true`).
- Web fetch inside `ingestArticle` for URL mode; strip scripts/styles and clamp length before sending to the model.
- Never expose `LOVABLE_API_KEY`; all AI calls behind `requireSupabaseAuth` server fns.
- Placeholder `src/routes/index.tsx` is replaced.
