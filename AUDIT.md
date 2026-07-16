# Phase 2: Senior Code Audit — SourceIQ

## Executive Summary

SourceIQ is **well-architected** with strong foundations (TypeScript, SSR, auth), but has several **medium & low-severity issues** to address before production:

- ✅ **Good:** Type safety, error handling, modular design
- ⚠️ **Needs Work:** Missing validation, accessibility gaps, incomplete error cases
- 🔴 **Critical:** A few edge cases in auth & URL handling

**Estimated Refactor Time:** 4-6 hours

---

## Issues by Severity

### 🔴 CRITICAL (Must Fix Before Production)

#### 1. **Missing Password Confirmation in Reset Flow**
**File:** `src/routes/reset-password.tsx`  
**Issue:** User only enters password once. No confirmation field to prevent typos.
```tsx
// ❌ CURRENT
<Input
  id="password"
  type="password"
  minLength={6}
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// ✅ SHOULD BE
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
// Validate: password === confirmPassword
```
**Impact:** Users may lock themselves out if they mistype.

---

#### 2. **No Validation on Article Content Length Before Storing**
**File:** `src/lib/research.functions.ts` (line 219-223)
```typescript
if (!content || content.trim().length < 80) {
  throw new Error(
    "The extracted content is too short to analyze..."
  );
}
// ✅ GOOD — but consider max length for safety
if (content.length > 200000) {
  throw new Error("Content exceeds 200,000 characters");
}
```
**Impact:** Prevents DoS via massive content uploads.

---

#### 3. **URL Validation Missing in research.functions.ts**
**File:** `src/lib/research.functions.ts` (line 204)
```typescript
try {
  hostname = new URL(data.url).hostname.replace(/^www\./, "");
} catch {
  throw new Error("That doesn't look like a valid URL...");
}
// ✅ GOOD — but earlier in extractFromUrl, should validate protocol
const parsed = new URL(url);
const host = parsed.hostname.toLowerCase();
// ❌ MISSING: Check if protocol is https (allow http for localhost only)
if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
  throw new Error('Only HTTPS URLs are allowed for security');
}
```
**Impact:** Could allow SSRF attacks or data exposure.

---

#### 4. **Auth Middleware Not Validating Token Expiry**
**File:** `src/integrations/supabase/auth-middleware.ts` (line 92)
```typescript
const { data, error } = await supabase.auth.getClaims(token);
if (error || !data?.claims) {
  throw new Error('Unauthorized: Invalid token');
}
// ✅ Token is validated by Supabase, but consider:
// - Check if token has 'exp' claim and compare with Date.now()
// (Supabase likely does this, but it's good practice to verify)
```
**Impact:** Low (Supabase handles this server-side), but document.

---

### ⚠️ HIGH (Recommended Fixes)

#### 5. **Missing Error Recovery in AI Analysis**
**File:** `src/lib/research.functions.ts` (line 306-336)
```typescript
try {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: analysisSchema }),
    prompt,
  });
  // ✅ GOOD error handling for NoObjectGeneratedError
  // ❌ MISSING: Timeout handling, rate limit detection
} catch (err) {
  if (NoObjectGeneratedError.isInstance(err)) {
    throw new Error("Could not produce structured analysis. Try again.");
  }
  throw err; // Generic error
}
```
**Improvement:**
```typescript
catch (err) {
  if (NoObjectGeneratedError.isInstance(err)) {
    throw new Error("AI analysis failed (invalid output). Try again.");
  }
  if (err instanceof Error) {
    if (err.message.includes('rate_limit')) {
      throw new Error("Rate limited. Please wait a moment and try again.");
    }
    if (err.message.includes('timeout') || err.name === 'TimeoutError') {
      throw new Error("Analysis took too long. Try a shorter article.");
    }
  }
  throw err;
}
```

---

#### 6. **No Retry Logic for Transient Failures**
**File:** `src/lib/research.functions.ts` (fetchWithTimeout)
```typescript
async function fetchWithTimeout(url: string, timeoutMs = 20000): Promise<Response> {
  // ✅ Has timeout
  // ❌ MISSING: No retry on transient errors (429, 503, timeout)
  // Add: exponential backoff for retries
}
```
**Improvement:** Add retry utility:
```typescript
async function fetchWithRetry(
  url: string,
  maxRetries = 2,
  timeoutMs = 20000
): Promise<Response> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fetchWithTimeout(url, timeoutMs);
    } catch (err) {
      if (i === maxRetries) throw err;
      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

---

#### 7. **Missing Content Security Policy (CSP) Headers**
**File:** Global (not in code, needs Vite/server config)
```typescript
// ✅ Should add to vite.config.ts or server.ts
headers: {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' https://fonts.googleapis.com",
}
```

---

#### 8. **No Rate Limiting on Server Functions**
**File:** `src/lib/research.functions.ts`
```typescript
export const ingestArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  // ✅ Auth check present
  // ❌ MISSING: Rate limit per user (e.g., 10 articles/hour)
  .handler(async ({ data, context }) => {
    // Should check:
    // SELECT COUNT(*) FROM articles WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour'
    // if (count > 10) throw new Error('Rate limited');
  });
```

---

### 🟡 MEDIUM (Nice to Have)

#### 9. **No Loading State in Auth Page While Google OAuth Redirects**
**File:** `src/routes/auth.tsx` (line 69-81)
```tsx
async function handleGoogle() {
  setLoading(true);
  try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw result.error;
    if (!result.redirected) navigate({ to: "/app" }); // ✅ Good
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Sign-in failed");
    setLoading(false); // ✅ Good
  }
}
// ⚠️ If `result.redirected` is true, component unmounts — loading state cleared by browser anyway
// But consider: Show "Redirecting..." message before redirect
```

---

#### 10. **Missing Accessibility in Marketing Nav**
**File:** `src/components/marketing/MarketingNav.tsx` (line 33-43)
```tsx
<div className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
  <a href="#platform" className="transition-colors hover:text-accent">
    Platform
  </a>
  // ✅ GOOD: Semantic <a> tags
  // ⚠️ MISSING: Skip to main content link, focus management
</div>
```
**Improvement:** Add skip link:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

#### 11. **No Input Sanitization for Article Text**
**File:** `src/lib/research.functions.ts` (line 195)
```typescript
let content = data.text ?? "";
// ✅ Good: Zod validates max 200,000 chars
// ⚠️ MISSING: Sanitize HTML/script tags if pasted from rich text editors
// DOMPurify is overkill here, but consider: basic HTML stripping
```

---

#### 12. **MarketingNav Logo Missing Proper Loading Attribute**
**File:** `src/components/marketing/MarketingNav.tsx` (line 25-31)
```tsx
<img
  src={logo}
  alt="SourceIQ"
  className="h-8 w-auto md:h-9"
  width={200}
  height={64}
  // ✅ GOOD: alt, width, height
  // ⚠️ MISSING: loading="lazy" (though logo should be eager)
/>
```
**Improvement:** Add explicit loading:
```tsx
loading="eager" // Critical image, load immediately
```

---

#### 13. **Untitled Articles Default Should Be Indexed Uniquely**
**File:** `src/lib/research.functions.ts` (line 196)
```typescript
let title = data.title ?? "Untitled article";
// ✅ Works, but could be better:
let title = data.title ?? `Untitled article (${new Date().toISOString().split('T')[0]})`;
```

---

### 🟢 LOW (Polish & Performance)

#### 14. **Redundant Scroll Event Listener on Every Page Load**
**File:** `src/components/marketing/MarketingNav.tsx` (line 8-13)
```tsx
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20);
  onScroll(); // ✅ Good: initial call
  window.addEventListener("scroll", onScroll, { passive: true }); // ✅ Passive
  return () => window.removeEventListener("scroll", onScroll);
}, []);
// ⚠️ LOW: Listener is removed on unmount, but if nav is always present, no issue
```

---

#### 15. **No Analytics Tracking**
**File:** Global
```typescript
// ⚠️ MISSING: Add analytics for:
// - Article ingestion (success/failure/platform)
// - Analysis completion time
// - Study material generation
// Example: analytics.track('article_ingested', { platform: 'wikipedia', wordCount });
```

---

#### 16. **Missing Sitemap & Robots.txt**
**File:** `public/` directory
```
public/
├── sitemap.xml  // ✅ Add for SEO
├── robots.txt   // ✅ Add for crawlers
└── favicon.ico  // ✅ Add
```

---

#### 17. **No Error Boundary for Component Tree**
**File:** `src/routes/__root.tsx`
```tsx
// ✅ HAS error handler:
errorComponent: ErrorComponent,
// ✅ GOOD — covers route-level errors
// ⚠️ LOW: Consider React Error Boundary wrapper for non-route errors
```

---

## Summary Table

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| Missing password confirmation | 🔴 Critical | auth.tsx, reset-password.tsx | Needs fix |
| No max content length validation | 🔴 Critical | research.functions.ts | Needs fix |
| Missing HTTPS protocol check | 🔴 Critical | research.functions.ts | Needs fix |
| No retry logic for transient failures | ⚠️ High | research.functions.ts | Recommended |
| Missing rate limiting | ⚠️ High | research.functions.ts | Recommended |
| Missing CSP headers | ⚠️ High | vite.config.ts | Recommended |
| AI error recovery incomplete | ⚠️ High | research.functions.ts | Recommended |
| Missing accessibility features | 🟡 Medium | MarketingNav.tsx | Nice to have |
| No analytics tracking | 🟢 Low | Global | Polish |
| Missing sitemap/robots.txt | 🟢 Low | public/ | Polish |

---

## Recommendations for Phase 3

### Quick Wins (1-2 hours)
1. Add password confirmation
2. Add HTTPS protocol validation
3. Add max content length check
4. Add CSP headers

### Medium Effort (2-3 hours)
5. Add retry logic with exponential backoff
6. Improve AI error messages
7. Add accessibility features (skip links)
8. Create public assets (sitemap, robots.txt)

### Longer Term
9. Implement rate limiting
10. Add analytics
11. Add input sanitization
12. Add comprehensive test suite

---

## Code Quality Metrics

| Metric | Status | Notes |
|--------|--------|-------|
| TypeScript Coverage | ✅ Good | Strict mode enabled |
| Error Handling | ⚠️ Partial | Some edge cases missing |
| Security | ⚠️ Good | Needs HTTPS check + rate limits |
| Accessibility | 🟡 Basic | Marketing nav needs work |
| Performance | ✅ Good | SSR, code splitting, caching |
| Test Coverage | 🔴 None | No tests yet |

---

## Next Steps

1. **Review & Prioritize:** Which issues are blocking production?
2. **Create Issues:** Convert these findings to GitHub issues
3. **Phase 4:** Refactor & fix (estimated 4-6 hours)
4. **Phase 5:** Feature development

---

**Audit Date:** 2026-07-16  
**Auditor:** Copilot (Senior Code Review)  
**Codebase:** SourceIQ Prototype
