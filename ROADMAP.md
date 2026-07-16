# Phase 3: Production Roadmap for SourceIQ

## Overview

This roadmap prioritizes features from **highest to lowest impact** for turning SourceIQ into a production-ready SaaS. Each phase estimates effort, business value, and dependencies.

---

## Prioritization Framework

**Impact Score = (User Value × Revenue Potential × Competitive Advantage) / Effort**

- **Tier 1 (Weeks 1-2):** Foundation features — unblock other features, critical for MVP
- **Tier 2 (Weeks 3-4):** Core workflows — directly generate user value
- **Tier 3 (Weeks 5-6):** Polish & scaling — improve retention, performance
- **Tier 4 (Future):** Nice-to-haves — strategic but lower immediate impact

---

## TIER 1: Foundation (Weeks 1-2)

### 1.1 Workspace Dashboard
**Impact:** 🔴 **Critical** — Users need a hub to manage research  
**Effort:** 8-12 hours  
**Dependencies:** Auth ✅ (done)

**Deliverables:**
- [ ] Route: `/app` → Dashboard page
- [ ] List all articles for logged-in user
- [ ] Create new project/workspace
- [ ] Quick stats: Total articles, analyses, study sets
- [ ] Filter by status (draft, analyzed, studied)

**Features:**
```typescript
// Database queries needed
SELECT 
  id, title, source_url, created_at, 
  (SELECT COUNT(*) FROM analyses WHERE article_id = articles.id) AS analysis_count
FROM articles 
WHERE user_id = ? 
ORDER BY created_at DESC
```

**UI Components:**
- Article card grid/list
- "New article" button
- Search/filter sidebar
- Empty state

**Success Criteria:**
- ✅ Users see their articles on login
- ✅ Can create new projects
- ✅ Article counts display correctly

---

### 1.2 Article Ingestion UI
**Impact:** 🔴 **Critical** — Core user action (ingest → analyze → study)  
**Effort:** 10-14 hours  
**Dependencies:** `ingestArticle` function ✅ (done), Workspace dashboard (1.1)

**Deliverables:**
- [ ] Route: `/app/article/new` → Article ingestion form
- [ ] Two input modes: URL tab + Text tab
- [ ] Real-time URL validation & platform detection
- [ ] Submit → `ingestArticle` server function
- [ ] Success → redirect to article detail page
- [ ] Error handling with helpful messages

**Features:**
```tsx
// URL Input Tab
- Paste URL
- Auto-detect platform (YouTube, Wikipedia, Reddit, GitHub, etc.)
- Show platform icon & article preview if available
- Copy-paste from restricted sites → suggest "Paste text" tab

// Text Input Tab
- Rich text editor OR plain textarea
- Character counter (0-200,000)
- Optional: Drag & drop file upload (PDF, DOCX)

// Form Validation
- Zod schema: { url?: string, text?: string, projectId?: uuid }
- Require either URL or text
- Auto-trim whitespace
```

**UI Components:**
- Tabs (URL / Text / File)
- URL input with validation feedback
- Platform indicator badge
- Character counter
- Loading skeleton on submit
- Error toast notification

**Success Criteria:**
- ✅ User can paste URL and submit
- ✅ Platform detection shows accurate icon
- ✅ Text input accepts content
- ✅ Form prevents submission with empty fields
- ✅ Loading state during ingest
- ✅ Redirects to article detail on success

---

### 1.3 Article Detail Page
**Impact:** 🔴 **Critical** — Users view ingested articles  
**Effort:** 6-8 hours  
**Dependencies:** Article ingestion (1.2)

**Deliverables:**
- [ ] Route: `/app/article/:id` → Article detail page
- [ ] Display: Title, source URL, content preview
- [ ] Fetch article from Supabase
- [ ] Show "Analyze" button (launches analysis)
- [ ] Loading state while analysis runs
- [ ] Error handling if article not found

**Features:**
```typescript
// Fetch article
const article = await supabase
  .from('articles')
  .select('*')
  .eq('id', articleId)
  .eq('user_id', userId)
  .single();

// If not found, show 404
// If found, display with Analyze button
```

**UI Components:**
- Breadcrumb (Dashboard > Article Title)
- Article header (title, source URL, date)
- Content preview (truncated with scroll)
- "Analyze Now" button (triggers analysis)
- Loading state (spinner)
- Back button

**Success Criteria:**
- ✅ Users can view articles they ingested
- ✅ Non-owners cannot access
- ✅ "Analyze Now" button initiates analysis
- ✅ Graceful error for missing articles

---

## TIER 2: Core Workflows (Weeks 3-4)

### 2.1 Analysis Results Viewer
**Impact:** 🟠 **High** — Users see value from AI analysis  
**Effort:** 12-16 hours  
**Dependencies:** Article detail (1.3), `analyzeArticle` function ✅

**Deliverables:**
- [ ] Route: `/app/article/:id/analysis` → Analysis results
- [ ] Display: Trust score, claims, bias flags, sources
- [ ] Visual indicators: Trust score gauge, claim verdict badges
- [ ] Claims table: Text, verdict, confidence, rationale
- [ ] Bias flags with quote highlights
- [ ] Recommended sources with links
- [ ] Generate study material button

**Features:**
```tsx
// Trust Score Display
- Large visual: 0-100 gauge (red/yellow/green)
- Summary text (1-3 sentences)
- Key metrics: Claim accuracy %, Bias likelihood

// Claims Table
- Claim text (clickable → highlights in article)
- Verdict: "Supported" (green) | "Contested" (yellow) | "Unverified" (gray) | "False" (red)
- Confidence slider (0-100%)
- Rationale (expandable)

// Bias Flags
- Type badge (emotional-language, cherry-picking, etc.)
- Quote snippet
- Detailed explanation

// Sources
- Link cards with title + URL
- "Why recommended" explanation
- Open in new tab button
```

**UI Components:**
- Gauge chart (recharts or custom SVG)
- Badge system for verdicts
- Expandable card grid
- Table for claims
- Badge grid for bias types
- Link card component
- Loading skeleton

**Database Schema:**
```sql
-- Already exists, just needs viewer:
SELECT * FROM analyses WHERE article_id = ? AND user_id = ?;
```

**Success Criteria:**
- ✅ Trust score displays prominently
- ✅ Claims sortable/filterable by verdict
- ✅ Bias flags are clear & actionable
- ✅ Sources are accessible
- ✅ User can navigate back to article

---

### 2.2 Study Material Generator & Viewer
**Impact:** 🟠 **High** — Creates sticky user engagement (studying increases retention)  
**Effort:** 14-18 hours  
**Dependencies:** Analysis results (2.1), `generateStudyMaterial` function ✅

**Deliverables:**
- [ ] Route: `/app/article/:id/study` → Study material hub
- [ ] Three tabs: Flashcards | Summary | Quiz
- [ ] Flashcards: Flip animation, progress tracker
- [ ] Summary: Headline + key points + outline
- [ ] Quiz: MCQ with immediate feedback
- [ ] "Export" button (future: PDF, DOCX, Markdown)
- [ ] Progress saved to database

**Features:**

#### Flashcards Tab
```tsx
- Card display: Front (question) → Click to flip → Back (answer)
- Progress: "Card 3 of 12"
- Navigation: Previous / Next buttons
- Mark as "Learned" / "Need review"
- Keyboard support: Space to flip, Arrow keys to navigate
```

#### Summary Tab
```tsx
- Headline (bold, large)
- Key Points (bulleted list, 4-8 items)
- Outline (expandable sections with details)
- Copy to clipboard button
```

#### Quiz Tab
```tsx
- Question display
- MCQ options (3-5)
- Submit button
- Feedback: "Correct! ✅" or "Incorrect. The answer is: X"
- Show explanation
- Progress: "Question 3 of 8"
- Final score display
```

**Database Schema:**
```sql
-- Already exists:
SELECT * FROM study_sets 
WHERE article_id = ? AND user_id = ? 
ORDER BY kind;
```

**UI Components:**
- Tabs component (already exists)
- Flip card animation
- MCQ button group
- Progress bar
- Outline tree (recursive)
- Copy button with toast feedback

**Success Criteria:**
- ✅ All three study types render correctly
- ✅ Flashcard flip animation smooth
- ✅ Quiz calculates score accurately
- ✅ Users can navigate between cards/questions
- ✅ Progress persists on page reload

---

### 2.3 User Profile & Settings
**Impact:** 🟡 **Medium** — Required for account management, UX polish  
**Effort:** 6-8 hours  
**Dependencies:** Auth ✅

**Deliverables:**
- [ ] Route: `/app/settings` → Settings page
- [ ] Profile section: Name, email, avatar (gravatar)
- [ ] Account section: Change password, delete account
- [ ] Preferences: Email notifications, theme (light/dark)
- [ ] Data export: Download all analyses as JSON

**Features:**
```tsx
// Profile Card
- Display name (editable)
- Email (read-only)
- Avatar (gravatar or initials)
- Last login date

// Account Section
- Change password (old password → new password → confirm)
- Delete account (confirm dialog with 7-day grace period)

// Preferences
- Notification toggle: Email on new analysis complete
- Theme: Light / Dark / Auto
- Language: English (future: internationalization)

// Data Export
- Button: "Download my data"
- Exports: articles.json, analyses.json, study_sets.json
- File format: Timestamped ZIP
```

**Database Queries:**
```typescript
// Update profile
await supabase
  .from('profiles')
  .update({ full_name })
  .eq('id', userId);

// Delete account (cascade delete articles/analyses)
// Should use Supabase RLS policies + cascade rules
```

**UI Components:**
- Card layout
- Form inputs (editable fields)
- Toggle switches
- Confirm dialog
- Download button

**Success Criteria:**
- ✅ Users can edit profile
- ✅ Password change works
- ✅ Settings persist
- ✅ Data export generates valid JSON

---

## TIER 3: Polish & Scaling (Weeks 5-6)

### 3.1 Search & Filtering
**Impact:** 🟡 **Medium** — Improves discoverability for power users  
**Effort:** 8-10 hours  
**Dependencies:** Dashboard (1.1)

**Deliverables:**
- [ ] Full-text search across article titles & content
- [ ] Filter by: Status, date range, platform, trust score
- [ ] Sort by: Date, trust score, relevance
- [ ] Save searches (future feature)

**Implementation:**
```sql
-- Use Supabase full-text search
SELECT * FROM articles 
WHERE user_id = ? 
AND (title ILIKE ? OR content ILIKE ?)
AND created_at BETWEEN ? AND ?
ORDER BY created_at DESC;
```

**UI Components:**
- Search input with debounce
- Filter sidebar (expandable)
- Sort dropdown
- Result count badge
- "No results" empty state

---

### 3.2 Collaboration & Sharing
**Impact:** 🟡 **Medium** — Increases utility for teams  
**Effort:** 16-20 hours  
**Dependencies:** Article detail (1.3), Analysis viewer (2.1)

**Deliverables:**
- [ ] Share analysis (read-only link)
- [ ] Invite collaborators to project
- [ ] Comment on analyses (future: threaded comments)
- [ ] Role-based access: Owner, Editor, Viewer

**Database Schema:**
```sql
-- New tables
CREATE TABLE project_members (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  role ENUM('owner', 'editor', 'viewer'),
  created_at TIMESTAMP
);

CREATE TABLE shared_analyses (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id),
  shared_with_email TEXT,
  token UUID UNIQUE,
  expires_at TIMESTAMP NULLABLE,
  created_at TIMESTAMP
);
```

**UI Components:**
- Share modal (copy link)
- Invite dialog (email input + role selector)
- Member list with role badges
- Link expiration settings

---

### 3.3 Export & Reporting
**Impact:** 🟡 **Medium** — Increases user value (actionable reports)  
**Effort:** 12-14 hours  
**Dependencies:** Analysis viewer (2.1)

**Deliverables:**
- [ ] Export analysis as PDF (with charts)
- [ ] Export as DOCX (formatted report)
- [ ] Export as Markdown (for docs/wikis)
- [ ] Generate custom report (title, date range, branding)

**Tools:** 
- PDF: `jsPDF` + `html2canvas`
- DOCX: `docx` library
- Markdown: HTML-to-Markdown converter

**UI Components:**
- Export button dropdown
- Format selector
- Filename input
- Loading state (report generation)
- Download trigger

---

### 3.4 Performance Optimization
**Impact:** 🟢 **Low effort, high value** — Improves retention  
**Effort:** 6-8 hours

**Deliverables:**
- [ ] Implement image lazy loading
- [ ] Code split study material routes
- [ ] Optimize bundle size (audit)
- [ ] Add service worker (offline support)
- [ ] Database query optimization (indexes)

---

## TIER 4: Future Features

### 4.1 AI Chat & Exploration
**Impact:** 🟠 **High** — Sticky feature, increased engagement  
**Effort:** 16-20 hours  
**Features:** Ask questions about analyzed articles, get AI responses with citations

### 4.2 Mobile App
**Impact:** 🟠 **High** — Reach more users  
**Effort:** 40+ hours (React Native or Flutter)

### 4.3 Advanced Bias Detection
**Impact:** 🟡 **Medium** — Competitive advantage  
**Effort:** 20+ hours (ML model training/fine-tuning)

### 4.4 Real-time Collaboration
**Impact:** 🟡 **Medium** — Team feature  
**Effort:** 12-16 hours (Supabase Realtime)

### 4.5 Browser Extension
**Impact:** 🟡 **Medium** — Increased usage  
**Effort:** 20+ hours

### 4.6 Integrations
**Impact:** 🟢 **Low** — Nice to have  
**Effort:** 8+ hours each
- Slack notifications
- Google Drive export
- Notion integration

---

## Timeline & Resource Plan

### MVP (Weeks 1-2): TIER 1
**Team:** 1-2 developers  
**Deliverable:** Users can ingest → view → analyze articles

### Phase 2 (Weeks 3-4): TIER 2
**Team:** 1-2 developers  
**Deliverable:** Complete user workflow (study materials, profile)

### Phase 3 (Weeks 5-6): TIER 3
**Team:** 1-2 developers + Designer  
**Deliverable:** Polish, search, sharing, export

### Phase 4+ (Weeks 7+): TIER 4
**Team:** 2-3 developers + Designer + ML Engineer  
**Deliverable:** Advanced features, scaling

---

## Success Metrics by Phase

### TIER 1 (MVP Launch)
- [ ] 50+ articles ingested daily
- [ ] 0% crash rate
- [ ] < 2s page load time
- [ ] 90% auth success rate

### TIER 2 (Feature Complete)
- [ ] 30% of users generate study materials
- [ ] 70% return within 7 days
- [ ] NPS > 30
- [ ] < 5% error rate

### TIER 3 (Optimized)
- [ ] 50% of users share analyses
- [ ] 80% return within 7 days
- [ ] NPS > 50
- [ ] < 1% error rate

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AI analysis slow/fails | Add fallback prompts, timeout handling (see AUDIT.md) |
| Database scalability | Implement caching, query optimization, read replicas |
| UI/UX friction | Conduct user testing before each phase |
| Security vulnerabilities | Regular audits, rate limiting (see AUDIT.md) |
| Competitor features | Fast iteration, focus on unique bias detection |

---

## Budget Estimate

| Phase | Estimate | Notes |
|-------|----------|-------|
| TIER 1 (MVP) | $8K-12K | 1-2 devs, 2 weeks |
| TIER 2 | $12K-16K | 1-2 devs, 2 weeks |
| TIER 3 | $10K-14K | 1-2 devs, designer, 2 weeks |
| TIER 4 (MVP→Scale) | $50K+ | Scaling, ML, mobile, team growth |

---

## Next Steps

1. **Phase 4:** Implement TIER 1 features (refactoring + fixes)
2. **Gather Feedback:** User testing on TIER 1
3. **Iterate:** TIER 2 based on early usage patterns
4. **Plan Scaling:** Infrastructure for TIER 3+

---

**Roadmap Version:** 1.0  
**Last Updated:** 2026-07-16  
**Project:** SourceIQ SaaS  
**Status:** Ready for Phase 4 (Refactoring & Implementation)
