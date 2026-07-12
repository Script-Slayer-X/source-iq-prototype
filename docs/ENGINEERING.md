# SourceIQ — Engineering Standards

This is the single source of truth for how code is written in this repo.
New contributors should be able to read this file and match the codebase.

Stack: **TanStack Start v1 · React 19 · Vite 7 · Tailwind v4 · shadcn (New York) · Lovable Cloud (Supabase) · Lovable AI Gateway (`google/gemini-3-flash-preview`).**

---

## 1. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| React component | `PascalCase` | `TrustScoreDial` |
| Hook | `useCamelCase` | `useCurrentUser` |
| Server function | `camelCase` verb | `analyzeArticle`, `listProjects` |
| Server route handler | `HTTP method` on `Route.server.handlers` | `POST: async ({ request }) => …` |
| Type / interface | `PascalCase`, no `I`/`T` prefix | `Article`, `TrustScore` |
| Zod schema | `camelCase` + `Schema` | `articleIngestSchema` |
| Constant | `SCREAMING_SNAKE_CASE` (module-level literals) | `MAX_ARTICLE_TOKENS` |
| Enum-like union | `PascalCase` type of `"kebab-case"` strings | `type BiasFlag = "left" \| "right" \| "loaded-language"` |
| CSS token | `--kebab-case` | `--color-accent`, `--duration-base` |
| Tailwind class | Always via semantic token | `bg-card`, `text-muted-foreground` |
| Query key | Namespaced tuple | `["research","articles", id]` |
| Event handler prop | `onVerb` | `onSubmit`, `onArticleAnalyzed` |
| Boolean prop | `is`/`has`/`can` | `isLoading`, `hasError`, `canEdit` |

Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities, `kebab-case.md` for docs.

---

## 2. Folder conventions

```
src/
  routes/                     # TanStack file-based routes (see docs/ROUTING.md)
    _authenticated/           # auth-gated subtree
    api/public/               # raw HTTP endpoints (webhooks, cron)
  components/
    ui/                       # shadcn primitives — DO NOT EDIT
    common/                   # cross-module shared (L2)
    marketing/                # feature module
    workspace/                # feature module
    research/{sub}/           # (future) research sub-modules
    study/{sub}/              # (future) study sub-modules
  hooks/                      # cross-module hooks
  lib/
    *.functions.ts            # createServerFn modules (client-safe imports)
    *.server.ts               # server-only helpers (never imported client-side)
    utils.ts                  # cn(), formatDate(), pure helpers
  integrations/supabase/      # AUTO-GENERATED — DO NOT EDIT
  styles.css                  # design tokens + @utility declarations
```

Rule: a feature module never imports from another feature module's internals — only from `common/`, `ui/`, `lib/utils`, or another module's exported server functions.

---

## 3. Component naming

- One component per file. Filename matches export name.
- Named exports only. **No default exports** except in `src/routes/**` route files (TanStack convention) and lazy chunks.
- Props type = `ComponentNameProps`, declared inline above the component or exported when reused.
- Structure inside file: types → helpers → component → sub-components.
- Composition over configuration: prefer `<Card><CardHeader/><CardBody/></Card>` over `<Card header={} body={} />`.
- Every custom interactive component forwards `className` (merged with `cn()`) and forwards refs when it wraps a DOM node.

---

## 4. Hooks naming & rules

- File `useThing.ts` exports `function useThing()`.
- Return either a value or a stable object; never a mixed positional array unless mirroring a well-known API (`useState`-shaped).
- Data hooks wrap `useQuery`/`useMutation`. Never fetch in `useEffect` for initial render.
- Side-effect-only hooks return `void`.
- No conditional hook calls, no hooks inside loops — enforced by eslint.
- Hooks belong in `src/hooks/` unless scoped to one component (colocated then).

---

## 5. TypeScript conventions

- `strict: true`. No `any`, no `@ts-ignore`. Use `unknown` + narrowing; `@ts-expect-error` with a comment only when a third-party lib forces it.
- Prefer `type` for unions/aliases, `interface` only when declaration merging is needed.
- Validate **every** external boundary with Zod: server-function inputs, route params, form values, external API responses. Types are inferred from schemas with `z.infer`.
- Discriminated unions for state (`type AnalysisState = { status: "idle" } | { status: "loading" } | { status: "ready"; data: Analysis } | { status: "error"; error: string }`).
- Never annotate `useParams()`, `useLoaderData()`, `useSearch()` — TanStack infers them.
- Return types on exported functions are required; local functions may infer.
- `readonly` on shared arrays/objects passed as props.

---

## 6. API conventions

**App-internal RPC → `createServerFn`** in `src/lib/*.functions.ts`.
**External callers (webhooks, cron, public API) → server routes** under `src/routes/api/public/**`.

Server-function contract:

```ts
export const analyzeArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => analyzeArticleSchema.parse(raw))
  .handler(async ({ data, context }) => {
    // context.supabase (RLS as user), context.userId
    // read env inside .handler(), never at module scope
  });
```

Rules:
- Every protected fn uses `.middleware([requireSupabaseAuth])`.
- Never call protected fns from public-route loaders (SSR has no session).
- `supabaseAdmin` only in verified webhooks / admin maintenance, imported **inside** the handler.
- Response shape: return plain serializable objects. Errors are thrown (`throw new Response("Not found", { status: 404 })` or `throw notFound()`).
- Public API routes verify signature (HMAC, timing-safe compare) **before** touching the body.

---

## 7. State management

Layered — pick the lowest layer that solves the problem:

1. **URL state** (route params, search params) — filters, tabs, pagination. TanStack Router's `validateSearch` with Zod.
2. **Server state** — TanStack Query. All reads via `useServerFn(fn)` + `useQuery`. Mutations via `useMutation` + `queryClient.invalidateQueries(["namespace"])`.
3. **Local component state** — `useState` / `useReducer`. Keep as close to the DOM as possible.
4. **Cross-component but non-persistent** — React Context, one per concern. Never a global "app store".
5. **Persistent client state** (theme, sidebar collapsed) — `localStorage` read inside `useEffect` (never in `useState` initializer — SSR hydration mismatch).

**Never** introduce Redux / Zustand / Jotai without an explicit decision recorded in `docs/ADR/`.

Query keys are namespaced tuples:
```ts
["research","projects"]              // list
["research","projects", id]          // detail
["research","articles", id, "claims"]// nested
```

---

## 8. File naming (recap)

| Kind | Pattern |
|---|---|
| Route | `kebab.dot.notation.tsx` per TanStack (`app.projects.$projectId.tsx`) |
| Component | `PascalCase.tsx` |
| Hook | `useThing.ts` |
| Server function module | `feature.functions.ts` |
| Server-only helper | `feature.server.ts` |
| Type-only module | `feature.types.ts` |
| Test | `Thing.test.ts(x)` colocated |
| Doc | `kebab-case.md` under `docs/` |

---

## 9. Error handling

- **Never swallow errors.** Every `catch` either handles or rethrows.
- Server functions throw. Never return `{ ok: false, error }` sentinel shapes.
- User-facing UI: `errorComponent` on every route with a loader; retry calls `router.invalidate()` **and** `reset()`.
- Missing resources: throw `notFound()` in the loader, handle with `notFoundComponent`.
- Client-side unexpected errors: caught by root `errorComponent` and reported via `reportLovableError`.
- Form errors: field-level via `react-hook-form` + Zod resolver. Top-level via `sonner.toast.error`.
- Never `alert()`, never `console.log` for user-facing signals.

---

## 10. Logging

- Server: `console.info` / `console.warn` / `console.error` with a stable prefix `[module]` (`[research]`, `[auth]`).
- Never log secrets, tokens, session JSON, user PII beyond user id.
- Never log full AI prompts/responses in production paths; log token counts and status only.
- Client: `console.error` for developer-only signals. Runtime errors reach us through `reportLovableError`.
- `console.log` is forbidden in committed code — use `console.debug` if you truly need dev noise.

---

## 11. Comments

- Comment **why**, not what. Code shows what.
- No commented-out code. Delete it — Git remembers.
- JSDoc on exported server functions, hooks, and non-obvious utilities.
- `TODO(handle):` must include an owner and, ideally, an issue reference. Untethered `TODO`s are removed.
- No banner/ASCII-art comments.

---

## 12. Performance guidelines

- Default to Server Functions + Query for data. No `useEffect + fetch` for initial render.
- Prefer route-level lazy splitting (automatic in TanStack); avoid `React.lazy` inside components.
- Memoize only after measuring. Do not sprinkle `useMemo`/`useCallback` prophylactically.
- Images: `loading="lazy"` on non-hero images, explicit `width`/`height`, prefer `.jpg` for photos, `.webp` where supported.
- Lists over ~50 items → virtualize (`@tanstack/react-virtual`).
- Debounce user input feeding queries (250ms typical).
- Never block the main thread with sync JSON > 1 MB — stream or paginate.
- SSR: avoid `typeof window` checks in `useState` initializers; use `useEffect` or a hydration flag.

---

## 13. Accessibility standards

Baseline: **WCAG 2.1 AA**.

- Every interactive element is a real `<button>` / `<a>` / shadcn primitive. No `onClick` on `<div>`.
- Icon-only buttons carry `aria-label`.
- All form inputs have an associated `<label>` (visible) or `aria-label`.
- Focus is always visible — use `focus-ring` utility (`box-shadow` ring on `:focus-visible`).
- Color is never the sole signal (trust score also carries a label + icon).
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1 — verified against tokens, not eyeballed.
- Respect `prefers-reduced-motion` — enforced globally in `styles.css`.
- Landmarks: one `<main>` per page, `<nav>` around sidebars, `<header>`/`<footer>` where semantic.
- Modals/sheets/menus use shadcn (Radix) primitives — do not rebuild focus trapping.
- `<html lang="en">` set in root shell.

---

## 14. Responsive standards

Breakpoints follow Tailwind defaults:

| Token | min-width | Target |
|---|---|---|
| `sm` | 640px | large phone landscape |
| `md` | 768px | tablet |
| `lg` | 1024px | small laptop |
| `xl` | 1280px | desktop |
| `2xl` | 1536px | wide desktop |

Rules:
- **Mobile-first.** Base styles target 360px+; add breakpoint prefixes upward.
- Sidebar collapses to icon rail `< md` (via shadcn `collapsible="icon"`).
- Detail panels become `Sheet` bottom drawers `< md`.
- Use `h-dvh` not `h-screen` for full-viewport layouts.
- Tap targets ≥ 44×44px on touch.
- Fluid type only for hero/marketing display headings (`text-4xl md:text-6xl` etc.); body stays fixed for readability.
- Never rely on hover — every hover affordance has a tap/focus equivalent.

---

## 15. Animation standards

Motion should feel considered, never busy.

- Durations come from `--duration-*` tokens; easings from `--ease-*`. No hardcoded ms.
- Default transition: `220ms var(--ease-standard)`.
- Reveal on scroll: `<Reveal>` component (already in `common/`).
- Hover elevation: bump one shadow step (`e2 → e3`), 140ms.
- Route transitions: rely on TanStack default — do not animate route swaps.
- Framer Motion only for stateful choreography (multi-step reveals, drag). Simple transitions stay in CSS.
- Never animate `width`/`height`/`top`/`left` — use `transform`/`opacity`.
- Respect `prefers-reduced-motion` (already globally handled).

---

## 16. Commits & PRs

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- One concern per PR. Design-system + feature changes split.
- Never commit generated files by hand: `src/routeTree.gen.ts`, `src/integrations/supabase/**`.
- Never commit `.env` values.

---

## 17. Definition of Done

A change is done when:

1. TypeScript passes.
2. All new user-facing surfaces reuse existing `ui/` or `common/` components.
3. Uses design tokens — no raw hex, no `text-white`, no arbitrary `bg-[#…]`.
4. Loading, empty, error states are handled.
5. Keyboard-navigable and screen-reader-labeled.
6. Responsive from 360px up.
7. No new `console.log`. No `TODO` without owner.
8. Docs updated when a public contract changes.
