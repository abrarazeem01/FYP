"""
NEXUS SENTINEL — MACHINE LEARNING & LLM FORENSICS PIPELINE
Combines CatBoost Regression, Isolation Forest outlier detection,
Roman-Urdu slang categorization, and Gemini/Ollama LLM forensics.
"""

import os
import re
import sys
import glob
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusSentinel-ML")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

CATBOOST_MODEL_PATH = MODELS_DIR / "catboost_price_model.cbm"
ISOLATION_FOREST_PATH = MODELS_DIR / "isolation_forest.joblib"
BENCHMARK_LOOKUP_PATH = MODELS_DIR / "market_benchmarks.joblib"
SLANG_MODEL_PATH = MODELS_DIR / "slang_classifier.joblib"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")

# ═══════════════════════════════════════════════════════════════════════════════
# COMPREHENSIVE ROMAN URDU & PAKISTANI SMUGGLING LEXICON
# ═══════════════════════════════════════════════════════════════════════════════
ROMAN_URDU_LEXICON = {
    # Customs Evasion / Non-Custom
    "non-custom": {"weight": 10, "category": "customs_evasion", "label": "Non-Custom Vehicle"},
    "non custom": {"weight": 10, "category": "customs_evasion", "label": "Non-Custom Vehicle"},
    "non-custom-paid": {"weight": 10, "category": "customs_evasion", "label": "Non-Custom-Paid"},
    "non custom paid": {"weight": 10, "category": "customs_evasion", "label": "Non-Custom-Paid"},
    "ncp": {"weight": 10, "category": "customs_evasion", "label": "NCP Acronym"},
    "without custom": {"weight": 10, "category": "customs_evasion", "label": "Without Customs Duty"},
    "baghair custom": {"weight": 9, "category": "customs_evasion", "label": "Baghair Custom"},
    "custom clear nahi": {"weight": 10, "category": "customs_evasion", "label": "Customs Uncleared"},
    "custom duty nahi": {"weight": 10, "category": "customs_evasion", "label": "Customs Duty Unpaid"},
    "duty unpaid": {"weight": 9, "category": "customs_evasion", "label": "Duty Unpaid"},

    # Structural & Identity Tampering
    "cut-piece": {"weight": 10, "category": "structural_tampering", "label": "Cut-Piece Chassis"},
    "cut piece": {"weight": 10, "category": "structural_tampering", "label": "Cut Piece Welded"},
    "cutpiece": {"weight": 10, "category": "structural_tampering", "label": "Cutpiece Frame"},
    "tampered chassis": {"weight": 10, "category": "identity_fraud", "label": "Chassis Tampering"},
    "punch chassis": {"weight": 10, "category": "identity_fraud", "label": "Punch Chassis VIN"},
    "chassis punch": {"weight": 10, "category": "identity_fraud", "label": "Chassis Punch VIN"},
    "body change": {"weight": 9, "category": "structural_tampering", "label": "Swapped Body Shell"},

    # Documentation Fraud
    "without file": {"weight": 9, "category": "documentation_fraud", "label": "No Registration File"},
    "baghair file": {"weight": 9, "category": "documentation_fraud", "label": "Baghair File"},
    "file missing": {"weight": 8, "category": "documentation_fraud", "label": "Missing Legal File"},
    "file nahi": {"weight": 8, "category": "documentation_fraud", "label": "No Paperwork"},
    "open letter": {"weight": 7, "category": "documentation_fraud", "label": "Open Transfer Letter"},
    "chalta phirta": {"weight": 8, "category": "documentation_fraud", "label": "Chalta Phirta (Running Only)"},
    "chalta firta": {"weight": 8, "category": "documentation_fraud", "label": "Chalta Firta (Unregistered)"},
    "duplicate book": {"weight": 7, "category": "documentation_fraud", "label": "Duplicate Logbook"},

    # Origin & Smuggling Corridors
    "kabuli": {"weight": 9, "category": "origin_smuggling", "label": "Afghan/Kabuli Import"},
    "kabli": {"weight": 9, "category": "origin_smuggling", "label": "Afghan/Kabli Origin"},
    "chaman border": {"weight": 9, "category": "origin_smuggling", "label": "Chaman Border Corridor"},
    "chaman": {"weight": 7, "category": "origin_smuggling", "label": "Chaman Supply Route"},
    "torkham": {"weight": 8, "category": "origin_smuggling", "label": "Torkham Pass Corridor"},
    "border vehicle": {"weight": 9, "category": "origin_smuggling", "label": "Border Cross Unit"},
    "border cross": {"weight": 9, "category": "origin_smuggling", "label": "Border Delivery Cross"},
    "border delivery": {"weight": 8, "category": "origin_smuggling", "label": "Direct Border Delivery"},

    # Registration Evasion
    "unregistered": {"weight": 6, "category": "registration_evasion", "label": "Unregistered Vehicle"},
    "non registered": {"weight": 6, "category": "registration_evasion", "label": "Non-Registered"},
    "without number": {"weight": 7, "category": "registration_evasion", "label": "Without Number Plates"},
}

# ------------------------------------------------------------------------------
# 1. DATASET LOADER & PREPROCESSING
# ------------------------------------------------------------------------------

def _parse_pakwheels_price(val) -> Optional[float]:
    """Parses PakWheels price strings like 'PKR 47,000,000', '38 lac', '1.5 crore'."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    s = re.sub(r'(?i)pkr|rs\.?', '', s).strip()
    s = s.replace(',', '').strip()
    s_lower = s.lower()
    lac_match = re.search(r'([\d.]+)\s*(?:lac|lacs|lakh)', s_lower)
    crore_match = re.search(r'([\d.]+)\s*(?:crore|cr)\b', s_lower)
    if lac_match:
        try:
            return float(lac_match.group(1)) * 1e5
        except ValueError:
            return None
    if crore_match:
        try:
            return float(crore_match.group(1)) * 1e7
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None


def _extract_make_model_from_title(title: str) -> Tuple[str, str]:
    tokens = str(title).strip().split()
    if not tokens:
        return "Unknown", "Unknown"
    make = tokens[0]
    model_parts: List[str] = []
    year_pattern = re.compile(r'^\d{4}$')
    for tok in tokens[1:]:
        if year_pattern.match(tok):
            break
        model_parts.append(tok)
    model = ' '.join(model_parts).strip() or "Unknown"
    return make, model


def _normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    mapping = {}
    for col in df.columns:
        c_clean = str(col).strip().lower().replace(" ", "_").replace("-", "_")
        if c_clean in ("make", "brand", "company", "manufacturer"):
            mapping[col] = "make"
        elif c_clean in ("model", "car_model", "car_name"):
            mapping[col] = "model"
        elif c_clean in ("year", "model_year", "assembly_year"):
            mapping[col] = "year"
        elif c_clean in ("price", "asking_price", "car_price", "cost", "pkr", "price_pkr"):
            mapping[col] = "price_pkr"
        elif c_clean in ("mileage", "km", "kms_driven", "meter"):
            mapping[col] = "mileage"
        elif c_clean in ("city", "location", "registered_city"):
            mapping[col] = "city"
        elif c_clean in ("engine", "engine_capacity", "cc", "capacity", "enginecapacity"):
            mapping[col] = "engine"
        elif c_clean in ("transmission", "gear", "transmission_type"):
            mapping[col] = "transmission"
        elif c_clean in ("text", "sentence", "slang", "description", "raw_text", "post"):
            mapping[col] = "text"
        elif c_clean in ("label", "target", "is_smuggling", "is_ncp", "category"):
            mapping[col] = "label"
    return df.rename(columns=mapping)


def _process_pakwheels_df(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.copy()
    if "Title" in df.columns:
        makes, models = zip(*df["Title"].apply(_extract_make_model_from_title))
        df["make"] = list(makes)
        df["model"] = list(models)
    else:
        df.setdefault("make", "Unknown")
        df.setdefault("model", "Unknown")

    price_col = next((c for c in ("price", "Price") if c in df.columns), None)
    if price_col:
        df["price_pkr"] = df[price_col].apply(_parse_pakwheels_price)
    else:
        df["price_pkr"] = None

    df["price_pkr"] = pd.to_numeric(df["price_pkr"], errors="coerce")
    df = df[df["price_pkr"].notna() & (df["price_pkr"] > 50000)].copy()

    mileage_col = next((c for c in ("Mileage", "mileage") if c in df.columns), None)
    if mileage_col:
        df["mileage"] = (
            df[mileage_col]
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.replace(r"(?i)km", "", regex=True)
            .str.strip()
        )
        df["mileage"] = pd.to_numeric(df["mileage"], errors="coerce").fillna(60000.0)
    else:
        df["mileage"] = 60000.0

    engine_col = next((c for c in ("EngineCapacity", "engine_capacity", "Engine") if c in df.columns), None)
    if engine_col:
        df["engine"] = (
            df[engine_col]
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.replace(r"(?i)cc", "", regex=True)
            .str.strip()
        )
        df["engine"] = pd.to_numeric(df["engine"], errors="coerce").fillna(1300.0)
    else:
        df["engine"] = 1300.0

    year_col = next((c for c in ("Year", "year") if c in df.columns), None)
    if year_col:
        df["year"] = pd.to_numeric(df[year_col], errors="coerce").fillna(2015).astype(int)
    else:
        df["year"] = 2015

    city_col = next((c for c in ("City", "city") if c in df.columns), None)
    df["city"] = df[city_col].fillna("Lahore").astype(str) if city_col else "Lahore"

    trans_col = next((c for c in ("Transmission", "transmission") if c in df.columns), None)
    df["transmission"] = df[trans_col].fillna("Automatic").astype(str) if trans_col else "Automatic"

    keep = ["make", "model", "year", "price_pkr", "mileage", "city", "transmission", "engine"]
    df = df[[c for c in keep if c in df.columns]].copy()
    df = df.reset_index(drop=True)
    return df


def load_datasets() -> Tuple[pd.DataFrame, pd.DataFrame]:
    part_files = sorted(glob.glob(str(DATA_DIR / "pakwheels_part_*.csv")))
    if not part_files:
        part_files = glob.glob(str(DATA_DIR / "*pakwheels*.csv"))

    if part_files:
        logger.info(f"Loading {len(part_files)} PakWheels data partition(s).")
        df_list = []
        for pf in part_files:
            try:
                raw = pd.read_csv(pf, low_memory=False)
                if "Title" in raw.columns:
                    sub_df = _process_pakwheels_df(raw)
                else:
                    sub_df = _normalize_column_names(raw)
                df_list.append(sub_df)
            except Exception as e:
                logger.warning(f"Error reading {pf}: {e}")
        cars_df = pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()
        logger.info(f"Combined dataset: {len(cars_df)} rows after price filtering.")
    else:
        logger.info("No PakWheels CSV partitions found in /backend/data/. Using synthetic baseline.")
        cars_df = pd.DataFrame([
            {"make": "Toyota", "model": "Corolla", "year": 2018, "price_pkr": 3850000, "mileage": 65000, "city": "Lahore", "engine": 1300, "transmission": "Automatic"},
            {"make": "Toyota", "model": "Corolla", "year": 2020, "price_pkr": 4600000, "mileage": 42000, "city": "Islamabad", "engine": 1600, "transmission": "Automatic"},
            {"make": "Honda", "model": "Civic", "year": 2019, "price_pkr": 4900000, "mileage": 55000, "city": "Karachi", "engine": 1800, "transmission": "Automatic"},
            {"make": "Honda", "model": "City", "year": 2017, "price_pkr": 2850000, "mileage": 88000, "city": "Rawalpindi", "engine": 1300, "transmission": "Manual"},
            {"make": "Suzuki", "model": "Alto", "year": 2021, "price_pkr": 2250000, "mileage": 30000, "city": "Lahore", "engine": 660, "transmission": "Automatic"},
            {"make": "Suzuki", "model": "Cultus", "year": 2019, "price_pkr": 2400000, "mileage": 50000, "city": "Peshawar", "engine": 1000, "transmission": "Manual"},
            {"make": "Toyota", "model": "Land Cruiser", "year": 2016, "price_pkr": 22000000, "mileage": 90000, "city": "Islamabad", "engine": 4600, "transmission": "Automatic"},
            {"make": "Toyota", "model": "Hilux", "year": 2020, "price_pkr": 9500000, "mileage": 45000, "city": "Quetta", "engine": 2800, "transmission": "Automatic"},
            {"make": "Daihatsu", "model": "Mira", "year": 2018, "price_pkr": 2350000, "mileage": 60000, "city": "Karachi", "engine": 660, "transmission": "Automatic"},
            {"make": "Kia", "model": "Sportage", "year": 2021, "price_pkr": 6800000, "mileage": 35000, "city": "Lahore", "engine": 2000, "transmission": "Automatic"},
        ])

    slang_file = DATA_DIR / "Nexus_Sentinel_NLP_Slang_Dataset_Large.csv"
    if slang_file.exists():
        try:
            slang_df = pd.read_csv(slang_file, low_memory=False)
            slang_df = _normalize_column_names(slang_df)
        except Exception as e:
            logger.warning(f"Could not load slang CSV: {e}")
            slang_df = pd.DataFrame()
    else:
        slang_df = pd.DataFrame([
            {"text": "Toyota Corolla 2019 non custom available in Quetta clean condition", "label": 1},
            {"text": "Kabuli gari chalta phirta cut piece chassis punch 5 lakh final", "label": 1},
            {"text": "Honda Civic 2020 without file running condition bargain deal", "label": 1},
            {"text": "Suzuki Alto genuine single owner Islamabad registered book file original", "label": 0},
            {"text": "Toyota Land Cruiser NCP fresh border cross Quetta delivery possible", "label": 1},
            {"text": "Kia Sportage bumper to bumper original total genuine Lahore registered", "label": 0},
            {"text": "Civic reborn cut piece engine sound chalta phirta sasti gari", "label": 1},
            {"text": "Daihatsu Mira import 2021 auction sheet verified genuine mileage", "label": 0},
            {"text": "V8 kabuli piece direct border delivery no registration required", "label": 1},
            {"text": "Corolla GLI original documents complete tax paid December 2024", "label": 0},
        ])

    return cars_df, slang_df


# ------------------------------------------------------------------------------
# 2. MODEL TRAINING (CATBOOST, ISOLATION FOREST, SLANG CLASSIFIER)
# ------------------------------------------------------------------------------

def train_pipeline() -> Dict[str, Any]:
    logger.info("Starting Nexus Sentinel ML Training Pipeline...")
    cars_df, slang_df = load_datasets()

    for col in ("make", "model"):
        if col not in cars_df.columns:
            cars_df[col] = "Unknown"
    if "year" not in cars_df.columns:
        cars_df["year"] = 2015
    if "price_pkr" not in cars_df.columns:
        if "price" in cars_df.columns:
            cars_df["price_pkr"] = pd.to_numeric(cars_df["price"], errors="coerce")
        else:
            cars_df["price_pkr"] = 2500000.0

    cars_df["year"] = pd.to_numeric(cars_df["year"], errors="coerce").fillna(2015).astype(int)
    cars_df["price_pkr"] = pd.to_numeric(cars_df["price_pkr"], errors="coerce")
    cars_df = cars_df[cars_df["price_pkr"].notna() & (cars_df["price_pkr"] > 50000)].copy()
    if cars_df.empty:
        raise ValueError("No valid price rows found after filtering.")

    cars_df["mileage"] = pd.to_numeric(
        cars_df["mileage"] if "mileage" in cars_df.columns else 60000,
        errors="coerce"
    ).fillna(60000).astype(float)
    cars_df["city"] = cars_df["city"].fillna("Lahore").astype(str) if "city" in cars_df.columns else "Lahore"
    cars_df["make"] = cars_df["make"].fillna("Toyota").astype(str)
    cars_df["model"] = cars_df["model"].fillna("Corolla").astype(str)

    y = cars_df["price_pkr"].astype(float)

    # Train Isolation Forest on price_pkr vs year/mileage
    iso_features = cars_df[["year", "mileage", "price_pkr"]].copy()
    iso_model = IsolationForest(contamination=0.08, random_state=42)
    iso_model.fit(iso_features)
    joblib.dump(iso_model, ISOLATION_FOREST_PATH)
    logger.info(f"Saved Isolation Forest to {ISOLATION_FOREST_PATH}")

    # Build market benchmark lookup dictionary
    benchmarks = cars_df.groupby(["make", "model", "year"]).agg(
        avg_market_price=("price_pkr", "mean"),
        min_price=("price_pkr", "min"),
        max_price=("price_pkr", "max")
    ).reset_index().to_dict(orient="records")
    joblib.dump(benchmarks, BENCHMARK_LOOKUP_PATH)
    logger.info(f"Saved {len(benchmarks)} market benchmark entries to {BENCHMARK_LOOKUP_PATH}")

    # Train CatBoost Regressor
    features = ["make", "model", "year", "mileage", "city"]
    cat_features = ["make", "model", "city"]
    X = cars_df[features].copy()

    if HAS_CATBOOST:
        cat_model = CatBoostRegressor(
            iterations=300,
            learning_rate=0.08,
            depth=6,
            cat_features=cat_features,
            verbose=False,
            random_seed=42
        )
        cat_model.fit(X, y)
        cat_model.save_model(str(CATBOOST_MODEL_PATH))
        logger.info(f"Saved CatBoost model to {CATBOOST_MODEL_PATH}")
    else:
        logger.warning("CatBoost not installed. Saving lightweight pipeline fallback.")
        joblib.dump({"mean_price": float(y.mean())}, CATBOOST_MODEL_PATH)

    # Train Slang NLP Classifier
    if "text" in slang_df.columns and "label" in slang_df.columns:
        slang_texts = slang_df["text"].astype(str).tolist()
        slang_labels = pd.to_numeric(slang_df["label"], errors="coerce").fillna(0).astype(int).tolist()
    else:
        slang_texts = ["genuine car single owner", "non custom cut piece ncp"]
        slang_labels = [0, 1]

    nlp_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 3), lowercase=True)),
        ("clf", LogisticRegression(max_iter=500, class_weight="balanced"))
    ])
    nlp_pipeline.fit(slang_texts, slang_labels)
    joblib.dump(nlp_pipeline, SLANG_MODEL_PATH)
    logger.info(f"Saved Slang Classifier model to {SLANG_MODEL_PATH}")

    return {
        "status": "success",
        "cars_samples": len(cars_df),
        "slang_samples": len(slang_df),
        "models_saved": [
            str(CATBOOST_MODEL_PATH),
            str(ISOLATION_FOREST_PATH),
            str(BENCHMARK_LOOKUP_PATH),
            str(SLANG_MODEL_PATH)
        ]
    }


# ------------------------------------------------------------------------------
# 3. ADVANCED ROMAN URDU SLANG DETECTION & EVIDENCE EXTRACTION
# ------------------------------------------------------------------------------

def _match_lexicon_terms_with_evidence(text: str) -> Tuple[List[str], List[Dict[str, Any]], int]:
    """
    Scans listing text for Roman-Urdu smuggling and illegal trade vocabulary.
    Returns:
      1. detected_terms (list of string flags)
      2. evidence_list (structured evidence with snippet, category, confidence)
      3. max_severity (0-10 int)
    """
    text_lower = text.lower()
    detected_terms: List[str] = []
    evidence_list: List[Dict[str, Any]] = []
    max_severity = 0

    # Sort terms by length descending to match compound phrases before single words
    sorted_terms = sorted(ROMAN_URDU_LEXICON.items(), key=lambda x: len(x[0]), reverse=True)

    for term, meta in sorted_terms:
        # Use regex boundary where possible, or substring search for hyphenated variations
        escaped_term = re.escape(term).replace(r"\-", r"[\-\s]?")
        pattern = re.compile(rf"(?:\b|_){escaped_term}(?:\b|_)", re.IGNORECASE)
        match = pattern.search(text)

        if match:
            start, end = match.span()
            matched_phrase = text[start:end]

            # Context window (approx 35 chars before and after)
            snip_start = max(0, start - 35)
            snip_end = min(len(text), end + 35)
            snippet = ("..." if snip_start > 0 else "") + text[snip_start:snip_end].strip() + ("..." if snip_end < len(text) else "")

            if term not in detected_terms:
                detected_terms.append(term)
                if meta["weight"] > max_severity:
                    max_severity = meta["weight"]

                evidence_list.append({
                    "term": term,
                    "matched_phrase": matched_phrase,
                    "label": meta.get("label", term.title()),
                    "category": meta["category"],
                    "severity": int(meta["weight"]),
                    "confidence": float(round(0.85 + (meta["weight"] / 100.0), 2)),
                    "snippet": snippet
                })

    return detected_terms, evidence_list, max_severity


# ------------------------------------------------------------------------------
# 4. VEHICLE ATTRIBUTE EXTRACTION & LLM FORENSICS
# ------------------------------------------------------------------------------

def _extract_via_regex(text: str) -> Dict[str, Any]:
    """Deterministic regex extraction of vehicle attributes from social media text."""
    text_lower = text.lower()

    # Extract Year (1990 - 2026)
    year_match = re.search(r"\b(199\d|20[0-2]\d)\b", text)
    year = int(year_match.group(1)) if year_match else 2019

    # Extract Asking Price
    asking_price = None
    lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs)\b", text_lower)
    crore_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr)\b", text_lower)
    pkr_num_match = re.search(r"(?:rs|pkr|price)?\s*[:=\-]?\s*(\d{6,8})\b", text_lower)

    if lakh_match:
        asking_price = float(lakh_match.group(1)) * 100000.0
    elif crore_match:
        asking_price = float(crore_match.group(1)) * 10000000.0
    elif pkr_num_match:
        asking_price = float(pkr_num_match.group(1))
    else:
        asking_price = 1400000.0

    # Extract Make
    known_makes = [
        "toyota", "honda", "suzuki", "kia", "hyundai", "nissan",
        "daihatsu", "mitsubishi", "audi", "bmw", "mercedes", "changan"
    ]
    found_make = "Toyota"
    for mk in known_makes:
        if re.search(rf"\b{mk}\b", text_lower):
            found_make = mk.capitalize()
            break

    # Extract Model
    known_models = [
        "corolla", "civic", "city", "alto", "cultus", "wagon r",
        "sportage", "land cruiser", "prado", "v8", "hilux", "revo",
        "mira", "mehran", "swift", "passo", "vezel", "br-v", "yaris"
    ]
    found_model = "Corolla"
    for md in known_models:
        if re.search(rf"\b{re.escape(md)}\b", text_lower):
            if md == "v8":
                found_model = "Land Cruiser V8"
            elif md == "revo":
                found_model = "Hilux Revo"
            else:
                found_model = md.title()
            break

    # Extract City
    cities = [
        "karachi", "lahore", "islamabad", "rawalpindi", "quetta",
        "peshawar", "multan", "faisalabad", "chaman", "gwadar", "hyderabad"
    ]
    found_city = "Quetta" if ("quetta" in text_lower or "chaman" in text_lower) else "Lahore"
    for c in cities:
        if re.search(rf"\b{c}\b", text_lower):
            found_city = c.title()
            break

    # Chassis check
    chassis_match = re.search(r"\b([A-Z0-9]{11,17})\b", text.upper())
    chassis_number = chassis_match.group(1) if chassis_match else "TAMPERED/UNAVAILABLE"

    return {
        "make": found_make,
        "model": found_model,
        "year": year,
        "variant": "Standard",
        "city": found_city,
        "asking_price": float(asking_price),
        "chassis_number": chassis_number
    }


def _call_llm_forensics(text: str) -> Tuple[Dict[str, Any], str]:
    """
    Executes vehicle parameter extraction and intelligence reasoning
    via Gemini API (if key is valid), Ollama local endpoint, or deterministic heuristics.
    """
    # Only invoke Gemini if a valid Google AI API key is configured (starts with 'AIzaSy')
    if GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIzaSy") and HAS_GENAI:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            system_prompt = (
                "You are Nexus Sentinel's chief automotive forensic AI. Analyze this Pakistani vehicle listing.\n"
                "Return ONLY a strictly valid JSON object with:\n"
                '{"make": string, "model": string, "year": integer, "variant": string, "city": string, '
                '"asking_price": float, "chassis_number": string, "forensic_reasoning": string}'
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{system_prompt}\nAnalyze text:\n\"\"\"{text}\"\"\"",
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            data = json.loads(response.text)
            reasoning = data.pop("forensic_reasoning", "Extracted via Gemini 2.5 Flash Forensics.")
            return data, reasoning
        except Exception as e:
            logger.warning(f"Gemini API inference skipped or failed: {e}")

    # Fallback to local Ollama if running
    if HAS_REQUESTS:
        try:
            res = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": f"Extract vehicle json from: {text}",
                    "format": "json",
                    "stream": False
                },
                timeout=1.0
            )
            if res.status_code == 200:
                payload = res.json().get("response", "{}")
                data = json.loads(payload)
                reasoning = data.pop("forensic_reasoning", "Extracted via Ollama local forensics.")
                return data, reasoning
        except Exception:
            pass

    # Deterministic high-accuracy regex extraction
    extracted = _extract_via_regex(text)
    reasoning = (
        f"Automated forensic parsing detected {extracted['year']} {extracted['make']} {extracted['model']} "
        f"located in {extracted['city']} with asking price PKR {extracted['asking_price']:,.0f}. "
        f"Chassis status: {extracted['chassis_number']}."
    )
    return extracted, reasoning


# ------------------------------------------------------------------------------
# 5. CATBOOST BENCHMARK ESTIMATION
# ------------------------------------------------------------------------------

def _predict_fair_price(make: str, model: str, year: int, city: str, mileage: float = 60000.0) -> float:
    """Predicts legitimate market benchmark price in PKR via CatBoost model."""
    if CATBOOST_MODEL_PATH.exists() and HAS_CATBOOST:
        try:
            model_cb = CatBoostRegressor()
            model_cb.load_model(str(CATBOOST_MODEL_PATH))
            df_in = pd.DataFrame([{
                "make": make,
                "model": model,
                "year": int(year),
                "mileage": float(mileage),
                "city": city
            }])
            pred = model_cb.predict(df_in)[0]
            val = float(pred)
            if val > 300000.0:
                return round(val, 2)
        except Exception as e:
            logger.warning(f"CatBoost inference notice: {e}")

    # Fallback to benchmark lookups
    if BENCHMARK_LOOKUP_PATH.exists():
        try:
            benchmarks = joblib.load(BENCHMARK_LOOKUP_PATH)
            for b in benchmarks:
                if (b["make"].lower() == make.lower() and
                    b["model"].lower() == model.lower() and
                    int(b["year"]) == int(year)):
                    return round(float(b["avg_market_price"]), 2)
        except Exception:
            pass

    # Heuristic market segment valuation
    base_segment = {
        "toyota": {"corolla": 4200000, "land cruiser": 22000000, "prado": 16000000, "hilux": 9500000, "yaris": 3800000},
        "honda": {"civic": 5100000, "city": 3200000, "vezel": 4800000},
        "suzuki": {"alto": 2250000, "cultus": 2500000, "wagon r": 2300000, "swift": 3400000},
        "kia": {"sportage": 6800000, "picanto": 2400000},
        "hyundai": {"tucson": 7200000, "elantra": 5800000},
    }

    brand = make.lower()
    mod = model.lower()
    base = base_segment.get(brand, {}).get(mod, 3500000)

    # Depreciation: ~7% per year from 2024
    years_diff = max(0, 2024 - year)
    depreciated = base * ((0.93) ** years_diff)
    return round(float(max(600000.0, depreciated)), 2)


# ------------------------------------------------------------------------------
# 6. UNIFIED FORENSIC INFERENCE & RISK ENGINE
# ------------------------------------------------------------------------------

def analyze_listing(text: str, manual_price: Optional[float] = None) -> Dict[str, Any]:
    """
    Executes complete 3-Stage Nexus Sentinel forensic intelligence pipeline:
    1. Slang Detection & Evidence Gathering (Roman Urdu + NLP)
    2. Vehicle Attribute Extraction
    3. CatBoost Price Benchmark & Isolation Forest Anomaly Check
    4. Deterministic Explainable Risk Score (0-100)
    """
    if not text or not text.strip():
        raise ValueError("Listing text cannot be empty.")

    clean_text = text.strip()

    # ── STAGE 1: ROMAN URDU SLANG INTELLIGENCE ────────────────────────────────
    detected_terms, evidence_list, max_severity = _match_lexicon_terms_with_evidence(clean_text)

    nlp_prob = 0.0
    if SLANG_MODEL_PATH.exists():
        try:
            clf_pipe = joblib.load(SLANG_MODEL_PATH)
            probs = clf_pipe.predict_proba([clean_text])[0]
            nlp_prob = float(probs[1]) if len(probs) > 1 else 0.5
        except Exception:
            nlp_prob = 0.85 if detected_terms else 0.05
    else:
        nlp_prob = 0.85 if detected_terms else 0.05

    # ── STAGE 2: VEHICLE EXTRACTION ───────────────────────────────────────────
    extracted, llm_reasoning = _call_llm_forensics(clean_text)

    make = str(extracted.get("make", "Toyota"))
    model = str(extracted.get("model", "Corolla"))
    year = int(extracted.get("year", 2019))
    city = str(extracted.get("city", "Lahore"))
    chassis = str(extracted.get("chassis_number", "TAMPERED/UNAVAILABLE"))

    asking_price = float(manual_price) if manual_price else float(extracted.get("asking_price", 1400000.0))

    # ── STAGE 3: PRICING VALUATION & ANOMALY DETECTION ────────────────────────
    predicted_market_price = _predict_fair_price(make, model, year, city)

    # Price Difference & Percentage Deviation
    price_difference_pkr = round(asking_price - predicted_market_price, 2)
    price_deviation_pct = round(((asking_price - predicted_market_price) / predicted_market_price) * 100.0, 2)

    # Isolation Forest Anomaly Check
    is_anomaly = False
    if ISOLATION_FOREST_PATH.exists():
        try:
            iso = joblib.load(ISOLATION_FOREST_PATH)
            df_iso = pd.DataFrame([[int(year), 60000.0, float(asking_price)]], columns=["year", "mileage", "price_pkr"])
            pred = iso.predict(df_iso)[0]
            is_anomaly = bool(pred == -1)
        except Exception as iso_err:
            logger.debug(f"Isolation Forest fallback: {iso_err}")
            is_anomaly = bool(price_deviation_pct < -40.0)
    else:
        is_anomaly = bool(price_deviation_pct < -40.0)

    # ── STAGE 4: EXPLAINABLE COMPOSITE RISK ENGINE (0 - 100) ──────────────────
    contributing_factors: List[Dict[str, Any]] = []

    # 1. Slang Severity Contribution (Up to 40 points)
    slang_points = 0
    if max_severity > 0:
        slang_points = int(min(40, (max_severity / 10.0) * 40))
        contributing_factors.append({
            "factor": "Roman Urdu Smuggling Vocabulary",
            "points": slang_points,
            "details": f"{len(detected_terms)} illicit indicator(s) matched: {', '.join(detected_terms[:3])}."
        })
    elif nlp_prob > 0.6:
        slang_points = int(nlp_prob * 25)
        contributing_factors.append({
            "factor": "NLP Smuggling Pattern",
            "points": slang_points,
            "details": f"NLP classification probability: {round(nlp_prob * 100, 1)}%."
        })

    # 2. Below-Market Price Undercutting (Up to 40 points)
    price_points = 0
    if price_deviation_pct <= -60.0:
        price_points = 40
        contributing_factors.append({
            "factor": "Severe Price Undervaluation",
            "points": 40,
            "details": f"Asking price is {abs(price_deviation_pct):.1f}% below legitimate PakWheels market benchmark."
        })
    elif price_deviation_pct <= -45.0:
        price_points = 32
        contributing_factors.append({
            "factor": "Critical Price Undercut",
            "points": 32,
            "details": f"Asking price is {abs(price_deviation_pct):.1f}% below fair market price."
        })
    elif price_deviation_pct <= -30.0:
        price_points = 22
        contributing_factors.append({
            "factor": "Substantial Price Undercut",
            "points": 22,
            "details": f"Asking price is {abs(price_deviation_pct):.1f}% below market value."
        })
    elif price_deviation_pct <= -15.0:
        price_points = 10
        contributing_factors.append({
            "factor": "Moderate Price Discount",
            "points": 10,
            "details": f"Asking price is {abs(price_deviation_pct):.1f}% below benchmark."
        })

    # 3. Documentation & Chassis Tampering Status (Up to 15 points)
    doc_points = 0
    chassis_upper = chassis.upper()
    if "TAMPER" in chassis_upper or "PUNCH" in clean_text.upper() or "UNAVAILABLE" in chassis_upper:
        doc_points = 15
        contributing_factors.append({
            "factor": "Chassis/VIN Identification Defect",
            "points": 15,
            "details": "Chassis number flagged as tampered, punched, or unavailable."
        })
    elif "without file" in detected_terms or "baghair file" in detected_terms:
        doc_points = 12
        contributing_factors.append({
            "factor": "Missing Legal Documentation",
            "points": 12,
            "details": "Listing advertises vehicle sold without registration file or papers."
        })

    # 4. Multivariate Outlier Indicator (Up to 5 points)
    outlier_points = 0
    if is_anomaly:
        outlier_points = 5
        contributing_factors.append({
            "factor": "Isolation Forest Anomaly",
            "points": 5,
            "details": "Multivariate inconsistency detected across price, year, and vehicle attributes."
        })

    total_risk = min(100, max(0, slang_points + price_points + doc_points + outlier_points))

    # Missing Information Assessment
    missing_info = []
    if "mileage" not in clean_text.lower():
        missing_info.append("Verified odometer mileage not stated")
    if chassis == "TAMPERED/UNAVAILABLE":
        missing_info.append("Official 17-digit Chassis VIN missing")
    if manual_price is None and "lakh" not in clean_text.lower() and "lac" not in clean_text.lower():
        missing_info.append("Explicit asking price unmentioned")

    # Status classification
    if total_risk >= 85:
        status = "verified_ncp"
        severity = "CRITICAL"
    elif total_risk >= 55:
        status = "flagged"
        severity = "HIGH"
    elif total_risk >= 30:
        status = "new"
        severity = "MEDIUM"
    else:
        status = "dismissed"
        severity = "LOW"

    confidence = "HIGH" if (asking_price and make != "Unknown" and model != "Unknown") else "MEDIUM"

    return {
        "extracted_json": {
            "make": make,
            "model": model,
            "year": int(year),
            "variant": extracted.get("variant", "Standard"),
            "city": city,
            "asking_price": float(asking_price),
            "chassis_number": chassis,
            "nlp_smuggling_confidence": float(round(nlp_prob, 4))
        },
        "slang_flags": detected_terms,
        "slang_evidence": evidence_list,
        "llm_reasoning": llm_reasoning,
        "predicted_market_price": float(round(predicted_market_price, 2)),
        "price_difference_pkr": float(price_difference_pkr),
        "price_deviation_pct": float(price_deviation_pct),
        "risk_score": int(total_risk),
        "severity": severity,
        "confidence": confidence,
        "contributing_factors": contributing_factors,
        "missing_information": missing_info,
        "status": status,
        "is_outlier": bool(is_anomaly)
    }


if __name__ == "__main__":
    if "--train" in sys.argv:
        print("Executing Nexus Sentinel ML Model Training...")
        res = train_pipeline()
        print(json.dumps(res, indent=2))
    else:
        sample_post = "Urgent sale! Toyota Corolla 2020 NCP cut-piece Quetta chalta phirta without file 8 lakh final. Border cross."
        print(f"Testing sample inference on: '{sample_post}'")
        analysis = analyze_listing(sample_post)
        print(json.dumps(analysis, indent=2))
