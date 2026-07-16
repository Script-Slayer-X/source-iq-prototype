# SourceIQ Cursor & Development Rules

## Core Principles

- **Never remove existing functionality** unless explicitly asked.
- **Preserve the Lovable connection** — avoid force pushing, rebasing, or squashing commits on the main branch. Keep all commits clean and linear.
- **Keep the branch in a working state** — commits push back to Lovable.

## Architecture & Code Style

- **File-based routing** — use TanStack Start conventions (file-based routes in `src/routes/`).
- **Prefer reusable React components** — keep components small, modular, and composable.
- **Use TypeScript strict typing** — always prefer explicit types over `any`.
- **Follow the existing folder structure**:
  - `src/routes/` — page components (file-based routing)
  - `src/components/` — reusable UI components
  - `src/hooks/` — custom React hooks
  - `src/lib/` — utility functions and shared logic
  - `src/integrations/` — external API integrations (Supabase, AI services, etc.)
  - `src/assets/` — images, icons, static files

## UI & Component Guidelines

- **Use shadcn/ui components** where possible for consistency and accessibility.
- **Use Tailwind CSS** for styling (avoid inline styles).
- **Use Radix UI** primitives (already in dependencies).
- **Do not duplicate code** — extract reusable components and utilities.
- **Preserve responsive behavior** — test on mobile, tablet, and desktop.

## State Management

- **Use TanStack React Query** for server state (API calls, data fetching).
- **Use React hooks** (useState, useContext) for client state.
- **Use Zod** for runtime validation of API responses and form inputs.

## Forms & Validation

- **Use React Hook Form** + Zod for type-safe form handling.
- **Validate server-side and client-side**.
- **Show clear error messages** to users.

## Async Operations

- **Add loading states** for all async operations (queries, mutations).
- **Add error states** with helpful error messages.
- **Use React Query** for caching and refetching logic.
- **Handle network failures gracefully** — retry logic where appropriate.

## Authentication & Authorization

- **Use Supabase authentication** (via `@lovable.dev/cloud-auth-js`).
- **Protect routes** that require authentication.
- **Check user permissions** before performing sensitive operations.
- **Securely handle API keys** (never commit `.env` files; use `.env.local`).

## Database & Supabase

- **Use Supabase client** (`@supabase/supabase-js`) for database operations.
- **Use row-level security (RLS)** policies for data protection.
- **Validate data integrity** at the application level.
- **Index frequently queried columns** for performance.

## Code Quality

- **Write readable code with clear naming** — variables, functions, and components should have descriptive names.
- **Add comments for complex logic** — explain the "why," not just the "what."
- **Follow ESLint rules** — run `npm run lint` before committing.
- **Format code with Prettier** — run `npm run format` before committing.

## Performance

- **Minimize bundle size** — lazy load routes and components where appropriate.
- **Avoid unnecessary re-renders** — use `useMemo` and `useCallback` sparingly but strategically.
- **Optimize images** — use responsive images and lazy loading.
- **Cache API responses** — use React Query's caching.
- **Monitor Core Web Vitals** — LCP, FID, CLS.

## Accessibility (a11y)

- **Use semantic HTML** — `<button>`, `<nav>`, `<main>`, `<form>`, etc.
- **Add ARIA attributes** where necessary.
- **Ensure keyboard navigation** — all interactive elements must be keyboard accessible.
- **Provide alt text** for images.
- **Use sufficient color contrast** — WCAG AA minimum.
- **Test with screen readers** — at least once per feature.

## Security

- **Never commit secrets** (API keys, tokens, passwords).
- **Use environment variables** for sensitive configuration.
- **Validate user input** on both client and server.
- **Sanitize data** before rendering (prevent XSS attacks).
- **Use HTTPS only** in production.
- **Implement CSRF protection** for form submissions.

## Testing

- **Write tests for critical features** — authentication, payment flows, data validation.
- **Test accessibility** — keyboard navigation, screen readers.
- **Test on real devices** — don't rely solely on browser dev tools.

## Commits & Git Workflow

- **Commit often** — after each completed feature or bug fix.
- **Use clear commit messages** — e.g., `"Add Universal Link Processor"`, `"Fix auth redirect bug"`.
- **Never force push** to `main` or connected branches.
- **Create feature branches** for larger changes (e.g., `feature/credibility-engine`).
- **Use pull requests** for code review before merging.

## Architectural Changes

- **Explain major changes before implementing them** — document the "why" and "how" in PRs.
- **Maintain backward compatibility** when possible.
- **Deprecate features gradually** instead of removing them suddenly.

## Documentation

- **Update README.md** when adding significant features.
- **Document API endpoints** and their expected inputs/outputs.
- **Keep comments up-to-date** when code changes.
- **Add TODOs** with context for future improvements (`// TODO: refactor on v2`).

## Debugging & Troubleshooting

- **Use browser DevTools** for client-side debugging.
- **Check network requests** in the Network tab.
- **Use console logs strategically** — remove before committing.
- **Check environment variables** — ensure `.env.local` is set correctly.
- **Review server logs** for backend errors.

## Before Every Commit

1. ✅ Test locally (`npm run dev`)
2. ✅ Run linter (`npm run lint`)
3. ✅ Format code (`npm run format`)
4. ✅ Verify no console errors or warnings
5. ✅ Verify the app still works
6. ✅ Write a clear commit message

---

**Last Updated:** 2026-07-16
**Project:** SourceIQ Prototype
**Connected to:** Lovable (lovable.dev)
