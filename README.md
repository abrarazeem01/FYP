# NEXUS SENTINEL (نیکسس سینٹینل)
### AI-Driven Anti-Smuggling & Non-Custom-Paid (NCP) Vehicle Intelligence Platform

Nexus Sentinel is an enterprise-grade intelligence platform engineered for law enforcement, customs authorities, and automotive forensic analysts. It monitors public vehicle listings, social media posts, and classified marketplaces to detect illegal Non-Custom-Paid (NCP) vehicles, cut-piece assemblies, tampered chassis numbers, and automotive smuggling rings across Pakistan.

---

## 🏛 4-Phase System Architecture

The project is structured and deployed across 4 progressive phases:

```
nexus-sentinel/
├── supabase/                     # Phase 1: Database schemas, migrations, RLS policies & seeds
│   └── schema.sql
├── backend/                      # Phases 2 & 3: FastAPI core, data ingestion, ML & LLM forensics
│   ├── app/
│   │   ├── api/                  # API routers (auth, posts, cases, benchmarks, lexicon)
│   │   ├── core/                 # Config, security, database connection & LLM clients
│   │   ├── models/               # Pydantic schemas & DB interfaces
│   │   └── services/             # Slang matchers, price forensics, case escalation
│   └── data/                     # Offline datasets & market benchmarks
│       ├── pakwheels_used_cars.csv
│       ├── pakwheels_market_benchmarks.csv
│       └── slang_dataset.csv
├── frontend/                     # Phase 4: React / Vite + Tailwind CSS + Lucide Dashboard
│   ├── src/
│   │   ├── components/           # UI widgets, case cards, risk meters, telemetry
│   │   ├── pages/                # Live Feed, Case Management, Lexicon, Analytics
│   │   └── services/             # Supabase & Backend API clients
│   └── dist/                     # Production build artifacts
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git tracking ignore rules
├── .cursorignore                 # AI assistant indexing ignore rules
└── README.md                     # Platform documentation
```

### Phase Breakdown

1. **Phase 1: Project Foundation & Supabase Database Schema**
   - Repository setup, environment templates, and strict ignore policies.
   - Comprehensive PostgreSQL schema in Supabase with strong types, foreign keys, triggers, and Row-Level Security (RLS).
   - 3-tier organizational hierarchy (`super_admin`, `lead_analyst`, `field_investigator`).
   - Roman Urdu smuggling lexicon seed and initial authority profiles.

2. **Phase 2: Data Pipeline, Slang Detection & Market Price Forensics**
   - High-throughput ingestion of car advertisements and marketplace messages.
   - Algorithmic Roman Urdu slang identification with severity-weighted scoring.
   - Market benchmark price deviation analysis (`price_deviation_pct` calculation against PakWheels market data).
   - LLM forensics engine (Gemini / Groq / Ollama) for chassis number extraction, sentiment analysis, and risk explanation.

3. **Phase 3: 3-Tier Investigation Workflow & Security Hardening**
   - Case creation and automated risk-based prioritization (Low, Medium, High, Critical).
   - Role-based case escalation:
     - **Level 3 (Sulaman — Field Investigator):** Field verification and on-ground notes.
     - **Level 2 (Abrar — Lead Analyst):** Case escalation, multi-post pattern clustering, and validation.
     - **Level 1 (Miss Hiba — Super Admin):** Final legal verdict, warrant submission, and audit compliance.
   - Time-based One-Time Password (TOTP) two-factor authentication (2FA) and immutable audit logging.

4. **Phase 4: Nexus Sentinel Dashboard & Single-Port Production Serving**
   - High-density dark-themed tactical dashboard for operations centers.
   - Live telemetry, real-time flagged post stream, interactive case boards, and geospatial heatmaps.
   - **Unified Single-Port Deployment:** FastAPI backend serves both the `/api/*` endpoints and the compiled `/frontend/dist` static assets on `http://localhost:8000`.

---

## 📊 Dataset Placement

All training benchmarks and reference dictionaries must be placed inside `/backend/data/`:

| Dataset File | Target Path | Description |
| :--- | :--- | :--- |
| **PakWheels Used Cars** | `/backend/data/pakwheels_used_cars.csv` | Raw vehicle listings used for baseline training and validation. |
| **Market Benchmarks** | `/backend/data/pakwheels_market_benchmarks.csv` | Pre-calculated clean market pricing per Make, Model, Year, and City. |
| **Slang Dataset** | `/backend/data/slang_dataset.csv` | Roman Urdu automotive smuggling glossary and indicator weights. |

> **Security Note:** `*.csv` files are strictly excluded from version control via `.gitignore` to prevent leaking raw internal feeds.

---

## 🔒 3-Tier Operational Hierarchy

```
       ┌────────────────────────────────────────────────────────┐
       │   LEVEL 1: Super Admin (Miss Hiba)                     │
       │   - Full platform governance & user role assignment    │
       │   - Final enforcement verdicts & warrant approval      │
       │   - Complete immutable audit log visibility            │
       └───────────────────────────┬────────────────────────────┘
                                   │ Escalations & Audits
       ┌───────────────────────────▼────────────────────────────┐
       │   LEVEL 2: Lead Analyst (Abrar)                        │
       │   - Intelligence feed monitoring & batch post review   │
       │   - Case assignment and escalation to Super Admin      │
       │   - Lexicon curation & benchmark threshold tuning      │
       └───────────────────────────┬────────────────────────────┘
                                   │ Case Assignments
       ┌───────────────────────────▼────────────────────────────┐
       │   LEVEL 3: Field Investigator (Sulaman)                │
       │   - On-ground physical verification & field notes      │
       │   - Chassis number inspection & photo evidence upload  │
       │   - Restricted strictly to assigned active cases       │
       └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Setup (Phase 1)

### 1. Database Provisioning (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the **SQL Editor**.
2. Open [`supabase/schema.sql`](file:///c:/Users/Dell/OneDrive/NEXUS%20SENTINEL/supabase/schema.sql) and execute the entire script.
3. Verify that the tables, triggers, RLS policies, and initial seeds (`profiles`, `slang_lexicon`) are created.

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials, API keys (Gemini / Groq), and JWT secret.

### 3. Unified Production Serving (Single-Port Architecture)
In production, the application operates on a single port:
- **API Base:** `http://localhost:8000/api/v1`
- **Interactive API Docs:** `http://localhost:8000/docs`
- **Frontend Dashboard:** `http://localhost:8000/`

```bash
# Production single-port launch (FastAPI serves built frontend)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
