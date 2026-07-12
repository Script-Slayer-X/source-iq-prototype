# SourceIQ — Design System

**Luminous Scholar.** Dark-first, editorial serif display, luminous cyan accent, deep shadows, glass surfaces. Optional light mode via `class="light"` on `<html>`.

All tokens live in `src/styles.css`. **Never hardcode values in components** — always reference the token or its Tailwind utility.

---

## 1. Color palette

Palette is semantic, not literal. Components reference roles (`bg-card`, `text-muted-foreground`), never hexes.

### Core roles (dark & light)

| Token | Utility | Dark | Light | Use |
|---|---|---|---|---|
| `--background` | `bg-background` | `hsl(230 20% 3%)` | `hsl(40 20% 98%)` | Page canvas |
| `--foreground` | `text-foreground` | `hsl(230 10% 96%)` | `hsl(230 25% 10%)` | Body text |
| `--card` | `bg-card` | `hsl(230 20% 6%)` | `hsl(0 0% 100%)` | Elevated surfaces |
| `--popover` | `bg-popover` | `hsl(230 22% 5%)` | `hsl(0 0% 100%)` | Floating menus |
| `--primary` / `--accent` | `bg-primary` / `text-accent` | `hsl(185 90% 65%)` — luminous cyan | `hsl(185 75% 38%)` | CTAs, focus, key highlights |
| `--secondary` | `bg-secondary` | `hsl(230 18% 10%)` | `hsl(230 15% 94%)` | Passive surfaces |
| `--muted` / `--muted-foreground` | `bg-muted` / `text-muted-foreground` | `hsl(230 18% 9%)` / `hsl(230 10% 60%)` | `hsl(230 15% 94%)` / `hsl(230 10% 40%)` | Subordinate text |
| `--border` | `border-border` | `hsl(230 10% 100% / 0.08)` | `hsl(230 15% 88%)` | Hairlines |
| `--ring` | via `focus-ring` | cyan @ 50% | cyan @ 40% | Focus outline |

### Status colors

| Token | Utility | Use |
|---|---|---|
| `--destructive` | `bg-destructive text-destructive-foreground` | Delete, dangerous confirm |
| `--success` | `bg-success text-success-foreground` | Verified sources, trust ≥ 80 |
| `--warning` | `bg-warning text-warning-foreground` | Bias flags, trust 40–79 |
| `--info` | `bg-info text-info-foreground` | Neutral notices |

Trust-score mapping (canonical): `≥80 → success`, `50–79 → warning`, `<50 → destructive`.

### Sidebar sub-scale

`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` — owned by `AppSidebar` and shadcn `Sidebar`. Do not reuse elsewhere.

---

## 2. Typography scale

Fonts loaded via `<link>` in `__root.tsx`:

| Family | Token | Use |
|---|---|---|
| Cormorant Garamond (italic 500/600) | `font-display` | Headlines, hero, empty-state titles |
| Inter (400/500/600/700) | `font-body`, `font-sans` | Everything body/UI |
| JetBrains Mono (400/500) | `font-mono` | Eyebrows, code, key caps, IDs |

Scale (Tailwind defaults; used consistently):

| Purpose | Class |
|---|---|
| Display / hero | `font-display italic text-5xl md:text-7xl leading-[1.05]` |
| Section title | `font-display italic text-4xl md:text-5xl leading-[1.05]` |
| H3 / card title | `text-xl font-semibold` |
| Body | `text-base leading-relaxed` |
| Small / meta | `text-sm text-muted-foreground` |
| Eyebrow | `font-mono text-[10px] uppercase tracking-[0.3em] text-accent` |
| Caption | `text-xs text-muted-foreground` |

Rule: `h1`/`h2`/`h3` inherit `font-display font-semibold` from base styles. Override to `font-body` explicitly when needed (rare).

---

## 3. Spacing system

4-pixel grid (Tailwind default). Use these values only:

`0 · 1 · 2 · 3 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 32` (→ `p-1` … `p-32`).

Semantic pairing:
- Inline gap in a control row: `gap-2`
- Card inner padding: `p-6` (or `p-8` on hero cards)
- Section vertical rhythm: `py-16 md:py-24`
- Page container: `mx-auto max-w-6xl px-6`

Avoid `p-5`, `p-7`, `p-9`, `p-11` — off-grid.

---

## 4. Border radius

| Token | Value | Utility | Use |
|---|---|---|---|
| `--radius-sm` | `radius − 4px` | `rounded-sm` | Chips, inline pills |
| `--radius-md` | `radius − 2px` | `rounded-md` | Inputs, small buttons |
| `--radius-lg` (base = `0.875rem` / 14px) | | `rounded-lg` | Buttons, dropdowns |
| `--radius-xl` | `radius + 4px` | `rounded-xl` | Cards |
| `--radius-2xl` | `radius + 8px` | `rounded-2xl` | Glass panels, elevated cards |
| `--radius-3xl` | `radius + 12px` | `rounded-3xl` | Hero surfaces |
| Full | | `rounded-full` | Avatars, pill CTAs, dials |

Rule: circles are `rounded-full`, everything else stays on the token scale.

---

## 5. Shadows & elevation

Elevation is a **single dimension**. Pick a level; do not stack custom shadows.

| Level | Utility | Token | Use |
|---|---|---|---|
| e0 | `elevation-0` / none | `--shadow-e0` | Inline surfaces |
| e1 | `elevation-1` | `--shadow-e1` | Hairline lift (rows, chips) |
| e2 | `elevation-2` | `--shadow-e2` | Cards, buttons hover |
| e3 | `elevation-3` | `--shadow-e3` | Popovers, dropdowns |
| e4 | `elevation-4` | `--shadow-e4` | Dialogs, sheets |
| e5 | `elevation-5` | `--shadow-e5` | Full-screen modals, hero glass |
| Focus | `focus-ring` | `--shadow-focus` | Focus-visible outline |
| Accent glow | `glow-accent` | `--shadow-glow` | Trust dial, active CTA |

Hover promotes by exactly **one** level (e2 → e3). Never more.

---

## 6. Surfaces

- `bg-background` — page canvas.
- `bg-card` + `border border-border` + `elevation-2` — standard card.
- `.glass-panel` (utility) — translucent glass with blur + saturate. Prefer via `<GlassPanel>` component.
- `bg-muted` — passive inline surface (code inline, subtle group backgrounds).

Do not mix glass and solid card on the same axis of hierarchy.

---

## 7. Icon sizing

Lucide only. Sizes align to text:

| Context | Class |
|---|---|
| Inline with body text | `size-4` (16px) |
| Buttons, sidebar items | `size-4` |
| Section eyebrow icon | `size-3.5` |
| Empty-state hero icon | `size-10` |
| Dashboard metric icon | `size-5` |
| Trust dial center glyph | `size-6` |

Stroke width stays at Lucide default (1.5). Never fill icons with color other than `currentColor`.

---

## 8. Animation timing

Durations (`--duration-*`) and easings (`--ease-*`) live in `styles.css`.

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 80ms | Ripple, tap acknowledge |
| `--duration-fast` | 140ms | Hover elevation, color shift |
| `--duration-base` | 220ms | Default UI transition |
| `--duration-slow` | 360ms | Sheet/dialog open, panel expand |
| `--duration-slower` | 640ms | Complex choreography |
| `--duration-reveal` | 800ms | Scroll-in reveal |

Easings:

| Token | Curve | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default in/out |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | Emphasis (dialog enter) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric loops (pulse) |
| `--ease-out-scholar` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveal / hero motion |

Default transition class: `transition-[background-color,color,box-shadow,transform] duration-[--duration-base] ease-[--ease-standard]`. Wrap into a component variant, don't repeat.

Animations always animate `transform` and/or `opacity`. Never `width`/`height`/`top`.

Global `@media (prefers-reduced-motion: reduce)` neutralizes durations — respect it, don't override.

---

## 9. Focus states

**All** interactive elements use the `focus-ring` utility (or shadcn primitive, which already implements it):

```
outline: none;
&:focus-visible {
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
}
```

Never use `outline-none` without a replacement. Never remove focus from links or buttons.

---

## 10. Hover states

- Buttons: elevation e2 → e3, background lightens one step (`hover:bg-primary/90` on primary, `hover:bg-secondary` on ghost).
- Cards (interactive): `hover:elevation-3 hover:border-border/60`, translate `-translate-y-0.5`.
- Links (body): underline via `.story-link` utility.
- Icon-only buttons: `hover:bg-muted` background tint.
- Duration: `--duration-fast`.

Non-interactive elements do **not** have hover state.

---

## 11. Disabled states

- Opacity **0.5** and `cursor-not-allowed`. shadcn handles this on primitives — do not re-implement.
- Never remove focus ring on disabled inputs — screen readers still traverse them.
- Disabled buttons keep their layout footprint (no `display: none`).
- Loading ≠ disabled. Loading uses `LoadingShimmer` or an inline spinner; disabled is a permission/validation state.

---

## 12. Transition durations (recap)

| Interaction | Duration | Easing |
|---|---|---|
| Color / bg swap | `--duration-fast` | `--ease-standard` |
| Elevation change | `--duration-fast` | `--ease-standard` |
| Transform (hover lift) | `--duration-base` | `--ease-standard` |
| Sheet / dialog open | `--duration-slow` | `--ease-emphasized` |
| Reveal on scroll | `--duration-reveal` | `--ease-out-scholar` |
| Trust-score dial fill | `--duration-slower` | `--ease-out-scholar` |

---

## 13. Utility inventory

Custom utilities declared in `src/styles.css`:

- `glass-panel` — translucent card with blur + saturate
- `animate-reveal` — one-shot fade+rise (paired with `<Reveal>` component)
- `animate-pulse-glow` — soft cyan pulse for live/active indicators
- `scholar-shimmer` — skeleton shimmer (used by `<LoadingShimmer>`)
- `elevation-1..5`, `glow-accent`
- `focus-ring`

Every future custom utility goes here via `@utility` — never inline `@apply` chains and never `tailwind.config.js` (Tailwind v4).

---

## 14. Contribution rules

1. Reach for a token before writing a value.
2. Reach for a `common/` component before making a new one (see `docs/COMPONENT_STRATEGY.md` once created).
3. Extend tokens by adding to `@theme` / `:root` / `.light` — never fork the file.
4. When adding a new semantic role, add it to **both** `dark` and `.light` in the same commit.
5. Never edit `src/components/ui/*` — extend by composition.
