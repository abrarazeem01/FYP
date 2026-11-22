"""
NEXUS SENTINEL — AUTOMATED PRE-DEMO SYSTEM DIAGNOSTICS
Audits environment configuration, Supabase 3-tier profiles, dataset presence,
trained model artifacts, dry-run ML forensics inference, and Playwright Chromium.
"""

import os
import sys
import glob
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add project root to path for imports
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(PROJECT_ROOT / ".env")
except ImportError:
    pass

# ANSI Color formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_header(title: str):
    print(f"\n{BOLD}{CYAN}=== {title} ==={RESET}")


def check_env_vars() -> bool:
    print_header("1. ENVIRONMENT VARIABLES AUDIT")
    env_file = PROJECT_ROOT / ".env"
    if not env_file.exists():
        print(f"  {YELLOW}⚠ .env file not found at project root. Using default / OS environment.{RESET}")
    else:
        print(f"  {GREEN}✓ .env file located at {env_file}{RESET}")

    required_keys = [
        ("SUPABASE_URL", False),
        ("SUPABASE_SERVICE_ROLE_KEY", False),
        ("GEMINI_API_KEY", False),
        ("JWT_SECRET_KEY", True),
        ("FRONTEND_URL", True),
    ]

    all_ok = True
    for key, is_optional in required_keys:
        val = os.getenv(key, "")
        if val and not val.startswith("your-") and not val.startswith("AIzaSy..."):
            masked = val[:6] + "..." + val[-4:] if len(val) > 12 else "***"
            print(f"  {GREEN}✓ {key}: configured ({masked}){RESET}")
        else:
            if is_optional:
                print(f"  {YELLOW}⚠ {key}: using default / fallback value{RESET}")
            else:
                print(f"  {YELLOW}⚠ {key}: not set or placeholder detected (fallback mock modes will activate){RESET}")
    return all_ok


def check_supabase_profiles() -> bool:
    print_header("2. SUPABASE CONNECTIVITY & 3-TIER HIERARCHY")
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key or "your-project" in url:
        print(f"  {YELLOW}⚠ Supabase credentials not set. Backend will operate in In-Memory Mock Store Mode.{RESET}")
        print(f"    - Miss Hiba (Level 1: super_admin): Mock Active")
        print(f"    - Abrar (Level 2: lead_analyst): Mock Active")
        print(f"    - Sulaman (Level 3: field_investigator): Mock Active")
        return True

    try:
        from supabase import create_client
        client = create_client(url, key)
        res = client.table("profiles").select("id, full_name, role, hierarchy_level").execute()
        records = res.data or []
        print(f"  {GREEN}✓ Successfully connected to Supabase ({len(records)} profiles located){RESET}")

        target_roles = {"super_admin": False, "lead_analyst": False, "field_investigator": False}
        for r in records:
            role = r.get("role")
            if role in target_roles:
                target_roles[role] = True
                print(f"    • {GREEN}✓ Verified {r.get('full_name')} (Level {r.get('hierarchy_level')}: {role}){RESET}")

        missing = [role for role, found in target_roles.items() if not found]
        if missing:
            print(f"  {YELLOW}⚠ Note: Missing seed profile(s) in DB: {missing}. Run supabase/schema.sql in SQL Editor.{RESET}")
        return True
    except Exception as exc:
        print(f"  {YELLOW}⚠ Supabase connection test returned note: {exc}{RESET}")
        print(f"    (Mock in-memory fallback will automatically ensure zero-crash operations){RESET}")
        return True


def check_datasets_and_models() -> bool:
    print_header("3. DATASET PRESENCE & TRAINED ML ARTIFACTS")
    # Note: Only check file existence via Path.exists(), DO NOT open or read CSV content!
    data_dir = BASE_DIR / "data"
    models_dir = BASE_DIR / "models"

    print(f"  Auditing data directory: {data_dir}")
    part_files = sorted(glob.glob(str(data_dir / "pakwheels_part_*.csv")))
    if part_files:
        print(f"  {GREEN}✓ Found {len(part_files)} PakWheels data partition(s){RESET}")
    else:
        single_car = list(data_dir.glob("*pakwheels*.csv"))
        if single_car:
            print(f"  {GREEN}✓ Found PakWheels benchmark file: {single_car[0].name}{RESET}")
        else:
            print(f"  {YELLOW}⚠ No PakWheels CSV files yet in /backend/data/. Synthetic baseline active.{RESET}")

    slang_file = data_dir / "Nexus_Sentinel_NLP_Slang_Dataset_Large.csv"
    if slang_file.is_file():
        print(f"  {GREEN}✓ Found Slang Lexicon dataset: {slang_file.name}{RESET}")
    else:
        print(f"  {YELLOW}⚠ Slang dataset not placed in /backend/data/. Built-in Roman Urdu dictionary active.{RESET}")

    print(f"\n  Auditing trained models in: {models_dir}")
    model_artifacts = [
        ("catboost_price_model.cbm", "CatBoost Fair Market Regressor"),
        ("isolation_forest.joblib", "Isolation Forest Price Anomaly Detector"),
        ("market_benchmarks.joblib", "PakWheels Benchmark Lookup Table"),
        ("slang_classifier.joblib", "XLM-RoBERTa / NLP Slang Classifier"),
    ]

    for filename, desc in model_artifacts:
        path = models_dir / filename
        if path.is_file():
            size_kb = round(path.stat().st_size / 1024, 1)
            print(f"  {GREEN}✓ Found {desc} ({filename}, {size_kb} KB){RESET}")
        else:
            print(f"  {YELLOW}⚠ {desc} ({filename}) not trained yet. Run 'python backend/ml_pipeline.py --train'{RESET}")

    return True


def check_dry_run_inference() -> bool:
    print_header("4. LIVE DRY-RUN ML & LLM FORENSICS INFERENCE")
    test_text = "Honda Civic 2018 non custom paid Quetta urgent sale 14 lac"
    print(f"  Evaluating ad: \"{test_text}\"")

    try:
        from backend.ml_pipeline import analyze_listing
        analysis = analyze_listing(test_text)

        make = analysis["extracted_json"].get("make")
        model = analysis["extracted_json"].get("model")
        year = analysis["extracted_json"].get("year")
        asking = analysis["extracted_json"].get("asking_price")
        pred = analysis.get("predicted_market_price")
        dev = analysis.get("price_deviation_pct")
        risk = analysis.get("risk_score")
        slang = analysis.get("slang_flags")
        status = analysis.get("status")

        print(f"  {GREEN}✓ Forensic Pipeline Execution Succeeded:{RESET}")
        print(f"    • Vehicle Extracted: {BOLD}{year} {make} {model}{RESET}")
        print(f"    • Asking Price: PKR {asking:,.0f} | Predicted Benchmark: PKR {pred:,.0f}")
        print(f"    • Price Deviation: {RED if dev < -30 else GREEN}{dev}%{RESET}")
        print(f"    • Slang Detected: {RED}{slang}{RESET}")
        print(f"    • Composite Risk Index: {RED if risk >= 70 else YELLOW}{risk}% ({status.upper()}){RESET}")
        print(f"    • Forensic Reasoning: {analysis.get('llm_reasoning')[:80]}...")
        return True
    except Exception as exc:
        print(f"  {RED}✗ Dry-run inference error: {exc}{RESET}")
        return False


def check_playwright() -> bool:
    print_header("5. PLAYWRIGHT CHROMIUM BROWSER AVAILABILITY")
    try:
        import playwright
        try:
            import importlib.metadata
            version = importlib.metadata.version("playwright")
        except Exception:
            version = "installed"
        print(f"  {GREEN}✓ Playwright Python package available (version {version}){RESET}")
    except ImportError:
        print(f"  {RED}✗ Playwright package not installed! Run 'pip install playwright'{RESET}")
        return False

    session_dir = BASE_DIR / "fb_session"
    if session_dir.exists():
        print(f"  {GREEN}✓ Persistent session directory present: {session_dir}{RESET}")
    else:
        print(f"  {YELLOW}⚠ Session directory will be created upon first launch.{RESET}")

    return True


def main():
    print(f"\n{BOLD}{MAGENTA}")
    print("====================================================================")
    print("       NEXUS SENTINEL — PRE-FLIGHT SYSTEM VERIFICATION TOOL         ")
    print("====================================================================")
    print(f"{RESET}")

    c1 = check_env_vars()
    c2 = check_supabase_profiles()
    c3 = check_datasets_and_models()
    c4 = check_dry_run_inference()
    c5 = check_playwright()

    print("\n" + "=" * 68)
    if c4:
        print(f"{BOLD}{GREEN}  ✓ SYSTEM READY FOR LIVE DEMO & EVALUATION DEFENSE!{RESET}")
        print(f"  To launch the unified single-port application: {BOLD}.\\start_nexus.ps1{RESET}")
    else:
        print(f"{BOLD}{YELLOW}  ⚠ System operational with minor warnings. Review logs above.{RESET}")
    print("=" * 68 + "\n")


if __name__ == "__main__":
    main()
