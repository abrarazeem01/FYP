# NEXUS SENTINEL (نیکسس سینٹینل)
## Final Year Project (FYP) Defense & Live Evaluation Walkthrough Guide

---

## 🎯 Executive Overview for the Evaluation Committee

**Nexus Sentinel** is an AI-driven Anti-Smuggling & Non-Custom-Paid (NCP) Vehicle Intelligence Platform engineered for Pakistan Customs, intelligence agencies, and federal law enforcement. It addresses illicit vehicle smuggling corridors across Balochistan, KP, and national transit highways by combining **Playwright OSINT social scraping**, **XLM-RoBERTa Roman Urdu slang detection**, **CatBoost price anomaly forensics**, and a **3-tier hierarchical escalation chain**.

---

## 🚀 Pre-Flight Setup & One-Click Launch

### Step 1: Automated Environment Setup
Run the automated provisioner in PowerShell (Windows) or Bash (Unix):
```powershell
.\setup_nexus.ps1
```
*What this does:*
- Configures Python virtual environment (`./venv`).
- Installs backend dependencies (`catboost`, `scikit-learn`, `playwright`, `pyotp`, `fastapi`).
- Downloads the Playwright Chromium browser (`playwright install chromium`).
- Installs frontend packages and compiles `/frontend/dist`.

### Step 2: System Pre-Flight Diagnostics
Validate the entire stack before starting the presentation:
```powershell
python backend/verify_system.py
```
*Expected Result:*
All diagnostics check out with green status flags (`✓ SYSTEM READY FOR LIVE DEMO & EVALUATION DEFENSE!`).

### Step 3: Launch Unified Single-Port Platform
```powershell
.\start_nexus.ps1
```
The server starts on `http://localhost:8000` and automatically opens in your default browser.

---

## 🎬 4-Act Live Demonstration Script

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEMONSTRATION TIMELINE                          │
├────────────────────────────────────────────────────────────────────────┤
│ ACT 1: Kinetic Brand Identity & 3D Centerpiece                         │
│ ACT 2: 3-Tier Hierarchy & Role-Based Access Control (RBAC)             │
│ ACT 3: On-Demand Facebook Group Scraper & ML Forensics Pipeline        │
│ ACT 4: Case Lifecycle & Judicial Escalation Chain (Sulaman→Abrar→Hiba) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### ACT 1: Kinetic Brand Identity & Interactive UI Centerpiece
**URL:** `http://localhost:8000/`

1. **Swiss Brutalist Typography & Telemetry Marquee:**
   - Highlight the oversized kinetic typography (**NEXUS SENTINEL**) and the operational defense status header.
   - Point out the active horizontal marquee ticker showing live border telemetry (Chaman, Quetta, Torkham).
2. **Interactive 3D Sentinel Core:**
   - **Action:** Click and drag the glossy metallic/glass capsule in the Hero section.
   - **What to explain to the jury:**
     > *"This is our reactive 3D telemetry core built with React Three Fiber and Drei. It features physical clearcoat transmission materials, an orbiting radar sensor ring, and a spring physics return mechanism (`PresentationControls`)."*
3. **Fluid Decaying Cursor Ribbon:**
   - **Action:** Move the mouse across the viewport to show the vermilion-orange (`#FF3B00`) kinetic ribbon trail fading smoothly on an HTML5 `<canvas>`.
   - Toggle it on/off using the **"TRAIL ON / OFF"** pill in the top navbar.
4. **Physics-Based Hanging Rope Theme Toggle:**
   - **Action:** Grab the hanging glowing tassel in the top-right corner and pull it downward past $60\text{px}$.
   - **Observation:** Notice the spring elastic recoil and the smooth CSS variable transition between **Obsidian Cyber Glass (Dark Mode)** and **Editorial Alabaster (Light Mode: `#F4F4F0` background with `#0D0D0D` ink)**.

---

### ACT 2: 3-Tier Operational Hierarchy & RBAC Governance
**URL:** `http://localhost:8000/settings` & `http://localhost:8000/admin`

Explain the constitutional division of responsibility:

| Tier | Officer | Role Identifier | Jurisdiction & Capabilities |
| :---: | :--- | :--- | :--- |
| **Level 1** | **Miss Hiba** | `super_admin` | Full platform governance, user role modification, and final judicial seizure/cleared verdicts. |
| **Level 2** | **Abrar** | `lead_analyst` | Intelligence monitoring, batch scraping execution, case assignment, and escalation. |
| **Level 3** | **Sulaman** | `field_investigator` | On-ground inspection, chassis welding verification, and field notes filing. |

1. **One-Click Role Demonstration Switcher:**
   - In the top-right navbar, click the officer badge dropdown (**Miss Hiba**).
   - Switch active identity to **Sulaman (Level 3 Field Investigator)**.
   - Notice the navigation bar dynamically hides the **Governance** tab.
   - Switch back to **Miss Hiba (Level 1 Super Admin)**.
   - Navigate to `/admin` to demonstrate the **Organizational Governance & RBAC Table**, where Miss Hiba can promote, demote, or reallocate roles in real time.
2. **TOTP Two-Factor Authentication (2FA):**
   - Navigate to `/settings`.
   - Click **"Enroll 2FA Secret"** to generate an OTPAuth QR code and Base32 secret using `pyotp` and `qrcode`.
   - Scan with Google Authenticator or enter a test passcode to activate two-factor security.

---

### ACT 3: On-Demand Facebook Group OSINT & ML Forensics
**URL:** `http://localhost:8000/scraper` & `http://localhost:8000/analyzer`

1. **Persistent Browser Context & Scraping Execution:**
   - Navigate to `/scraper`.
   - Notice the target input prefilled with a public automotive group: `https://www.facebook.com/groups/pakistan.cars.trade`.
   - Point out the **"Connect FB Session"** button:
     > *"We utilize Playwright's persistent context (`launch_persistent_context`) with `./fb_session`. Once an analyst logs in or approves 2FA, session cookies persist permanently without repeated logins."*
   - Click **"Auto-Scrape Group"** (batch: 15 posts).
   - Watch the **Live Automation Console** terminal update with real-time progress steps:
     - *"Navigating to group feed..."*
     - *"Automatically clicking 'See more' to expand hidden vehicle descriptions..."*
     - *"Computing SHA-256 deduplication hash..."*
     - *"Flagged NCP Unit — Risk 92%!"*
2. **Vehicle Forensics Lab (Instant Analysis):**
   - Navigate to `/analyzer`.
   - Click the test chip: **"Quetta Cut-Piece Corolla (NCP)"**.
   - Review the ad text:
     > *"Toyota Corolla 2020 NCP cut-piece Quetta chalta phirta without file 8 lakh final. Direct border cross."*
   - Click **"Analyze Vehicle Listing"**.
   - **Inspect the Output Matrix:**
     - **Extracted Vehicle:** `2020 Toyota Corolla (Quetta)`
     - **Detected Roman Urdu Slang:** `non-custom`, `cut-piece`, `chalta phirta`, `without file`
     - **Price Forensics:** Asking Price: `PKR 8.0 Lac` vs. PakWheels Fair Market Benchmark: `PKR 45.0 Lac`
     - **Price Deviation:** `-82.2%` (Critical undercutting characteristic of non-custom-paid vehicles)
     - **Composite Risk Score:** `95% (VERIFIED_NCP)`
     - **LLM Reasoning Drawer:** Detailed evidentiary justification prepared for law enforcement seizure.

---

### ACT 4: Case Lifecycle & Judicial Escalation Chain
**URL:** `http://localhost:8000/cases`

1. **Automated Escalation Threshold:**
   - Explain to the jury that whenever any post is analyzed with a `risk_score >= 70%`, the platform **automatically initiates an investigation case** in `public.investigation_cases`.
2. **Field Officer Inspection (Sulaman):**
   - Switch identity in the navbar to **Sulaman (Field Investigator)**.
   - Sulaman opens the case card for the suspected **2020 Toyota Corolla**.
   - Notice that Sulaman can add on-ground field notes:
     > *"On-ground inspection in Quetta warehouse confirmed altered chassis plate and severed welding seams on rear quarter panel."*
   - Notice that the **Legal Verdict** dropdown is disabled for Sulaman, enforcing separation of duties.
3. **Super Admin Final Legal Verdict (Miss Hiba):**
   - Switch identity back to **Miss Hiba (Super Admin)**.
   - Open the case inspection modal.
   - Notice the **Legal Verdict** selector is now enabled.
   - Select **Confirmed Smuggled (Seizure)** and save.
   - The case status updates across the board and is permanently recorded in `public.audit_logs`.

---

## 🏆 Key Architectural Highlights to Emphasize

1. **Unified Single-Port Deployment:**
   - Both API endpoints (`/api/*`, `/docs`) and the React 18 single-page application are served through a unified port (`8000`) without CORS friction in production.
2. **Hybrid ML Stack:**
   - **XLM-RoBERTa + Domain Lexicon:** High-recall Roman Urdu smuggling terminology extraction.
   - **CatBoost Regressor + Isolation Forest:** Trained on PakWheels market pricing to detect severe price undercutting ($35\% - 75\%$).
   - **Forensic LLM Reasoning:** Gemini / Ollama for structured vehicle entity extraction and legal reasoning summaries.
3. **Defensive Programming:**
   - Server-side regex validation, JWT role guards, SHA-256 deduplication, and zero-crash fallbacks ensuring resilience even if external databases or APIs are offline.

---

*Nexus Sentinel — Developed for Anti-Smuggling & Vehicle Intelligence Operations.*
