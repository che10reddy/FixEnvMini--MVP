**URL**: https://lovable.dev/projects/ef31a04c-4b42-4fe1-abf0-3073492ed5be

# 🛠️ FixEnv Mini - Complete Project Documentation

## 📋 Project Overview

**FixEnv Mini** is a Python dependency analysis tool that scans GitHub repositories for dependency conflicts, missing version pins, and reproducibility issues. It uses **Google Gemini 2.5 Flash** (via Lovable AI Gateway) for intelligent analysis and generates portable `.zfix` environment snapshot files.

flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        A[Landing Page] --> B[Scanning Page]
        B --> C[Results Page]
        C --> D[Snapshot Preview]
        C --> E[Share Results]
    end

    subgraph Backend["Backend (Supabase Edge Functions)"]
        F[analyze-repo]
        G[generate-snapshot]
        H[create-share]
        I[get-share]
    end

    subgraph External["External Services"]
        J[GitHub API]
        K[Lovable AI Gateway]
        L[Google Gemini 2.5 Flash]
    end

    subgraph Database["Database (Supabase)"]
        M[(shared_results)]
    end

    A -->|Submit URL| F
    F -->|Fetch files| J
    F -->|AI Analysis| K
    K --> L
    F -->|Cache results| M
    C -->|Generate| G
    G -->|AI Generation| K
    C -->|Share| H
    H -->|Store| M
    E -->|Fetch| I
    I -->|Read| M

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.3.1, TypeScript, Vite |
| **Styling** | Tailwind CSS, tailwindcss-animate, shadcn/ui components |
| **State Management** | TanStack React Query |
| **Routing** | React Router DOM 6.30.1 |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | Supabase PostgreSQL |
| **AI** | Google Gemini 2.5 Flash via Lovable AI Gateway |
| **Icons** | Lucide React |

---

## 📁 File Structure & Architecture

### Frontend Pages (4 main + 2 utility)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `Index.tsx` | Landing page with Hero, Features, Footer |
| `/scanning` | `Scanning.tsx` | Progress indicator during analysis |
| `/results` | `Results.tsx` | Analysis results display |
| `/fix-preview` | `FixPreview.tsx` | Snapshot preview & download |
| `/share/:token` | `SharedResults.tsx` | Public shared results viewer |
| `*` | `NotFound.tsx` | 404 page |

### Backend Edge Functions (4 functions)

| Function | Purpose | JWT Required |
|----------|---------|--------------|
| `analyze-repo` | Fetches GitHub repo, parses dependencies, calls AI | No |
| `generate-snapshot` | Generates AI-corrected `.zfix` files | No |
| `create-share` | Creates shareable links for results | No |
| `get-share` | Retrieves shared results by token | No |

---

## 🎨 Design System

### Color Palette (HSL)
```css
--background: 220 18% 8%     /* Dark background */
--foreground: 180 5% 92%     /* Light text */
--primary: 180 75% 55%       /* Teal/cyan accent */
--accent: 180 75% 55%        /* Same teal for accent */
--destructive: 0 72% 51%     /* Red for errors */
--card: 220 15% 12%          /* Slightly lighter dark */
--border: 220 15% 20%        /* Subtle borders */
--code-bg: 220 15% 10%       /* Code block background */
```

### Typography
- **Display Font**: Outfit (700-900 weight) - Headlines
- **Body Font**: Inter (400-700 weight) - Body text
- **Code Font**: JetBrains Mono - Code blocks

### Custom Animations
| Animation | Description |
|-----------|-------------|
| `glow-text` | Text shadow with primary color glow |
| `glow-border` | Box shadow with primary color glow |
| `shimmer` | Loading skeleton shimmer effect |
| `pulse-glow` | Pulsing glow on headlines |
| `gradient-shift` | Animated gradient background |
| `float` | Subtle floating up/down motion |
| `parallax` | Scroll-based parallax on hero elements |

---

## 📄 Page-by-Page Deep Dive

### 1. Landing Page (`/`)

**Components:**
- `Header` - Fixed header with Wrench icon + "FixEnv Mini" branding
- `Hero` - Main input section with animated particles
- `Features` - 3 feature cards with scroll animations
- `Footer` - Links to GitHub, Docs, Contact

**Hero Features:**
- GitHub URL input field with icon
- "Scan Repository" button with glow effect
- `FloatingParticles` - Canvas-based particle animation
  - 50 particles with mouse repulsion effect
  - Connection lines between nearby particles
  - Teal color (`rgba(76, 201, 240)`)
- Parallax scrolling on title, subtitle, and input section
- Subtitle fades out on scroll

**Feature Cards:**
1. **Dependency Analysis** (Search icon) - Detect missing/conflicting versions
2. **AI Fix Suggestions** (Sparkles icon) - AI-powered recommendations
3. **Reproducible Snapshot** (FileText icon) - Generate .zfix files

---

### 2. Scanning Page (`/scanning`)

**Purpose:** Shows real-time progress while analyzing repository

**Progress Steps (6 total):**
1. Fetching repository
2. Detecting dependency files
3. Parsing dependencies
4. Checking for version conflicts
5. Sending data to AI Analyzer
6. Preparing your results

**UX Features:**
- Auto-progress through steps 1-4 (800ms each)
- Steps 5-6 wait for actual edge function response
- Progress bar: 70% during AI analysis → 85% → 100%
- Timeout warning after 15 seconds: "Large repository detected..."
- `ScanningSkeleton` loading state

**Data Flow:**
```typescript
// Receives from navigation state:
location.state.repoUrl

// Sends to Results page:
{
  analysisData,      // AI analysis results
  rawRequirements,   // Original file content
  detectedFormats,   // Array of detected formats
  foundFiles,        // Array of found dependency files
  pythonVersion,     // Detected Python version
  pythonVersionSource, // Where Python version was found
  repositoryUrl      // Original URL
}
```

---

### 3. Results Page (`/results`)

**Purpose:** Display analysis results and provide actions

**Sections:**
1. **Hero Section** - Title + detected format badges + Python version badge
2. **Python Version Info Card** - Shows detected Python version and source
3. **Success State** - If no issues found, shows celebration UI
4. **Issues Summary Card** - Lists detected issues with severity (High/Medium/Low)
5. **AI Suggestions Card** - Bullet list of AI recommendations
6. **Dependency Diff Viewer** - Before → After split view
7. **Action Buttons** - Generate Snapshot, Share Results
8. **CI/CD Guide** - GitHub Actions integration example

**Severity Styling:**
| Severity | Icon | Color |
|----------|------|-------|
| High | AlertTriangle | Red (destructive) |
| Medium | AlertCircle | Yellow |
| Low | Info | Blue |

**Actions:**
- **Generate Snapshot** → Opens `SnapshotProgressDialog` → Navigates to `/fix-preview`
- **Share Results** → Creates share link via `create-share` function → Copy to clipboard

---

### 4. Snapshot Preview Page (`/fix-preview`)

**Purpose:** Preview and download the `.zfix` environment snapshot

**Data Received:**
```typescript
{
  zfixData,           // Complete .zfix JSON structure
  fixedContent,       // AI-generated fixed dependency file
  filename,           // "environment.zfix"
  format,             // ".zfix"
  fixesApplied,       // Number of fixes
  repositoryUrl,      // Original URL
  reproducibilityScore, // 0-100 score
  issues,             // Issues array
  dependencyDiff      // Dependency changes array
}
```

**Sections (Top to Bottom):**

1. **Hero Section** - "Environment Snapshot (.zfix)"

2. **Snapshot Metadata Card:**
   - Repository URL
   - Python Version
   - Generated At (timestamp)
   - Detected Formats (badges)

3. **Analysis Summary Card:**
   - Reproducibility Score (%)
   - Issues Detected (count)
   - AI Suggestions (count)

4. **Reproducibility Score Breakdown (Collapsible):**
   - SVG Circular Gauge (color-coded)
     - ≥80%: Teal/Primary
     - 50-79%: Yellow
     - <50%: Red
   - "What improved your score" (positive points)
   - "What lowered your score" (negative points)
   - Perfect score message: "🎉 Perfect score!"

5. **Fixed Dependencies (Collapsible):**
   - Syntax-highlighted code preview
   - Line numbers
   - Color-coded: comments (gray), pinned versions (teal)

6. **Full .zfix Structure (Collapsible):**
   - Raw JSON preview
   - "Copy JSON" button

7. **Action Buttons:**
   - "Download Snapshot" → Creates blob, triggers download
   - "Return Home" → Navigate to `/`

8. **Info Card** - Explains .zfix file format

**Score Points Generation Logic (`generatePoints()`):**
```typescript
// POSITIVE POINTS:
- No dependency issues detected
- All packages properly configured
- X packages properly pinned
- Dependencies are documented
- No critical issues found
- No conflicting dependencies

// NEGATIVE POINTS:
- X packages missing version pins
- X high-severity issues detected
- X medium-severity issues found
- X minor issues present
```

---

### 5. Shared Results Page (`/share/:token`)

**Purpose:** Public view of shared analysis results

**Features:**
- Fetches results via `get-share` edge function
- Displays view count badge
- Shows creation date
- Same layout as Results page (issues, suggestions, diff)
- CTA: "Try FixEnv on Your Repository"

---

## ⚙️ Backend Edge Functions - Deep Dive

### 1. `analyze-repo` Function

**Flow:**
```
1. Parse GitHub URL → Extract owner/repo
2. Check cache (24-hour TTL by commit SHA)
3. If cache hit → Return cached result
4. Detect branch (main vs master)
5. Fetch dependency files in PARALLEL
6. Detect Python version
7. Call Lovable AI Gateway for analysis
8. Calculate reproducibility score
9. Cache result → Return
```

**Supported Dependency Files:**
| File | Type | Format Label |
|------|------|--------------|
| requirements.txt | pip | Requirements.txt |
| pyproject.toml | poetry | Poetry (pyproject.toml) |
| poetry.lock | poetry-lock | Poetry Lock |
| Pipfile | pipenv | Pipenv |
| Pipfile.lock | pipenv-lock | Pipenv Lock |
| setup.py | setuptools | Setup.py |

**Python Version Detection Sources (Priority Order):**
1. pyproject.toml (already fetched)
2. .python-version (most common)
3. runtime.txt
4. .github/workflows/ci.yml
5. .github/workflows/main.yml
6. .github/workflows/test.yml

**AI Prompt Knowledge Base (25+ patterns):**
- Missing version pins
- Python compatibility conflicts (pandas <1.5 + Python 3.11)
- Dependency conflicts (scipy 1.5.x + numpy 1.26.x)
- Breaking upgrades (SQLAlchemy 2.0 + Flask-SQLAlchemy <3)
- Deprecated packages (sklearn → scikit-learn)
- CUDA mismatches

**Reproducibility Score Algorithm:**
```
Base: 50 points

Version Pinning (0-30 points):
- 100% pinned = +30
- Proportional to pinned percentage

Conflicts (0-25 points):
- 0 conflicts = +25
- ≤2 conflicts = +15
- ≤5 conflicts = +5

Package Health (0-15 points):
- 0 outdated = +15
- ≤3 outdated = +10
- ≤6 outdated = +5

Maximum: 100 (capped)
```

**AI Response Format:**
```json
{
  "issues": [{
    "title": "Missing version pin",
    "package": "numpy",
    "severity": "high",
    "category": "missing_pin",
    "description": "..."
  }],
  "suggestions": ["Pin numpy to 1.26.2..."],
  "dependencyDiff": [{
    "package": "numpy",
    "before": "unversioned",
    "after": "1.26.2"
  }]
}
```

---

### 2. `generate-snapshot` Function

**Purpose:** Generate AI-corrected dependency file and .zfix structure

**Input:**
```typescript
{
  issues, suggestions, dependencyDiff,
  detectedFormats, primaryFormat, pythonVersion,
  rawRequirements, repositoryUrl, reproducibilityScore
}
```

**Output Format Detection:**
- Poetry/pyproject.toml → `pyproject.toml`
- Pipenv/Pipfile → `Pipfile`
- Default → `requirements.txt`

**AI Prompt Features:**
- Generates COMPLETE file with ALL dependencies
- Adds inline comments explaining each fix
- Auto-header with timestamp and Python version
- Format-specific templates

**.zfix Structure:**
```json
{
  "version": "1.0",
  "generated_at": "2025-12-01T...",
  "generator": "FixEnv Mini",
  "metadata": {
    "repository_url": "...",
    "python_version": "3.11",
    "detected_formats": ["Requirements.txt"],
    "primary_format": "Requirements.txt",
    "scan_timestamp": "..."
  },
  "analysis": {
    "reproducibility_score": 85,
    "total_issues": 3,
    "issues": [...],
    "suggestions": [...],
    "dependency_changes": [...]
  },
  "fixed_dependencies": {
    "format": "requirements.txt",
    "content": "# Auto-fixed by FixEnv Mini..."
  }
}
```

---

### 3. `create-share` Function

**Purpose:** Store analysis results and generate shareable token

**Token Generation:**
- 12-character alphanumeric string
- Uniqueness check (up to 5 retries)

**Storage:** Inserts into `shared_results` table

---

### 4. `get-share` Function

**Purpose:** Retrieve shared results and increment view count

**Flow:**
1. Fetch by `share_token`
2. If found → Increment `view_count`
3. Return analysis data, repository URL, view count, created date

---

## 🗄️ Database Schema

### `shared_results` Table

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `share_token` | text | NO | - |
| `analysis_data` | jsonb | NO | - |
| `repository_url` | text | NO | - |
| `created_at` | timestamptz | NO | `now()` |
| `view_count` | integer | NO | `0` |
| `expires_at` | timestamptz | YES | - |

### RLS Policies (Public Access)

| Policy | Command | Condition |
|--------|---------|-----------|
| Anyone can view shared results | SELECT | `true` |
| Anyone can create shared results | INSERT | - |
| Anyone can update view count | UPDATE | `true` |

---

## 🎭 UI Components

### Skeleton Loaders
- `ScanningSkeleton` - 5 step placeholders with shimmer
- `ResultsSkeleton` - Full results page placeholder

### Dialogs
- `SnapshotProgressDialog` - Simple spinner with "30 seconds" message

### Animations
- `PageTransition` - Fade in/out between routes
- `useScrollAnimation` - IntersectionObserver-based visibility detection

---

## 🔧 Configuration Files

### `supabase/config.toml`
```toml
project_id = "ncafkcmxumkklboonfhs"

[functions.analyze-repo]
verify_jwt = false

[functions.generate-snapshot]
verify_jwt = false

[functions.create-share]
verify_jwt = false

[functions.get-share]
verify_jwt = false
```

### Secrets Available
- `LOVABLE_API_KEY` - For AI Gateway access
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
