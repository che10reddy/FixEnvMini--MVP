**URL**: https://fixenvmini.lovable.app

---

# FixEnv Mini - Complete Project Documentation

## 📋 Project Overview

**FixEnv Mini** is a Python dependency analysis tool that scans GitHub repositories for dependency conflicts, missing version pins, security vulnerabilities (CVEs), and reproducibility issues. It leverages **Google Gemini 2.5 Flash AI** for intelligent conflict detection and generates portable `.zfix` environment snapshots.

### Core Purpose
- Analyze Python environments for conflicts, security vulnerabilities, and reproducibility issues
- Detect and parse 6 different Python dependency formats
- Provide AI-powered fix suggestions
- Generate exportable `.zfix` snapshots with fixed dependencies
- Works in browser (Web UI), terminal (CLI), and CI/CD pipelines

### Tagline
> "Python environments, fixed"

---

## 🏗️ Architecture Overview

flowchart TD
    subgraph Frontend["Frontend (React + Vite)"]
        A[Landing Page] --> B[Scanning Page]
        B --> C[Results Page]
        C --> D[Fix Preview Page]
        C --> E[Shared Results Page]
    end

    subgraph Backend["Backend (Lovable Cloud)"]
        F[analyze-repo] --> G[GitHub API]
        F --> H[Lovable AI Gateway]
        F --> I[OSV.dev API]
        J[generate-snapshot] --> H
        K[create-share] --> L[(Supabase DB)]
        M[get-share] --> L
    end

    subgraph External["External Services"]
        G[GitHub API]
        H[Google Gemini 2.5 Flash]
        I[OSV.dev CVE Database]
    end

    Frontend --> Backend

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3.1 | UI Framework |
| TypeScript | Type Safety |
| Vite 5.4.19 | Build Tool |
| Tailwind CSS 3.4.17 | Styling |
| shadcn/ui (Radix) | Component Library |
| TanStack React Query | Data Fetching/Caching |
| React Router DOM | Client-side Routing |
| Lucide React | Icons |

### Backend (Lovable Cloud)
| Technology | Purpose |
|------------|---------|
| Supabase Edge Functions (Deno) | Serverless Backend |
| Supabase PostgreSQL | Database |
| Google Gemini 2.5 Flash | AI Analysis |
| OSV.dev API | CVE Detection |
| GitHub Raw API | Repository Fetching |

---

## 📄 Page Structure & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index.tsx` | Landing page with hero, features, architecture diagram |
| `/scanning` | `Scanning.tsx` | Progress indicator during repository analysis |
| `/results` | `Results.tsx` | Display analysis results (issues, suggestions, vulnerabilities) |
| `/fix-preview` | `FixPreview.tsx` | Preview and download .zfix snapshot |
| `/share/:token` | `SharedResults.tsx` | Public shareable results page |
| `*` | `NotFound.tsx` | 404 error page |

---

## 🎨 Design System

### Color Palette (HSL)
```css
--background: 220 18% 8%       /* Dark background */
--foreground: 180 5% 92%       /* Light text */
--primary: 180 75% 55%         /* Teal/Cyan accent */
--accent: 180 75% 55%          /* Same as primary */
--card: 220 15% 12%            /* Card backgrounds */
--muted-foreground: 180 5% 65% /* Muted text */
--destructive: 0 72% 51%       /* Red for errors */
--border: 220 15% 20%          /* Border color */
--code-bg: 220 15% 10%         /* Code block background */
```

### Typography
- **Headings**: `Outfit` font family
- **Body**: `Inter` font family  
- **Code**: `JetBrains Mono` / `Fira Code`

### Custom Animations
- `animate-gradient` - Gradient color shift
- `animate-float` - Subtle floating effect for cards
- `animate-pulse-glow` - Pulsing glow on headlines
- `animate-fade-in` - Fade-in entrance animation
- `shimmer` - Loading skeleton effect

---

## 🔧 Frontend Components

### Core Components
| Component | File | Purpose |
|-----------|------|---------|
| `Header` | `Header.tsx` | Fixed navbar with logo (Wrench icon) and Docs link |
| `Footer` | `Footer.tsx` | Links to GitHub, CI/CD integration dialog, contact |
| `Hero` | `Hero.tsx` | Landing page hero with input, parallax scrolling |
| `Features` | `Features.tsx` | 4 feature cards + 3 usage method cards |
| `ArchitectureDiagram` | `ArchitectureDiagram.tsx` | 4-step pipeline visualization |
| `FloatingParticles` | `FloatingParticles.tsx` | Canvas-based interactive particles |
| `CLIDocsDialog` | `CLIDocsDialog.tsx` | Documentation dialog with CLI commands |

### Loading & Skeleton Components
| Component | Purpose |
|-----------|---------|
| `ScanningSkeleton` | Skeleton loader for scanning page |
| `ResultsSkeleton` | Skeleton loader for results page |
| `SnapshotProgressDialog` | Progress modal for snapshot generation |

### Feature Cards Content
1. **Dependency Analysis** - "Scan 6 formats: requirements.txt, pyproject.toml, Pipfile, poetry.lock, setup.py & Pipfile.lock"
2. **AI Fix Suggestions** - "25+ conflict patterns analyzed by Google Gemini for version pins, upgrades & fixes"
3. **Reproducible Snapshot** - "Export portable .zfix artifacts with fixed dependencies and dual scores"
4. **Security Scanning** - "Real-time CVE detection via Google OSV with CRITICAL/HIGH/MEDIUM/LOW ratings"

---

## ⚡ Edge Functions (Backend)

### 1. `analyze-repo` (Main Analysis)
**Location**: `supabase/functions/analyze-repo/index.ts`
**Rate Limit**: 10 requests/minute/IP
**JWT Required**: No

**Functionality**:
1. Validates GitHub URL (strict hostname check)
2. Checks cache (24-hour TTL based on commit SHA)
3. Fetches 6 dependency file types in parallel
4. Detects Python version from 5+ sources
5. Calls Gemini AI for analysis with 25+ conflict patterns
6. Queries OSV.dev for CVE detection
7. Calculates reproducibility score (weighted algorithm)
8. Caches results in database

**Supported Dependency Formats**:
- `requirements.txt` (pip)
- `pyproject.toml` (Poetry/PEP 517)
- `poetry.lock`
- `Pipfile` (Pipenv)
- `Pipfile.lock`
- `setup.py` (Setuptools)

**Python Version Detection Sources**:
- `pyproject.toml`
- `.python-version`
- `runtime.txt`
- `.github/workflows/*.yml`

**Reproducibility Score Algorithm**:
```
Base Score: 50 points
+ Version Pinning: 0-30 points (based on % pinned)
+ No Conflicts: 0-25 points
+ Package Health: 0-15 points (no outdated packages)
- Critical CVEs: -10 points each (max -20)
- High CVEs: -5 points each (max -10)
= Final Score: 0-100 (capped)
```

---

### 2. `generate-snapshot` (Snapshot Generation)
**Location**: `supabase/functions/generate-snapshot/index.ts`
**Rate Limit**: 5 requests/minute/IP (stricter for AI-heavy)
**JWT Required**: No

**Functionality**:
1. Receives analysis data from frontend
2. Determines output format (requirements.txt, pyproject.toml, or Pipfile)
3. Calls Gemini AI to generate complete fixed dependency file
4. Builds `.zfix` JSON structure with all metadata
5. Returns downloadable artifact

**.zfix File Structure**:
```json
{
  "version": "1.0",
  "generated_at": "ISO timestamp",
  "generator": "FixEnv Mini",
  "metadata": {
    "repository_url": "...",
    "python_version": "...",
    "detected_formats": [...],
    "primary_format": "..."
  },
  "analysis": {
    "reproducibility_score": 85,
    "total_issues": 3,
    "issues": [...],
    "suggestions": [...],
    "dependency_changes": [...],
    "vulnerabilities": [...],
    "vulnerability_count": 2
  },
  "fixed_dependencies": {
    "format": "requirements.txt",
    "content": "# Fixed file content..."
  }
}
```

---

### 3. `create-share` (Create Shareable Link)
**Location**: `supabase/functions/create-share/index.ts`
**Rate Limit**: 20 requests/minute/IP
**JWT Required**: No

**Functionality**:
1. Generates unique 12-character share token
2. Stores analysis data in `shared_results` table
3. Returns shareable URL

---

### 4. `get-share` (Retrieve Shared Results)
**Location**: `supabase/functions/get-share/index.ts`
**Rate Limit**: 30 requests/minute/IP
**JWT Required**: No

**Functionality**:
1. Validates share token
2. Fetches analysis data from database
3. Increments view count
4. Returns full analysis data

---

## 🗄️ Database Schema

### Table: `shared_results`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | Primary key |
| `created_at` | timestamptz | `now()` | Creation timestamp |
| `share_token` | text | - | Unique 12-char token for sharing |
| `repository_url` | text | - | GitHub repository URL (or cache key) |
| `analysis_data` | jsonb | - | Complete analysis results |
| `view_count` | integer | 0 | Number of times viewed |
| `expires_at` | timestamptz | - | Cache expiration (24h for cache entries) |

### RLS Policies
- `Anyone can view shared results` - SELECT with `USING (true)`
- `Anyone can create shared results` - INSERT with `WITH CHECK (true)`
- `Anyone can update view count` - UPDATE with `USING (true)`

> ⚠️ **Security Note**: Current RLS policies are permissive. All operations go through edge functions with service role keys, so direct client access should be restricted.

---

## 🔐 Security Features

### Implemented Security
1. **Rate Limiting** - All edge functions have IP-based rate limits
2. **URL Validation** - Strict GitHub hostname validation using URL parser
3. **CORS Headers** - Proper cross-origin configuration
4. **Service Role Keys** - Database writes use service role, not anon key
5. **No Direct API Key Exposure** - All AI calls go through edge functions

### Security Scanning
- **OSV.dev Integration** - Free CVE detection (no API key required)
- **Severity Levels** - CRITICAL, HIGH, MEDIUM, LOW based on CVSS scores
- **Security Score** - 0-100 score based on vulnerability count/severity

---

## 📦 CLI Tool

**Package**: `fixenv-cli` (npm)
**Location**: `cli/` directory

### Installation
```bash
npm install -g fixenv-cli
# or use directly
npx fixenv-cli scan https://github.com/user/repo
```

### Usage
```bash
# Basic scan
npx fixenv-cli scan https://github.com/pallets/flask

# JSON output (for CI/CD)
npx fixenv-cli scan https://github.com/pallets/flask --json

# Help
npx fixenv-cli --help
```

### CLI Output
```
🔧 FixEnv - Python Environment Analysis
──────────────────────────────────────────────────
Repository: pallets/flask
Python: ^3.8
Formats: Requirements.txt, Setup.py

📊 Reproducibility Score: 87%
⚠️  Issues Found: 3
🔒 Vulnerabilities: 1 (High)
```

---

## 🔄 CI/CD Integration (GitHub Actions)

The footer includes a ready-to-use GitHub Actions workflow:

```yaml
name: FixEnv Security Check
on: [push, pull_request]

jobs:
  fixenv-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run FixEnv Analysis
        run: |
          REPO_URL="https://github.com/${{ github.repository }}"
          npx fixenv-cli scan $REPO_URL --json > fixenv-report.json

      - name: Check for Critical Vulnerabilities
        run: |
          CRITICAL=$(cat fixenv-report.json | jq '.vulnerabilities | map(select(.severity == "CRITICAL" or .severity == "HIGH")) | length')
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Found $CRITICAL critical/high severity vulnerabilities"
            exit 1
          fi

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: fixenv-report
          path: fixenv-report.json
```

---

## 🎯 AI Knowledge Base (Conflict Patterns)

The AI prompt includes 25+ real-world dependency conflict patterns:

1. **Missing version pins** - `numpy` without version
2. **Python compatibility** - pandas <1.5 breaks on Python 3.11+
3. **Breaking upgrades** - SQLAlchemy 2.0 + Flask-SQLAlchemy <3
4. **Deprecated packages** - `sklearn` → `scikit-learn`
5. **CUDA/GPU mismatches** - torch versions need matching CUDA
6. **Indirect conflicts** - transformers 4.33+ requires tokenizers 0.14+
7. **TensorFlow** - TensorFlow 2.3 requires Python 3.6-3.8
8. **Pydantic** - Pydantic 2.0 + FastAPI <0.100

---

## 📁 Project File Structure

```
├── cli/                          # CLI tool
│   ├── index.js                  # CLI entry point
│   ├── package.json
│   └── README.md
├── src/
│   ├── App.tsx                   # Main app with routing
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles & design system
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ArchitectureDiagram.tsx
│   │   ├── FloatingParticles.tsx
│   │   ├── CLIDocsDialog.tsx
│   │   ├── ScanningSkeleton.tsx
│   │   ├── ResultsSkeleton.tsx
│   │   └── SnapshotProgressDialog.tsx
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Scanning.tsx
│   │   ├── Results.tsx
│   │   ├── FixPreview.tsx
│   │   ├── SharedResults.tsx
│   │   └── NotFound.tsx
│   ├── hooks/
│   │   ├── use-scroll-animation.tsx
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   └── integrations/supabase/
│       ├── client.ts              # Auto-generated
│       └── types.ts               # Auto-generated
├── supabase/
│   ├── config.toml                # Function configuration
│   └── functions/
│       ├── analyze-repo/index.ts
│       ├── generate-snapshot/index.ts
│       ├── create-share/index.ts
│       └── get-share/index.ts
├── tailwind.config.ts
├── package.json
└── vite.config.ts
```

---

## ⚙️ Configuration Files

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

### Available Secrets
- `LOVABLE_API_KEY` - AI Gateway access (auto-provisioned)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_PUBLISHABLE_KEY`

---

## 🚀 User Flow

sequenceDiagram
    participant U as User
    participant L as Landing Page
    participant S as Scanning Page
    participant E as Edge Function
    participant G as GitHub API
    participant A as Gemini AI
    participant O as OSV.dev
    participant R as Results Page
    participant F as Fix Preview

    U->>L: Enter GitHub URL
    U->>L: Click "Scan Repository"
    L->>S: Navigate with repoUrl
    S->>E: Call analyze-repo
    E->>G: Fetch dependency files (parallel)
    E->>G: Detect Python version
    E->>A: AI analysis with patterns
    E->>O: Check CVEs
    E-->>S: Return analysis
    S->>R: Navigate with results
    U->>R: View issues & suggestions
    U->>R: Click "Generate Snapshot"
    R->>E: Call generate-snapshot
    E->>A: Generate fixed file
    E-->>R: Return .zfix data
    R->>F: Navigate to preview
    U->>F: Download .zfix file

---

## 📊 Performance Optimizations

1. **Parallel File Fetching** - All 6 dependency files fetched simultaneously via `Promise.all()`
2. **Early Python Version Exit** - Stops checking once version found
3. **24-Hour Result Caching** - Cache key uses commit SHA for accuracy
4. **Optimized AI Prompt** - Reduced from ~3,500 to ~1,200 characters
5. **IP-Based Rate Limiting** - Prevents API abuse

---

### Long-Term Vision (Avastha)
- Full application runtime state capture into portable capsules
- AI-assisted environment diagnosis and repair
- Cross-platform support (macOS, Windows, Linux)
- Enterprise reproducibility and auditability

